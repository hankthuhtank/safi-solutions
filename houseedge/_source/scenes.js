/* HouseEdge — the photographs on the page are these scenes, rendered offline by _source/render.html.
   Every table layout follows the real printed felt: arc text on blackjack, spelled-out SIX and NINE on craps, etc. */
import {
  THREE,
  TAU,
  INK,
  makeRenderer,
  casinoLights,
  makeFelt,
  feltTexture,
  arcText,
  makeCard,
  makeStack,
  makeChip,
  makeDie,
  makeWheel,
  makeReels,
  canvasTex,
  WHEEL,
  suitPath,
} from "../props3d.js";

const GOLD = "#dcbc72",
  CREAM = "#efe6cf",
  SERIF = "'Bodoni Moda', Georgia, serif",
  SANS = "'Schibsted Grotesk', Arial, sans-serif";
const P = (o, x, y, z, ry = 0) => {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  return o;
};

/* world→canvas helper for a felt of size fw × fd metres drawn at W × H px */
const mapper = (fw, fd, W, H) => ({
  x: (x) => (x / fw + 0.5) * W,
  y: (z) => (z / fd + 0.5) * H,
  s: (m) => (m / fw) * W,
});

function woodFloor(scene, w = 6, d = 4) {
  const tex = canvasTex("floor", 1024, 1024, (g, W, H) => {
    g.fillStyle = "#060505";
    g.fillRect(0, 0, W, H);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = -0.002;
  m.receiveShadow = true;
  scene.add(m);
}
function rail(scene, fw, fd, zFront, depth = 0.09) {
  // padded leather arm-rest along the near edge of the table
  const g = new THREE.CapsuleGeometry(depth / 2, fw, 8, 24);
  g.rotateZ(Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1a120d, roughness: 0.55 }));
  m.position.set(0, 0.03, zFront + depth / 2 - 0.01);
  m.scale.y = 0.62;
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
}

/* ---------------------------------------------------------------- blackjack */
/* A regulation half-moon table: the dealer's straight edge is the far side (z = -0.5), every arc is centred on
   the middle of that edge. Arc text sits mid-table, the insurance band just inside the betting spots, the spots near the rail. */
