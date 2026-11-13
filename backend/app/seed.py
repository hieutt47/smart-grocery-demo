"""Versioned demonstration data, independently authored for this project.

Prices, origin, availability, timings and recipes are illustrative, not a live supply feed.
No external recipe text or photographs are copied. Cooking content still needs expert review.
"""

from sqlalchemy import select

from .models import (
    Ingredient,
    IngredientProductMapping,
    Product,
    Recipe,
    RecipeIngredient,
    RecipeStep,
    RecipeVariant,
)

PRODUCTS = [
    ("chicken", "Thịt gà", "Thịt & cá", 38000, 400, "g", "🍗", "ga thit ga"),
    ("beef", "Thịt bò", "Thịt & cá", 55000, 250, "g", "🥩", "bo thit bo"),
    ("pork", "Thịt heo", "Thịt & cá", 32000, 300, "g", "🥩", "heo lon thit lon"),
    ("fish", "Cá thu", "Thịt & cá", 42000, 300, "g", "🐟", "ca ca thu"),
    ("shrimp", "Tôm", "Thịt & cá", 35000, 200, "g", "🦐", "tom hai san"),
    ("eggs", "Trứng gà", "Trứng & đậu", 15000, 6, "quả", "🥚", "trung"),
    ("tofu", "Đậu hũ", "Trứng & đậu", 10000, 300, "g", "🧈", "dau hu dau phu"),
    ("tomato", "Cà chua", "Rau củ", 10000, 300, "g", "🍅", "ca chua"),
    ("greens", "Rau cải", "Rau củ", 10000, 300, "g", "🥬", "cai rau cai"),
    ("spinach", "Rau muống", "Rau củ", 12000, 400, "g", "🌿", "rau muong"),
    ("ginger", "Gừng", "Rau củ", 5000, 100, "g", "🫚", "gung"),
    ("garlic", "Tỏi", "Rau củ", 5000, 100, "g", "🧄", "toi"),
    ("onion", "Hành lá", "Rau củ", 3000, 50, "g", "🌱", "hanh hanh la"),
    ("carrot", "Cà rốt", "Rau củ", 9000, 300, "g", "🥕", "ca rot"),
    ("potato", "Khoai tây", "Rau củ", 12000, 400, "g", "🥔", "khoai tay"),
    ("pumpkin", "Bí đỏ", "Rau củ", 12000, 400, "g", "🎃", "bi bi do"),
    ("cucumber", "Dưa leo", "Rau củ", 9000, 300, "g", "🥒", "dua leo dua chuot"),
    ("lettuce", "Xà lách", "Rau củ", 10000, 200, "g", "🥬", "xa lach salad"),
    ("mushroom", "Nấm", "Rau củ", 15000, 200, "g", "🍄", "nam"),
    ("lime", "Chanh", "Rau củ", 5000, 2, "quả", "🍋", "chanh"),
    ("rice", "Gạo thơm", "Gạo & gia vị", 18000, 500, "g", "🍚", "gao"),
    ("noodles", "Mì sợi", "Gạo & gia vị", 12000, 200, "g", "🍜", "mi mi soi"),
    ("oil", "Dầu ăn", "Gạo & gia vị", 15000, 250, "ml", "🫗", "dau an"),
    ("fish-sauce", "Nước mắm", "Gạo & gia vị", 12000, 250, "ml", "🍶", "nuoc mam"),
    ("soy-sauce", "Nước tương", "Gạo & gia vị", 10000, 250, "ml", "🍶", "nuoc tuong xi dau"),
    ("salt", "Muối", "Gạo & gia vị", 5000, 300, "g", "🧂", "muoi"),
    ("sugar", "Đường", "Gạo & gia vị", 8000, 300, "g", "🥄", "duong"),
    ("pepper", "Tiêu", "Gạo & gia vị", 10000, 50, "g", "🧂", "tieu"),
    ("banana", "Chuối", "Trái cây", 18000, 500, "g", "🍌", "chuoi"),
    ("orange", "Cam", "Trái cây", 25000, 500, "g", "🍊", "cam"),
    ("chili", "Ớt tươi", "Rau củ", 4000, 50, "g", "🌶️", "ot ot hiem ot cay"),
    ("shallot", "Hành tím", "Rau củ", 6000, 150, "g", "🧅", "hanh tim cu hanh"),
    ("corn", "Bắp ngọt", "Rau củ", 12000, 2, "bắp", "🌽", "bap ngo bap ngot"),
    ("watermelon", "Dưa hấu", "Trái cây", 22000, 1000, "g", "🍉", "dua hau"),
    ("mango", "Xoài cát", "Trái cây", 32000, 500, "g", "🥭", "xoai xoai cat"),
    ("yogurt", "Sữa chua", "Trứng & đậu", 12000, 2, "hộp", "🥛", "sua chua yaourt"),
]

