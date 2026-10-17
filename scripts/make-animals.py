"""Generates the cartoon animal illustrations in src/assets/animals/*.svg.

Style follows the reference dog (dog.png): sitting chibi pose, oversized head,
big brown eyes with a white rim and highlight, cream muzzle/chest/paws, soft
inner shading and no outlines. Run: python3 scripts/make-animals.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "animals"
INK = "#3a2116"
IRIS = "#5a3420"
PUPIL = "#1d100a"
TONGUE = "#f3727f"
BLUSH = "#ff8f8f"


def eye(cx, cy, r=30, look=(4, 3)):
    lx, ly = look
    return f"""
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/>
  <circle cx="{cx+lx}" cy="{cy+ly}" r="{r*0.8:.1f}" fill="{IRIS}"/>
  <circle cx="{cx+lx}" cy="{cy+ly}" r="{r*0.55:.1f}" fill="{PUPIL}"/>
  <circle cx="{cx+lx-r*0.28:.1f}" cy="{cy+ly-r*0.3:.1f}" r="{r*0.26:.1f}" fill="#fff"/>
  <circle cx="{cx+lx+r*0.3:.1f}" cy="{cy+ly+r*0.32:.1f}" r="{r*0.1:.1f}" fill="#fff"/>"""


def brows(lx, rx, y, color, w=22):
    return f"""
  <path d="M{lx-w} {y+6} Q{lx} {y-8} {lx+w} {y+4}" stroke="{color}" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M{rx-w} {y+4} Q{rx} {y-8} {rx+w} {y+6}" stroke="{color}" stroke-width="9" fill="none" stroke-linecap="round"/>"""


def cheeks(lx, rx, y, r=18, op=0.35):
    return f"""
  <ellipse cx="{lx}" cy="{y}" rx="{r}" ry="{r*0.7:.1f}" fill="{BLUSH}" opacity="{op}"/>
  <ellipse cx="{rx}" cy="{y}" rx="{r}" ry="{r*0.7:.1f}" fill="{BLUSH}" opacity="{op}"/>"""


def open_smile(cx, cy, w=34, depth=34):
    return f"""
  <path d="M{cx-w} {cy} Q{cx} {cy+depth*1.5} {cx+w} {cy} Q{cx} {cy+depth*0.35} {cx-w} {cy} Z" fill="{INK}"/>
  <path d="M{cx-w*0.55:.1f} {cy+depth*0.62:.1f} Q{cx} {cy+depth*0.25:.1f} {cx+w*0.55:.1f} {cy+depth*0.62:.1f} Q{cx} {cy+depth*1.18:.1f} {cx-w*0.55:.1f} {cy+depth*0.62:.1f} Z" fill="{TONGUE}"/>"""


def sitting_body(base, shade, cream, top=300, belly=True, paw=None, toes=True):
    """Sitting body with two front legs and cream paws."""
    paw = paw or cream
    out = f"""
  <path d="M150 {top+20} Q130 470 170 478 L342 478 Q382 470 362 {top+20} Q340 {top-30} 256 {top-34} Q172 {top-30} 150 {top+20} Z" fill="{base}"/>
  <path d="M332 {top+10} Q372 400 350 478 L320 478 Q340 400 318 {top+6} Z" fill="{shade}" opacity="0.55"/>
  <ellipse cx="128" cy="452" rx="44" ry="30" fill="{base}"/>
  <ellipse cx="384" cy="452" rx="44" ry="30" fill="{shade}"/>"""
    if belly:
        out += f"""
  <path d="M206 {top-6} Q256 {top+20} 306 {top-6} Q318 400 290 458 L222 458 Q194 400 206 {top-6} Z" fill="{cream}"/>"""
    out += f"""
  <rect x="190" y="{top+40}" width="52" height="150" rx="26" fill="{base}"/>
  <rect x="270" y="{top+40}" width="52" height="150" rx="26" fill="{base}"/>
  <ellipse cx="214" cy="476" rx="38" ry="24" fill="{paw}"/>
  <ellipse cx="298" cy="476" rx="38" ry="24" fill="{paw}"/>"""
    if toes:
        for x in (214, 298):
            out += f"""
  <path d="M{x-10} 466 v14 M{x+10} 466 v14" stroke="{shade}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>"""
    return out


def svg(name, body):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">{body}\n</svg>\n'
    )