const BJ = { cz: -0.5, text: 0.44, rule: 0.53, ins: [0.6, 0.68], spot: 0.86, rail: 0.99 };
const seat = (a, r = BJ.spot) => [Math.cos(a) * r, BJ.cz + Math.sin(a) * r];
function blackjackFelt() {
  const fw = 2.2,
    fd = 1.3,
    W = 3520,
    H = 2080,
    M = mapper(fw, fd, W, H);
  return feltTexture("felt-bj", W, H, (g) => {
    const cx = M.x(0),
      cy = M.y(BJ.cz);
    arcText(g, "BLACKJACK PAYS 3 TO 2", cx, cy, M.s(BJ.text), Math.PI / 2, {
      font: `700 ${M.s(0.046)}px ${SERIF}`,
      color: GOLD,
      spacing: 1.12,
      up: false,
    });
    arcText(g, "Dealer must draw to 16 and stand on all 17s", cx, cy, M.s(BJ.rule), Math.PI / 2, {
      font: `italic 500 ${M.s(0.026)}px ${SERIF}`,
      color: CREAM,
      spacing: 1.03,
      up: false,
    });
    g.strokeStyle = GOLD;
    g.lineWidth = M.s(0.0035);
    BJ.ins.forEach((r) => {
      g.beginPath();
      g.arc(cx, cy, M.s(r), Math.PI * 0.16, Math.PI * 0.84);
      g.stroke();
    });
    arcText(g, "INSURANCE PAYS 2 TO 1", cx, cy, M.s((BJ.ins[0] + BJ.ins[1]) / 2), Math.PI / 2, {
      font: `700 ${M.s(0.032)}px ${SERIF}`,
      color: GOLD,
      spacing: 1.18,
      up: false,
    });
    for (let i = 0; i < 7; i++) {
      const [x, z] = seat(Math.PI * (0.2 + i * 0.1)),
        X = M.x(x),
        Y = M.y(z);
      g.strokeStyle = CREAM;
      g.lineWidth = M.s(0.0035);
      g.beginPath();
      g.arc(X, Y, M.s(0.05), 0, TAU);
      g.stroke();
      g.lineWidth = M.s(0.0012);
      g.beginPath();
      g.arc(X, Y, M.s(0.043), 0, TAU);
      g.stroke();
    }
  });
}
function curvedRail(scene, r, a0, a1, cz) {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const a = a0 + ((a1 - a0) * i) / 64;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0.028, cz + Math.sin(a) * r));
  }
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 128, 0.052, 20, false),
    new THREE.MeshPhysicalMaterial({ color: 0x1b120c, roughness: 0.5, clearcoat: 0.3 }),
  );
  m.scale.y = 0.62;
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
}
export function blackjack(scene, renderer) {
  const fw = 2.2,
    fd = 1.3;
  woodFloor(scene);
  scene.add(makeFelt(fw, fd, blackjackFelt()));
  curvedRail(scene, BJ.rail, Math.PI * 0.08, Math.PI * 0.92, BJ.cz);
  const card = (r, s, x, z, ry, up = true, y = 0) =>
    scene.add(P(makeCard(r, s, { faceUp: up }), x, 0.0002 + y, z, ry));
  // dealer: 6 up, hole card tucked face down
  card("6", "D", -0.036, BJ.cz + 0.19, 0.03);
  card("9", "C", 0.034, BJ.cz + 0.192, -0.02, false);
  // three seats: a natural (A♠ K♥), a hard 16 that stands on the dealer's 6, an 11 that doubled
  const hand = (a, cards, chips, seed) => {
    const [x, z] = seat(a),
      [cx, czc] = seat(a, 0.745),
      rot = -(a - Math.PI / 2);
    scene.add(P(makeStack(chips, chips.length, seed), x, 0, z));
    cards.forEach(([r, s, up], k) =>
      card(
        r,
        s,
        cx + Math.cos(rot) * (k - (cards.length - 1) / 2) * 0.03,
        czc - Math.sin(rot) * (k - (cards.length - 1) / 2) * 0.03 - k * 0.012,
        rot + (k ? 0.06 : -0.04),
        up !== false,
        k * 0.0004,
      ),
    );
  };
  hand(
    Math.PI * 0.5,
    [
      ["A", "S"],
      ["K", "H"],
    ],
    [25, 25, 25, 5],
    2,
  );
  hand(
    Math.PI * 0.4,
    [
      ["10", "C"],
      ["6", "S"],
    ],
    [100, 100],
    5,
  );
  hand(
    Math.PI * 0.6,
    [
      ["8", "H"],
      ["3", "C"],
      ["Q", "D"],
    ],
    [5, 5, 5, 5, 5, 5],
    9,
  );
  const cam = new THREE.PerspectiveCamera(30, 1.5, 0.05, 20);
  cam.position.set(0.02, 0.56, 0.92);
  cam.lookAt(0, 0, 0.03);
  casinoLights(scene, renderer, { key: [0.25, 1.6, 0.35], target: [0, 0, -0.05] });
  return cam;
}

