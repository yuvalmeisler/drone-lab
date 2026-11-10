// בונה את תמונות "רכיבים בפירוק" — תמונת SVG אחת לכל פירוק, לפי השדה components ב-src/data/drones.ts.
// הרצה: npm run parts   (או: node scripts/components/build-sheets.ts)
// הקבצים נכתבים ל-public/components/<drone>/<task>.svg

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drones, partsImage, type Drone, type Part, type PartIcon, type Task } from '../../src/data/drones.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const W = 1200
const PAD = 48
const GAP = 24
const COL_W = (W - PAD * 2 - GAP) / 2
const ICON_R = 46
const FONT = "'Google Sans', 'Noto Sans Hebrew', 'Segoe UI', Arial, sans-serif"
const INK = '#0B2149'
const MUTED = '#475569'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** הערכת רוחב טקסט בפיקסלים (אין מדידה אמיתית בלי דפדפן) */
function textWidth(s: string, size: number) {
  let w = 0
  for (const ch of s) w += /[\s.,:;'"()\-—·]/.test(ch) ? 0.32 : 0.6
  return w * size
}

function wrap(s: string, size: number, max: number) {
  const lines: string[] = []
  let line = ''
  for (const word of s.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && textWidth(next, size) > max) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** אייקונים פשוטים בקווים, בתיבה של 64×64 */
function icon(kind: PartIcon, c: string) {
  const red = '#E3132B'
  const shapes: Record<PartIcon, string> = {
    prop: `<ellipse cx="32" cy="17" rx="7" ry="14"/><ellipse cx="32" cy="47" rx="7" ry="14"/><circle cx="32" cy="32" r="6" fill="${c}"/>`,
    motor: `<line x1="32" y1="8" x2="32" y2="19"/><ellipse cx="32" cy="22" rx="15" ry="5"/><path d="M17 22 V48 Q32 56 47 48 V22"/><line x1="17" y1="34" x2="47" y2="34" stroke-dasharray="3 4"/>`,
    mark: `<ellipse cx="32" cy="32" rx="11" ry="25"/><line x1="22" y1="22" x2="42" y2="22" stroke="${red}" stroke-width="6"/><circle cx="32" cy="32" r="4" fill="${c}"/>`,
    lock: `<path d="M50 32 A18 18 0 1 1 40 16"/><polyline points="33,11 40,16 35,23"/><circle cx="32" cy="32" r="6" fill="${c}"/>`,
    screw: `<rect x="20" y="8" width="24" height="11" rx="4"/><line x1="28" y1="13.5" x2="36" y2="13.5"/><path d="M27 19 V48 L32 56 L37 48 V19"/><line x1="27" y1="27" x2="37" y2="23"/><line x1="27" y1="35" x2="37" y2="31"/><line x1="27" y1="43" x2="37" y2="39"/>`,
    screwdriver: `<rect x="25" y="6" width="14" height="24" rx="6"/><line x1="29" y1="12" x2="29" y2="24"/><line x1="35" y1="12" x2="35" y2="24"/><line x1="32" y1="30" x2="32" y2="52"/><line x1="28" y1="56" x2="36" y2="52"/>`,
    pry: `<path d="M12 52 L44 20 Q50 14 54 18 Q56 22 50 28 L18 58 Z"/><line x1="40" y1="30" x2="46" y2="24"/>`,
    tweezers: `<path d="M24 8 L30 56"/><path d="M40 8 L34 56"/><line x1="24" y1="8" x2="40" y2="8"/>`,
    gimbal: `<rect x="23" y="8" width="18" height="6" rx="2"/><path d="M32 14 V20 H52 V42 H46"/><rect x="16" y="32" width="30" height="20" rx="5"/><circle cx="29" cy="42" r="6"/>`,
    camera: `<rect x="10" y="20" width="44" height="30" rx="6"/><rect x="17" y="14" width="12" height="6" rx="2"/><circle cx="32" cy="35" r="10"/><circle cx="32" cy="35" r="4" fill="${c}"/>`,
    lens: `<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="13"/><circle cx="32" cy="32" r="5" fill="${c}"/><path d="M22 24 A13 13 0 0 1 30 19.5" stroke-width="3"/>`,
    cover: `<path d="M14 44 Q14 16 32 16 Q50 16 50 44"/><line x1="8" y1="44" x2="56" y2="44"/><path d="M22 36 Q24 26 30 24" stroke-width="3"/>`,
    button: `<line x1="32" y1="4" x2="32" y2="17"/><polyline points="26,12 32,18 38,12"/><rect x="12" y="24" width="40" height="26" rx="7"/><circle cx="32" cy="37" r="6" fill="${c}"/>`,
    port: `<rect x="10" y="20" width="44" height="26" rx="7"/><line x1="20" y1="29" x2="20" y2="37"/><line x1="28" y1="29" x2="28" y2="37"/><line x1="36" y1="29" x2="36" y2="37"/><line x1="44" y1="29" x2="44" y2="37"/>`,
    dots: `<circle cx="32" cy="16" r="7" fill="${red}" stroke="${red}"/><circle cx="32" cy="48" r="7" fill="${red}" stroke="${red}"/><line x1="32" y1="25" x2="32" y2="39" stroke-dasharray="3 4"/>`,
    antenna: `<line x1="32" y1="58" x2="32" y2="22"/><circle cx="32" cy="20" r="4" fill="${c}"/><path d="M22 12 A14 14 0 0 0 22 28"/><path d="M42 12 A14 14 0 0 1 42 28"/><path d="M15 6 A23 23 0 0 0 15 34"/><path d="M49 6 A23 23 0 0 1 49 34"/>`,
    sensor: `<rect x="8" y="20" width="48" height="24" rx="9"/><circle cx="21" cy="32" r="6"/><circle cx="43" cy="32" r="6"/><circle cx="21" cy="32" r="2" fill="${c}"/><circle cx="43" cy="32" r="2" fill="${c}"/>`,
    frame: `<line x1="14" y1="14" x2="50" y2="50"/><line x1="50" y1="14" x2="14" y2="50"/><circle cx="14" cy="14" r="6" fill="#fff"/><circle cx="50" cy="14" r="6" fill="#fff"/><circle cx="14" cy="50" r="6" fill="#fff"/><circle cx="50" cy="50" r="6" fill="#fff"/><rect x="23" y="23" width="18" height="18" rx="5" fill="#fff"/>`,
    leg: `<line x1="20" y1="10" x2="44" y2="10"/><line x1="22" y1="10" x2="18" y2="48"/><line x1="42" y1="10" x2="46" y2="48"/><line x1="8" y1="50" x2="30" y2="50" stroke-width="5"/><line x1="34" y1="50" x2="56" y2="50" stroke-width="5"/>`,
    case: `<rect x="8" y="20" width="48" height="32" rx="6"/><path d="M24 20 V13 H40 V20"/><line x1="8" y1="32" x2="56" y2="32"/><rect x="28" y="28" width="8" height="8" rx="2" fill="${c}"/>`,
    speaker: `<path d="M10 26 H20 L32 15 V49 L20 38 H10 Z"/><path d="M40 24 A11 11 0 0 1 40 40"/><path d="M46 17 A20 20 0 0 1 46 47"/>`,
    stick: `<ellipse cx="32" cy="52" rx="16" ry="5"/><line x1="32" y1="52" x2="32" y2="24"/><circle cx="32" cy="17" r="8"/>`,
    cable: `<rect x="6" y="16" width="12" height="16" rx="2"/><rect x="46" y="32" width="12" height="16" rx="2"/><path d="M18 20 C32 20 32 36 46 36"/><path d="M18 28 C32 28 32 44 46 44"/>`,
    battery: `<rect x="14" y="14" width="36" height="42" rx="6"/><rect x="24" y="8" width="16" height="6" rx="2"/><polyline points="35,22 27,36 37,36 29,50"/>`,
  }
  return `<g fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${shapes[kind]}</g>`
}

function warnIcon(x: number, y: number) {
  return `<g transform="translate(${x} ${y})"><path d="M20 3 L38 35 H2 Z" fill="#FFC60A" stroke="#B45309" stroke-width="2.5" stroke-linejoin="round"/><line x1="20" y1="14" x2="20" y2="24" stroke="#78350F" stroke-width="3.5" stroke-linecap="round"/><circle cx="20" cy="30" r="2.2" fill="#78350F"/></g>`
}

function card(p: Part, x: number, y: number, h: number, d: Drone) {
  const right = x + COL_W
  const cx = right - 24 - ICON_R
  const cy = y + 24 + ICON_R
  const textR = right - 24 - ICON_R * 2 - 22
  const textW = textR - (x + 24)
  const name = wrap(p.name, 25, textW)
  const desc = wrap(p.desc, 19, textW)
  let ty = y + 46
  const lines: string[] = []
  for (const l of name) {
    lines.push(`<text x="${textR}" y="${ty}" font-size="25" font-weight="700" fill="${INK}">${esc(l)}</text>`)
    ty += 32
  }
  ty += 2
  for (const l of desc) {
    lines.push(`<text x="${textR}" y="${ty}" font-size="19" fill="${MUTED}">${esc(l)}</text>`)
    ty += 28
  }
  return `
  <g>
    <rect x="${x}" y="${y}" width="${COL_W}" height="${h}" rx="22" fill="#fff" stroke="#E6ECF5" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${ICON_R}" fill="${d.accentSoft}"/>
    <g transform="translate(${cx - 32} ${cy - 32})">${icon(p.icon, d.accent)}</g>
    ${lines.join('\n    ')}
  </g>`
}

function cardHeight(p: Part) {
  const textW = COL_W - 48 - ICON_R * 2 - 22
  const h = 46 + wrap(p.name, 25, textW).length * 32 + 2 + wrap(p.desc, 19, textW).length * 28 + 4
  return Math.max(h, 24 * 2 + ICON_R * 2)
}

function sheet(d: Drone, t: Task) {
  const parts = t.components ?? []
  const headH = 170
  let y = headH + 36
  const body: string[] = []
  for (let i = 0; i < parts.length; i += 2) {
    const row = parts.slice(i, i + 2)
    const h = Math.max(...row.map(cardHeight))
    // RTL: הרכיב הראשון בשורה מימין
    row.forEach((p, k) => body.push(card(p, k === 0 ? PAD + COL_W + GAP : PAD, y, h, d)))
    y += h + GAP
  }

  const sHead = 'תזכורת בטיחות — עוצרים ובודקים לפני שמתחילים'
  const sRules = wrap('רחפן כבוי וסוללה בחוץ לפני כל מגע · עובדים עם הכלי המתאים ובלי כוח · כל בורג חוזר למקומו · לא נוגעים בעדשה ובמגעים', 19, W - PAD * 2 - 110)
  const sH = 44 + 32 + sRules.length * 28
  const sy = y + 8
  const H = sy + sH + PAD
  const sx = W - PAD - 84
  const sText =
    `<text x="${sx}" y="${sy + 48}" font-size="22" font-weight="800" fill="#78350F">${esc(sHead)}</text>` +
    sRules.map((l, i) => `<text x="${sx}" y="${sy + 82 + i * 28}" font-size="19" fill="#92400E">${esc(l)}</text>`).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" direction="rtl" font-family="${FONT}" text-anchor="start">
  <title>${esc(`רכיבים בפירוק · ${t.title} · ${d.name}`)}</title>
  <rect width="${W}" height="${H}" fill="#F4F7FC"/>
  <rect width="${W}" height="${headH}" fill="${d.accent}"/>
  <circle cx="90" cy="20" r="140" fill="#fff" opacity="0.08"/>
  <circle cx="230" cy="190" r="90" fill="#fff" opacity="0.07"/>
  <text x="${W - PAD}" y="62" font-size="22" font-weight="700" fill="#fff" opacity="0.85">רכיבים בפירוק · ⁨${esc(d.name)}⁩</text>
  <text x="${W - PAD}" y="122" font-size="50" font-weight="800" fill="#fff">${esc(t.title)}</text>
  <text x="${PAD}" y="122" font-size="20" font-weight="600" fill="#fff" opacity="0.85" text-anchor="end">${parts.length} רכיבים</text>
  ${body.join('\n')}
  <rect x="${PAD}" y="${sy}" width="${W - PAD * 2}" height="${sH}" rx="20" fill="#FFFBF0" stroke="#FCEBC0" stroke-width="2"/>
  ${warnIcon(W - PAD - 64, sy + sH / 2 - 19)}
  ${sText}
</svg>
`
}

let n = 0
for (const d of drones) {
  for (const t of d.tasks) {
    if (!t.components?.length) continue
    const out = join(root, 'public', partsImage(d.id, t.id))
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, sheet(d, t))
    n++
  }
}
console.log(`נוצרו ${n} תמונות רכיבים ב-public/components`)
