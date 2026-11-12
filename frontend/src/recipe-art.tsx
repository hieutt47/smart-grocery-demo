import {useId, type ReactNode} from 'react';

interface ArtFrameProps {
  bg: string;
  accent?: string;
  name: string;
  className?: string;
  decorative?: boolean;
  children: ReactNode;
}

function ArtFrame({bg, accent, name, className = 'recipe-photo-cover', decorative = false, children}: ArtFrameProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const glowId = `glow-${uid}`;
  const shadowId = `shadow-${uid}`;

  return (
    <div
      className={`recipe-art-wrap ${className}`}
      data-recipe-name={name}
      role={decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : `Món ăn: ${name}`}
      aria-hidden={decorative ? true : undefined}
    >
      <svg
        viewBox="0 0 360 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="recipe-svg-art"
        preserveAspectRatio="xMidYMid slice"
        width="360"
        height="200"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="60%" stopColor={accent || bg} stopOpacity="0.35" />
            <stop offset="100%" stopColor={bg} stopOpacity="0" />
          </radialGradient>
          <filter id={shadowId} x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#2c261e" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Nền ấm de-boxed */}
        <rect width="360" height="200" fill={bg} />
        <circle cx="180" cy="105" r="95" fill={`url(#${glowId})`} />

        {/* Họa tiết đĩa hoặc nồi ấm cúng */}
        <g filter={`url(#${shadowId})`}>
          {children}
        </g>
      </svg>
    </div>
  );
}

interface ArtProps {
  name: string;
  className?: string;
  decorative?: boolean;
}

/* 1. Gà rang gừng: Chảo rang vàng xém cạnh, sợi gừng thơm lừng */
function GaRangGungArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#fbf5eb" accent="#d97736" name={name} className={className} decorative={decorative}>
      {/* Đĩa sứ tròn */}
      <circle cx="180" cy="110" r="68" fill="#ffffff" stroke="#e8ded0" strokeWidth="2" />
      <circle cx="180" cy="110" r="56" fill="#f5ede0" />
      {/* Miếng gà rang vàng óng */}
      <rect x="145" y="85" width="28" height="24" rx="8" fill="#c66827" />
      <rect x="175" y="80" width="32" height="26" rx="9" fill="#db7c35" />
      <rect x="155" y="110" width="30" height="25" rx="8" fill="#bc5f1f" />
      <rect x="187" y="108" width="26" height="22" rx="7" fill="#d3742f" />
      {/* Sợi gừng thái mỏng vàng tươi */}
      <path d="M142 98l18-4M170 78l16 8M160 125l22-6M185 102l14 12M155 105l20 2" stroke="#f4b251" strokeWidth="2.5" strokeLinecap="round" />
      {/* Hành hoa xanh điểm xuyết */}
      <circle cx="152" cy="92" r="3" fill="#3b7a42" />
      <circle cx="182" cy="95" r="3.2" fill="#3b7a42" />
      <circle cx="170" cy="118" r="3" fill="#3b7a42" />
      <circle cx="198" cy="116" r="2.8" fill="#3b7a42" />
      {/* Làn hơi nóng bốc lên */}
      <path d="M165 60c-2-8 3-12 1-18M185 58c-2-8 3-12 1-18M175 52c-2-6 2-10 1-15" stroke="#a38260" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.4" />
    </ArtFrame>
  );
}