/* ---------------------------------------------------------------- baccarat */
function baccaratFelt() {
  const fw = 1.8,
    fd = 1.1,
    W = 3072,
    H = 1878,
    M = mapper(fw, fd, W, H);
  return feltTexture("felt-bac", W, H, (g) => {
    const band = (z0, z1, label, sub, col) => {
      const y0 = M.y(z0),
        y1 = M.y(z1),
        x0 = M.x(-0.78),
        x1 = M.x(0.78);
      g.strokeStyle = GOLD;
      g.lineWidth = M.s(0.004);
      g.strokeRect(x0, y0, x1 - x0, y1 - y0);
      for (let i = 1; i < 7; i++) {
        const x = x0 + ((x1 - x0) * i) / 7;
        g.beginPath();
        g.moveTo(x, y0);
        g.lineTo(x, y1);
        g.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const x = x0 + ((x1 - x0) * (i + 0.5)) / 7;
        g.fillStyle = col;
        g.font = `700 ${M.s(0.034)}px ${SERIF}`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(label, x, (y0 + y1) / 2 - M.s(0.008));
        g.fillStyle = CREAM;
        g.font = `500 ${M.s(0.015)}px ${SANS}`;
        g.fillText(sub, x, (y0 + y1) / 2 + M.s(0.028));
      }
    };
    band(0.02, 0.14, "TIE", "PAYS 8 TO 1", GOLD);
    band(0.14, 0.3, "BANKER", "5% COMMISSION", "#e3574c");
    band(0.3, 0.46, "PLAYER", "PAYS 1 TO 1", CREAM);
    // card boxes where the dealer lays the hands
    [
      [-0.2, "PLAYER"],
      [0.2, "BANKER"],
    ].forEach(([x, t]) => {
      g.strokeStyle = GOLD;
      g.lineWidth = M.s(0.003);
      const bx = M.x(x - 0.15),
        by = M.y(-0.36),
        bw = M.s(0.3),
        bh = M.s(0.2);
      g.strokeRect(bx, by, bw, bh);
      g.fillStyle = GOLD;
      g.font = `700 ${M.s(0.03)}px ${SERIF}`;
      g.textAlign = "center";
      g.fillText(t, M.x(x), M.y(-0.105));
    });
  });
}
export function baccarat(scene, renderer) {
  const fw = 1.8,
    fd = 1.1;
  woodFloor(scene);
  scene.add(makeFelt(fw, fd, baccaratFelt()));
  rail(scene, fw + 0.2, fd, fd / 2 - 0.02);
  const card = (r, s, x, z, ry, y = 0) => scene.add(P(makeCard(r, s), x, 0.0002 + y, z, ry));
  // Player: 7 + 2 = 9, a natural. Banker: K + 5 = 5. Player wins.
  card("7", "C", -0.235, -0.26, -0.03);
  card("2", "D", -0.165, -0.26, 0.03);
  card("K", "S", 0.165, -0.26, 0.02);
  card("5", "H", 0.235, -0.26, -0.04);
  const cellX = (i) => -0.78 + (1.56 * (i + 0.5)) / 7;
  scene.add(P(makeStack([100, 100, 25], 3, 4), cellX(3) + 0.05, 0, 0.41)); // on PLAYER
  scene.add(P(makeStack(25, 5, 6), cellX(2) + 0.05, 0, 0.265)); // on BANKER
  scene.add(P(makeStack(5, 2, 8), cellX(4) + 0.06, 0, 0.115)); // on TIE
  scene.add(P(makeStack([1000, 100], 2, 9), cellX(5) + 0.05, 0, 0.41));
  const cam = new THREE.PerspectiveCamera(30, 1.5, 0.05, 20);
  cam.position.set(0.05, 0.58, 0.78);
  cam.lookAt(0, 0, -0.02);
  casinoLights(scene, renderer, { key: [-0.2, 1.9, 0.4], target: [0, 0, -0.05] });
  return cam;
}