# ---------------------------------------------------------------- cat
c = dict(base="#f4a54a", shade="#d97f2a", cream="#fff3e0", stripe="#d6761f")
svg("cat", f"""
  <path d="M362 430 Q470 420 452 320 Q446 290 426 300 Q440 380 352 400 Z" fill="{c['base']}"/>
  <path d="M440 318 Q450 300 432 296 Q424 318 436 330 Z" fill="{c['stripe']}"/>
  {sitting_body(c['base'], c['shade'], c['cream'], top=310)}
  <path d="M152 140 L140 34 Q148 26 160 32 L236 96 Z" fill="{c['base']}"/>
  <path d="M164 122 L160 60 L212 102 Z" fill="#f7a8b4"/>
  <path d="M360 140 L372 34 Q364 26 352 32 L276 96 Z" fill="{c['shade']}"/>
  <path d="M348 122 L352 60 L300 102 Z" fill="#f7a8b4"/>
  <ellipse cx="256" cy="200" rx="150" ry="128" fill="{c['base']}"/>
  <path d="M256 74 L240 74 Q244 104 256 112 Q268 104 272 74 Z" fill="{c['stripe']}"/>
  <path d="M220 80 Q222 100 230 110 M292 80 Q290 100 282 110" stroke="{c['stripe']}" stroke-width="10" stroke-linecap="round" fill="none"/>
  <path d="M110 190 h34 M110 214 h30 M402 190 h-34 M402 214 h-30" stroke="{c['stripe']}" stroke-width="10" stroke-linecap="round"/>
  <ellipse cx="256" cy="250" rx="84" ry="62" fill="{c['cream']}"/>
  {eye(196, 192, 32)}{eye(316, 192, 32)}
  {cheeks(170, 342, 248)}
  <path d="M242 228 Q256 222 270 228 Q264 244 256 246 Q248 244 242 228 Z" fill="#f28b9b"/>
  <path d="M256 246 v10 M256 256 Q240 274 226 262 M256 256 Q272 274 286 262" stroke="{INK}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M206 244 L150 236 M206 256 L152 262 M306 244 L362 236 M306 256 L360 262" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
""")

# ---------------------------------------------------------------- fish
f = dict(base="#ff9f43", shade="#f07b1f", belly="#ffe4c4", fin="#4fb3ff", fin2="#2b8fe0")
svg("fish", f"""
  <path d="M370 256 Q450 170 492 168 Q470 256 492 344 Q450 342 370 256 Z" fill="{f['fin']}"/>
  <path d="M400 256 Q456 200 482 196 Q468 256 482 316 Q456 312 400 256 Z" fill="{f['fin2']}" opacity="0.6"/>
  <path d="M190 120 Q250 40 320 110 Z" fill="{f['fin']}"/>
  <path d="M210 392 Q260 452 300 392 Z" fill="{f['fin']}"/>
  <ellipse cx="236" cy="256" rx="176" ry="140" fill="{f['base']}"/>
  <path d="M100 300 Q236 420 380 300 Q300 372 236 374 Q160 372 100 300 Z" fill="{f['belly']}"/>
  <path d="M300 136 Q336 256 300 376" stroke="#fff" stroke-width="26" fill="none" opacity="0.9"/>
  <path d="M352 168 Q376 256 352 344" stroke="{f['shade']}" stroke-width="18" fill="none" opacity="0.6"/>
  <path d="M232 262 Q262 290 236 318 Q216 292 232 262 Z" fill="{f['fin2']}"/>
  {eye(150, 214, 40, (6, 4))}
  {cheeks(128, 9999, 280, 20)}
  <path d="M86 270 Q100 296 124 290" stroke="{INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="60" cy="150" r="12" fill="#bfe6ff" opacity="0.8"/>
  <circle cx="34" cy="104" r="8" fill="#bfe6ff" opacity="0.7"/>
""")