/* 2. Bò xào cà chua: Đĩa bò nâu mềm và múi cà chua đỏ mọng */
function BoXaoCaChuaArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#fbf1ec" accent="#c74932" name={name} className={className} decorative={decorative}>
      <circle cx="180" cy="110" r="68" fill="#ffffff" stroke="#ebdcd5" strokeWidth="2" />
      <circle cx="180" cy="110" r="56" fill="#f7ebe6" />
      {/* Thịt bò thái mỏng xào chín tới */}
      <path d="M148 95c10-6 24-2 26 8s-8 16-22 14-8-16-4-22z" fill="#7a342b" />
      <path d="M178 88c12-4 22 2 24 12s-6 18-18 16-10-22-6-28z" fill="#662921" />
      <path d="M162 112c14-2 22 8 20 18s-14 12-22 6-2-22 2-24z" fill="#753028" />
      {/* Múi cà chua đỏ tươi chín mềm */}
      <path d="M140 115c6-14 20-12 24 2s-10 18-24 14z" fill="#db3f28" />
      <path d="M185 105c8-12 22-8 22 6s-8 16-22 10z" fill="#e84b33" />
      {/* Hạt tiêu và tỏi phi */}
      <circle cx="168" cy="100" r="2" fill="#2b1a17" />
      <circle cx="178" cy="115" r="2.2" fill="#f2d89b" />
      <circle cx="192" cy="98" r="1.8" fill="#2b1a17" />
      <path d="M168 58c-2-7 3-11 1-16M188 56c-2-7 3-11 1-16" stroke="#9e6255" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.4" />
    </ArtFrame>
  );
}

/* 3. Trứng chiên hành: Chảo trứng vàng rực rỡ điểm hành hoa */
function TrungChienHanhArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#fef8ea" accent="#e09c1f" name={name} className={className} decorative={decorative}>
      {/* Chảo tròn cán đen */}
      <path d="M120 110h-24c-3 0-5 2-5 5v2c0 3 2 5 5 5h24" fill="#3a342c" />
      <circle cx="180" cy="110" r="66" fill="#3a342c" />
      <circle cx="180" cy="110" r="58" fill="#f7ba36" />
      <circle cx="180" cy="110" r="48" fill="#f9c84e" />
      {/* Nếp gấp phồng xốp viền trứng */}
      <path d="M142 98c8-10 22-8 32-4s24-2 30 6 6 22-2 30-22 12-32 8-28-6-30-18 2-16 2-22z" fill="#fcd968" opacity="0.9" />
      {/* Hành hoa xanh rắc đều */}
      <circle cx="158" cy="96" r="3.2" fill="#2f7236" />
      <circle cx="174" cy="90" r="3.5" fill="#2f7236" />
      <circle cx="192" cy="100" r="3.2" fill="#2f7236" />
      <circle cx="165" cy="115" r="3.5" fill="#2f7236" />
      <circle cx="185" cy="120" r="3.2" fill="#2f7236" />
      <circle cx="172" cy="128" r="3" fill="#2f7236" />
      {/* Khói thơm nóng hổi */}
      <path d="M170 54c-2-7 3-11 1-16M190 52c-2-7 3-11 1-16" stroke="#b08436" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.45" />
    </ArtFrame>
  );
}

/* 4. Canh cải đậu hũ: Bát canh thanh mát, đậu non và rau xanh tươi */
function CanhCaiDauHuArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#f1f7f0" accent="#2f7f38" name={name} className={className} decorative={decorative}>
      {/* Bát sứ trắng miệng rộng */}
      <ellipse cx="180" cy="118" rx="72" ry="46" fill="#ffffff" stroke="#d5e5d3" strokeWidth="2" />
      {/* Nước dùng canh trong thanh ngọt */}
      <ellipse cx="180" cy="114" rx="62" ry="38" fill="#e5f2e3" />
      {/* Tàu lá cải xanh mướt */}
      <path d="M138 110c12-16 32-12 40-2s-10 22-24 18-20-4-16-16z" fill="#3c8846" opacity="0.9" />
      <path d="M172 104c14-14 36-8 38 6s-16 18-28 12-14-10-10-18z" fill="#2e7337" opacity="0.85" />
      {/* Miếng đậu non trắng mịn cắt vuông */}
      <rect x="156" y="112" width="20" height="15" rx="3" fill="#ffffff" stroke="#d2e3cf" strokeWidth="1" />
      <rect x="180" y="108" width="18" height="14" rx="3" fill="#ffffff" stroke="#d2e3cf" strokeWidth="1" />
      <rect x="168" y="124" width="19" height="13" rx="3" fill="#ffffff" stroke="#d2e3cf" strokeWidth="1" />
      {/* Lát gừng mỏng cay nhẹ */}
      <ellipse cx="152" cy="125" rx="6" ry="3" fill="#ebd28f" />
      <path d="M170 65c-2-8 3-12 1-18M190 63c-2-8 3-12 1-18" stroke="#5d9664" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.45" />
    </ArtFrame>
  );
}