/* ---------------------------------------------------------------- craps */
function crapsFelt() {
  const fw = 1.8,
    fd = 1.1,
    W = 3072,
    H = 1878,
    M = mapper(fw, fd, W, H);
  return feltTexture("felt-craps", W, H, (g) => {
    g.strokeStyle = CREAM;
    g.lineWidth = M.s(0.004);
    g.textAlign = "center";
    g.textBaseline = "middle";
    const box = (x0, z0, x1, z1) =>
      g.strokeRect(M.x(x0), M.y(z0), M.x(x1) - M.x(x0), M.y(z1) - M.y(z0));
    // place numbers across the top
    const nums = ["4", "5", "SIX", "8", "NINE", "10"];
    nums.forEach((t, i) => {
      const x0 = -0.72 + i * 0.24;
      box(x0, -0.5, x0 + 0.24, -0.3);
      g.fillStyle = t === "SIX" || t === "NINE" ? "#e8c46a" : CREAM;
      g.font = `700 ${M.s(t.length > 2 ? 0.052 : 0.078)}px ${SERIF}`;
      g.fillText(t, M.x(x0 + 0.12), M.y(-0.4));
    });
    // COME
    box(-0.72, -0.3, 0.72, -0.1);
    g.fillStyle = "#e3574c";
    g.font = `700 ${M.s(0.11)}px ${SERIF}`;
    g.fillText("COME", M.x(0), M.y(-0.2));
    // FIELD
    box(-0.72, -0.1, 0.72, 0.1);
    g.fillStyle = CREAM;
    g.font = `600 ${M.s(0.052)}px ${SERIF}`;
    g.fillText("3 · 4 · 9 · 10 · 11", M.x(0), M.y(-0.03));
    g.fillStyle = "#e8c46a";
    g.font = `700 ${M.s(0.03)}px ${SANS}`;
    g.fillText("FIELD", M.x(0), M.y(0.055));
    [
      [-0.56, "2"],
      [0.56, "12"],
    ].forEach(([x, t]) => {
      g.strokeStyle = "#e8c46a";
      g.beginPath();
      g.arc(M.x(x), M.y(-0.02), M.s(0.05), 0, TAU);
      g.stroke();
      g.fillStyle = "#e8c46a";
      g.font = `700 ${M.s(0.05)}px ${SERIF}`;
      g.fillText(t, M.x(x), M.y(-0.02));
      g.font = `600 ${M.s(0.016)}px ${SANS}`;
      g.fillText("PAYS DOUBLE", M.x(x), M.y(0.055));
    });
    g.strokeStyle = CREAM;
    // DON'T PASS BAR (with the 12 barred)
    box(-0.72, 0.1, 0.72, 0.2);
    g.fillStyle = CREAM;
    g.font = `700 ${M.s(0.042)}px ${SERIF}`;
    g.fillText("DON'T PASS BAR", M.x(-0.08), M.y(0.15));
    [
      [0.34, 6],
      [0.42, 6],
    ].forEach(([x]) => {
      g.fillStyle = CREAM;
      g.fillRect(M.x(x) - M.s(0.028), M.y(0.15) - M.s(0.028), M.s(0.056), M.s(0.056));
      g.fillStyle = "#b3241c";
      for (let k = 0; k < 6; k++) {
        g.beginPath();
        g.arc(
          M.x(x) + M.s(k % 2 ? 0.013 : -0.013),
          M.y(0.15) + M.s(-0.016 + Math.floor(k / 2) * 0.016),
          M.s(0.0055),
          0,
          TAU,
        );
        g.fill();
      }
    });
    // PASS LINE
    box(-0.8, 0.2, 0.8, 0.38);
    g.fillStyle = CREAM;
    g.font = `700 ${M.s(0.1)}px ${SERIF}`;
    g.fillText("PASS LINE", M.x(0), M.y(0.29));
  });
}
function puck() {
  const tex = canvasTex("puck-on", 512, 512, (g, w) => {
    g.fillStyle = "#f4efe4";
    g.fillRect(0, 0, w, w);
    g.fillStyle = "#141414";
    g.font = `800 190px ${SANS}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("ON", w / 2, w / 2 + 8);
  });
  const side = new THREE.MeshStandardMaterial({ color: 0xf1ece0, roughness: 0.45 }),
    top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.012, 48), [side, top, side]);
  m.castShadow = m.receiveShadow = true;
  m.position.y = 0.006;
  return m;
}
export function craps(scene, renderer) {
  const fw = 1.8,
    fd = 1.1;
  woodFloor(scene);
  scene.add(makeFelt(fw, fd, crapsFelt()));
  rail(scene, fw + 0.2, fd, fd / 2 - 0.02);
  scene.add(P(puck(), -0.72 + 2 * 0.24 + 0.17, 0, -0.455)); // the point is SIX
  // the shooter just made the point: 4 + 2
  const d1 = makeDie(4, 0.5),
    d2 = makeDie(2, -0.35);
  d1.position.set(0.2, d1.position.y, -0.16);
  d2.position.set(0.245, d2.position.y, -0.128);
  scene.add(d1, d2);
  // pass line bet with odds behind it
  scene.add(P(makeStack(25, 2, 3), -0.18, 0, 0.3));
  scene.add(P(makeStack([25, 25, 25, 25, 5], 5, 4), -0.18, 0, 0.35));
  scene.add(P(makeStack(5, 3, 5), 0.3, 0, 0.29));
  scene.add(P(makeStack(25, 1, 7), 0.52, 0, -0.2)); // come bet
  const cam = new THREE.PerspectiveCamera(30, 1.5, 0.05, 20);
  cam.position.set(0.14, 0.5, 0.64);
  cam.lookAt(0.05, 0, -0.04);
  casinoLights(scene, renderer, { key: [0.35, 1.9, 0.55], target: [0, 0, -0.05] });
  return cam;
}

/* ---------------------------------------------------------------- roulette */
function rouletteLayoutFelt(key = "felt-rl") {
  const fw = 2.4,
    fd = 1.5,
    W = 3600,
    H = 2250,
    M = mapper(fw, fd, W, H);
  return feltTexture(
    key,
    W,
    H,
    (g) => {
      const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
      const x0 = -0.95,
        z0 = 0.02,
        cw = 0.1,
        ch = 0.115;
      g.textAlign = "center";
      g.textBaseline = "middle";
      for (let c = 0; c < 12; c++)
        for (let r = 0; r < 3; r++) {
          const n = c * 3 + (3 - r),
            x = x0 + c * cw,
            z = z0 + r * ch;
          g.strokeStyle = CREAM;
          g.lineWidth = M.s(0.003);
          g.strokeRect(M.x(x), M.y(z), M.s(cw), M.s(ch));
          g.fillStyle = RED.has(n) ? "#b3241c" : "#151515";
          g.beginPath();
          g.ellipse(M.x(x + cw / 2), M.y(z + ch / 2), M.s(0.034), M.s(0.042), 0, 0, TAU);
          g.fill();
          g.fillStyle = CREAM;
          g.font = `700 ${M.s(0.04)}px ${SERIF}`;
          g.fillText(String(n), M.x(x + cw / 2), M.y(z + ch / 2) + M.s(0.002));
        }
      g.strokeRect(M.x(x0 - 0.1), M.y(z0), M.s(0.1), M.s(ch * 3));
      g.fillStyle = "#0c7445";
      g.fillStyle = CREAM;
      g.font = `700 ${M.s(0.05)}px ${SERIF}`;
      g.fillText("0", M.x(x0 - 0.05), M.y(z0 + ch * 1.5));
      ["1st 12", "2nd 12", "3rd 12"].forEach((t, i) => {
        g.strokeRect(M.x(x0 + i * cw * 4), M.y(z0 + ch * 3), M.s(cw * 4), M.s(0.1));
        g.fillStyle = CREAM;
        g.font = `600 ${M.s(0.038)}px ${SERIF}`;
        g.fillText(t, M.x(x0 + i * cw * 4 + cw * 2), M.y(z0 + ch * 3 + 0.05));
      });
    },
    INK.felt,
  );
}
export function roulette(scene, renderer, { wheelType = "european", result = 17 } = {}) {
  woodFloor(scene);
  const felt = makeFelt(2.4, 1.5, rouletteLayoutFelt());
  felt.position.set(-0.35, 0, 0.2);
  scene.add(felt);
  const wheel = makeWheel(wheelType);
  wheel.group.position.set(0.36, 0, -0.18);
  scene.add(wheel.group);
  wheel.setRotor(0.35);
  const i = wheel.order.indexOf(String(result));
  const a = wheel.angleOf(i);
  wheel.placeBall(a, WHEEL.pocketR, WHEEL.pocketY + 0.002);
  // chips on the layout: straight-up on 17, a split, and red
  const cell = (c, r) => [-0.35 - 0.95 + c * 0.1 + 0.05, 0.2 + 0.02 + r * 0.115 + 0.0575];
  const [x17, z17] = cell(5, 1);
  scene.add(P(makeStack(25, 3, 3), x17, 0, z17));
  const [xa, za] = cell(8, 0);
  scene.add(P(makeStack(5, 4, 5), xa + 0.05, 0, za));
  scene.add(P(makeStack([100, 25], 2, 6), -0.35 - 0.95 + 0.6, 0, 0.2 + 0.02 + 0.115 * 3 + 0.05));
  const cam = new THREE.PerspectiveCamera(30, 1.5, 0.05, 20);
  cam.position.set(-0.15, 0.92, 0.9);
  cam.lookAt(0.1, 0, -0.02);
  casinoLights(scene, renderer, { key: [0.1, 2.0, 0.45], target: [0.1, 0, -0.05] });
  return cam;
}
export function wheelOnly(scene, renderer, { wheelType = "european", result = 17 } = {}) {
  woodFloor(scene, 3, 3);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.45, 0.04, 96),
    new THREE.MeshStandardMaterial({ color: 0x0c0806, roughness: 0.7 }),
  );
  base.position.y = -0.02;
  base.receiveShadow = true;
  scene.add(base);
  const wheel = makeWheel(wheelType);
  scene.add(wheel.group);
  wheel.setRotor(0.2);
  const i = wheel.order.indexOf(String(result));
  wheel.placeBall(wheel.angleOf(i), WHEEL.pocketR, WHEEL.pocketY + 0.002);
  const cam = new THREE.PerspectiveCamera(28, 1.5, 0.05, 20);
  cam.position.set(0, 1.05, 0.92);
  cam.lookAt(0, 0.03, 0.02);
  casinoLights(scene, renderer, { key: [0.25, 1.8, 0.6], target: [0, 0, 0] });
  return cam;
}

/* ---------------------------------------------------------------- slots */
function ledTex(text) {
  return canvasTex(`led-${text}`, 1024, 128, (g, w, h) => {
    g.fillStyle = "#120404";
    g.fillRect(0, 0, w, h);
    g.font = `700 76px 'IBM Plex Mono', monospace`;
    g.textBaseline = "middle";
    g.fillStyle = "#ff3b2e";
    g.shadowColor = "#ff3b2e";
    g.shadowBlur = 18;
    g.fillText(text, 26, h / 2 + 4);
  });
}
export function slots(scene, renderer) {
  scene.background = new THREE.Color(0x070605);
  const cab = new THREE.Group();
  scene.add(cab);
  const reels = makeReels({ show: [["7"], ["7"], ["BAR"]] });
  reels.position.set(0, 0.0, 0);
  cab.add(reels);
  // cabinet face with a window cut for the reels
  const outer = new THREE.Shape();
  const W = 0.5,
    H = 0.62;
  outer.moveTo(-W / 2, -H / 2);
  outer.lineTo(W / 2, -H / 2);
  outer.lineTo(W / 2, H / 2);
  outer.lineTo(-W / 2, H / 2);
  outer.closePath();
  const hole = new THREE.Path();
  const hw = 0.27,
    hh = 0.15;
  hole.moveTo(-hw / 2, -hh / 2);
  hole.lineTo(-hw / 2, hh / 2);
  hole.lineTo(hw / 2, hh / 2);
  hole.lineTo(hw / 2, -hh / 2);
  hole.closePath();
  outer.holes.push(hole);
  const face = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outer, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 3,
    }),
    new THREE.MeshPhysicalMaterial({
      color: 0x5a0e0c,
      roughness: 0.35,
      clearcoat: 1,
      metalness: 0.2,
    }),
  );
  face.position.z = 0.1;
  face.castShadow = face.receiveShadow = true;
  cab.add(face);
  // chrome bezel around the window
  const bz = new THREE.Shape();
  bz.moveTo(-hw / 2 - 0.018, -hh / 2 - 0.018);
  bz.lineTo(hw / 2 + 0.018, -hh / 2 - 0.018);
  bz.lineTo(hw / 2 + 0.018, hh / 2 + 0.018);
  bz.lineTo(-hw / 2 - 0.018, hh / 2 + 0.018);
  bz.closePath();
  bz.holes.push(hole);
  const bezel = new THREE.Mesh(
    new THREE.ExtrudeGeometry(bz, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 4,
    }),
    new THREE.MeshStandardMaterial({ color: 0xe0e4e7, metalness: 1, roughness: 0.16 }),
  );
  bezel.position.z = 0.135;
  cab.add(bezel);
  // payline
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(hw + 0.01, 0.003, 0.002),
    new THREE.MeshBasicMaterial({ color: 0xff2a1f }),
  );
  line.position.set(0, 0, 0.128);
  cab.add(line);
  // glass
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(hw, hh),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0,
      metalness: 0,
      transparent: true,
      opacity: 0.08,
      clearcoat: 1,
    }),
  );
  glass.position.z = 0.126;
  cab.add(glass);
  // LED meters
  [
    [-0.14, "CREDITS 1250"],
    [0.12, "BET 3  WIN 0"],
  ].forEach(([x, t]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.025),
      new THREE.MeshBasicMaterial({ map: ledTex(t), toneMapped: false }),
    );
    m.position.set(x, -0.125, 0.137);
    cab.add(m);
  });
  // top glass with the pay table
  const pt = canvasTex("paytable", 1024, 512, (g, w, h) => {
    g.fillStyle = "#0d0a08";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#d9b566";
    g.lineWidth = 6;
    g.strokeRect(16, 16, w - 32, h - 32);
    g.fillStyle = "#d9b566";
    g.font = `700 64px ${SERIF}`;
    g.textAlign = "center";
    g.fillText("PAY TABLE", w / 2, 96);
    const rows = [
      ["7  7  7", "1000"],
      ["BAR BAR BAR", "100"],
      ["BELL BELL BELL", "20"],
      ["ANY 3 BARS", "10"],
      ["CHERRY  ANY  ANY", "2"],
    ];
    g.font = `600 36px ${SANS}`;
    rows.forEach(([a, b], i) => {
      g.textAlign = "left";
      g.fillStyle = "#f3ead7";
      g.fillText(a, 90, 180 + i * 64);
      g.textAlign = "right";
      g.fillStyle = "#ffcf5a";
      g.fillText(b, w - 90, 180 + i * 64);
    });
  });
  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.2),
    new THREE.MeshBasicMaterial({ map: pt }),
  );
  top.position.set(0, 0.22, 0.137);
  cab.add(top);
  // light inside the reel box
  const lamp = new THREE.PointLight(0xfff0d6, 1.4, 0.6, 1.2);
  lamp.position.set(0, 0.08, 0.09);
  cab.add(lamp);
  const cam = new THREE.PerspectiveCamera(30, 1.5, 0.05, 20);
  cam.position.set(0.26, 0.14, 0.9);
  cam.lookAt(0, 0.07, 0);
  casinoLights(scene, renderer, {
    key: [0.9, 1.2, 1.4],
    target: [0, 0, 0],
    intensity: 9,
    env: 0.5,
  });
  return cam;
}

/* ---------------------------------------------------------------- poker */
function pokerFelt() {
  const W = 3200,
    H = 2000,
    fw = 2.4,
    fd = 1.5,
    M = mapper(fw, fd, W, H);
  return feltTexture(
    "felt-poker",
    W,
    H,
    (g) => {
      g.strokeStyle = "rgba(220,188,114,.8)";
      g.lineWidth = M.s(0.004);
      g.beginPath();
      g.ellipse(M.x(0), M.y(0), M.s(0.8), M.s(0.42), 0, 0, TAU);
      g.stroke();
    },
    "#0f3f2d",
  );
}
function dealerButton() {
  const tex = canvasTex("dealer-btn", 512, 512, (g, w) => {
    g.fillStyle = "#f6f2e8";
    g.fillRect(0, 0, w, w);
    g.fillStyle = "#141414";
    g.font = `800 96px ${SANS}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("DEALER", w / 2, w / 2 + 6);
  });
  const side = new THREE.MeshStandardMaterial({ color: 0xf1ece0, roughness: 0.35 }),
    top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 48), [side, top, side]);
  m.castShadow = true;
  m.position.y = 0.005;
  return m;
}
export function poker(scene, renderer) {
  woodFloor(scene);
  scene.add(makeFelt(2.4, 1.5, pokerFelt()));
  const card = (r, s, x, z, ry, up = true, y = 0) =>
    scene.add(P(makeCard(r, s, { faceUp: up }), x, 0.0002 + y, z, ry));
  // board: A♠ K♠ 7♦ | Q♠ | 2♣
  [
    ["A", "S"],
    ["K", "S"],
    ["7", "D"],
    ["Q", "S"],
    ["2", "C"],
  ].forEach(([r, s], i) => card(r, s, -0.16 + i * 0.075, -0.05, 0));
  // hero's hole cards (J♠ 10♠ — a royal flush draw... the board already gives a straight)
  card("J", "S", -0.03, 0.3, -0.18, true);
  card("10", "S", 0.03, 0.305, 0.14, true, 0.0004);
  // villain's cards face down
  card("9", "H", 0.42, -0.28, 2.4, false);
  card("9", "D", 0.46, -0.25, 2.2, false, 0.0004);
  scene.add(P(makeStack([100, 100, 25, 25, 25, 5], 6, 3), 0.06, 0, 0.1));
  scene.add(P(makeStack([25, 25, 5], 3, 5), 0.12, 0, 0.13));
  scene.add(P(makeStack(1000, 2, 7), -0.02, 0, 0.135));
  scene.add(P(makeStack([100, 100, 100, 100, 100, 100, 100, 100], 8, 11), 0.22, 0, 0.34));
  scene.add(P(makeStack([25, 25, 25, 25, 25, 25], 6, 12), 0.27, 0, 0.31));
  scene.add(P(dealerButton(), -0.26, 0, 0.24));
  const cam = new THREE.PerspectiveCamera(30, 1.5, 0.05, 20);
  cam.position.set(-0.04, 0.48, 0.78);
  cam.lookAt(0.04, 0, 0.1);
  casinoLights(scene, renderer, { key: [0.2, 1.8, 0.5], target: [0, 0, 0] });
  return cam;
}