# ---------------------------------------------------------------- bird
b = dict(base="#4a9df0", shade="#2f78d0", belly="#ffe8c2", beak="#ffb627")
svg("bird", f"""
  <path d="M352 380 Q450 400 470 330 Q420 360 360 340 Z" fill="{b['shade']}"/>
  <path d="M236 470 v-40 M286 470 v-40" stroke="{b['beak']}" stroke-width="10" stroke-linecap="round"/>
  <path d="M216 474 h40 M266 474 h40" stroke="{b['beak']}" stroke-width="10" stroke-linecap="round"/>
  <ellipse cx="260" cy="300" rx="170" ry="160" fill="{b['base']}"/>
  <ellipse cx="260" cy="350" rx="110" ry="100" fill="{b['belly']}"/>
  <path d="M370 250 Q440 320 380 400 Q330 370 340 300 Z" fill="{b['shade']}"/>
  <path d="M150 250 Q80 320 140 400 Q190 370 180 300 Z" fill="{b['shade']}"/>
  <path d="M230 150 Q240 96 268 108 Q252 120 262 150 M262 150 Q282 104 306 120 Q284 128 286 152" fill="{b['base']}"/>
  {eye(206, 238, 34)}{eye(314, 238, 34)}
  {brows(206, 314, 190, b['shade'])}
  {cheeks(172, 348, 290)}
  <path d="M232 280 Q260 266 288 280 L260 318 Z" fill="{b['beak']}"/>
  <path d="M238 284 Q260 296 282 284" stroke="#e08f00" stroke-width="5" fill="none"/>
""")

# ---------------------------------------------------------------- horse
h = dict(base="#c07a43", shade="#9a5a2c", mane="#5c311b", muzzle="#f0d2ad")
svg("horse", f"""
  <path d="M356 410 Q440 420 430 330 Q420 300 404 320 Q414 380 350 390 Z" fill="{h['mane']}"/>
  {sitting_body(h['base'], h['shade'], h['muzzle'], top=320, belly=False, paw="#4a2a18", toes=False)}
  <path d="M170 98 L160 26 Q172 18 182 26 L214 84 Z" fill="{h['base']}"/>
  <path d="M342 98 L352 26 Q340 18 330 26 L298 84 Z" fill="{h['shade']}"/>
  <path d="M176 88 L172 46 L198 82 Z M336 88 L340 46 L314 82 Z" fill="#f2b7a6"/>
  <ellipse cx="256" cy="180" rx="128" ry="118" fill="{h['base']}"/>
  <path d="M200 70 Q256 20 312 70 Q296 120 256 104 Q216 120 200 70 Z" fill="{h['mane']}"/>
  <path d="M236 100 Q256 90 276 100 L268 220 Q256 230 244 220 Z" fill="#fff6ea"/>
  <ellipse cx="256" cy="262" rx="92" ry="64" fill="{h['muzzle']}"/>
  <ellipse cx="222" cy="252" rx="10" ry="14" fill="{h['shade']}"/>
  <ellipse cx="290" cy="252" rx="10" ry="14" fill="{h['shade']}"/>
  {eye(198, 172, 30)}{eye(314, 172, 30)}
  {cheeks(164, 348, 226)}
  {open_smile(256, 280, 34, 26)}
""")

# ---------------------------------------------------------------- cow
w = dict(base="#ffffff", shade="#e3dcd6", spot="#4a3328", muzzle="#f6b4b9")
svg("cow", f"""
  {sitting_body(w['base'], w['shade'], w['base'], top=320, belly=False, paw="#4a3328", toes=False)}
  <path d="M172 360 Q206 340 214 380 Q204 420 170 410 Z M318 400 Q350 380 356 420 Q340 446 316 430 Z" fill="{w['spot']}"/>
  <path d="M168 98 Q140 40 168 30 Q170 70 196 90 Z M344 98 Q372 40 344 30 Q342 70 316 90 Z" fill="#f5e6c4"/>
  <ellipse cx="108" cy="160" rx="54" ry="28" fill="{w['base']}" transform="rotate(-20 108 160)"/>
  <ellipse cx="404" cy="160" rx="54" ry="28" fill="{w['shade']}" transform="rotate(20 404 160)"/>
  <ellipse cx="112" cy="162" rx="30" ry="14" fill="{w['muzzle']}" transform="rotate(-20 112 162)"/>
  <ellipse cx="400" cy="162" rx="30" ry="14" fill="{w['muzzle']}" transform="rotate(20 400 162)"/>
  <ellipse cx="256" cy="180" rx="134" ry="120" fill="{w['base']}"/>
  <path d="M290 66 Q370 70 380 150 Q330 170 300 130 Q280 100 290 66 Z" fill="{w['spot']}"/>
  <path d="M232 62 Q256 52 270 64 Q262 86 240 82 Z" fill="{w['spot']}"/>
  <ellipse cx="256" cy="266" rx="100" ry="62" fill="{w['muzzle']}"/>
  <ellipse cx="220" cy="254" rx="11" ry="15" fill="#d9707c"/>
  <ellipse cx="292" cy="254" rx="11" ry="15" fill="#d9707c"/>
  {eye(198, 178, 30)}{eye(314, 178, 30)}
  {brows(198, 314, 134, "#8a6e60")}
  {open_smile(256, 284, 30, 22)}
""")

