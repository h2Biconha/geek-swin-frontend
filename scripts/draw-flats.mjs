/**
 * Gera os desenhos técnicos (flats) dos produtos em public/art/*.svg.
 * Rode: node scripts/draw-flats.mjs
 *
 * São ilustrações de ficha técnica (frente, costas, detalhe), não fotografia.
 * Quando houver fotos reais, elas entram pelo campo "media" do catalog.json e os flats
 * continuam como vistas técnicas da galeria.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/art/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const ACCENT = "#2E2EFF";
const SCHEMES = {
  black: { fill: "#1A1A1C", outline: "#0B0B0C", seam: "#45454B", inner: "#0E0E10", print: "#E9E7E1", shade: 0.32, light: 0.06 },
  bone: { fill: "#F5F3ED", outline: "#A9A69C", seam: "#C9C5BA", inner: "#DCD9D0", print: "#0B0B0C", shade: 0.1, light: 0.5 },
  cement: { fill: "#B9B6AD", outline: "#86837B", seam: "#9C998F", inner: "#9E9B92", print: "#0B0B0C", shade: 0.16, light: 0.18 },
  line: { fill: "#121214", outline: "#EEECE6", seam: "rgba(238,236,230,.38)", inner: "#0B0B0C", print: "#EEECE6", shade: 0, light: 0 },
};

let uid = 0;
/** Peça = silhueta + camada de volume (gradiente recortado na silhueta) + costuras. */
function piece(d, s, extra = "") {
  const id = `g${++uid}`;
  const vol = s.shade
    ? `<clipPath id="${id}c"><path d="${d}"/></clipPath>
       <linearGradient id="${id}v" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="${s.shade}"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${s.light * 0.35}"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${s.shade}"/></linearGradient>
       <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${s.light * 0.25}"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${s.shade * 0.5}"/></linearGradient>`
    : "";
  return `<defs>${vol}</defs>
  <path d="${d}" fill="${s.fill}" stroke="${s.outline}" stroke-width="3" stroke-linejoin="round"/>
  ${s.shade ? `<g clip-path="url(#${id}c)"><rect width="1000" height="1250" fill="url(#${id}v)"/><rect width="1000" height="1250" fill="url(#${id}h)"/></g>` : ""}
  ${extra}`;
}
const seam = (d, s, w = 2) => `<path d="${d}" fill="none" stroke="${s.seam}" stroke-width="${w}" stroke-dasharray="7 6" stroke-linecap="round"/>`;
const line = (d, s, w = 2.5) => `<path d="${d}" fill="none" stroke="${s.outline}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const text = (x, y, t, s, size = 26, anchor = "middle", ls = 4, weight = 800) =>
  `<text x="${x}" y="${y}" fill="${s.print}" font-family="'Archivo Narrow','Arial Narrow',Arial,sans-serif" font-weight="${weight}" font-size="${size}" letter-spacing="${ls}" text-anchor="${anchor}">${t}</text>`;
const label = (x, y, w = 38, h = 20) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ACCENT}"/>`;
const shadow = (rx = 300, y = 1160) =>
  `<defs><filter id="sh" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="14"/></filter></defs><ellipse cx="500" cy="${y}" rx="${rx}" ry="20" fill="#000" opacity=".16" filter="url(#sh)"/>`;