/* ---------------------------------------------------------------- hero: the whole pit on one table */
export function hero(scene, renderer) {
  woodFloor(scene, 8, 5);
  const felt = makeFelt(3.2, 1.8, rouletteLayoutFelt("felt-hero"));
  felt.position.set(-0.62, 0, 0.32);
  scene.add(felt);
  const wheel = makeWheel("european");
  wheel.group.position.set(0.42, 0, -0.12);
  scene.add(wheel.group);
  wheel.setRotor(1.1);
  const i = wheel.order.indexOf("32");
  wheel.placeBall(wheel.angleOf(i), WHEEL.pocketR, WHEEL.pocketY + 0.002);
  scene.add(P(makeStack([100, 100, 100, 100, 100, 100, 100], 7, 2), -0.14, 0, 0.2));
  scene.add(P(makeStack([25, 25, 25, 25, 25], 5, 3), -0.09, 0, 0.245));
  scene.add(P(makeStack([5, 5, 5, 5, 5, 5, 5, 5, 5], 9, 4), -0.19, 0, 0.26));
  scene.add(P(makeStack(1000, 3, 5), -0.05, 0, 0.19));
  const c1 = makeCard("A", "S");
  c1.position.set(0.06, 0.0002, 0.37);
  c1.rotation.y = -0.35;
  scene.add(c1);
  const c2 = makeCard("K", "H");
  c2.position.set(0.12, 0.0006, 0.38);
  c2.rotation.y = 0.12;
  scene.add(c2);
  const d1 = makeDie(6, 0.4),
    d2 = makeDie(1, -0.6);
  d1.position.set(0.24, d1.position.y, 0.33);
  d2.position.set(0.28, d2.position.y, 0.37);
  scene.add(d1, d2);
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 20);
  cam.position.set(-0.12, 0.5, 0.96);
  cam.lookAt(0.2, 0.02, 0.02);
  casinoLights(scene, renderer, { key: [0.35, 2.0, 0.6], target: [0.25, 0, 0.05], angle: 0.62 });
  return cam;
}

export const SCENES = {
  hero,
  blackjack,
  baccarat,
  craps,
  roulette,
  wheel: wheelOnly,
  slots,
  poker,
};