/* 5. Đậu hũ sốt cà chua: Đậu hũ rán vàng đẫm sốt cà đỏ au */
function DauHuSotCaArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#fdf2ed" accent="#d94b30" name={name} className={className} decorative={decorative}>
      <circle cx="180" cy="110" r="68" fill="#ffffff" stroke="#ecd7ce" strokeWidth="2" />
      <circle cx="180" cy="110" r="56" fill="#f8e5dc" />
      {/* Vũng sốt cà chua sền sệt đậm đà */}
      <ellipse cx="180" cy="112" rx="46" ry="34" fill="#df4328" opacity="0.9" />
      {/* Miếng đậu hũ chiên vàng giòn */}
      <polygon points="148,94 172,86 166,110 142,106" fill="#f4c058" stroke="#d79a29" strokeWidth="1" />
      <polygon points="174,90 200,94 194,118 168,112" fill="#e9b244" stroke="#d79a29" strokeWidth="1" />
      <polygon points="152,112 180,114 174,134 146,128" fill="#f4c058" stroke="#d79a29" strokeWidth="1" />
      <polygon points="182,115 208,112 202,132 178,132" fill="#e3a736" stroke="#d79a29" strokeWidth="1" />
      {/* Hành hoa rắc trên mặt sốt */}
      <circle cx="162" cy="98" r="3" fill="#2d6e35" />
      <circle cx="184" cy="102" r="3.2" fill="#2d6e35" />
      <circle cx="174" cy="122" r="3" fill="#2d6e35" />
      <circle cx="196" cy="120" r="2.8" fill="#2d6e35" />
      <path d="M168 56c-2-7 3-11 1-16M188 54c-2-7 3-11 1-16" stroke="#aa5e50" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.45" />
    </ArtFrame>
  );
}

/* 6. Canh bí đỏ nấu tôm: Bát canh vàng ươm tôm hồng ngọt thanh */
function CanhBiTomArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#fff5ea" accent="#de7d23" name={name} className={className} decorative={decorative}>
      <ellipse cx="180" cy="118" rx="72" ry="46" fill="#ffffff" stroke="#eedecb" strokeWidth="2" />
      {/* Nước canh bí đỏ vàng sánh mịn */}
      <ellipse cx="180" cy="114" rx="62" ry="38" fill="#f7ab3b" />
      {/* Miếng bí đỏ cắt miếng hầm mềm */}
      <path d="M142 110c4-12 18-14 24-4s-6 18-18 16-8-4-6-12z" fill="#d97217" />
      <path d="M190 114c6-12 20-10 22 2s-10 16-20 12-4-8-2-14z" fill="#d97217" />
      {/* Tôm hồng tươi cuộn tròn */}
      <path d="M162 102c8-8 20-4 22 6s-8 16-16 12c-4-2-8-8-6-18z" fill="#ff7f66" stroke="#e0583d" strokeWidth="1" />
      <path d="M178 120c6-6 16-2 18 6s-6 12-14 8c-3-2-6-6-4-14z" fill="#ff7f66" stroke="#e0583d" strokeWidth="1" />
      {/* Hành ngò tươi */}
      <circle cx="158" cy="120" r="3" fill="#2d7034" />
      <circle cx="178" cy="106" r="3.2" fill="#2d7034" />
      <path d="M170 65c-2-8 3-12 1-18M190 63c-2-8 3-12 1-18" stroke="#aa7942" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.45" />
    </ArtFrame>
  );
}