const svg = (body, vb = "0 0 1000 1250", title = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img">${title ? `<title>${title}</title>` : ""}${body}</svg>`;

/* ---------- camiseta boxy ---------- */
const TEE = "M410 250 L250 292 L128 478 L222 536 L276 462 L284 1080 L716 1080 L724 462 L778 536 L872 478 L750 292 L590 250 Q500 300 410 250 Z";
function tee(s, view, print = "") {
  const neckFront = view === "front";
  const collar = neckFront
    ? `<path d="M410 250 Q500 336 590 250" fill="${s.inner}" stroke="${s.outline}" stroke-width="3"/><path d="M398 254 Q500 362 602 254" fill="none" stroke="${s.outline}" stroke-width="2.5"/>${seam("M392 262 Q500 378 608 262", s)}`
    : `<path d="M410 250 Q500 286 590 250" fill="none" stroke="${s.outline}" stroke-width="3"/>${seam("M404 262 Q500 304 596 262", s)}`;
  return piece(
    TEE,
    s,
    `${collar}
    ${line("M250 292 L276 462", s, 2)}${line("M750 292 L724 462", s, 2)}
    ${seam("M240 306 L266 466", s)}${seam("M760 306 L734 466", s)}
    ${seam("M146 492 L232 546", s)}${seam("M854 492 L768 546", s)}
    ${seam("M286 1046 L714 1046", s)}${seam("M286 1056 L714 1056", s)}
    ${print}
    ${view === "front" ? label(300, 1016, 30, 16) : ""}`,
  );
}

/* ---------- moletom com capuz ---------- */
const HOOD = "M384 270 C340 140 410 46 500 40 C590 46 660 140 616 270 Z";
const HOODIE = "M402 256 L230 300 L146 830 L234 838 L272 476 L276 990 L724 990 L728 476 L766 838 L854 830 L770 300 L598 256 Q500 300 402 256 Z";
function hoodie(s, view, print = "") {
  const front = `
    <path d="M428 272 C414 128 586 128 572 272 L500 332 Z" fill="${s.inner}" stroke="${s.outline}" stroke-width="3" stroke-linejoin="round"/>
    ${line("M402 256 C420 300 470 322 500 332 C530 322 580 300 598 256", s, 3)}
    <path d="M470 304 C468 360 462 420 458 474" fill="none" stroke="${s.print}" stroke-opacity=".85" stroke-width="7" stroke-linecap="round"/>
    <path d="M530 304 C532 360 538 420 542 474" fill="none" stroke="${s.print}" stroke-opacity=".85" stroke-width="7" stroke-linecap="round"/>
    <rect x="451" y="470" width="14" height="30" rx="3" fill="#7d7d84"/><rect x="535" y="470" width="14" height="30" rx="3" fill="#7d7d84"/>
    <path d="M346 940 L346 780 L398 728 L602 728 L654 780 L654 940 Z" fill="none" stroke="${s.outline}" stroke-width="2.5" stroke-linejoin="round"/>
    ${seam("M358 930 L358 786 L404 740 L596 740 L642 786 L642 930", s)}
    ${line("M346 780 L398 728", s, 4)}${line("M654 780 L602 728", s, 4)}
    ${label(300, 1024, 30, 16)}`;
  const back = `
    <path d="M384 270 C340 140 410 46 500 40 C590 46 660 140 616 270 C598 356 554 414 500 428 C446 414 402 356 384 270 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="3"/>
    ${seam("M500 48 L500 420", s)}${line("M500 40 L500 428", s, 1.5)}`;
  return `<path d="${HOOD}" fill="${s.inner}" stroke="${s.outline}" stroke-width="3"/>` +
    piece(
      HOODIE,
      s,
      `${line("M230 300 L272 476", s, 2)}${line("M770 300 L728 476", s, 2)}
      <path d="M146 830 L234 838 L230 910 L152 904 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="3"/>
      <path d="M854 830 L766 838 L770 910 L848 904 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="3"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => line(`M${162 + i * 13} 838 L${160 + i * 13} 904`, s, 1.2) + line(`M${838 - i * 13} 838 L${840 - i * 13} 904`, s, 1.2)).join("")}
      <path d="M276 990 L724 990 L720 1074 L280 1074 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="3"/>
      ${Array.from({ length: 29 }, (_, i) => line(`M${290 + i * 15.4} 996 L${290 + i * 15.4} 1068`, s, 1.1)).join("")}
      ${view === "front" ? front : back}
      ${print}`,
    );
}

/* ---------- boné ---------- */
function cap(s, view) {
  if (view === "front" || view === "detail")
    return piece(
      "M232 700 C232 452 372 352 520 350 C676 352 790 470 792 668 L792 700 Z",
      s,
      `<path d="M232 700 C300 760 600 776 900 744 C962 738 966 700 904 690 C760 676 470 690 232 700 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="3"/>
      ${seam("M248 712 C330 754 600 764 880 730", s)}${seam("M262 722 C340 760 600 768 870 740", s)}
      ${line("M520 350 C452 420 404 560 392 700", s, 2)}${line("M520 350 C600 430 640 560 650 696", s, 2)}${line("M520 350 C700 400 780 520 792 640", s, 1.5)}
      ${seam("M508 360 C444 430 398 560 380 700", s)}${seam("M532 360 C612 436 654 560 664 696", s)}
      <ellipse cx="520" cy="348" rx="22" ry="10" fill="${s.fill}" stroke="${s.outline}" stroke-width="2.5"/>
      <circle cx="452" cy="476" r="7" fill="none" stroke="${s.seam}" stroke-width="3"/><circle cx="620" cy="470" r="7" fill="none" stroke="${s.seam}" stroke-width="3"/>
      <rect x="690" y="556" width="68" height="34" fill="${ACCENT}" transform="rotate(8 724 573)"/>
      <text x="724" y="580" transform="rotate(8 724 573)" fill="#fff" font-family="'Archivo Narrow','Arial Narrow',Arial,sans-serif" font-weight="800" font-size="22" letter-spacing="2" text-anchor="middle">GS_</text>`,
    ) + shadow(330, 790);
  return piece(
    "M262 720 C262 464 378 372 500 370 C622 372 738 464 738 720 Z",
    s,
    `<path d="M410 720 C410 620 590 620 590 720 Z" fill="${s.inner}" stroke="${s.outline}" stroke-width="3"/>
    <path d="M396 664 L604 664 L604 690 L396 690 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="2.5"/>
    <rect x="566" y="654" width="40" height="46" fill="none" stroke="#8a8a90" stroke-width="5"/>
    ${line("M500 370 L500 640", s, 2)}${line("M500 370 C430 430 390 560 380 720", s, 2)}${line("M500 370 C570 430 610 560 620 720", s, 2)}
    ${seam("M512 380 L512 630", s)}${seam("M488 380 L488 630", s)}
    <ellipse cx="500" cy="368" rx="22" ry="10" fill="${s.fill}" stroke="${s.outline}" stroke-width="2.5"/>
    ${seam("M276 708 L724 708", s)}` ,
  ) + shadow(260, 780);
}

/* ---------- meias (3 pares) ---------- */
function sock(s, cuff, x, y, rot) {
  const d = "M0 0 L0 540 C0 616 44 654 122 654 L318 654 C372 654 392 622 392 582 C392 540 360 520 316 514 L150 492 L150 0 Z";
  return `<g transform="translate(${x} ${y}) rotate(${rot})">${piece(
    d,
    s,
    `<path d="M0 0 L150 0 L150 110 L0 110 Z" fill="${cuff.fill}" stroke="${cuff.outline}" stroke-width="3"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${14 + i * 15} 8 L${14 + i * 15} 102" stroke="${cuff.seam}" stroke-width="2"/>`).join("")}
    <rect x="0" y="128" width="150" height="12" fill="${ACCENT}"/><rect x="0" y="152" width="150" height="12" fill="${ACCENT}"/>
    ${seam("M0 560 C40 560 70 600 74 654", s)}${seam("M312 520 C300 560 300 620 318 654", s)}`,
  )}</g>`;
}
const socks = (view) => {
  const bone = SCHEMES.bone, black = SCHEMES.black;
  if (view === "detail") return sock(bone, black, 360, 160, 0);
  return sock(bone, black, 190, 210, -6) + sock(bone, black, 380, 190, 0) + sock(bone, black, 560, 230, 6) + shadow(360, 1000);
};

/* ---------- calças ---------- */
const PANT = (w) => `M328 210 L672 210 L676 264 L${712 + w} 1128 L${520} 1128 L500 540 L480 1128 L${288 - w} 1128 L324 264 Z`;
function pant(s, view, kind) {
  const w = kind === "wide" ? 14 : 0;
  const common = `
    <path d="M328 210 L672 210 L676 264 L324 264 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="3"/>
    ${seam("M330 254 L670 254", s)}
    ${[352, 430, 570, 648].map((x) => `<rect x="${x - 8}" y="204" width="16" height="66" fill="${s.fill}" stroke="${s.outline}" stroke-width="2.5"/>`).join("")}
    ${seam(`M${292 - w} 1100 L478 1100`, s)}${seam(`M522 1100 L${708 + w} 1100`, s)}`;
  let det = "";
  if (view === "front" || view === "detail") {
    det += `${line("M500 264 L500 470", s, 2)}${seam("M522 266 L522 444 Q522 476 498 492", s)}
      ${line("M340 266 C360 330 384 370 420 386", s, 2.5)}${line("M660 266 C640 330 616 370 580 386", s, 2.5)}
      ${kind === "wide" ? line("M420 264 L432 640", s, 2) + line("M580 264 L568 640", s, 2) : ""}
      <circle cx="500" cy="236" r="9" fill="#8a8a90"/>`;
    if (kind === "cargo")
      det += [[300, 1], [586, -1]].map(([x]) => `
        <path d="M${x} 590 L${x + 116} 590 L${x + 116} 800 L${x} 800 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="2.5"/>
        ${seam(`M${x + 10} 600 L${x + 106} 600 L${x + 106} 790 L${x + 10} 790 Z`, s)}
        <path d="M${x - 6} 566 L${x + 122} 566 L${x + 122} 626 L${x - 6} 626 Z" fill="${s.fill}" stroke="${s.outline}" stroke-width="2.5"/>
        ${seam(`M${x + 2} 616 L${x + 114} 616`, s)}`).join("") +
        `<path d="M372 1128 L366 1170" stroke="${s.outline}" stroke-width="4"/><rect x="358" y="1166" width="16" height="22" rx="4" fill="#8a8a90"/>
         <path d="M628 1128 L634 1170" stroke="${s.outline}" stroke-width="4"/><rect x="626" y="1166" width="16" height="22" rx="4" fill="#8a8a90"/>`;
    det += label(604, 270, 26, 14);
  } else {
    det += `${line("M500 210 L500 540", s, 2)}${seam("M332 330 C420 300 580 300 668 330", s)}
      <path d="M370 360 L460 360 L456 470 L374 470 Z" fill="none" stroke="${s.outline}" stroke-width="2.5"/>${seam("M380 370 L450 370 L447 460 L383 460 Z", s)}
      <path d="M540 360 L630 360 L626 470 L544 470 Z" fill="none" stroke="${s.outline}" stroke-width="2.5"/>${seam("M550 370 L620 370 L617 460 L553 460 Z", s)}`;
  }
  return piece(PANT(w), s, common + det) + shadow(300, 1196);
}

/* ---------- estampas ---------- */
const frame = (s) => {
  const c = (x, y, dx, dy) => `<path d="M${x} ${y + dy * 34} L${x} ${y} L${x + dx * 34} ${y}" fill="none" stroke="${s.print}" stroke-width="7"/>`;
  return c(434, 400, 1, 1) + c(566, 400, -1, 1) + c(434, 532, 1, -1) + c(566, 532, -1, -1) +
    `<rect x="489" y="455" width="22" height="22" fill="${ACCENT}"/>` + text(500, 580, "PLAYER SELECT", s, 20, "middle", 6, 700);
};
const backPrint = (s, t2) => text(500, 380, "INSERT COIN", s, 30, "middle", 8) + text(500, 412, t2, s, 16, "middle", 5, 600);

/* ---------- arquivos ---------- */
const files = {};
const B = SCHEMES.black, W = SCHEMES.bone, C = SCHEMES.cement, L = SCHEMES.line;
const crop = { tee: "300 170 400 500", hoodie: "300 220 400 500", cap: "560 440 320 400", pant: "260 520 280 350", sock: "320 120 300 375" };

files["hoodie-front"] = svg(hoodie(B, "front", text(612, 430, "GS_", { print: "#3a3a40" }, 22, "middle", 2)) + shadow());
files["hoodie-back"] = svg(hoodie(B, "back", backPrint(B, "DROP 001 · N° ___/150")) + shadow());
files["hoodie-detail"] = svg(hoodie(B, "front", text(612, 430, "GS_", { print: "#3a3a40" }, 22, "middle", 2)), crop.hoodie);
files["hoodie-line"] = svg(hoodie(L, "front", text(612, 430, "GS_", L, 22, "middle", 2)));

files["tee-front"] = svg(tee(W, "front", frame(W)) + shadow());
files["tee-back"] = svg(tee(W, "back", backPrint(W, "DROP 001 · N° ___/300")) + shadow());
files["tee-detail"] = svg(tee(W, "front", frame(W)), crop.tee);

files["tee-black-front"] = svg(tee(B, "front", text(612, 430, "GG/WP", B, 26, "middle", 3)) + shadow());
files["tee-black-back"] = svg(tee(B, "back") + shadow());
files["tee-black-detail"] = svg(tee(B, "front", text(612, 430, "GG/WP", B, 26, "middle", 3)), crop.tee);

files["cap-front"] = svg(cap(B, "front"), "120 250 860 1075");
files["cap-back"] = svg(cap(B, "back"), "60 230 880 1100");
files["cap-detail"] = svg(cap(B, "detail"), crop.cap);

files["socks-front"] = svg(socks("front"), "60 80 900 1125");
files["socks-detail"] = svg(socks("detail"), crop.sock);

files["cargo-front"] = svg(pant(C, "front", "cargo"));
files["cargo-back"] = svg(pant(C, "back", "cargo"));
files["cargo-detail"] = svg(pant(C, "front", "cargo"), crop.pant);

files["wide-front"] = svg(pant(B, "front", "wide"));
files["wide-back"] = svg(pant(B, "back", "wide"));
files["wide-detail"] = svg(pant(B, "front", "wide"), "300 180 400 500");

const mini = (s, x, y, r, print = "") => `<g transform="translate(${x} ${y}) rotate(${r} 500 625) scale(.78)">${tee(s, "front", print)}</g>`;
files["kit-front"] = svg(mini(B, -40, 150, -7, text(612, 430, "GG/WP", B, 26, "middle", 3)) + mini(C, 260, 150, 7) + mini(W, 110, 190, 0) + shadow(360, 1170));
files["kit-detail"] = svg(mini(B, -40, 150, -7) + mini(C, 260, 150, 7) + mini(W, 110, 190, 0), "180 260 640 800");

for (const [name, s] of Object.entries(files)) writeFileSync(new URL(`${name}.svg`, OUT), s);
console.log(`${Object.keys(files).length} desenhos em public/art/`);
