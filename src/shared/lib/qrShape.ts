// Геометрия «органичного» QR: модули сливаются в группы, у групп скруглены внешние углы,
// во внутренних углах — галтели. Всё — ОДИН path (без швов между модулями при сглаживании).
import qrcode from "qrcode-generator";

export type QrShape = { size: number; body: string; finders: { ring: string; eye: string }; hole: number };

const R_OUT = 0.48; // радиус внешнего угла, в модулях
const R_IN = 0.36;  // радиус галтели во внутреннем углу

const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

export function qrShape(value: string, opts: { level?: "L" | "M" | "Q" | "H"; holeRatio?: number } = {}): QrShape {
  const qr = qrcode(0, opts.level ?? "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  const inFinder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  // центральная «дырка» под знак: нечётная сторона, чтобы стояла ровно по центру
  let hole = Math.round(n * (opts.holeRatio ?? 0));
  if (hole && hole % 2 === 0) hole += 1;
  const h0 = (n - hole) / 2;
  const inHole = (x: number, y: number) => hole > 0 && x >= h0 - 0.5 && x < h0 + hole - 0.5 && y >= h0 - 0.5 && y < h0 + hole - 0.5;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && !inFinder(x, y) && !inHole(x, y) && qr.isDark(y, x);

  const d: string[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const up = on(x, y - 1), dn = on(x, y + 1), lf = on(x - 1, y), rt = on(x + 1, y);
    if (on(x, y)) {
      const tl = !up && !lf ? R_OUT : 0, tr = !up && !rt ? R_OUT : 0, br = !dn && !rt ? R_OUT : 0, bl = !dn && !lf ? R_OUT : 0;
      d.push(`M${x + tl} ${y}H${x + 1 - tr}${tr ? `A${tr} ${tr} 0 0 1 ${x + 1} ${y + tr}` : ""}V${y + 1 - br}${br ? `A${br} ${br} 0 0 1 ${x + 1 - br} ${y + 1}` : ""}H${x + bl}${bl ? `A${bl} ${bl} 0 0 1 ${x} ${y + 1 - bl}` : ""}V${y + tl}${tl ? `A${tl} ${tl} 0 0 1 ${x + tl} ${y}` : ""}Z`);
    } else if (!inFinder(x, y) && !inHole(x, y)) {
      const r = R_IN;
      // галтель только в настоящем внутреннем углу (L из трёх модулей), без перемычек на диагональных стыках
      if (up && lf && on(x - 1, y - 1)) d.push(`M${x} ${y}H${x + r}A${r} ${r} 0 0 0 ${x} ${y + r}Z`);
      if (up && rt && on(x + 1, y - 1)) d.push(`M${x + 1} ${y}V${y + r}A${r} ${r} 0 0 0 ${x + 1 - r} ${y}Z`);
      if (dn && rt && on(x + 1, y + 1)) d.push(`M${x + 1} ${y + 1}H${x + 1 - r}A${r} ${r} 0 0 0 ${x + 1} ${y + 1 - r}Z`);
      if (dn && lf && on(x - 1, y + 1)) d.push(`M${x} ${y + 1}V${y + 1 - r}A${r} ${r} 0 0 0 ${x + r} ${y + 1}Z`);
    }
  }
  const corners = [[0, 0], [n - 7, 0], [0, n - 7]];
  const ring = corners.map(([x, y]) => roundRect(x, y, 7, 7, 2.4) + roundRect(x + 1, y + 1, 5, 5, 1.6)).join("");
  const eye = corners.map(([x, y]) => roundRect(x + 2, y + 2, 3, 3, 1.2)).join("");
  return { size: n, body: d.join(""), finders: { ring, eye }, hole };
}