/* 7. Rau muống xào tỏi: Đĩa rau xanh giòn rụm thơm nức tỏi phi */
function RauMuongXaoArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#f1f7f0" accent="#297833" name={name} className={className} decorative={decorative}>
      <ellipse cx="180" cy="116" rx="72" ry="48" fill="#ffffff" stroke="#d5e5d3" strokeWidth="2" />
      <ellipse cx="180" cy="114" rx="60" ry="38" fill="#e8f3e6" />
      {/* Cọng và lá rau muống xanh giòn */}
      <path d="M136 112c22-18 56-14 74-2M142 120c24-12 50-8 68 8M150 102c26-8 48 2 64 16" stroke="#2b7735" strokeWidth="5" strokeLinecap="round" />
      <path d="M146 110c18-12 42-10 60 4M138 122c22-6 44 4 58 14M155 116c20-8 40-2 52 10" stroke="#3d9749" strokeWidth="4" strokeLinecap="round" />
      {/* Tép tỏi đập dập phi vàng thơm lừng */}
      <ellipse cx="162" cy="108" rx="6" ry="4" fill="#fae29a" stroke="#cca84e" strokeWidth="1" />
      <ellipse cx="188" cy="116" rx="6.5" ry="4.5" fill="#f8de92" stroke="#cca84e" strokeWidth="1" />
      <ellipse cx="176" cy="126" rx="5.5" ry="3.8" fill="#fae29a" stroke="#cca84e" strokeWidth="1" />
      <circle cx="170" cy="102" r="2.2" fill="#2b231d" />
      <path d="M168 60c-2-8 3-12 1-18M188 58c-2-8 3-12 1-18" stroke="#5d9664" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.45" />
    </ArtFrame>
  );
}

/* 8. Thịt heo rang gừng: Miếng ba chỉ vàng cháy cạnh thơm lừng */
function ThitHeoRangGungArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#faf2eb" accent="#b9572c" name={name} className={className} decorative={decorative}>
      <circle cx="180" cy="110" r="68" fill="#ffffff" stroke="#ebdad0" strokeWidth="2" />
      <circle cx="180" cy="110" r="56" fill="#f7ebe2" />
      {/* Thịt ba chỉ thái mỏng đảo cháy cạnh */}
      <rect x="142" y="88" width="34" height="20" rx="6" fill="#8f391f" />
      <rect x="145" y="93" width="28" height="6" rx="2" fill="#eedad1" opacity="0.8" />
      <rect x="180" y="84" width="36" height="22" rx="6" fill="#a44426" />
      <rect x="184" y="90" width="28" height="6" rx="2" fill="#eedad1" opacity="0.8" />
      <rect x="150" y="114" width="36" height="22" rx="6" fill="#9c4023" />
      <rect x="154" y="120" width="28" height="6" rx="2" fill="#eedad1" opacity="0.8" />
      <rect x="184" y="112" width="32" height="20" rx="6" fill="#b85130" />
      {/* Sợi gừng tươi đảo vàng */}
      <path d="M138 104l22-6M172 82l18 8M158 132l24-4M188 106l16 10" stroke="#f2af4b" strokeWidth="2.4" strokeLinecap="round" />
      {/* Hành hoa và hạt tiêu */}
      <circle cx="150" cy="98" r="3" fill="#2d6e35" />
      <circle cx="188" cy="98" r="3.2" fill="#2d6e35" />
      <circle cx="174" cy="120" r="3" fill="#2d6e35" />
      <path d="M168 56c-2-7 3-11 1-16M188 54c-2-7 3-11 1-16" stroke="#9e6255" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.45" />
    </ArtFrame>
  );
}

