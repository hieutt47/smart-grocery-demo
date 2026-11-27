import logging
import os
import secrets
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import delete, func, select, text

from .assistant import get_recommendation_provider
from .db import create_database
from .domain import (
    OFFSETS,
    DomainError,
    cart_data,
    custom_recipe_quote,
    delivery_data,
    fingerprint,
    iso,
    normalize,
    order_data,
    product_data,
    recipe_data,
    recipe_quote,
    update_cart,
)
from .models import (
    AnalyticsEvent,
    Cart,
    CartItem,
    CheckoutQuote,
    Conversation,
    CustomRecipe,
    DeliverySimulation,
    DemoSession,
    Order,
    OrderItem,
    Product,
    RateWindow,
    Recipe,
)
from .schemas import (
    AddIngredients,
    AdvanceInput,
    AssistantInput,
    CartLine,
    CartPatch,
    CustomRecipeQuoteInput,
    DeliveryInput,
    EventInput,
    OrderInput,
    RecipeQuoteInput,
    SessionInput,
)
from .seed import MEALS, seed

logger = logging.getLogger("grocery")
COOKIE = "grocery_session"
ROOT = Path(__file__).resolve().parents[2]


def migrate(engine):
    from alembic import command
    from alembic.config import Config

    config = Config(str(ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(ROOT / "backend/migrations"))
    config.attributes["connection"] = engine
    config.set_main_option("sqlalchemy.url", str(engine.url).replace("%", "%%"))
    command.upgrade(config, "head")


def _load_dotenv() -> None:
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def create_app(database_url=None, clock=None):
    if database_url is None and "pytest" not in sys.modules:
        _load_dotenv()
    engine, factory = create_database(database_url)
    now = clock or (lambda: int(time.time()))

    @asynccontextmanager
    async def lifespan(app):
        migrate(engine)
        with factory.begin() as db:
            seed(db)
        yield
        engine.dispose()

    app = FastAPI(
        title="AI Smart Grocery · Demo API",
        version="0.1.0",
        lifespan=lifespan,
        description="Sample data, rules-based assistant, simulated checkout and robot delivery. No payments.",
    )
    app.state.engine, app.state.factory, app.state.clock = engine, factory, now
    origins = set(
        os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000",
        ).split(",")
    )
    if os.getenv("RENDER_EXTERNAL_URL"):
        origins.add(os.environ["RENDER_EXTERNAL_URL"].rstrip("/"))
    cleanup_at = [0]

    @app.middleware("http")
    async def guard(request, call_next):
        started = time.monotonic()
        request_id = secrets.token_hex(6)
        if request.url.path.startswith("/api/") and request.method in {"POST", "PATCH", "DELETE", "PUT"}:
            origin = request.headers.get("origin")
            fetch_site = request.headers.get("sec-fetch-site")
            if (origin and origin not in origins) or fetch_site == "cross-site":
                return JSONResponse(
                    {"code": "ORIGIN_REJECTED", "message": "Nguồn yêu cầu không được chấp nhận."}, 403
                )
            if int(request.headers.get("content-length", "0") or 0) > 32768:
                return JSONResponse({"code": "REQUEST_TOO_LARGE", "message": "Yêu cầu quá dài."}, 413)
        if request.url.path.startswith("/api/") and now() - cleanup_at[0] > 300:
            with factory.begin() as db:
                db.execute(delete(DemoSession).where(DemoSession.expires_at <= now()))
                db.execute(delete(CheckoutQuote).where(CheckoutQuote.expires_at < now()))
            cleanup_at[0] = now()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"
        )
        if request.url.path in {"/docs", "/redoc"}:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://fastapi.tiangolo.com; connect-src 'self'; worker-src blob:; frame-ancestors 'none'"
            )
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        # No bodies, query strings, contact fields or session tokens in logs.
        logger.info(
            "request id=%s method=%s status=%s ms=%d",
            request_id,
            request.method,
            response.status_code,
            (time.monotonic() - started) * 1000,
        )
        return response

    @app.exception_handler(DomainError)
    async def domain_error(request, exc):
        return JSONResponse({"code": exc.code, "message": exc.message}, status_code=exc.status)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, exc):
        return JSONResponse(
            {
                "code": "VALIDATION_ERROR",
                "message": "Thông tin chưa hợp lệ. Kiểm tra các trường và giới hạn demo.",
                "fields": [".".join(map(str, e["loc"])) for e in exc.errors()],
            },
            422,
        )

    def database(request: Request):
        with factory() as db:
            # Serialize short write transactions before any reads: avoids lost updates in SQLite.
            if request.method in {"POST", "PATCH", "DELETE", "PUT"}:
                db.execute(text("BEGIN IMMEDIATE"))
            try:
                # Commit before response headers/cookies reach the browser.
                yield db
                db.commit()
            except Exception:
                db.rollback()
                raise

    def session(request: Request, db=Depends(database, scope="function")):
        token = request.cookies.get(COOKIE)
        s = db.get(DemoSession, token) if token else None
        if not s or s.expires_at <= now():
            raise DomainError(
                "SESSION_EXPIRED", "Phiên demo đã hết hiệu lực. Bắt đầu phiên mới để tiếp tục.", 401
            )
        return s

    def own_order(db, sid, oid):
        order = db.get(Order, oid)
        if not order or order.session_id != sid:
            raise DomainError("NOT_FOUND", "Không tìm thấy đơn trong phiên của bạn.", 404)
        return order

    def limit(db, sid, kind, maximum):
        window = now() // 60
        row = db.get(RateWindow, (sid, kind))
        if row and row.window == window:
            if row.count >= maximum:
                raise DomainError("RATE_LIMITED", "Bạn thử hơi nhanh. Hãy đợi một phút rồi thử lại.", 429)
            row.count += 1
        elif row:
            row.window, row.count = window, 1
        else:
            db.add(RateWindow(session_id=sid, kind=kind, window=window, count=1))

    @app.get("/api/v1/health")
    def health(db=Depends(database, scope="function")):
        db.execute(text("SELECT 1"))
        gemini_key = os.getenv("GEMINI_API_KEY")
        assistant_mode = "gemini" if gemini_key else "rules"
        gemini_status = None
        if assistant_mode == "gemini":
            from .gemini import LAST_STATUS

            gemini_status = LAST_STATUS

        return {
            "status": "ok",
            "version": "0.1.0",
            "assistant_mode": assistant_mode,
            "gemini_status": gemini_status,
            "demo": True,
        }

    @app.post("/api/v1/sessions")
    def start_session(
        body: SessionInput, request: Request, response: Response, db=Depends(database, scope="function")
    ):
        token = request.cookies.get(COOKIE)
        existing = db.get(DemoSession, token) if token else None
        if existing and existing.expires_at > now() and not body.renew:
            return {"expires_at": iso(existing.expires_at), "demo": True}
        if token and not body.renew:
            raise DomainError(
                "SESSION_EXPIRED",
                "Dịch vụ đã khởi động lại hoặc phiên đã hết hạn. Bắt đầu phiên mới nhé.",
                401,
            )
        if existing:
            db.delete(existing)
            db.flush()
        sid = secrets.token_urlsafe(32)
        db.add(DemoSession(id=sid, created_at=now(), expires_at=now() + 86400))
        db.flush()
        db.add(Cart(session_id=sid, version=0))
        secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
        response.set_cookie(COOKIE, sid, httponly=True, secure=secure, samesite="lax", path="/")
        return {"expires_at": iso(now() + 86400), "demo": True}

    @app.delete("/api/v1/session-data")
    def erase(response: Response, s=Depends(session), db=Depends(database, scope="function")):
        db.delete(s)
        response.delete_cookie(COOKIE, path="/")
        return {"deleted": True}

    @app.get("/api/v1/products")
    def products(
        q: str = Query(default="", max_length=100), category: str = "", db=Depends(database, scope="function")
    ):
        rows = list(db.scalars(select(Product).order_by(Product.id)))
        query = normalize(q).strip()
        return [
            product_data(p)
            for p in rows
            if (not category or p.category == category)
            and all(word in normalize(p.name + " " + p.aliases) for word in query.split())
        ]

    @app.get("/api/v1/products/{pid}")
    def product(pid: str, db=Depends(database, scope="function")):
        p = db.get(Product, pid)
        if not p:
            raise DomainError("NOT_FOUND", "Không tìm thấy sản phẩm.", 404)
        return product_data(p)

    @app.get("/api/v1/recipes")
    def recipes(db=Depends(database, scope="function")):
        return [recipe_data(db, r) for r in db.scalars(select(Recipe).order_by(Recipe.id))]

    @app.get("/api/v1/meals")
    def meals():
        return MEALS

    @app.get("/api/v1/recipes/{rid}")
    def recipe(rid: str, db=Depends(database, scope="function")):
        r = db.get(Recipe, rid)
        if r:
            return recipe_data(db, r, True)
        cr = db.get(CustomRecipe, rid)
        if cr:
            return {
                "id": cr.id,
                "name": cr.name,
                "description": cr.description,
                "minutes": cr.minutes,
                "servings": cr.servings,
                "emoji": cr.emoji,
                "color": cr.color,
                "tags": cr.tags,
                "source": "Công thức phối hợp bởi Trợ lý AI Bữa Nhà",
                "is_custom": True,
                "estimated_kcal": cr.estimated_kcal,
                "ingredients": cr.ingredients,
                "steps": cr.steps,
                "variants": [],
            }
        raise DomainError("NOT_FOUND", "Không tìm thấy món.", 404)

    @app.post("/api/v1/recipe-quotes")
    def get_recipe_quote(body: RecipeQuoteInput, db=Depends(database, scope="function")):
        return recipe_quote(db, body.selections)

    @app.post("/api/v1/custom-recipe-quote")
    def get_custom_recipe_quote(body: CustomRecipeQuoteInput, db=Depends(database, scope="function")):
        return custom_recipe_quote(db, body.servings, body.base_servings, body.ingredients)

    @app.get("/api/v1/cart")
    def get_cart(s=Depends(session), db=Depends(database, scope="function")):
        return cart_data(db, s.id)

    @app.patch("/api/v1/cart")
    def patch_cart(body: CartPatch, s=Depends(session), db=Depends(database, scope="function")):
        return update_cart(db, s.id, body.items, body.mode, body.expected_version)

    @app.post("/api/v1/cart/ingredients")
    def add_ingredients(body: AddIngredients, s=Depends(session), db=Depends(database, scope="function")):
        quote = recipe_quote(db, body.selections)
        if quote["missing"]:
            raise DomainError(
                "PRODUCT_UNAVAILABLE", "Có nguyên liệu chưa có hàng. Bỏ chọn mục đó rồi thử lại.", 409
            )
        if not quote["items"]:
            raise DomainError("EMPTY_SELECTION", "Bạn chưa chọn nguyên liệu cần mua.")
        lines = [CartLine(product_id=i["product_id"], quantity=i["quantity"]) for i in quote["items"]]
        return update_cart(db, s.id, lines, "add", body.expected_version)

    @app.post("/api/v1/checkout/quote")
    def checkout(body: DeliveryInput, s=Depends(session), db=Depends(database, scope="function")):
        cart = cart_data(db, s.id)
        if not cart["items"]:
            raise DomainError("EMPTY_CART", "Giỏ hàng đang trống.")
        if any(not x["available"] for x in cart["items"]):
            raise DomainError("PRODUCT_UNAVAILABLE", "Một sản phẩm trong giỏ hiện hết hàng mẫu.", 409)
        scheduled = None
        if body.delivery_mode == "scheduled":
            if not body.scheduled_at or body.scheduled_at.utcoffset() is None:
                raise DomainError("INVALID_SCHEDULE", "Chọn giờ giao có múi giờ Việt Nam.")
            scheduled = int(body.scheduled_at.timestamp())
            if not now() + 1800 <= scheduled <= now() + 7 * 86400:
                raise DomainError(
                    "INVALID_SCHEDULE", "Giờ giao phải sau ít nhất 30 phút và trong 7 ngày tới."
                )
        elif body.scheduled_at is not None:
            raise DomainError("INVALID_SCHEDULE", "Giao ngay không cần giờ hẹn.")
        q = CheckoutQuote(
            id=secrets.token_urlsafe(16),
            session_id=s.id,
            cart_version=cart["version"],
            fingerprint=fingerprint(cart["items"]),
            delivery_mode=body.delivery_mode,
            scheduled_at=scheduled,
            expires_at=now() + 600,
            total=cart["total"],
        )
        db.add(q)
        return {"quote_id": q.id, "total": q.total, "delivery_fee": 0, "expires_at": iso(q.expires_at)}

    @app.post("/api/v1/orders")
    def place_order(body: OrderInput, s=Depends(session), db=Depends(database, scope="function")):
        request_hash = fingerprint(body.model_dump(exclude={"idempotency_key"}))
        old = db.scalar(
            select(Order).where(Order.session_id == s.id, Order.idempotency_key == body.idempotency_key)
        )
        if old:
            if old.request_hash != request_hash:
                raise DomainError("IDEMPOTENCY_CONFLICT", "Khóa xác nhận đã dùng cho nội dung khác.", 409)
            return order_data(db, old, now())
        limit(db, s.id, "orders", 5)
        quote = db.get(CheckoutQuote, body.quote_id)
        if not quote or quote.session_id != s.id or quote.expires_at < now():
            raise DomainError(
                "QUOTE_EXPIRED", "Bản tính tiền đã hết hiệu lực. Vui lòng kiểm tra lại giỏ.", 409
            )
        if db.scalar(select(Order).where(Order.quote_id == quote.id)):
            raise DomainError("QUOTE_USED", "Bản xác nhận này đã được dùng để tạo đơn.", 409)
        cart = cart_data(db, s.id)
        if cart["version"] != quote.cart_version or fingerprint(cart["items"]) != quote.fingerprint:
            raise DomainError(
                "CART_CHANGED", "Giỏ hoặc giá đã thay đổi. Vui lòng kiểm tra lại tổng tiền.", 409
            )
        if quote.scheduled_at is not None and quote.scheduled_at <= now():
            raise DomainError("INVALID_SCHEDULE", "Giờ giao đã qua. Vui lòng chọn lại.", 409)
        order = Order(
            id=secrets.token_hex(8),
            session_id=s.id,
            quote_id=quote.id,
            idempotency_key=body.idempotency_key,
            request_hash=request_hash,
            created_at=now(),
            total=quote.total,
            delivery_mode=quote.delivery_mode,
            scheduled_at=quote.scheduled_at,
            address=body.address.model_dump(),
            contact=body.contact,
        )
        db.add(order)
        db.flush()
        for item in cart["items"]:
            db.add(
                OrderItem(
                    order_id=order.id,
                    **{
                        k: item[k]
                        for k in ("product_id", "name", "price", "quantity", "pack_size", "unit", "emoji")
                    },
                )
            )
        db.add(
            DeliverySimulation(
                order_id=order.id,
                start_at=(quote.scheduled_at - 90) if quote.scheduled_at else now(),
                offset_seconds=0,
            )
        )
        db.execute(delete(CartItem).where(CartItem.session_id == s.id))
        db.get(Cart, s.id).version += 1
        db.flush()
        return order_data(db, order, now())

    @app.get("/api/v1/orders")
    def orders(s=Depends(session), db=Depends(database, scope="function")):
        return [
            order_data(db, o, now())
            for o in db.scalars(
                select(Order).where(Order.session_id == s.id).order_by(Order.created_at.desc())
            )
        ]

    @app.get("/api/v1/orders/{oid}")
    def get_order(oid: str, s=Depends(session), db=Depends(database, scope="function")):
        return order_data(db, own_order(db, s.id, oid), now())

    @app.get("/api/v1/orders/{oid}/delivery")
    def get_delivery(oid: str, s=Depends(session), db=Depends(database, scope="function")):
        return delivery_data(db, own_order(db, s.id, oid), now())

    @app.post("/api/v1/orders/{oid}/simulation/advance")
    def advance(oid: str, body: AdvanceInput, s=Depends(session), db=Depends(database, scope="function")):
        order = own_order(db, s.id, oid)
        sim = db.get(DeliverySimulation, oid)
        elapsed = now() + sim.offset_seconds - sim.start_at
        target = 90 if body.target == "complete" else next((x for x in OFFSETS if x > elapsed), 90)
        sim.offset_seconds += max(0, target - elapsed)
        return delivery_data(db, order, now())

    @app.post("/api/v1/orders/{oid}/reorder-preview")
    def reorder(oid: str, s=Depends(session), db=Depends(database, scope="function")):
        own_order(db, s.id, oid)
        items, missing = [], []
        for row in db.scalars(select(OrderItem).where(OrderItem.order_id == oid)):
            p = db.get(Product, row.product_id)
            if not p or not p.available:
                missing.append(row.name)
            else:
                items.append(
                    {
                        **product_data(p),
                        "product_id": p.id,
                        "quantity": row.quantity,
                        "old_price": row.price,
                        "subtotal": p.price * row.quantity,
                    }
                )
        return {
            "items": items,
            "missing": missing,
            "total": sum(x["subtotal"] for x in items),
            "cart_version": db.get(Cart, s.id).version,
        }

    @app.get("/api/v1/assistant/conversation")
    def current_conversation(s=Depends(session), db=Depends(database, scope="function")):
        conversation = db.scalar(select(Conversation).where(Conversation.session_id == s.id))
        return (
            {"id": conversation.id, "messages": conversation.messages, "context": conversation.context}
            if conversation
            else None
        )

    @app.delete("/api/v1/assistant/conversation")
    def clear_conversation(s=Depends(session), db=Depends(database, scope="function")):
        db.execute(delete(Conversation).where(Conversation.session_id == s.id))
        return {"deleted": True}

    @app.delete("/api/v1/assistant/memory")
    def remove_memory_fact(
        category: str = Query(..., max_length=40),
        value: str = Query(default="", max_length=80),
        s=Depends(session),
        db=Depends(database, scope="function"),
    ):
        conversation = db.scalar(select(Conversation).where(Conversation.session_id == s.id))
        if not conversation:
            return {"memory": {}}
        ctx = dict(conversation.context or {})
        memory = dict(ctx.get("memory") or {})
        if category == "pregnancy":
            memory["pregnancy"] = False
        elif category in memory and isinstance(memory[category], list):
            memory[category] = [item for item in memory[category] if item != value]
            if category in {"dislikes", "allergies"}:
                excluded = set(ctx.get("excluded") or [])
                excluded.discard(value)
                ctx["excluded"] = sorted(excluded)
        ctx["memory"] = memory
        conversation.context = ctx
        return {"memory": memory}

    @app.post("/api/v1/assistant/messages")
    def assistant(body: AssistantInput, request: Request):
        token = request.cookies.get(COOKIE)
        if not token:
            raise DomainError("SESSION_REQUIRED", "Bắt đầu phiên demo để tiếp tục.", 401)

        # Phase A: Short write transaction to validate session, rate-limit, and snapshot context
        with factory.begin() as db:
            db.execute(text("BEGIN IMMEDIATE"))
            s = db.get(DemoSession, token)
            if not s:
                raise DomainError("SESSION_EXPIRED", "Phiên đã hết hạn hoặc bị xóa.", 401)
            if s.expires_at <= now():
                db.delete(s)
                raise DomainError("SESSION_EXPIRED", "Phiên demo đã hết hạn.", 401)
            limit(db, s.id, "assistant", 20)
            if body.conversation_id:
                conversation = db.get(Conversation, body.conversation_id)
                if not conversation or conversation.session_id != s.id:
                    raise DomainError("NOT_FOUND", "Không tìm thấy hội thoại trong phiên này.", 404)
            else:
                conversation = db.scalar(select(Conversation).where(Conversation.session_id == s.id))
                if not conversation:
                    conversation = Conversation(
                        id=secrets.token_urlsafe(16), session_id=s.id, context={}, messages=[]
                    )
                    db.add(conversation)
                    db.flush()
            if body.pantry:
                conversation.context = {**conversation.context, "pantry": body.pantry}
            if isinstance(body.taste_profile, dict):
                conversation.context = {**conversation.context, "taste_profile": body.taste_profile}
            recent_history = []
            for msg in conversation.messages[-8:]:
                if msg.get("role") == "user":
                    recent_history.append({"role": "user", "text": msg.get("content", "")})
                elif msg.get("role") == "assistant" and isinstance(msg.get("result"), dict):
                    res_obj = msg["result"]
                    sug_names = [s_item.get("name", "") for s_item in res_obj.get("suggestions", [])]
                    summary = res_obj.get("message", "")
                    if sug_names:
                        summary = f"{summary} [Đã gợi ý: {', '.join(sug_names)}]"
                    recent_history.append({"role": "assistant", "text": summary})
            conv_id = conversation.id
            provider_ctx = {**conversation.context, "history": recent_history}

        # Phase B: Read-only DB access while calling Gemini (no SQLite write lock held!)
        with factory() as read_db:
            result = get_recommendation_provider().recommend(read_db, body.content, provider_ctx)
        result["context"].pop("history", None)
        result["conversation_id"] = conv_id

        # Phase C: Short write transaction to persist custom recipes and conversation turn
        with factory.begin() as db:
            db.execute(text("BEGIN IMMEDIATE"))
            for sug in result.get("suggestions", []):
                for r in sug.get("recipes", []):
                    if (r.get("is_custom") or str(r.get("id", "")).startswith("custom-")) and not db.get(
                        CustomRecipe, r["id"]
                    ):
                        db.add(
                            CustomRecipe(
                                id=r["id"],
                                name=r["name"],
                                description=r.get("description", ""),
                                minutes=int(r.get("minutes", 20)),
                                servings=int(r.get("servings", 2)),
                                emoji=r.get("emoji", "🍽️"),
                                color=r.get("color", "green"),
                                tags=r.get("tags", []),
                                ingredients=r.get("ingredients", []),
                                steps=r.get("steps", []),
                                estimated_kcal=int(r.get("estimated_kcal", 300)),
                                created_at=now(),
                            )
                        )
            conv = db.get(Conversation, conv_id)
            if conv:
                conv.context = result["context"]
                conv.messages = (
                    conv.messages
                    + [{"role": "user", "content": body.content}, {"role": "assistant", "result": result}]
                )[-20:]
        return result

    @app.post("/api/v1/events")
    def record_event(body: EventInput, db=Depends(database, scope="function")):
        db.add(AnalyticsEvent(event_name=body.event_name, target_id=body.target_id, created_at=now()))
        return {"recorded": True}

    @app.get("/api/v1/metrics/summary")
    def metrics_summary(db=Depends(database, scope="function")):
        rows = db.execute(
            select(AnalyticsEvent.event_name, func.count(AnalyticsEvent.id)).group_by(
                AnalyticsEvent.event_name
            )
        ).all()
        by_event = {name: count for name, count in rows}
        return {"total_events": sum(by_event.values()), "by_event": by_event}

    # The same origin serves the built React app. Unknown API paths remain JSON 404s.
    static_dir = ROOT / "frontend/dist"
    if (static_dir / "assets").exists():
        app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise DomainError("NOT_FOUND", "API không tồn tại.", 404)
        if (static_dir / "index.html").exists():
            return FileResponse(
                static_dir / "index.html",
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
            )
        return JSONResponse({"message": "Backend ready. Build the frontend or start Vite on port 5173."})

    return app


app = create_app()
