export interface NutritionEstimate {
  kcal: number;
  label: 'Eat clean' | 'Giàu đạm' | 'Nhẹ bụng' | 'Đủ năng lượng';
  eatClean?: boolean;
}

export const RECIPE_NUTRITION: Record<string, NutritionEstimate> = {
  'ga-rang-gung': {kcal: 420, label: 'Giàu đạm'},
  'bo-xao-ca-chua': {kcal: 380, label: 'Giàu đạm', eatClean: true},
  'trung-chien-hanh': {kcal: 240, label: 'Nhẹ bụng'},
  'canh-cai-dau-hu': {kcal: 160, label: 'Eat clean', eatClean: true},
  'dau-hu-sot-ca': {kcal: 220, label: 'Eat clean', eatClean: true},
  'ca-thu-kho': {kcal: 410, label: 'Giàu đạm'},
  'canh-bi-tom': {kcal: 190, label: 'Nhẹ bụng', eatClean: true},
  'rau-muong-xao': {kcal: 150, label: 'Eat clean', eatClean: true},
  'thit-rang': {kcal: 470, label: 'Đủ năng lượng'},
  'canh-ca-trung': {kcal: 180, label: 'Nhẹ bụng', eatClean: true},
  'salad-dua-leo': {kcal: 120, label: 'Eat clean', eatClean: true},
  'mi-xao-rau': {kcal: 360, label: 'Đủ năng lượng'},
  'thit-kho-trung': {kcal: 540, label: 'Đủ năng lượng'},
  'canh-chua-ca': {kcal: 230, label: 'Nhẹ bụng', eatClean: true},
  'tom-rim-man-ngot': {kcal: 310, label: 'Giàu đạm'},
  'bo-xao-rau-muong': {kcal: 350, label: 'Giàu đạm', eatClean: true},
  'thit-heo-xao-chua-ngot': {kcal: 440, label: 'Đủ năng lượng'},
  'canh-cai-thit-bam': {kcal: 210, label: 'Nhẹ bụng', eatClean: true},
  'dau-hu-chien-gion': {kcal: 260, label: 'Nhẹ bụng'},
  'ga-xao-nam': {kcal: 320, label: 'Eat clean', eatClean: true},
  'canh-khoai-tay-thit': {kcal: 340, label: 'Đủ năng lượng'},
  'trung-cuon-rau-cu': {kcal: 230, label: 'Eat clean', eatClean: true}
};

export function getRecipeNutrition(recipeId: string): NutritionEstimate {
  return RECIPE_NUTRITION[recipeId] || {kcal: 300, label: 'Đủ năng lượng'};
}

export interface OfficeLunchOption {
  id: string;
  name: string;
  emoji: string;
  price: number;
  kcal: number;
  tag: string;
  note: string;
}

export const OFFICE_LUNCH_OPTIONS: OfficeLunchOption[] = [
  {
    id: 'lunch-salad-uc-ga',
    name: 'Salad ức gà áp chảo',
    emoji: '🥗',
    price: 55000,
    kcal: 360,
    tag: 'Eat clean · Không buồn ngủ',
    note: 'Nhẹ bụng, giàu đạm, giữ tỉnh táo suốt buổi chiều họp hành.'
  },
  {
    id: 'lunch-bun-cha',
    name: 'Bún chả Hà Nội',
    emoji: '🥢',
    price: 45000,
    kcal: 520,
    tag: 'Quen thuộc · Dễ rủ nhóm',
    note: 'Hợp đi ăn nhóm 2–5 người, nhiều rau sống ăn kèm đỡ ngán.'
  },
  {
    id: 'lunch-com-ga-hoi-an',
    name: 'Cơm gà xé / gà nướng',
    emoji: '🍗',
    price: 50000,
    kcal: 560,
    tag: 'Đủ năng lượng',
    note: 'No lâu đến tối, phù hợp hôm chạy deadline nhiều.'
  },
  {
    id: 'lunch-pho-bo',
    name: 'Phở bò tái chín',
    emoji: '🍜',
    price: 50000,
    kcal: 450,
    tag: 'Ấm bụng · Nhanh gọn',
    note: 'Ăn nhanh trong 20 phút, nước dùng thanh nhẹ.'
  },
  {
    id: 'lunch-bun-bo-hue',
    name: 'Bún bò Huế',
    emoji: '🍲',
    price: 55000,
    kcal: 540,
    tag: 'Đậm đà · Đổi gió',
    note: 'Kích thích vị giác khi trưa thấy chán cơm.'
  },
  {
    id: 'lunch-com-tam',
    name: 'Cơm tấm sườn bì chả',
    emoji: '🍛',
    price: 50000,
    kcal: 620,
    tag: 'No lâu · Phổ biến',
    note: 'Lựa chọn an toàn cho cả team, dễ đặt ship hoặc ăn tại quán.'
  },
  {
    id: 'lunch-poke-bowl',
    name: 'Cơm gạo lứt cá hồi / ức gà',
    emoji: '🥑',
    price: 68000,
    kcal: 410,
    tag: 'Eat clean · Ít dầu mỡ',
    note: 'Cân bằng tinh bột chậm và đạm sạch, không gây nặng bụng.'
  },
  {
    id: 'lunch-mi-quang',
    name: 'Mì Quảng gà / tôm thịt',
    emoji: '🥣',
    price: 45000,
    kcal: 480,
    tag: 'Nhẹ bụng · Ngon miệng',
    note: 'Ít nước, nhiều rau thơm, ăn trưa rất vừa vặn.'
  }
];