RECIPES = [
    (
        "ga-rang-gung",
        "Gà rang gừng",
        30,
        "🍗",
        "peach",
        ["gà", "món mặn"],
        {"chicken": 350, "ginger": 25, "onion": 10, "fish-sauce": 15, "oil": 10},
        [
            "Sơ chế gừng thành sợi, hành lá cắt nhỏ. Thịt gà để riêng với rau củ và dụng cụ ăn ngay.",
            "Cắt gà thành miếng vừa ăn, ướp với nước mắm và một nửa gừng.",
            "Làm nóng dầu, đảo phần gừng còn lại rồi cho gà vào rang. Thêm chút nước nếu chảo khô.",
            "Nấu gà chín kỹ đến tận phần giữa miếng thịt. Thêm hành lá, đảo đều và dùng cùng cơm nếu thích.",
        ],
    ),
    (
        "bo-xao-ca-chua",
        "Bò xào cà chua",
        20,
        "🥩",
        "rose",
        ["bò", "món mặn", "nhanh"],
        {"beef": 200, "tomato": 250, "garlic": 10, "oil": 10, "soy-sauce": 10},
        [
            "Cà chua rửa sạch, bổ múi. Tỏi băm nhỏ; thịt bò thái mỏng trên thớt riêng.",
            "Làm nóng dầu, phi tỏi rồi xào thịt bò cho chín; chuyển ra đĩa sạch.",
            "Cho cà chua vào chảo, đảo đến khi mềm. Thêm nước tương và ít nước.",
            "Cho bò trở lại chảo, đảo đều cho nóng và chín kỹ rồi dùng ngay.",
        ],
    ),
    (
        "trung-chien-hanh",
        "Trứng chiên hành",
        10,
        "🍳",
        "yellow",
        ["trứng", "nhanh"],
        {"eggs": 3, "onion": 10, "oil": 10, "salt": 2},
        [
            "Rửa hành, cắt nhỏ. Đập trứng vào bát sạch, thêm hành và muối.",
            "Đánh trứng đều bằng nĩa. Làm nóng chảo với dầu ở lửa vừa.",
            "Đổ trứng vào chảo, dàn đều. Trở mặt nếu cần để trứng chín hoàn toàn.",
            "Chuyển ra đĩa, cắt miếng vừa ăn và dùng khi còn nóng.",
        ],
    ),
    (
        "canh-cai-dau-hu",
        "Canh cải đậu hũ",
        15,
        "🥬",
        "green",
        ["rau", "canh", "nhanh"],
        {"greens": 250, "tofu": 200, "salt": 3, "ginger": 5},
        [
            "Rửa sạch rau cải và cắt khúc. Đậu hũ cắt miếng; gừng thái mỏng.",
            "Đun nước với gừng. Cho đậu hũ vào, đun sôi nhẹ.",
            "Thêm rau cải, nấu đến khi rau chín. Nêm muối theo khẩu vị.",
            "Múc ra bát và dùng nóng. Lượng nước điều chỉnh theo bát canh mong muốn.",
        ],
    ),
    (
        "dau-hu-sot-ca",
        "Đậu hũ sốt cà chua",
        20,
        "🍅",
        "peach",
        ["đậu", "món mặn", "nhanh"],
        {"tofu": 300, "tomato": 250, "onion": 10, "oil": 15, "salt": 3},
        [
            "Rửa cà chua, cắt nhỏ; đậu hũ cắt miếng, thấm nhẹ cho ráo.",
            "Áp chảo đậu hũ với dầu đến khi vàng nhẹ, chuyển ra đĩa sạch.",
            "Nấu cà chua với ít nước và muối đến khi thành sốt.",
            "Cho đậu hũ vào sốt, đun nhẹ cho nóng đều. Thêm hành lá rồi tắt bếp.",
        ],
    ),
    (
        "ca-thu-kho",
        "Cá thu kho gừng",
        35,
        "🐟",
        "blue",
        ["cá", "món mặn"],
        {"fish": 300, "ginger": 20, "fish-sauce": 15, "sugar": 5, "oil": 10},
        [
            "Sơ chế cá bằng dụng cụ riêng, thấm ráo. Gừng rửa sạch và thái lát.",
            "Xếp gừng và cá vào nồi. Thêm nước mắm, đường, dầu và nước vừa đủ.",
            "Đun sôi rồi hạ lửa, kho đến khi cá chín kỹ và phần nước sánh lại.",
            "Gắp cá nhẹ tay, kiểm tra và loại xương khi ăn. Dùng nóng.",
        ],
    ),
    (
        "canh-bi-tom",
        "Canh bí đỏ nấu tôm",
        25,
        "🎃",
        "yellow",
        ["tôm", "canh"],
        {"pumpkin": 350, "shrimp": 150, "onion": 10, "salt": 3},
        [
            "Bí gọt vỏ, bỏ hạt, rửa sạch và cắt miếng. Tôm sơ chế riêng.",
            "Đun nước rồi cho bí vào nấu đến khi gần mềm.",
            "Thêm tôm, tiếp tục nấu đến khi tôm và bí chín hoàn toàn.",
            "Nêm muối, thêm hành rồi múc canh ra bát dùng nóng.",
        ],
    ),
    (
        "rau-muong-xao",
        "Rau muống xào tỏi",
        15,
        "🌿",
        "green",
        ["rau", "nhanh"],
        {"spinach": 350, "garlic": 15, "oil": 15, "salt": 3},
        [
            "Nhặt rau, rửa kỹ và để ráo; cắt khúc vừa ăn. Tỏi bóc vỏ, băm nhỏ.",
            "Làm nóng dầu trong chảo, cho tỏi vào đảo thơm.",
            "Thêm rau, đảo đều; thêm chút nước nếu cần để rau chín đều.",
            "Nêm muối khi rau chín, đảo lại và cho ra đĩa.",
        ],
    ),
    (
        "thit-rang",
        "Thịt heo rang gừng",
        25,
        "🥘",
        "rose",
        ["heo", "món mặn"],
        {"pork": 300, "ginger": 15, "fish-sauce": 15, "sugar": 5, "oil": 10},
        [
            "Thái thịt heo thành miếng vừa ăn trên thớt riêng. Gừng rửa sạch, thái sợi.",
            "Làm nóng dầu, cho gừng vào đảo rồi thêm thịt.",
            "Thêm nước mắm, đường và ít nước. Nấu đến khi thịt chín kỹ bên trong.",
            "Đảo cho nước sốt bám đều, chuyển sang đĩa sạch và dùng nóng.",
        ],
    ),
    (
        "canh-ca-trung",
        "Canh cà chua trứng",
        15,
        "🥣",
        "peach",
        ["trứng", "canh", "nhanh"],
        {"tomato": 250, "eggs": 2, "onion": 10, "oil": 5, "salt": 3},
        [
            "Rửa cà chua, cắt múi; hành cắt nhỏ. Đánh trứng trong bát sạch.",
            "Xào cà chua với dầu cho mềm, thêm nước và đun sôi.",
            "Rót trứng từ từ, khuấy nhẹ. Nấu đến khi trứng chín hoàn toàn.",
            "Nêm muối, thêm hành lá và dùng canh nóng.",
        ],
    ),
    (
        "salad-dua-leo",
        "Salad dưa leo cà chua",
        10,
        "🥗",
        "green",
        ["rau", "nhanh"],
        {"cucumber": 200, "tomato": 150, "lettuce": 100, "lime": 1, "oil": 5, "salt": 2},
        [
            "Rửa kỹ rau củ bằng nước sạch và để ráo; dùng thớt riêng cho đồ ăn sống.",
            "Cắt dưa leo, cà chua thành miếng; xé xà lách vừa ăn.",
            "Pha nước chanh, dầu và muối thành nước trộn.",
            "Trộn nhẹ rau củ ngay trước khi ăn; giữ lạnh nếu chưa dùng ngay.",
        ],
    ),
    (
        "mi-xao-rau",
        "Mì xào rau củ",
        20,
        "🍜",
        "yellow",
        ["rau", "nhanh", "mì"],
        {"noodles": 200, "carrot": 100, "greens": 150, "mushroom": 100, "oil": 15, "soy-sauce": 15},
        [
            "Rửa rau củ, thái nhỏ. Chuẩn bị mì theo hướng dẫn trên bao bì và để ráo.",
            "Làm nóng dầu, xào cà rốt và nấm đến khi gần chín.",
            "Thêm rau cải, đảo đến khi chín. Cho mì vào cùng nước tương.",
            "Đảo nhẹ để mì nóng đều và rau củ chín hoàn toàn, rồi dùng ngay.",
        ],
    ),
    (
        "thit-kho-trung",
        "Thịt kho trứng",
        40,
        "🥘",
        "peach",
        ["heo", "món mặn", "trứng"],
        {"pork": 350, "eggs": 3, "fish-sauce": 20, "sugar": 10, "garlic": 10, "pepper": 2},
        [
            "Thịt heo cạo sạch bì, cắt miếng vuông vừa ăn. Trứng luộc chín, bóc vỏ sạch.",
            "Ướp thịt với nước mắm, đường, tỏi băm và hạt tiêu trong 15 phút.",
            "Thắng đường lên màu cánh gián, cho thịt vào đảo săn rồi thêm nước xâm xấp mặt thịt.",
            "Đun sôi, hạ nhỏ lửa kho thịt mềm. Cho trứng vào kho cùng đến khi nước sốt sánh vàng óng.",
        ],
    ),
    (
        "canh-chua-ca",
        "Canh chua cá",
        25,
        "🐟",
        "blue",
        ["cá", "canh", "món mặn"],
        {"fish": 300, "tomato": 200, "lime": 1, "onion": 10, "fish-sauce": 15, "chili": 5},
        [
            "Cá thu rửa sạch, thấm ráo. Cà chua bổ múi cau, hành lá cắt khúc.",
            "Đun sôi nước với cà chua để tạo vị chua ngọt tự nhiên. Vắt nước cốt chanh vào nồi.",
            "Thả cá thu vào nấu sôi nhẹ đến khi cá chín mềm, không khuấy mạnh tránh vỡ nát.",
            "Nêm nước mắm vừa ăn, thêm vài lát ớt và rắc hành lá rồi tắt bếp, dùng nóng.",
        ],
    ),
    (
        "tom-rim-man-ngot",
        "Tôm rim mặn ngọt",
        20,
        "🦐",
        "rose",
        ["tôm", "món mặn", "nhanh"],
        {"shrimp": 300, "garlic": 10, "onion": 10, "fish-sauce": 15, "sugar": 10, "oil": 10, "pepper": 2},
        [
            "Tôm cắt râu, rửa sạch và để ráo nước.",
            "Làm nóng dầu ăn, phi thơm tỏi băm rồi trút tôm vào đảo đều ở lửa lớn cho tôm chuyển màu đỏ.",
            "Pha nước mắm và đường, rưới đều lên tôm. Hạ lửa vừa, đảo đều tay cho sốt bám bóng mặt tôm.",
            "Khi nước sốt cạn sánh keo, thêm hành lá và rắc chút tiêu thơm rồi cho ra đĩa.",
        ],
    ),
    (
        "bo-xao-rau-muong",
        "Bò xào rau muống",
        15,
        "🥩",
        "green",
        ["bò", "rau", "món mặn", "nhanh"],
        {"beef": 200, "spinach": 350, "garlic": 15, "oil": 15, "soy-sauce": 10},
        [
            "Thịt bò thái lát mỏng, ướp với chút tỏi và nước tương. Rau muống nhặt sạch, rửa ráo.",
            "Làm nóng chảo với dầu, phi vàng thơm tỏi rồi cho thịt bò vào xào nhanh ở lửa lớn vừa chín tới, múc riêng ra đĩa.",
            "Dùng lại chảo, cho rau muống vào xào nhanh tay trên lửa to để rau giữ màu xanh giòn.",
            "Trút thịt bò vào đảo cùng rau trong 30 giây cho hòa quyện rồi trút ra đĩa dùng nóng.",
        ],
    ),
    (
        "thit-heo-xao-chua-ngot",
        "Thịt heo xào chua ngọt",
        25,
        "🥘",
        "peach",
        ["heo", "món mặn"],
        {"pork": 300, "tomato": 200, "onion": 10, "lime": 1, "sugar": 10, "fish-sauce": 10, "oil": 10},
        [
            "Thịt heo cắt con chì vừa ăn. Cà chua băm nhỏ để làm sốt chua ngọt.",
            "Chiên hoặc xào xém vàng các mặt thịt heo trên lửa vừa, vớt ra đĩa sạch.",
            "Xào cà chua với dầu, nước cốt chanh, đường và nước mắm tạo thành sốt sánh mịn sệt.",
            "Cho thịt heo vào đảo đều cho ngấm đẫm sốt chua ngọt, rắc hành lá rồi tắt bếp.",
        ],
    ),
    (
        "canh-cai-thit-bam",
        "Canh cải thịt băm",
        15,
        "🥬",
        "green",
        ["heo", "canh", "rau", "nhanh"],
        {"greens": 300, "pork": 150, "ginger": 10, "salt": 3, "fish-sauce": 5},
        [
            "Rau cải nhặt rửa sạch, cắt khúc 3cm. Thịt heo băm nhỏ hoặc thái mỏng.",
            "Gừng gọt vỏ, đập dập hoặc thái sợi mỏng.",
            "Đun sôi nước, cho gừng và thịt băm vào khuấy nhẹ cho tơi thịt, hớt bọt.",
            "Thả rau cải vào đun sôi bùng, nêm muối và chút nước mắm rồi tắt bếp ngay để rau xanh mướt.",
        ],
    ),
    (
        "dau-hu-chien-gion",
        "Đậu hũ chiên giòn",
        12,
        "🧈",
        "yellow",
        ["đậu", "món mặn", "nhanh"],
        {"tofu": 400, "oil": 25, "soy-sauce": 15, "chili": 5},
        [
            "Đậu hũ cắt miếng vuông vừa ăn, dùng khăn sạch thấm thật khô bề mặt để khi chiên giòn rụm và không bắn dầu.",
            "Làm nóng dầu ngập đáy chảo, thả nhẹ từng miếng đậu vào chiên lửa vừa.",
            "Lật đều các mặt đến khi đậu phồng căng và có lớp vỏ vàng ruộm giòn tan.",
            "Vớt ra đĩa lót giấy thấm dầu, dùng nóng chấm kèm nước tương tỏi ớt.",
        ],
    ),
    (
        "ga-xao-nam",
        "Gà xào nấm tươi",
        20,
        "🍗",
        "peach",
        ["gà", "món mặn", "nhanh"],
        {"chicken": 300, "mushroom": 150, "carrot": 100, "onion": 10, "oil": 10, "soy-sauce": 15},
        [
            "Thịt gà lọc bỏ xương thừa, thái miếng vừa ăn. Nấm và cà rốt tỉa hoa thái lát.",
            "Làm nóng dầu, xào thịt gà săn thơm với chút nước tương rồi trút ra bát.",
            "Xào cà rốt và nấm tươi ở lửa vừa đến khi nấm chín tới ngọt nước.",
            "Cho gà vào đảo đều cùng nấm và cà rốt, thêm hành lá cắt khúc rồi tắt bếp.",
        ],
    ),
    (
        "canh-khoai-tay-thit",
        "Canh khoai tây hầm thịt",
        30,
        "🥔",
        "yellow",
        ["heo", "canh", "rau củ"],
        {"potato": 300, "carrot": 150, "pork": 200, "onion": 10, "salt": 4},
        [
            "Khoai tây, cà rốt gọt vỏ, cắt miếng dày vừa miệng. Thịt heo thái miếng mỏng.",
            "Xào sơ thịt heo với chút muối cho săn đậm đà.",
            "Thêm nước đun sôi rồi cho khoai tây và cà rốt vào ninh lửa vừa khoảng 15-20 phút.",
            "Khi khoai và cà rốt chín mềm bùi ngọt, nêm lại gia vị vừa miệng, thêm hành lá thái nhỏ.",
        ],
    ),
    (
        "trung-cuon-rau-cu",
        "Trứng cuộn rau củ",
        15,
        "🍳",
        "yellow",
        ["trứng", "nhanh"],
        {"eggs": 4, "carrot": 50, "mushroom": 50, "onion": 10, "oil": 10, "salt": 2},
        [
            "Cà rốt, nấm và hành lá băm thật nhỏ li ti.",
            "Đập trứng vào bát, nêm muối, đánh tan đều cùng rau củ băm nhỏ.",
            "Thoa một lớp dầu mỏng lên chảo chống dính, đổ một lớp trứng mỏng tráng đều.",
            "Khi mặt trứng se lại, dùng đũa cuộn tròn dần về một phía. Cắt khoanh tròn vừa ăn xếp ra đĩa.",
        ],
    ),
]

