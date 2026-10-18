#!/usr/bin/env python3
"""Build original TradeSchool technical diagrams.

Run: python3 tools/media/build_diagrams.py
"""

import os

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "reference")

# Palette. Signal colors are pulled from real field color coding:
# ANSI Z535 safety signage, ASME A13.1 pipe marking, AHRI refrigerant cylinder colors.
IN_K = "#12151A"  # graphite ground
PANEL = "#1A1F26"
RULE = "#2E3540"
RULE2 = "#455060"
BONE = "#E9E5DC"
DIM = "#97A1AD"
SIG = {
    "electrical": "#F0B429",
    "hvac": "#E0607E",
    "plumbing": "#2FA36B",
    "industrial": "#E4712F",
    "welding": "#C4472F",
    "construction": "#4A87C7",
}
MONO = "ui-monospace,'IBM Plex Mono',Menlo,monospace"
SANS = "'Saira','Saira Condensed',system-ui,sans-serif"


def head(w, h, title, sub, accent):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}">
<rect width="{w}" height="{h}" fill="{IN_K}"/>
<rect x="0" y="0" width="{w}" height="4" fill="{accent}"/>
<text x="36" y="52" fill="{BONE}" font-family="{SANS}" font-size="26" font-weight="700" letter-spacing="-0.01em">{title}</text>
<text x="36" y="78" fill="{DIM}" font-family="{SANS}" font-size="14">{sub}</text>
<line x1="36" y1="96" x2="{w-36}" y2="96" stroke="{RULE}"/>
"""


def lab(x, y, t, color=None, size=12, anchor="start", weight="500"):
    return (
        f'<text x="{x}" y="{y}" fill="{color or DIM}" font-family="{MONO}" '
        f'font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" '
        f'letter-spacing="0.06em">{t}</text>\n'
    )


def note(x, y, t, size=13, color=None, anchor="start"):
    return (
        f'<text x="{x}" y="{y}" fill="{color or BONE}" font-family="{SANS}" '
        f'font-size="{size}" text-anchor="{anchor}">{t}</text>\n'
    )


def leader(x1, y1, x2, y2, color=None):
    return (
        f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{color or RULE2}" '
        f'stroke-width="1" stroke-dasharray="3 3"/>\n'
        f'<circle cx="{x1}" cy="{y1}" r="2.5" fill="{color or RULE2}"/>\n'
    )


def write(name, body):
    p = os.path.abspath(os.path.join(OUT, name))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf8") as f:
        f.write(body + "</svg>\n")
    print("wrote", os.path.relpath(p, os.path.abspath(os.path.join(OUT, "..", ".."))))


# ---------------------------------------------------------------- HVAC compressor
def compressor():
    a = SIG["hvac"]
    s = head(
        1000,
        560,
        "What the compressor actually does",
        "It does not make cold. It raises pressure so the refrigerant can reject heat at outdoor temperature.",
        a,
    )

    # Reciprocating
    s += f'<rect x="40" y="120" width="440" height="300" rx="14" fill="{PANEL}" stroke="{RULE}"/>\n'
    s += lab(64, 150, "RECIPROCATING", a, 12, weight="600")
    # cylinder body
    s += f'<rect x="150" y="185" width="120" height="170" rx="8" fill="none" stroke="{RULE2}" stroke-width="3"/>\n'
    # piston
    s += f'<rect x="156" y="255" width="108" height="26" fill="{a}" opacity="0.75"/>\n'
    # rod + crank
    s += f'<path d="M210 281 L210 330" stroke="{RULE2}" stroke-width="4"/>\n'
    s += f'<circle cx="210" cy="352" r="24" fill="none" stroke="{RULE2}" stroke-width="3"/>\n'
    s += f'<circle cx="210" cy="330" r="4" fill="{RULE2}"/>\n'
    # valves
    s += f'<path d="M170 185 l0 -22 l22 0" stroke="{RULE2}" stroke-width="3" fill="none"/>\n'
    s += f'<path d="M250 185 l0 -22 l-22 0" stroke="{RULE2}" stroke-width="3" fill="none"/>\n'
    s += lab(146, 168, "SUCTION", DIM, 9, anchor="end")
    s += lab(276, 168, "DISCHARGE", DIM, 9, anchor="start")
    # arrows
    s += f'<path d="M100 190 L146 190" stroke="#79A8FF" stroke-width="3" marker-end="url(#ar1)"/>\n'
    s += f'<path d="M274 190 L336 190" stroke="{a}" stroke-width="3" marker-end="url(#ar2)"/>\n'
    s += lab(64, 214, "LOW P IN", "#79A8FF", 11)
    s += lab(344, 214, "HIGH P OUT", a, 11)
    s += note(64, 386, "Piston sweeps a fixed volume. Head valves make flow one-way.", 13)
    s += note(64, 406, "Worn valves show up as low capacity, not as a dead unit.", 13, DIM)

    # Scroll
    s += (
        f'<rect x="520" y="120" width="440" height="300" rx="14" fill="{PANEL}" stroke="{RULE}"/>\n'
    )
    s += lab(544, 150, "SCROLL", a, 12, weight="600")
    cx, cy = 740, 272
    # two interleaved true involute spirals — the real scroll geometry
    import math

    def involute(phase, turns=2.75, rb=5.8, steps=190):
        pts = []
        for i in range(steps + 1):
            t = (i / steps) * turns * 2 * math.pi
            th = t + phase
            px = cx + rb * (math.cos(th) + t * math.sin(th))
            py = cy + rb * (math.sin(th) - t * math.cos(th))
            pts.append(f"{px:.1f} {py:.1f}")
        return "M" + " L".join(pts)

    s += (
        f'<path d="{involute(0)}" fill="none" stroke="{RULE2}" '
        f'stroke-width="6" stroke-linecap="round"/>\n'
    )
    s += (
        f'<path d="{involute(math.pi)}" fill="none" stroke="{a}" '
        f'stroke-width="6" stroke-linecap="round" opacity="0.9"/>\n'
    )
    s += f'<circle cx="{cx}" cy="{cy}" r="7" fill="{a}"/>\n'
    s += leader(cx, cy, 890, 200, RULE2)
    s += lab(894, 198, "DISCHARGE", a, 10)
    s += leader(cx - 74, cy + 40, 596, 372, RULE2)
    s += lab(544, 388, "SUCTION AT THE OUTER EDGE", "#79A8FF", 10)
    s += note(544, 410, "Gas pockets shrink as they travel inward. No valves.", 13, DIM)

    s += f"""<defs>
