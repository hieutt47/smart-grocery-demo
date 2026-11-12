// Glyphs for products that lucide-react has no icon for.
// Drawn on the same 24x24 grid, 1.5 stroke and round caps as Lucide so they sit
// next to real Lucide icons without a style break (docs/DESIGN.md §6.6).
import type {ReactNode} from 'react';

interface GlyphProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function Glyph({size = 44, strokeWidth = 1.5, className, children}: GlyphProps & {children: ReactNode}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ---------- Thịt & cá ---------- */

/* Tôm dùng icon Shell của Lucide (xem components.tsx) vì hình con tôm vẽ tay
   ở cỡ 44px dễ đọc thành con giun. */

/* ---------- Trứng & đậu ---------- */

/** Đậu hũ: khối đậu non nhìn chéo, mặt trên sáng. */
export function TofuIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4.8 11.6 12 7.7l7.2 3.9-7.2 3.9z" />
      <path d="M4.8 11.6v5.2l7.2 3.9 7.2-3.9v-5.2" />
      <path d="M12 15.5v5.2" />
      <path d="M8.6 11.4h.01M15.4 11.4h.01" strokeWidth={2.6} />
    </Glyph>
  );
}

/* ---------- Rau củ ---------- */

/** Cà chua: quả tròn, đài hoa trên đỉnh. */
export function TomatoIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="14" r="6.9" />
      <path d="M12 7.1V4.3" />
      <path d="M12 7.2 9.3 5.1M12 7.2l2.7-2.1M12 7.2l-.9-3.1M12 7.2l.9-3.1" />
    </Glyph>
  );
}

/** Gừng: củ nhiều nhánh nằm ngang như "bàn tay" gừng. */
export function GingerIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4.1 13.6c0-1.4 1-2.5 2.4-2.5h.2c.4-1.3 1.5-2.2 2.9-2.2.7 0 1.3.2 1.9.7.5-.5 1.2-.7 1.9-.7 1.3 0 2.4.9 2.8 2.2h.2c1.4 0 2.4 1.1 2.4 2.5s-1 2.5-2.4 2.5h-.4c-.5 1.5-1.9 2.5-3.5 2.5-.8 0-1.6-.3-2.2-.9-.6.6-1.4.9-2.2.9-1.6 0-3-1-3.5-2.5h-.2c-1.3 0-2.3-1.1-2.3-2.5z" />
      <path d="M9.1 9.5 8.1 7.8M15 9.6l1-1.7M12.3 6.9V4.9" />
    </Glyph>
  );
}

/** Tỏi: củ nhiều múi có cuống. */
export function GarlicIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4.3c1.2 1.7 2.2 2.6 3.6 3.5 1.9 1.1 3 3 3 5 0 3.4-3 5.9-6.6 5.9s-6.6-2.5-6.6-5.9c0-2 1.1-3.9 3-5C9.8 6.9 10.8 6 12 4.3z" />
      <path d="M12 12.9v5.6M9.4 13.9v3.4M14.6 13.9v3.4" />
      <path d="M12 4.1V2.3" />
    </Glyph>
  );
}

/** Hành lá: cụm lá hành dài xòe ra từ gốc trắng. */
export function ScallionIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M6.6 16.6c-1.3-3.4-1.1-6.6.7-9.5" />
      <path d="M9.4 16.6c-.6-4.2-.1-8 1.5-11.4" />
      <path d="M12.6 16.6c.2-4.3 1.3-8 3.3-11" />
      <path d="M15.6 16.6c1.2-2.6 1.7-5.2 1.5-7.7" />
      <path d="M9 16.6h6.6v1.6a3.3 3.3 0 0 1-6.6 0z" />
    </Glyph>
  );
}

/** Khoai tây: củ bầu dục nghiêng, vài mắt củ. */
export function PotatoIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <ellipse cx="12" cy="12.4" rx="7.6" ry="6" transform="rotate(-22 12 12.4)" />
      <circle cx="9.1" cy="10.4" r=".7" fill="currentColor" stroke="none" />
      <circle cx="13.4" cy="12.3" r=".7" fill="currentColor" stroke="none" />
      <circle cx="10.7" cy="14.9" r=".7" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/** Bí đỏ: quả bè ngang, có khía dọc và cuống ngắn. */
export function PumpkinIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4.6 14.1c0-3.2 3.3-5.8 7.4-5.8s7.4 2.6 7.4 5.8-3.3 5.8-7.4 5.8-7.4-2.6-7.4-5.8z" />
      <path d="M9.5 8.9c-1.1 1.4-1.7 3.2-1.7 5.2s.6 3.8 1.7 5.2" />
      <path d="M14.5 8.9c1.1 1.4 1.7 3.2 1.7 5.2s-.6 3.8-1.7 5.2" />
      <path d="M12 8.2V5.4" />
      <path d="M12.3 5.8c.7-.8 1.8-1 2.6-.7" />
    </Glyph>
  );
}