# ---------------------------------------------------------------- pig
p = dict(base="#f9a8bd", shade="#ec849f", snout="#ffc4d2", nostril="#c95b78")
svg("pig", f"""
  <path d="M362 420 Q420 430 410 380 Q396 360 386 380 Q404 396 380 404" stroke="{p['shade']}" stroke-width="10" fill="none" stroke-linecap="round"/>
  {sitting_body(p['base'], p['shade'], p['snout'], top=320, paw="#e9839c", toes=False)}
  <path d="M138 130 Q120 40 170 56 Q206 70 214 100 Z" fill="{p['base']}"/>
  <path d="M374 130 Q392 40 342 56 Q306 70 298 100 Z" fill="{p['shade']}"/>
  <path d="M156 110 Q150 70 176 76 Q194 84 196 100 Z M356 110 Q362 70 336 76 Q318 84 316 100 Z" fill="#f47f9c"/>
  <ellipse cx="256" cy="190" rx="148" ry="130" fill="{p['base']}"/>
  {eye(190, 176, 30)}{eye(322, 176, 30)}
  {brows(190, 322, 132, p['shade'])}
  {cheeks(156, 356, 240, 22, 0.45)}
  <ellipse cx="256" cy="244" rx="58" ry="42" fill="{p['snout']}"/>
  <ellipse cx="236" cy="244" rx="10" ry="16" fill="{p['nostril']}"/>
  <ellipse cx="276" cy="244" rx="10" ry="16" fill="{p['nostril']}"/>
  <path d="M226 296 Q256 322 286 296" stroke="{INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
""")

# ---------------------------------------------------------------- rabbit
r = dict(base="#ece6df", shade="#cfc4b8", cream="#fffaf3", inner="#f6a9b9")
svg("rabbit", f"""
  <circle cx="380" cy="430" r="36" fill="#fff"/>
  {sitting_body(r['base'], r['shade'], r['cream'], top=330, paw=r['cream'])}
  <path d="M196 140 Q160 10 196 6 Q236 10 232 140 Z" fill="{r['base']}"/>
  <path d="M316 140 Q352 10 316 6 Q276 10 280 140 Z" fill="{r['shade']}"/>
  <path d="M204 126 Q186 40 204 30 Q222 40 222 126 Z M308 126 Q326 40 308 30 Q290 40 290 126 Z" fill="{r['inner']}"/>
  <ellipse cx="256" cy="218" rx="140" ry="122" fill="{r['base']}"/>
  <ellipse cx="256" cy="270" rx="76" ry="54" fill="{r['cream']}"/>
  {eye(198, 206, 32)}{eye(314, 206, 32)}
  {cheeks(166, 346, 264, 22, 0.45)}
  <path d="M244 250 Q256 244 268 250 Q262 264 256 266 Q250 264 244 250 Z" fill="#f28b9b"/>
  <path d="M256 266 v8 M256 274 Q244 288 232 280 M256 274 Q268 288 280 280" stroke="{INK}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <rect x="246" y="282" width="20" height="18" rx="4" fill="#fff"/>
""")

# ---------------------------------------------------------------- sheep
s = dict(wool="#fffaf0", woolshade="#eadfcf", face="#f0d0b0", leg="#5a4033")
wool_body = "".join(
    f'<circle cx="{x}" cy="{y}" r="{rr}" fill="{s["wool"]}"/>'
    for x, y, rr in [(150, 360, 64), (210, 320, 70), (290, 318, 72), (360, 360, 64),
                     (160, 430, 56), (256, 400, 90), (352, 430, 56), (256, 450, 60)]
)
wool_head = "".join(
    f'<circle cx="{x}" cy="{y}" r="{rr}" fill="{s["wool"]}"/>'
    for x, y, rr in [(186, 96, 46), (236, 70, 50), (290, 72, 48), (334, 104, 44),
                     (150, 150, 40), (366, 156, 38)]
)
svg("sheep", f"""
  <rect x="196" y="420" width="40" height="70" rx="20" fill="{s['leg']}"/>
  <rect x="276" y="420" width="40" height="70" rx="20" fill="{s['leg']}"/>
  {wool_body}
  <ellipse cx="340" cy="410" rx="50" ry="60" fill="{s['woolshade']}" opacity="0.6"/>
  <ellipse cx="108" cy="190" rx="50" ry="24" fill="{s['face']}" transform="rotate(-25 108 190)"/>
  <ellipse cx="404" cy="190" rx="50" ry="24" fill="#ddb994" transform="rotate(25 404 190)"/>
  <ellipse cx="256" cy="200" rx="118" ry="112" fill="{s['face']}"/>
  {wool_head}
  {eye(208, 196, 30)}{eye(304, 196, 30)}
  {cheeks(178, 334, 250, 20, 0.45)}
  <ellipse cx="256" cy="248" rx="22" ry="14" fill="#a8705a"/>
  {open_smile(256, 268, 28, 22)}
""")