<marker id="ar1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#79A8FF"/></marker>
<marker id="ar2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="{a}"/></marker>
</defs>\n"""
    s += f'<line x1="36" y1="452" x2="964" y2="452" stroke="{RULE}"/>\n'
    s += note(
        36,
        482,
        "Field check: a compressor that runs but builds no pressure difference is not compressing.",
        14,
    )
    s += note(
        36,
        506,
        "Compare suction and discharge pressure against the P\u2013T chart for the refrigerant on the nameplate \u2014 not a remembered number.",
        13,
        DIM,
    )
    write("hvac/compressor_types.svg", s)


# ---------------------------------------------------------------- PLC architecture
def plc():
    a = SIG["electrical"]
    s = head(
        1000,
        560,
        "How a PLC is put together",
        "Signal flows one way each scan: field devices \u2192 input image \u2192 program \u2192 output image \u2192 loads.",
        a,
    )

    # left: field input devices
    s += lab(40, 132, "FIELD INPUT DEVICES", DIM, 10)
    for t, y in [("START pushbutton", 176), ("Proximity sensor", 232), ("Photo eye", 288)]:
        s += f'<rect x="40" y="{y-24}" width="190" height="40" rx="6" fill="{PANEL}" stroke="{RULE}"/>\n'
        s += note(56, y + 2, t, 13, BONE)
        s += f'<path d="M234 {y-4} L300 {y-4}" stroke="#79A8FF" stroke-width="2" marker-end="url(#pin)"/>\n'

    # modules
    mods = [
        (310, "INPUT", "DI module", a),
        (470, "CPU", "program + memory", RULE2),
        (630, "OUTPUT", "DO module", a),
    ]
    for x, n, sub, col in mods:
        s += f'<rect x="{x}" y="140" width="130" height="230" rx="8" fill="{PANEL}" stroke="{col}" stroke-width="2"/>\n'
        s += lab(x + 65, 168, n, BONE, 13, anchor="middle", weight="600")
        s += lab(x + 65, 186, sub, DIM, 9, anchor="middle")
        for t in range(6):
            s += f'<rect x="{x+16}" y="{206+t*24}" width="98" height="16" rx="2" fill="none" stroke="{RULE}"/>\n'
    # inter-module arrows
    s += (
        f'<path d="M444 250 L464 250" stroke="{RULE2}" stroke-width="3" marker-end="url(#pbus)"/>\n'
    )
    s += (
        f'<path d="M604 250 L624 250" stroke="{RULE2}" stroke-width="3" marker-end="url(#pbus)"/>\n'
    )
    # backplane
    s += f'<rect x="300" y="382" width="470" height="14" rx="4" fill="{RULE}"/>\n'
    s += lab(306, 414, "BACKPLANE / BUS", DIM, 10)

    # right: field output devices
    s += lab(800, 132, "FIELD OUTPUT DEVICES", DIM, 10)
    for t, y in [("Contactor coil", 176), ("Solenoid valve", 232), ("Indicator lamp", 288)]:
        s += f'<path d="M764 {y-4} L790 {y-4}" stroke="{a}" stroke-width="2" marker-end="url(#pout)"/>\n'
        s += f'<rect x="800" y="{y-24}" width="160" height="40" rx="6" fill="{PANEL}" stroke="{RULE}"/>\n'
        s += note(814, y + 2, t, 13, BONE)

    s += f"""<defs>
