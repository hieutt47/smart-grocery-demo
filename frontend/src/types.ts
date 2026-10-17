export interface Product { id: string; product_id?: string; name: string; category: string; price: number; pack_size: number; unit: string; emoji: string; available: boolean; origin: string }
export interface CartItem extends Product { product_id: string; quantity: number; subtotal: number }
export interface Cart { items: CartItem[]; version: number; total: number; count: number; delivery_fee: number }
export interface Recipe { id: string; name: string; description: string; minutes: number; servings: number; emoji: string; color: string; tags: string[]; source: string; ingredients?: Ingredient[]; steps?: string[]; variants?: {id: string; name: string; note: string}[] }
export interface Ingredient { id: string; name: string; quantity: number; unit: string }
export interface Selection { recipe_id: string; servings: number; ingredient_ids: string[]; variant_id?: string | null }
export interface Quote { items: {product_id: string; name: string; emoji: string; required: number; quantity: number; purchased: number; pack_size: number; unit: string; price: number; subtotal: number; ingredient_ids: string[]}[]; missing: {ingredient_id: string; name: string; reason: string}[]; total: number }
export interface Suggestion { id: string; name: string; recipes: Recipe[]; selections: Selection[]; total: number; minutes: number; servings: number; reason: string }
export interface AssistantResult { mode: 'rules'; message: string; suggestions: Suggestion[]; products: Product[]; conversation_id: string; context: {servings: number; budget: number | null; minutes: number | null; excluded: string[]} }
export type ChatMessage = {role: 'user'; content: string} | {role: 'assistant'; result: AssistantResult};
export interface Conversation {id: string; messages: ChatMessage[]; context: AssistantResult['context']}
export interface Address { building: string; tower: string; floor: string; apartment: string }
export interface Delivery {index: number; stages: string[]; status: string; waiting: boolean; complete: boolean; progress: number; estimated_at: string; simulated: true; time_advanced: boolean; destination: string}
export interface Order { id: string; created_at: string; total: number; items: {product_id: string; name: string; quantity: number; price: number; pack_size: number; unit: string; emoji: string}[]; delivery_mode: 'now' | 'scheduled'; scheduled_at: string | null; address: Address; contact: string; delivery: Delivery }
export interface Reorder {items: (CartItem & {old_price: number})[]; missing: string[]; total: number; cart_version: number}