/* 9. Canh cà chua trứng: Mây trứng bồng bềnh trong canh chua ngọt */
function CanhCaChuaTrungArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#fef4ea" accent="#d9542a" name={name} className={className} decorative={decorative}>
      <ellipse cx="180" cy="118" rx="72" ry="46" fill="#ffffff" stroke="#eed8cb" strokeWidth="2" />
      {/* Nước canh cà chua đỏ cam dịu ngọt */}
      <ellipse cx="180" cy="114" rx="62" ry="38" fill="#e85b3a" />
      {/* Vân trứng vàng xốp bồng bềnh như mây */}
      <path d="M142 110c14-12 30-4 44-10s26 2 34 10-18 16-36 12-32 4-42-12z" fill="#fbd358" opacity="0.95" />
      <path d="M154 122c12-8 26-2 36-6s20 2 26 8-14 12-28 8-24 4-34-10z" fill="#fce484" opacity="0.9" />
      {/* Múi cà chua chín mềm nổi trên mặt canh */}
      <path d="M136 116c4-10 16-8 18 2s-8 14-18 10z" fill="#c4381b" />
      <path d="M196 112c6-10 18-6 18 4s-10 12-18 8z" fill="#c4381b" />
      {/* Hành hoa và rau mùi rắc trên mặt */}
      <circle cx="160" cy="112" r="3" fill="#2b6b33" />
      <circle cx="178" cy="106" r="3.2" fill="#2b6b33" />
      <circle cx="190" cy="120" r="3" fill="#2b6b33" />
      <path d="M170 65c-2-8 3-12 1-18M190 63c-2-8 3-12 1-18" stroke="#a86e4e" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.45" />
    </ArtFrame>
  );
}

/* 10. Salad dưa leo cà chua: Đĩa salad tươi trộn giấm dầu ô liu đã hoàn thiện */
function SaladDuaLeoArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#f2f8f1" accent="#368940" name={name} className={className} decorative={decorative}>
      {/* Đĩa sứ phong cách Bắc Âu */}
      <circle cx="180" cy="110" r="68" fill="#ffffff" stroke="#d5e6d3" strokeWidth="2" />
      <circle cx="180" cy="110" r="56" fill="#eaf4e8" />
      {/* Xà lách xoăn xanh mướt làm nền */}
      <path d="M136 114c10-18 36-16 48-4s-8 26-26 22-26-4-22-18z" fill="#4fa458" opacity="0.85" />
      <path d="M174 104c12-16 38-12 44 4s-14 24-28 18-18-8-16-22z" fill="#3c8e45" opacity="0.85" />
      {/* Lát dưa leo giòn rụm cắt khoanh */}
      <circle cx="156" cy="108" r="14" fill="#a4dfa7" stroke="#3b8d44" strokeWidth="2.5" />
      <circle cx="156" cy="108" r="9" fill="#c4f0c7" />
      <circle cx="186" cy="114" r="15" fill="#a4dfa7" stroke="#3b8d44" strokeWidth="2.5" />
      <circle cx="186" cy="114" r="10" fill="#c4f0c7" />
      {/* Cà chua bi bổ đôi đỏ mọng */}
      <ellipse cx="170" cy="124" rx="11" ry="8" fill="#e2452c" />
      <ellipse cx="170" cy="124" rx="8" ry="5.5" fill="#f16852" />
      <ellipse cx="196" cy="98" rx="10" ry="7.5" fill="#e2452c" />
      {/* Hạt tiêu đen xay nhuyễn và sốt dầu giấm bóng bẩy */}
      <circle cx="164" cy="112" r="1.6" fill="#2b231d" />
      <circle cx="178" cy="108" r="1.8" fill="#2b231d" />
      <circle cx="188" cy="126" r="1.6" fill="#2b231d" />
    </ArtFrame>
  );
}