# ---------------------------------------------------------------- duck
d = dict(base="#ffd54a", shade="#f5b625", beak="#ff9a1f", cream="#fff3b8")
svg("duck", f"""
  <path d="M220 470 l-30 12 h60 Z M300 470 l-30 12 h60 Z" fill="{d['beak']}"/>
  <path d="M220 440 v30 M300 440 v30" stroke="{d['beak']}" stroke-width="12" stroke-linecap="round"/>
  <path d="M110 360 Q90 470 256 466 Q430 470 420 340 Q440 300 462 290 Q430 280 400 310 Q330 250 256 260 Q140 270 110 360 Z" fill="{d['base']}"/>
  <path d="M170 350 Q220 300 300 330 Q320 400 240 420 Q170 410 170 350 Z" fill="{d['shade']}"/>
  <path d="M230 52 Q244 20 262 40 Q270 18 284 42" stroke="{d['base']}" stroke-width="14" fill="none" stroke-linecap="round"/>
  <circle cx="256" cy="180" r="128" fill="{d['base']}"/>
  <path d="M340 110 Q380 190 340 270 Q370 190 340 110 Z" fill="{d['shade']}"/>
  {eye(206, 168, 32)}{eye(310, 168, 32)}
  {brows(206, 310, 120, d['shade'])}
  {cheeks(170, 346, 220, 22, 0.45)}
  <path d="M196 226 Q256 196 316 226 Q300 262 256 262 Q212 262 196 226 Z" fill="{d['beak']}"/>
  <path d="M206 232 Q256 250 306 232" stroke="#e07a00" stroke-width="5" fill="none"/>
  <ellipse cx="240" cy="216" rx="5" ry="3" fill="#c96800"/><ellipse cx="272" cy="216" rx="5" ry="3" fill="#c96800"/>
""")

# ---------------------------------------------------------------- elephant
e = dict(base="#a7b8cc", shade="#8399b2", inner="#f4b9c8", cream="#e7eef6")
svg("elephant", f"""
  {sitting_body(e['base'], e['shade'], e['cream'], top=320, belly=False, paw=e['cream'])}
  <path d="M150 120 Q30 90 40 220 Q50 320 160 270 Z" fill="{e['base']}"/>
  <path d="M362 120 Q482 90 472 220 Q462 320 352 270 Z" fill="{e['shade']}"/>
  <path d="M146 150 Q70 130 76 220 Q84 280 150 250 Z M366 150 Q442 130 436 220 Q428 280 362 250 Z" fill="{e['inner']}"/>
  <ellipse cx="256" cy="180" rx="130" ry="122" fill="{e['base']}"/>
  <path d="M228 236 Q222 330 252 372 Q284 404 330 380 Q350 366 334 344 Q318 334 306 350 Q290 362 280 342 Q270 300 284 236 Z" fill="#b5c4d6" stroke="{e['shade']}" stroke-width="7" stroke-linejoin="round"/>
  <path d="M240 280 h26 M244 312 h28 M256 344 h20" stroke="{e['shade']}" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
  {eye(200, 176, 30)}{eye(312, 176, 30)}
  {brows(200, 312, 132, e['shade'])}
  {cheeks(170, 346, 236, 22, 0.45)}
  <path d="M190 262 Q206 290 226 284" stroke="{INK}" stroke-width="6" fill="none" stroke-linecap="round"/>
""")