/** Dưa leo: quả dài, có gai nhỏ và cuống. */
export function CucumberIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <g transform="rotate(24 12 12)">
        <rect x="8" y="3.6" width="8" height="17.2" rx="4" />
        <path d="M12 3.6V2.2" />
        <circle cx="10.6" cy="8.4" r=".6" fill="currentColor" stroke="none" />
        <circle cx="13.4" cy="11" r=".6" fill="currentColor" stroke="none" />
        <circle cx="10.6" cy="13.6" r=".6" fill="currentColor" stroke="none" />
        <circle cx="13.4" cy="16.2" r=".6" fill="currentColor" stroke="none" />
      </g>
    </Glyph>
  );
}

/** Nấm: mũ nấm cong, thân đứng. */
export function MushroomIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3.7 11.5a8.3 8.3 0 0 1 16.6 0c0 .8-.6 1.5-1.4 1.5H5.1c-.8 0-1.4-.7-1.4-1.5z" />
      <path d="M9.9 13v5.2a2.1 2.1 0 0 0 4.2 0V13" />
    </Glyph>
  );
}

/* ---------- Gạo & gia vị ---------- */

/** Cơm: bát cơm trắng đầy, hạt cơm vun trên miệng bát. */
export function RiceBowlIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3.9 12.6h16.2c0 4.3-3.6 7.8-8.1 7.8s-8.1-3.5-8.1-7.8z" />
      <path d="M5.5 12.6c.6-2.6 3.2-4.5 6.5-4.5s5.9 1.9 6.5 4.5" />
      <path d="M9.2 11.2h.01M12 10.4h.01M14.8 11.2h.01" strokeWidth={2.4} />
      <path d="M3.2 20.4h17.6" />
    </Glyph>
  );
}

/** Mì sợi: ba vắt sợi gợn sóng đặt cạnh nhau. */
export function NoodleIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M6.6 3.4c-2.4 2.2-2.4 4.4 0 6.6s2.4 4.4 0 6.6" />
      <path d="M12 3.4c-2.4 2.2-2.4 4.4 0 6.6s2.4 4.4 0 6.6" />
      <path d="M17.4 3.4c-2.4 2.2-2.4 4.4 0 6.6s2.4 4.4 0 6.6" />
      <path d="M4.6 16.6h14.8l-1.5 2.3a3 3 0 0 1-2.5 1.4H8.6a3 3 0 0 1-2.5-1.4z" />
    </Glyph>
  );
}

/** Dầu ăn: chai có cổ và giọt dầu. */
export function OilBottleIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9.9 2.8h4.2v2.3c.5.4 1 .9 1.3 1.5l.7 1.5c.3.6.4 1.3.4 1.9v9a2 2 0 0 1-2 2H9.5a2 2 0 0 1-2-2v-9c0-.6.1-1.3.4-1.9l.7-1.5c.3-.6.8-1.1 1.3-1.5z" />
      <path d="M12 12.4c-1 1.3-1.7 2.2-1.7 3.1a1.7 1.7 0 0 0 3.4 0c0-.9-.7-1.8-1.7-3.1z" />
    </Glyph>
  );
}

/** Nước tương: chai dáng cao có nhãn. */
export function SauceBottleIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9.6 2.9h4.8v3.3c1.7.9 2.7 2.6 2.7 4.5v7.9a2 2 0 0 1-2 2H8.9a2 2 0 0 1-2-2v-7.9c0-1.9 1-3.6 2.7-4.5z" />
      <path d="M6.9 12.1h10.2M6.9 15.4h10.2" />
    </Glyph>
  );
}

/** Muối: hũ muối miệng rộng có nắp chấm lỗ. */
export function SaltShakerIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M7.6 9.2a4.4 4.4 0 0 1 8.8 0" />
      <path d="M7.6 9.2h8.8l.9 8.9a2.2 2.2 0 0 1-2.2 2.4H8.9a2.2 2.2 0 0 1-2.2-2.4z" />
      <path d="M9.9 6.9h.01M13.9 6.9h.01M11.9 5.8h.01" strokeWidth={2.6} />
    </Glyph>
  );
}

/** Tiêu: cối xay tiêu dáng thuôn, có núm vặn trên đỉnh. */
export function PepperMillIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M10.2 2.4h3.6v2.2" />
      <path d="M8.4 4.6h7.2l-1 14.2a2.6 2.6 0 0 1-2.6 2.4 2.6 2.6 0 0 1-2.6-2.4z" />
      <path d="M8.7 9.4h6.6M8.5 14.4h7" />
    </Glyph>
  );
}

/** Đường: bát đường thốt nốt với các viên đường vun trên miệng. */
export function SugarBowlIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4.4 12.4h15.2c0 4.4-3.4 7.9-7.6 7.9S4.4 16.8 4.4 12.4z" />
      <path d="M4.4 12.4c1.3-1.7 4.1-2.8 7.6-2.8s6.3 1.1 7.6 2.8" />
      <path d="M3.4 20.7h17.2" />
      <rect x="8.4" y="7.2" width="3" height="3" rx=".8" />
      <rect x="12.4" y="7.2" width="3" height="3" rx=".8" />
    </Glyph>
  );
}

/* ---------- Trái cây ---------- */

/** Cam: quả tròn có lá và cuống, khác múi chanh. */
export function OrangeIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="13.6" r="6.9" />
      <path d="M12 6.7V4.4" />
      <path d="M12.4 4.8c1.2-1 2.8-1.1 4-.4-1 1.2-2.6 1.5-4 .4z" />
    </Glyph>
  );
}