/* 11. Mì xào rau củ: Đĩa mì vàng óng xào rau củ bắt mắt */
function MiXaoRauArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#fef7e9" accent="#d98f1f" name={name} className={className} decorative={decorative}>
      <circle cx="180" cy="110" r="68" fill="#ffffff" stroke="#ebd9bf" strokeWidth="2" />
      <circle cx="180" cy="110" r="56" fill="#f8edd8" />
      {/* Sợi mì vàng óng cuộn tròn trên đĩa */}
      <path d="M142 114c12-16 40-16 54 2s-10 24-28 20-30-6-26-22z" stroke="#e09e2b" strokeWidth="5" strokeLinecap="round" />
      <path d="M148 106c18-12 44-8 56 8s-14 20-32 16-28-10-24-24z" stroke="#f2b442" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M156 122c16-8 38-6 48 6" stroke="#d48c17" strokeWidth="4" strokeLinecap="round" />
      {/* Cà rốt thái sợi và rau cải ngọt */}
      <path d="M145 100l22 6M176 122l20-4" stroke="#df5625" strokeWidth="3" strokeLinecap="round" />
      <path d="M170 94l16 12M152 128l18-8" stroke="#35853e" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="172" cy="112" r="2" fill="#241914" />
      <path d="M170 56c-2-7 3-11 1-16M190 54c-2-7 3-11 1-16" stroke="#b08436" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.45" />
    </ArtFrame>
  );
}

/* 12. Cá thu kho gừng: Niêu cá kho đậm màu cánh gián thơm cay */
function CaThuKhoArt({name, className, decorative}: ArtProps) {
  return (
    <ArtFrame bg="#f9f1e8" accent="#964b28" name={name} className={className} decorative={decorative}>
      {/* Niêu đất truyền thống */}
      <circle cx="180" cy="110" r="68" fill="#4d3224" stroke="#382216" strokeWidth="2" />
      <circle cx="180" cy="110" r="56" fill="#6d3f23" />
      {/* Nước kho màu cánh gián đậm đà sôi sùng sục */}
      <circle cx="180" cy="110" r="48" fill="#451e0e" />
      {/* Khúc cá thu kho chắc nịch */}
      <ellipse cx="178" cy="108" rx="28" ry="18" fill="#7d3b19" stroke="#5a270f" strokeWidth="2" />
      <path d="M162 108c8-6 24-6 32 0" stroke="#361508" strokeWidth="2" strokeLinecap="round" />
      {/* Lát gừng vàng đậm */}
      <ellipse cx="160" cy="96" rx="9" ry="5" fill="#cf9b3c" />
      <ellipse cx="194" cy="118" rx="8" ry="4.5" fill="#cf9b3c" />
      {/* Ớt chỉ thiên đỏ cay nồng */}
      <path d="M182 124c6-4 12-2 14 4" stroke="#d9351e" strokeWidth="3" strokeLinecap="round" />
      {/* Hơi khói nghi ngút */}
      <path d="M170 54c-2-7 3-11 1-16M190 52c-2-7 3-11 1-16" stroke="#946549" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.5" />
    </ArtFrame>
  );
}

export function RecipeVisual({recipe, className, decorative = false}: {recipe: {id: string; name: string}; className?: string; decorative?: boolean}) {
  const id = recipe.id;
  const name = recipe.name;

  if (id.startsWith('ga-rang')) return <GaRangGungArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('bo-xao')) return <BoXaoCaChuaArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('trung-chien')) return <TrungChienHanhArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('canh-cai')) return <CanhCaiDauHuArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('dau-hu-sot')) return <DauHuSotCaArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('canh-bi')) return <CanhBiTomArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('rau-muong')) return <RauMuongXaoArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('thit-rang') || id.startsWith('thit-heo')) return <ThitHeoRangGungArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('canh-ca-trung') || id.startsWith('canh-ca-chua')) return <CanhCaChuaTrungArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('salad')) return <SaladDuaLeoArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('mi-xao')) return <MiXaoRauArt name={name} className={className} decorative={decorative} />;
  if (id.startsWith('ca-thu')) return <CaThuKhoArt name={name} className={className} decorative={decorative} />;

  // Mặc định: Gà rang gừng ấm cúng
  return <GaRangGungArt name={name} className={className} decorative={decorative} />;
}