# ---------------------------------------------------------------- lion
l = dict(base="#f6b84a", shade="#e19a2a", mane="#c9621e", mane2="#a94d14", cream="#fff0d2")
mane = "".join(
    f'<circle cx="{256+150*__import__("math").cos(a):.0f}" cy="{196+138*__import__("math").sin(a):.0f}" r="52" fill="{l["mane"] if i % 2 else l["mane2"]}"/>'
    for i, a in enumerate([k * 3.14159 / 6 for k in range(12)])
)
svg("lion", f"""
  <path d="M362 430 Q460 440 452 360" stroke="{l['base']}" stroke-width="16" fill="none" stroke-linecap="round"/>
  <circle cx="452" cy="350" r="20" fill="{l['mane']}"/>
  {sitting_body(l['base'], l['shade'], l['cream'], top=330)}
  {mane}
  <circle cx="256" cy="196" r="150" fill="{l['mane']}"/>
  <circle cx="160" cy="96" r="30" fill="{l['base']}"/><circle cx="352" cy="96" r="30" fill="{l['shade']}"/>
  <circle cx="160" cy="96" r="15" fill="#e88c5a"/><circle cx="352" cy="96" r="15" fill="#e88c5a"/>
  <ellipse cx="256" cy="200" rx="124" ry="116" fill="{l['base']}"/>
  <ellipse cx="256" cy="256" rx="80" ry="58" fill="{l['cream']}"/>
  {eye(204, 186, 30)}{eye(308, 186, 30)}
  {brows(204, 308, 142, l['shade'])}
  {cheeks(170, 342, 246, 20, 0.4)}
  <path d="M236 226 Q256 216 276 226 Q270 246 256 250 Q242 246 236 226 Z" fill="#7a3f1f"/>
  {open_smile(256, 262, 32, 26)}
""")

# ---------------------------------------------------------------- monkey
m = dict(base="#9a6240", shade="#7a4a2e", face="#f2cba1", inner="#e8b48a")
svg("monkey", f"""
  <path d="M360 430 Q470 440 460 340 Q450 290 410 300 Q440 330 420 360" stroke="{m['shade']}" stroke-width="18" fill="none" stroke-linecap="round"/>
  {sitting_body(m['base'], m['shade'], m['face'], top=320, paw=m['face'])}
  <circle cx="110" cy="200" r="50" fill="{m['base']}"/><circle cx="402" cy="200" r="50" fill="{m['shade']}"/>
  <circle cx="110" cy="200" r="28" fill="{m['inner']}"/><circle cx="402" cy="200" r="28" fill="{m['inner']}"/>
  <ellipse cx="256" cy="196" rx="146" ry="134" fill="{m['base']}"/>
  <path d="M240 64 Q256 40 280 52 Q262 60 262 76 Z" fill="{m['base']}"/>
  <path d="M256 104 Q310 70 340 130 Q370 200 340 260 Q300 310 256 306 Q212 310 172 260 Q142 200 172 130 Q202 70 256 104 Z" fill="{m['face']}"/>
  {eye(212, 176, 30)}{eye(300, 176, 30)}
  {cheeks(184, 330, 234, 20, 0.45)}
  <ellipse cx="248" cy="226" rx="5" ry="4" fill="{m['shade']}"/><ellipse cx="264" cy="226" rx="5" ry="4" fill="{m['shade']}"/>
  {open_smile(256, 248, 40, 30)}
""")

# ---------------------------------------------------------------- frog
g = dict(base="#7ccc4e", shade="#59ad33", belly="#e2f6bf")
svg("frog", f"""
  <ellipse cx="120" cy="440" rx="70" ry="36" fill="{g['shade']}"/>
  <ellipse cx="392" cy="440" rx="70" ry="36" fill="{g['shade']}"/>
  <path d="M110 330 Q100 470 256 470 Q412 470 402 330 Q380 250 256 250 Q132 250 110 330 Z" fill="{g['base']}"/>
  <ellipse cx="256" cy="380" rx="100" ry="80" fill="{g['belly']}"/>
  <path d="M180 470 q-20 -60 10 -90 M332 470 q20 -60 -10 -90" stroke="{g['shade']}" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.6"/>
  <ellipse cx="210" cy="478" rx="34" ry="14" fill="{g['base']}"/><ellipse cx="302" cy="478" rx="34" ry="14" fill="{g['base']}"/>
  <ellipse cx="256" cy="220" rx="168" ry="110" fill="{g['base']}"/>
  <circle cx="176" cy="132" r="62" fill="{g['base']}"/>
  <circle cx="336" cy="132" r="62" fill="{g['base']}"/>
  {eye(176, 132, 42)}{eye(336, 132, 42)}
  {cheeks(140, 372, 236, 26, 0.45)}
  <path d="M168 230 Q256 300 344 230" stroke="{INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M232 266 Q256 298 280 266 Z" fill="{TONGUE}"/>
  <circle cx="230" cy="196" r="5" fill="{g['shade']}"/><circle cx="282" cy="196" r="5" fill="{g['shade']}"/>
""")

print("ok")