MEALS = [
    {"id": "bua-nhanh", "name": "Bữa cơm nhẹ nhàng", "recipe_ids": ["trung-chien-hanh", "canh-cai-dau-hu"]},
    {
        "id": "bua-gia-dinh",
        "name": "Bữa nhà ấm áp",
        "recipe_ids": ["thit-rang", "rau-muong-xao", "canh-ca-trung"],
    },
    {"id": "bua-rau", "name": "Bữa nhiều rau", "recipe_ids": ["dau-hu-sot-ca", "canh-cai-dau-hu"]},
    {
        "id": "bua-com-kho",
        "name": "Bữa cơm đậm đà",
        "recipe_ids": ["thit-kho-trung", "canh-cai-thit-bam", "salad-dua-leo"],
    },
    {"id": "bua-ha-nhiet", "name": "Bữa cơm thanh mát", "recipe_ids": ["bo-xao-rau-muong", "canh-chua-ca"]},
    {
        "id": "bua-cuoi-tuan",
        "name": "Bữa sum họp gia đình",
        "recipe_ids": ["tom-rim-man-ngot", "canh-khoai-tay-thit", "dau-hu-chien-gion"],
    },
]


def seed(db):
    # Stable IDs make repeated seeding a no-op, retaining demo edits for tests.
    for pid, name, category, price, size, unit, emoji, aliases in PRODUCTS:
        if db.get(Product, pid):
            continue
        allergens = {
            "eggs": ["egg"],
            "tofu": ["soy"],
            "fish": ["fish"],
            "fish-sauce": ["fish"],
            "shrimp": ["shellfish"],
            "soy-sauce": ["soy", "wheat"],
            "noodles": ["wheat", "egg"],
        }.get(pid, [])
        db.add(
            Product(
                id=pid,
                name=name,
                category=category,
                price=price,
                pack_size=size,
                unit=unit,
                emoji=emoji,
                aliases=aliases,
            )
        )
        db.add(Ingredient(id=pid, name=name, unit=unit, allergens=allergens))
        db.flush()
        db.add(IngredientProductMapping(ingredient_id=pid, product_id=pid))
    db.flush()
    for rid, name, minutes, emoji, color, tags, ingredients, steps in RECIPES:
        if db.get(Recipe, rid):
            continue
        db.add(
            Recipe(
                id=rid,
                name=name,
                description="Một món nhà dễ nấu, từ những nguyên liệu quen thuộc.",
                minutes=minutes,
                emoji=emoji,
                color=color,
                tags=tags,
            )
        )
        db.flush()
        for iid, quantity in ingredients.items():
            db.add(RecipeIngredient(recipe_id=rid, ingredient_id=iid, quantity=quantity))
        for position, step in enumerate(steps, 1):
            db.add(RecipeStep(recipe_id=rid, position=position, text=step))
        seasonings = {i: 0.5 for i in ingredients if i in {"salt", "fish-sauce", "soy-sauce"}}
        if seasonings:
            db.add(
                RecipeVariant(
                    id=f"{rid}-nhat",
                    recipe_id=rid,
                    name="Nêm nhạt hơn",
                    note="Giảm một nửa lượng gia vị mặn trong công thức mẫu; không phải tư vấn dinh dưỡng.",
                    quantity_factors=seasonings,
                )
            )
    db.flush()
    assert len(db.scalars(select(Product)).all()) >= 30
