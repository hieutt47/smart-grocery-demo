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
  'trung-cuon-rau-cu': {kcal: 230, label: 'Eat clean', eatClean: true},
  'uc-ga-ap-chao-bong-cai': {kcal: 330, label: 'Eat clean', eatClean: true},
  'salad-uc-ga-bo': {kcal: 340, label: 'Eat clean', eatClean: true},
  'ca-basa-ap-chao-chanh': {kcal: 310, label: 'Eat clean', eatClean: true},
  'bo-xao-bong-cai': {kcal: 360, label: 'Giàu đạm', eatClean: true},
  'tom-xao-dau-que': {kcal: 250, label: 'Eat clean', eatClean: true},
  'ga-xao-ot-chuong': {kcal: 310, label: 'Eat clean', eatClean: true},
  'salad-trung-bo': {kcal: 320, label: 'Eat clean', eatClean: true},
  'yen-mach-trung-bo': {kcal: 350, label: 'Eat clean', eatClean: true},
  'dau-hu-hap-xi-dau': {kcal: 190, label: 'Eat clean', eatClean: true},
  'canh-bong-cai-thit-bam': {kcal: 220, label: 'Nhẹ bụng', eatClean: true},
  'uc-ga-luoc-cham-tieu-chanh': {kcal: 280, label: 'Eat clean', eatClean: true},
  'bo-ap-chao-sa-lach': {kcal: 340, label: 'Giàu đạm', eatClean: true},
  'ca-basa-hap-gung': {kcal: 270, label: 'Eat clean', eatClean: true},
  'nam-xao-cai-thia': {kcal: 140, label: 'Eat clean', eatClean: true},
  'mien-tron-bo': {kcal: 410, label: 'Giàu đạm'},
  'mien-xao-tom-nam': {kcal: 370, label: 'Nhẹ bụng'},
  'bun-thit-bo-xao': {kcal: 460, label: 'Giàu đạm'},
  'mi-xao-trung-cai': {kcal: 390, label: 'Đủ năng lượng'},
  'mi-xao-bo-ot-chuong': {kcal: 450, label: 'Đủ năng lượng'},
  'com-chien-trung-toi': {kcal: 430, label: 'Đủ năng lượng'},
  'com-chien-duong-chau-don-gian': {kcal: 450, label: 'Đủ năng lượng'},
  'trung-hap-nam': {kcal: 190, label: 'Eat clean', eatClean: true},
  'trung-xao-ca-chua': {kcal: 250, label: 'Nhẹ bụng'},
  'bun-ca-basa-chua': {kcal: 390, label: 'Nhẹ bụng'},
  'chao-yen-mach-thit-bam': {kcal: 310, label: 'Eat clean', eatClean: true},
  'sup-bap-ga-xe': {kcal: 260, label: 'Nhẹ bụng'},
  'uc-ga-sot-dau-hao': {kcal: 360, label: 'Giàu đạm'},
  'thit-heo-kho-tieu': {kcal: 490, label: 'Đủ năng lượng'},
  'bo-xao-dau-que': {kcal: 350, label: 'Giàu đạm'},
  'thit-bam-sot-ca-chua': {kcal: 390, label: 'Đủ năng lượng'},
  'dau-hu-nhoi-thit-sot-ca': {kcal: 340, label: 'Giàu đạm'},
  'ga-kho-nam-dong-co': {kcal: 410, label: 'Giàu đạm'},
  'ca-thu-sot-ca-chua': {kcal: 390, label: 'Giàu đạm'},
  'tom-xao-nam-cai-thia': {kcal: 240, label: 'Eat clean', eatClean: true},
  'khoai-tay-xao-thit-bam': {kcal: 380, label: 'Đủ năng lượng'},
  'bi-do-xao-toi': {kcal: 170, label: 'Nhẹ bụng'},
  'canh-dau-que-thit-bam': {kcal: 220, label: 'Nhẹ bụng'},
  'cai-thia-sot-dau-hao': {kcal: 130, label: 'Eat clean', eatClean: true}
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
  },
  {
    id: 'lunch-banh-mi-chao',
    name: 'Bánh mì chảo thập cẩm',
    emoji: '🍳',
    price: 45000,
    kcal: 510,
    tag: 'Nhanh gọn · Đổi vị',
    note: 'Đổi gió thay cơm trưa, nóng hổi và đủ chất.'
  },
  {
    id: 'lunch-bun-dau',
    name: 'Bún đậu mắm tôm / nước mắm',
    emoji: '🥢',
    price: 55000,
    kcal: 590,
    tag: 'Kèo nhóm cực vui',
    note: 'Rất hợp tụ tập 3–5 đồng nghiệp cuối tuần hoặc trưa thứ 6.'
  },
  {
    id: 'lunch-com-van-phong',
    name: 'Cơm văn phòng cá kho / sườn rim',
    emoji: '🍱',
    price: 45000,
    kcal: 550,
    tag: 'Cơm nhà · Giá mềm',
    note: 'Đầy đủ món mặn, rau xào và canh như cơm nhà.'
  },
  {
    id: 'lunch-mien-tron-han-quoc',
    name: 'Miến trộn bò Hàn Quốc (Japchae)',
    emoji: '🍜',
    price: 58000,
    kcal: 430,
    tag: 'Ít ngán · Thanh nhẹ',
    note: 'Nhiều rau củ, không bị đầy bụng vào buổi chiều.'
  },
  {
    id: 'lunch-com-tron-bibimbap',
    name: 'Cơm trộn Hàn Quốc (Bibimbap)',
    emoji: '🥗',
    price: 60000,
    kcal: 520,
    tag: 'Đủ rau · Đủ đạm',
    note: 'Nhiều màu sắc, nhiều rau củ, ăn một bát là đủ chất.'
  },
  {
    id: 'lunch-bun-thit-nuong',
    name: 'Bún thịt nướng chả giò',
    emoji: '🥣',
    price: 45000,
    kcal: 490,
    tag: 'Mát mẻ · Dễ ăn',
    note: 'Trưa nắng nóng ăn bún nguội kèm rau sống rất dễ chịu.'
  },
  {
    id: 'lunch-com-chay',
    name: 'Cơm chay thanh đạm 4 món',
    emoji: '🥬',
    price: 40000,
    kcal: 380,
    tag: 'Thanh lọc · Tiết kiệm',
    note: 'Nhẹ nhàng hệ tiêu hóa, hợp ngày rằm hoặc cần giải ngán.'
  },
  {
    id: 'lunch-mi-y-bo-bam',
    name: 'Mì Ý sốt bò băm (Spaghetti)',
    emoji: '🍝',
    price: 62000,
    kcal: 540,
    tag: 'Đổi gió · Tiện đặt ship',
    note: 'Dễ đóng hộp, gọn gàng khi vừa ăn vừa làm việc.'
  },
  {
    id: 'lunch-bun-rieu',
    name: 'Bún riêu cua tóp mỡ',
    emoji: '🍅',
    price: 45000,
    kcal: 460,
    tag: 'Chua thanh · Giải ngán',
    note: 'Vị chua dịu từ cà chua, ăn kèm rau sống rất mát.'
  },
  {
    id: 'lunch-hu-tieu-nam-vang',
    name: 'Hủ tiếu Nam Vang (khô/nước)',
    emoji: '🍜',
    price: 50000,
    kcal: 470,
    tag: 'Nhẹ bụng · Tôm thịt',
    note: 'Nước dùng ngọt thanh, dễ ăn cho cả người kén chọn.'
  },
  {
    id: 'lunch-wrap-ga-nuong',
    name: 'Bánh cuộn (Wrap) ức gà rau củ',
    emoji: '🌯',
    price: 55000,
    kcal: 370,
    tag: 'Eat clean · Siêu gọn',
    note: 'Cầm tay ăn nhanh trong 10 phút khi lịch họp dày đặc.'
  },
  {
    id: 'lunch-chao-suon',
    name: 'Cháo sườn / cháo gà nấm',
    emoji: '🥣',
    price: 40000,
    kcal: 340,
    tag: 'Ấm bụng · Nhẹ nhàng',
    note: 'Phù hợp hôm hơi mệt, mưa lạnh hoặc cần ăn nhẹ.'
  }
];