<marker id="pin" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#79A8FF"/></marker>
<marker id="pout" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="{a}"/></marker>
<marker id="pbus" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="{RULE2}"/></marker>
</defs>\n"""
    s += f'<line x1="36" y1="440" x2="964" y2="440" stroke="{RULE}"/>\n'
    s += note(
        36, 470, "Diagnostic order: module LED first, then terminal voltage, then the program.", 14
    )
    s += note(
        36,
        494,
        "An input LED that is lit proves the field device closed. It does not prove the program used it.",
        13,
        DIM,
    )
    s += note(
        36,
        518,
        "An output LED that is lit proves the program commanded the output. It does not prove the load ran.",
        13,
        DIM,
    )
    write("electrical/plc_architecture.svg", s)


# ---------------------------------------------------------------- Photoelectric modes
def photoeye():
    a = SIG["electrical"]
    s = head(
        1000,
        520,
        "Three ways a photoelectric sensor sees a target",
        "The sensing mode decides where you mount, what you align, and what a dirty lens does to the signal.",
        a,
    )
    rows = [
        (
            "THROUGH-BEAM",
            "Separate emitter and receiver. Longest range, most reliable, two devices to wire and align.",
            "tb",
        ),
        (
            "RETROREFLECTIVE",
            "One device plus a reflector. One cable, shorter range, shiny targets can false-trigger.",
            "rr",
        ),
        (
            "DIFFUSE",
            "One device, no reflector. Target itself returns the light, so range depends on target color and finish.",
            "df",
        ),
    ]
    y = 130
    for title, desc, kind in rows:
        s += f'<rect x="40" y="{y}" width="920" height="112" rx="12" fill="{PANEL}" stroke="{RULE}"/>\n'
        s += lab(64, y + 28, title, a, 12, weight="600")
        s += note(64, y + 52, desc, 13, DIM)
        bx = 560
        if kind == "tb":
            s += f'<rect x="{bx}" y="{y+34}" width="34" height="48" rx="4" fill="none" stroke="{RULE2}" stroke-width="2"/>\n'
            s += f'<rect x="{bx+300}" y="{y+34}" width="34" height="48" rx="4" fill="none" stroke="{RULE2}" stroke-width="2"/>\n'
            s += f'<path d="M{bx+34} {y+58} L{bx+300} {y+58}" stroke="{a}" stroke-width="2" stroke-dasharray="8 5"/>\n'
            s += lab(bx, y + 100, "EMITTER", DIM, 9)
            s += lab(bx + 334, y + 100, "RECEIVER", DIM, 9, anchor="end")
        elif kind == "rr":
            s += f'<rect x="{bx}" y="{y+34}" width="34" height="48" rx="4" fill="none" stroke="{RULE2}" stroke-width="2"/>\n'
            s += f'<rect x="{bx+300}" y="{y+34}" width="12" height="48" fill="{RULE2}"/>\n'
            s += f'<path d="M{bx+34} {y+50} L{bx+300} {y+50}" stroke="{a}" stroke-width="2" stroke-dasharray="8 5"/>\n'
            s += f'<path d="M{bx+300} {y+68} L{bx+34} {y+68}" stroke="{a}" stroke-width="2" stroke-dasharray="8 5" opacity="0.6"/>\n'
            s += lab(bx, y + 100, "SENSOR", DIM, 9)
            s += lab(bx + 334, y + 100, "REFLECTOR", DIM, 9, anchor="end")
        else:
            s += f'<rect x="{bx}" y="{y+34}" width="34" height="48" rx="4" fill="none" stroke="{RULE2}" stroke-width="2"/>\n'
            s += f'<rect x="{bx+250}" y="{y+28}" width="46" height="60" rx="3" fill="{RULE2}" opacity="0.45"/>\n'
            s += f'<path d="M{bx+34} {y+50} L{bx+250} {y+50}" stroke="{a}" stroke-width="2" stroke-dasharray="8 5"/>\n'
            s += f'<path d="M{bx+250} {y+68} L{bx+34} {y+68}" stroke="{a}" stroke-width="2" stroke-dasharray="8 5" opacity="0.4"/>\n'
            s += lab(bx, y + 100, "SENSOR", DIM, 9)
            s += lab(bx + 296, y + 100, "TARGET", DIM, 9, anchor="end")
        y += 124

    s += f'<line x1="36" y1="{y+6}" x2="964" y2="{y+6}" stroke="{RULE}"/>\n'
    s += note(
        36,
        y + 36,
        "Light-on or dark-on is a separate setting from the sensing mode. Check both before calling a sensor bad.",
        14,
    )
    s += note(
        36,
        y + 60,
        "Output type (PNP or NPN) decides how it lands on the PLC input card. Wrong type reads as a dead sensor.",
        13,
        DIM,
    )
    write("electrical/photoeye_modes.svg", s)


# ---------------------------------------------------------------- Hydraulic cylinder
def cylinder():
    a = SIG["industrial"]
    s = head(
        1000,
        560,
        "Inside a hydraulic cylinder",
        "Force comes from pressure times area. The rod steals area on the retract side, so the two directions are not equal.",
        a,
    )

    x, y, w, h = 120, 150, 560, 120
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{PANEL}" stroke="{RULE2}" stroke-width="3"/>\n'
    # piston
    px = x + 300
    s += f'<rect x="{px}" y="{y+6}" width="30" height="{h-12}" fill="{a}" opacity="0.8"/>\n'
    # rod
    s += f'<rect x="{px+30}" y="{y+h/2-11}" width="228" height="22" fill="{RULE2}"/>\n'
    # ports
    s += f'<rect x="{x+40}" y="{y-26}" width="26" height="26" fill="none" stroke="{a}" stroke-width="2"/>\n'
    s += f'<rect x="{x+w-66}" y="{y-26}" width="26" height="26" fill="none" stroke="{a}" stroke-width="2"/>\n'
    s += lab(x + 53, y - 34, "CAP END PORT", a, 10, anchor="middle")
    s += lab(x + w - 53, y - 34, "ROD END PORT", a, 10, anchor="middle")
    # fill shading
    s += f'<rect x="{x+3}" y="{y+3}" width="297" height="{h-6}" fill="{a}" opacity="0.14"/>\n'

    s += leader(px + 15, y + h - 14, 300, 330, RULE2)
    s += lab(240, 348, "PISTON", BONE, 11)
    s += leader(px + 120, y + h / 2 + 11, 520, 330, RULE2)
    s += lab(470, 348, "ROD", BONE, 11)
    s += leader(x + w - 6, y + 26, 762, 136, RULE2)
    s += lab(770, 134, "ROD SEAL + WIPER", BONE, 11)
    s += lab(770, 152, "leaks show here first", DIM, 10)

    # area comparison
    s += (
        f'<rect x="700" y="250" width="260" height="180" rx="12" fill="{PANEL}" stroke="{RULE}"/>\n'
    )
    s += lab(722, 278, "AREA THAT SEES PRESSURE", DIM, 10)
    s += f'<circle cx="782" cy="342" r="42" fill="{a}" opacity="0.75"/>\n'
    s += lab(782, 400, "EXTEND", BONE, 11, anchor="middle")
    s += lab(782, 416, "full bore", DIM, 9, anchor="middle")
    s += f'<circle cx="898" cy="342" r="42" fill="{a}" opacity="0.75"/>\n'
    s += f'<circle cx="898" cy="342" r="17" fill="{PANEL}"/>\n'
    s += lab(898, 400, "RETRACT", BONE, 11, anchor="middle")
    s += lab(898, 416, "bore minus rod", DIM, 9, anchor="middle")

    s += f'<line x1="36" y1="452" x2="964" y2="452" stroke="{RULE}"/>\n'
    s += note(
        36, 482, "Force = pressure \u00d7 effective area.  Speed = flow \u00f7 effective area.", 14
    )
    s += note(
        36,
        506,
        "Same pump, same relief setting: a cylinder pushes harder and slower extending than it does retracting.",
        13,
        DIM,
    )
    write("industrial/cylinder_anatomy.svg", s)


# ---------------------------------------------------------------- Belt drive
def belt():
    a = SIG["industrial"]
    s = head(
        1000,
        520,
        "Belt drive: speed traded for torque",
        "Sheave diameters set the ratio. Tension sets whether the belt transmits it or polishes itself away.",
        a,
    )
    s += f'<circle cx="250" cy="250" r="72" fill="none" stroke="{RULE2}" stroke-width="4"/>\n'
    s += f'<circle cx="250" cy="250" r="10" fill="{RULE2}"/>\n'
    s += f'<circle cx="620" cy="250" r="128" fill="none" stroke="{RULE2}" stroke-width="4"/>\n'
    s += f'<circle cx="620" cy="250" r="14" fill="{RULE2}"/>\n'
    s += f'<path d="M250 178 L620 122" stroke="{a}" stroke-width="6" stroke-linecap="round"/>\n'
    s += f'<path d="M250 322 L620 378" stroke="{a}" stroke-width="6" stroke-linecap="round"/>\n'
    s += lab(250, 350, "DRIVER", BONE, 11, anchor="middle")
    s += lab(250, 366, "motor sheave  \u00d8 4\u2033", DIM, 10, anchor="middle")
    s += lab(620, 406, "DRIVEN", BONE, 11, anchor="middle")
    s += lab(620, 422, "load sheave  \u00d8 8\u2033", DIM, 10, anchor="middle")

    s += (
        f'<rect x="790" y="150" width="172" height="200" rx="12" fill="{PANEL}" stroke="{RULE}"/>\n'
    )
    s += lab(812, 178, "RATIO 2:1", a, 12, weight="600")
    s += note(812, 206, "Speed halves", 13, BONE)
    s += note(812, 228, "Torque roughly doubles", 13, BONE)
    s += note(812, 258, "Power stays the same", 13, DIM)
    s += note(812, 280, "minus belt losses", 12, DIM)
    s += lab(812, 314, "SLIP SHOWS AS", DIM, 9)
    s += note(812, 334, "heat, dust, squeal", 12, a)

    s += f'<line x1="36" y1="440" x2="964" y2="440" stroke="{RULE}"/>\n'
    s += note(
        36,
        470,
        "Check alignment before tension. A misaligned drive wears the belt edge no matter how tight you set it.",
        14,
    )
    write("industrial/belt_drive_ratio.svg", s)


# ---------------------------------------------------------------- Gear reduction
def gearbox():
    a = SIG["industrial"]
    s = head(
        1000,
        480,
        "Gear reduction is a torque multiplier",
        "Count teeth, not guesses. Every reduction stage trades shaft speed for shaft torque.",
        a,
    )

    def gear(cx, cy, r, teeth, color):
        import math

        out = f'<circle cx="{cx}" cy="{cy}" r="{r-8}" fill="none" stroke="{color}" stroke-width="3"/>\n'
        for i in range(teeth):
            ang = 2 * math.pi * i / teeth
            x1 = cx + (r - 8) * math.cos(ang)
            y1 = cy + (r - 8) * math.sin(ang)
            x2 = cx + r * math.cos(ang)
            y2 = cy + r * math.sin(ang)
            out += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="4"/>\n'
        out += f'<circle cx="{cx}" cy="{cy}" r="8" fill="{color}"/>\n'
        return out

    s += gear(260, 260, 58, 12, RULE2)
    s += gear(430, 260, 116, 24, a)
    s += lab(260, 348, "PINION  12 T", BONE, 11, anchor="middle")
    s += lab(430, 400, "GEAR  24 T", BONE, 11, anchor="middle")

    s += (
        f'<rect x="620" y="150" width="340" height="196" rx="12" fill="{PANEL}" stroke="{RULE}"/>\n'
    )
    s += lab(644, 180, "24 \u00f7 12 = 2:1 REDUCTION", a, 13, weight="600")
    s += note(644, 212, "Output speed = input speed \u00f7 2", 13, BONE)
    s += note(644, 236, "Output torque \u2248 input torque \u00d7 2", 13, BONE)
    s += note(644, 268, "The gearbox never adds power.", 13, DIM)
    s += note(644, 290, "Heat, noise and metal in the oil are", 12, DIM)
    s += note(644, 308, "the evidence that it is losing some.", 12, DIM)

    s += f'<line x1="36" y1="392" x2="964" y2="392" stroke="{RULE}"/>\n'
    s += note(
        36,
        422,
        "A gearbox that suddenly runs hot at the same load has lost lubrication, alignment or clearance \u2014 not ratio.",
        14,
    )
    write("industrial/gear_reduction.svg", s)


# ---------------------------------------------------------------- Header framing
def header():
    a = SIG["construction"]
    s = head(
        1000,
        560,
        "Framing a rough opening",
        "The header carries what the missing studs used to carry. Jacks take it down to the plate.",
        a,
    )
    W = "#6B5A44"
    s += f'<rect x="120" y="130" width="640" height="18" fill="{W}"/>\n'  # top plate
    s += f'<rect x="120" y="148" width="640" height="18" fill="{W}"/>\n'  # dbl top plate
    s += f'<rect x="120" y="430" width="640" height="18" fill="{W}"/>\n'  # bottom plate
    # king studs
    s += f'<rect x="200" y="166" width="20" height="264" fill="{W}"/>\n'
    s += f'<rect x="620" y="166" width="20" height="264" fill="{W}"/>\n'
    # header
    s += f'<rect x="200" y="196" width="440" height="46" fill="{a}" opacity="0.85"/>\n'
    # jacks
    s += f'<rect x="220" y="242" width="18" height="188" fill="{W}"/>\n'
    s += f'<rect x="602" y="242" width="18" height="188" fill="{W}"/>\n'
    # cripples above
    for cx in (300, 380, 460, 540):
        s += f'<rect x="{cx}" y="166" width="16" height="30" fill="{W}" opacity="0.8"/>\n'
    # opening
    s += f'<rect x="238" y="242" width="364" height="188" fill="none" stroke="{a}" stroke-dasharray="6 5"/>\n'
    s += lab(420, 344, "ROUGH OPENING", a, 12, anchor="middle", weight="600")

    # load arrows down through header into jacks
    for lx in (330, 420, 510):
        s += (
            f'<path d="M{lx} 172 L{lx} 192" stroke="{a}" stroke-width="2" marker-end="url(#hd)"/>\n'
        )
    s += f'<path d="M229 250 L229 424" stroke="{a}" stroke-width="2" marker-end="url(#hd)" opacity="0.8"/>\n'
    s += f'<path d="M611 250 L611 424" stroke="{a}" stroke-width="2" marker-end="url(#hd)" opacity="0.8"/>\n'

    s += leader(210, 300, 140, 300, RULE2)
    s += lab(132, 298, "KING STUD", BONE, 11, anchor="end")
    s += leader(229, 380, 140, 386, RULE2)
    s += lab(132, 384, "JACK / TRIMMER", BONE, 11, anchor="end")
    s += leader(560, 219, 800, 200, RULE2)
    s += lab(808, 198, "HEADER", BONE, 11)
    s += leader(556, 178, 800, 150, RULE2)
    s += lab(808, 148, "CRIPPLE STUDS", BONE, 11)
    s += leader(700, 439, 800, 420, RULE2)
    s += lab(808, 418, "BOTTOM PLATE", BONE, 11)

    s += f'<defs><marker id="hd" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="{a}"/></marker></defs>\n'
    s += f'<line x1="36" y1="474" x2="964" y2="474" stroke="{RULE}"/>\n'
    s += note(
        36,
        504,
        "Header size follows span and the load above it. A jack that is short or missing is a load path with a gap in it.",
        14,
    )
    s += note(
        36,
        528,
        "Rough opening is sized from the manufacturer's unit dimensions plus shim space \u2014 not from the finished door or window.",
        13,
        DIM,
    )
    write("construction/header_framing.svg", s)


# ---------------------------------------------------------------- Arc processes
def arc():
    a = SIG["welding"]
    s = head(
        1000,
        620,
        "Four arc processes, four things feeding the puddle",
        "What shields the arc and what adds the filler is the difference that matters at the joint.",
        a,
    )
    rows = [
        (
            "SMAW",
            "Stick",
            "Flux coating on the electrode",
            "Consumable stick electrode",
            "Slag to chip. Works in wind.",
        ),
        (
            "GMAW",
            "MIG",
            "Shielding gas from a bottle",
            "Continuous solid wire",
            "Fast and clean. Drafts kill the shield.",
        ),
        (
            "FCAW",
            "Flux core",
            "Flux inside the wire, gas optional",
            "Continuous tubular wire",
            "Outdoor capable. Produces slag.",
        ),
        (
            "GTAW",
            "TIG",
            "Shielding gas from a bottle",
            "Separate filler rod, if any",
            "Most control. Slowest. Cleanest.",
        ),
    ]
    y = 122
    s += lab(64, y, "PROCESS", DIM, 10)
    s += lab(250, y, "SHIELDING", DIM, 10)
    s += lab(530, y, "FILLER", DIM, 10)
    s += lab(760, y, "FIELD TRADE-OFF", DIM, 10)
    y += 14
    s += f'<line x1="40" y1="{y}" x2="960" y2="{y}" stroke="{RULE}"/>\n'
    for code, common, shield, filler, trade in rows:
        y += 16
        s += f'<rect x="40" y="{y}" width="920" height="72" rx="10" fill="{PANEL}" stroke="{RULE}"/>\n'
        s += lab(64, y + 32, code, a, 15, weight="600")
        s += lab(64, y + 52, common, DIM, 11)
        s += note(250, y + 38, shield, 13, BONE)
        s += note(530, y + 38, filler, 13, BONE)
        s += note(760, y + 38, trade, 12, DIM)
        y += 72
    s += f'<line x1="36" y1="{y+22}" x2="964" y2="{y+22}" stroke="{RULE}"/>\n'
    s += note(
        36,
        y + 52,
        "Heat input = (volts \u00d7 amps \u00d7 60) \u00f7 (travel speed in in/min), reported in kJ/in.",
        14,
    )
    s += note(
        36,
        y + 76,
        "The welding procedure specification sets the window. Fume control is chosen from the base metal and any coating on it, not the process alone.",
        13,
        DIM,
    )
    write("welding/arc_processes.svg", s)


# ---------------------------------------------------------------- Water service
def service():
    a = SIG["plumbing"]
    s = head(
        1000,
        520,
        "Where building water comes in",
        "Every device on the service line answers a different question: how much, how fast, and which way.",
        a,
    )
    y = 262
    s += f'<path d="M70 {y} L940 {y}" stroke="{a}" stroke-width="10" stroke-linecap="round" opacity="0.45"/>\n'
    stops = [
        (150, "CURB STOP", "utility side shutoff", True),
        (330, "METER", "measures volume used", False),
        (510, "BACKFLOW DEVICE", "protects the main", True),
        (690, "PRESSURE-REDUCING", "street pressure to building", False),
        (870, "MAIN SHUTOFF", "first valve in an emergency", True),
    ]
    for x, t, sub, up in stops:
        s += f'<rect x="{x-30}" y="{y-26}" width="60" height="52" rx="8" fill="{PANEL}" stroke="{a}" stroke-width="2"/>\n'
        if up:
            s += f'<path d="M{x} {y-26} L{x} {y-62}" stroke="{RULE2}" stroke-width="1" stroke-dasharray="3 3"/>\n'
            s += lab(x, y - 88, t, BONE, 10, anchor="middle", weight="600")
            s += lab(x, y - 70, sub, DIM, 9, anchor="middle")
        else:
            s += f'<path d="M{x} {y+26} L{x} {y+62}" stroke="{RULE2}" stroke-width="1" stroke-dasharray="3 3"/>\n'
            s += lab(x, y + 82, t, BONE, 10, anchor="middle", weight="600")
            s += lab(x, y + 100, sub, DIM, 9, anchor="middle")
    s += f'<path d="M70 {y} L70 {y-70}" stroke="{a}" stroke-width="10" opacity="0.45" stroke-linecap="round"/>\n'
    s += lab(70, y - 88, "FROM MAIN", DIM, 9, anchor="middle")
    s += lab(940, y - 22, "TO BUILDING", DIM, 9, anchor="middle")

    s += f'<line x1="36" y1="410" x2="964" y2="410" stroke="{RULE}"/>\n'
    s += note(
        36,
        440,
        "Order varies by jurisdiction and hazard level. Read the actual installation before assuming.",
        14,
    )
    s += note(
        36,
        464,
        "Potable lines downstream must be lead-free: 0.25% weighted average across wetted surfaces,",
        13,
        DIM,
    )
    s += note(36, 484, "0.2% for solder and flux, per NSF/ANSI/CAN 372.", 13, DIM)
    write("plumbing/water_service.svg", s)


# ---------------------------------------------------------------- Refrigerant transition
def refrigerants():
    a = SIG["hvac"]
    s = head(
        1000,
        540,
        "The refrigerant you meet depends on the install date",
        "Three refrigerants are in the field at once. The nameplate decides the tools, the chart and the procedure.",
        a,
    )
    cards = [
        (
            40,
            "R-22",
            "HCFC \u00b7 A1",
            "Legacy equipment only. Production ended.\nService uses recovered or reclaimed stock.",
            RULE2,
        ),
        (
            355,
            "R-410A",
            "HFC \u00b7 A1 \u00b7 GWP \u2248 2088",
            "Huge installed base. Still legal to service\nindefinitely. Supply tightens as the\nAIM Act phasedown continues.",
            "#79A8FF",
        ),
        (
            670,
            "R-454B / R-32",
            "A2L \u00b7 GWP 466 / 675",
            "What new residential and light commercial\nsystems use. Mildly flammable, so tools,\nleak detection and procedures change.",
            a,
        ),
    ]
    for x, name, cls, body, col in cards:
        s += f'<rect x="{x}" y="130" width="290" height="196" rx="12" fill="{PANEL}" stroke="{col}" stroke-width="2"/>\n'
        s += lab(x + 22, 162, name, col, 16, weight="600")
        s += lab(x + 22, 182, cls, DIM, 10)
        yy = 212
        for line in body.split("\n"):
            s += note(x + 22, yy, line, 12, BONE if yy == 212 else DIM)
            yy += 19

    s += f'<rect x="40" y="346" width="920" height="74" rx="10" fill="{PANEL}" stroke="{RULE}"/>\n'
    s += lab(64, 374, "1 JAN 2025", a, 11, weight="600")
    s += note(
        168, 374, "New residential systems can no longer be manufactured with R-410A.", 13, BONE
    )
    s += lab(64, 402, "1 JAN 2026", a, 11, weight="600")
    s += note(
        168,
        402,
        "Installation of new residential and light commercial systems over 700 GWP ends.",
        13,
        BONE,
    )

    s += f'<line x1="36" y1="446" x2="964" y2="446" stroke="{RULE}"/>\n'
    s += note(
        36,
        476,
        "A2L refrigerants cannot be dropped into R-410A equipment. The equipment itself has to be rated for them.",
        14,
    )
    s += note(
        36,
        500,
        "EPA 608 still covers handling. A2L-specific training and A2L-rated recovery, gauges and leak detection are what change on the truck.",
        13,
        DIM,
    )
    write("diagrams/refrigerant_transition.svg", s)


for fn in (compressor, plc, photoeye, cylinder, belt, gearbox, header, arc, service, refrigerants):
    fn()
print("done")
