/* ============================================================
   Człowiek o wielu twarzach — Papcio
   ============================================================ */

const params = new URLSearchParams(location.search);
const SHOT = params.has("shot");
const SEEK = params.get("seek");
const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- content model --------------------------------------------------- */
const STATES = [
  { key: "intro", kind: "intro",
    word: "WSZYSTKIEGO NAJLEPSZEGO\nDLA NAJLEPSZEGO PAPCIA\nZ OKAZJI DNIA OJCA",
    label: "", accent: "#f1f1f4",
    bg: "radial-gradient(120% 90% at 50% 38%, #17171d 0%, #0a0a0e 52%, #000 100%)" },

  { key: "prac", card: 1, word: "PRACOWITY",
    label: "Drąży głębiej niż ktokolwiek — aż do skutku.",
    accent: "#7fb6ff",
    bg: "radial-gradient(62% 52% at 50% 28%, rgba(110,165,235,0.38), transparent 60%), radial-gradient(130% 120% at 50% 64%, #0c1b2c, #04070d 72%)" },

  { key: "amb", card: 2, word: "AMBITNY",
    label: "Mężczyzna Roku. Właściwy człowiek na właściwym miejscu.",
    accent: "#e9bd5e",
    bg: "radial-gradient(60% 50% at 50% 28%, rgba(225,170,80,0.34), transparent 60%), radial-gradient(130% 120% at 50% 64%, #1c1407, #08060a 72%)" },

  { key: "pom", card: 3, word: "POMYSŁOWY",
    label: "Kapitan własnego kursu — zawsze znajdzie drogę.",
    accent: "#aab6ff",
    bg: "radial-gradient(64% 52% at 50% 28%, rgba(120,170,230,0.36), transparent 62%), radial-gradient(130% 120% at 50% 68%, #122236, #0a1622 72%)" },

  { key: "cza", card: 4, word: "CZARUJĄCY",
    label: "Dwa kciuki w górę, zero kompromisów.",
    accent: "#6fd58c",
    bg: "radial-gradient(60% 50% at 50% 28%, rgba(95,205,125,0.30), transparent 60%), radial-gradient(130% 120% at 50% 66%, #0e2014, #060d09 72%)" },

  { key: "int", card: 5, word: "INTELIGENTNY",
    label: "Wie, co robi — i nigdy nie da się zdemaskować.",
    accent: "#93a6ff",
    bg: "radial-gradient(60% 50% at 50% 28%, rgba(120,140,235,0.32), transparent 60%), radial-gradient(130% 120% at 50% 66%, #161b2e, #0a0c16 72%)" },

  { key: "ory", card: 6, word: "ORYGINALNY",
    label: "Mistrz nieoczywistych pomysłów (i truskawkowych kapeluszy).",
    accent: "#ff8088",
    bg: "radial-gradient(60% 50% at 50% 28%, rgba(230,95,95,0.32), transparent 60%), radial-gradient(130% 120% at 50% 66%, #201111, #0c0807 72%)" },

  { key: "pap", card: 7, kind: "papcio", word: "PAPCIO", kicker: "W skrócie",
    label: "Najlepszy zawodnik w drużynie — najlepszy w roli taty.",
    accent: "#ffb27a",
    bg: "radial-gradient(60% 50% at 50% 28%, rgba(230,150,120,0.32), transparent 60%), radial-gradient(130% 120% at 50% 66%, #1e1317, #0c080a 72%)" },
];

const SEGS = STATES.length - 1;          // 7 transitions
const CARD_COUNT = STATES.filter(s => s.card).length;
// viewport-heights of scrolling per transition (higher = less sensitive)
const SCROLL_PER = 2.6;

/* ---- build DOM ------------------------------------------------------- */
const bgEl = document.getElementById("bg");
const cardsEl = document.getElementById("cards");
const wordsEl = document.getElementById("words");

const bgLayers = [];
const wordEls = [];
const cardEls = [];          // index 0..6 -> state 1..7

STATES.forEach((s, i) => {
  // background layer
  const layer = document.createElement("div");
  layer.className = "bg__layer";
  layer.style.background = s.bg;
  bgEl.appendChild(layer);
  bgLayers.push(layer);

  // word
  const w = document.createElement("div");
  w.className = "word";
  w.style.setProperty("--w-accent", s.accent);
  if (s.kind === "intro") {
    w.classList.add("word--intro");
    w.innerHTML = `<span class="word__text">${s.word.replace(/\n/g, "<br>")}</span>`;
  } else if (s.kind === "papcio") {
    w.classList.add("word--papcio");
    w.innerHTML =
      `<span class="word__kicker">${s.kicker}</span>` +
      `<span class="word__text"><span class="cap">${s.word[0]}</span>${s.word.slice(1)}</span>`;
  } else {
    w.innerHTML = `<span class="word__text"><span class="cap">${s.word[0]}</span>${s.word.slice(1)}</span>`;
  }
  wordsEl.appendChild(w);
  wordEls.push(w);

  // card
  if (s.card) {
    const c = document.createElement("div");
    c.className = "card";
    c.style.setProperty("--card-accent", s.accent);
    const idx = String(s.card).padStart(2, "0");
    c.innerHTML =
      `<img src="assets/${s.card}.jpg" alt="${s.word}" loading="eager" />` +
      `<span class="card__tag"><b>${idx}</b> ${s.word}</span>`;
    cardsEl.appendChild(c);
    cardEls.push(c);
  }
});

const cardForState = (i) => (STATES[i].card ? cardEls[STATES[i].card - 1] : null);

/* ---- HUD refs -------------------------------------------------------- */
const hudLabel = document.getElementById("hudLabel");
const hudCounter = document.getElementById("hudCounter");
const progressBar = document.getElementById("progressBar");
const scrollHint = document.getElementById("scrollHint");
const giftCue = document.getElementById("giftCue");
const loader = document.getElementById("loader");

/* =====================================================================
   MOTION
   ===================================================================== */
gsap.registerPlugin(ScrollTrigger);

/* depth tuning (toned down for reduced-motion) */
const D = RM
  ? { rotY: 0, rotX: 0, z: 0, scale: 0.97 }
  : { rotY: 42, rotX: 7, z: 620, scale: 0.8 };

/* initial states */
gsap.set(bgLayers, { opacity: 0 });
gsap.set(bgLayers[0], { opacity: 1 });

wordEls.forEach((w, i) => {
  gsap.set(w, i === 0
    ? { opacity: 1, yPercent: 0, filter: "blur(0px)" }
    : { opacity: 0, yPercent: 58, filter: "blur(12px)" });
});

gsap.set(cardEls, {
  opacity: 0, rotateY: D.rotY, rotateX: -D.rotX * 0.7,
  z: -D.z, scale: D.scale, transformOrigin: "50% 50%",
});

/* timeline */
const tl = gsap.timeline({ defaults: { ease: "none" }, paused: SHOT });

for (let i = 0; i < SEGS; i++) {
  const p = i;
  // background crossfade across the whole unit
  tl.to(bgLayers[i], { opacity: 0, duration: 1 }, p);
  tl.to(bgLayers[i + 1], { opacity: 1, duration: 1 }, p);

  // word out / in (enter from below, exit upward)
  tl.to(wordEls[i], { opacity: 0, yPercent: -52, filter: "blur(12px)", duration: 0.5, ease: "power2.in" }, p);
  tl.to(wordEls[i + 1], { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 0.55, ease: "power2.out" }, p + 0.42);

  // card out / in (3D morph)
  const co = cardForState(i);
  if (co) tl.to(co, { opacity: 0, rotateY: -D.rotY, rotateX: D.rotX, z: -D.z, scale: D.scale, duration: 0.55, ease: "power2.in" }, p);
  const ci = cardForState(i + 1);
  if (ci) {
    // final PAPCIO state: photo sits BELOW the headline (smaller, lower)
    const lastPapcio = STATES[i + 1].kind === "papcio";
    const active = lastPapcio
      ? { opacity: 1, rotateY: 0, rotateX: 0, z: 0, scale: 0.78, yPercent: 24, duration: 0.64, ease: "power3.out" }
      : { opacity: 1, rotateY: 0, rotateX: 0, z: 0, scale: 1, yPercent: 0, duration: 0.64, ease: "power3.out" };
    tl.to(ci, active, p + 0.34);
  }
}
tl.to({}, { duration: 0.6 }, SEGS); // hold final state

const TOTAL = tl.totalDuration();

/* ---- HUD updater ----------------------------------------------------- */
function updateHud(progress) {
  const t = progress * TOTAL;
  const active = Math.min(SEGS, Math.max(0, Math.round(t)));
  const s = STATES[active];

  progressBar.style.height = (progress * 100).toFixed(2) + "%";

  if (active > 0) {
    hudLabel.textContent = s.label;
    hudLabel.style.setProperty("--hud-accent", s.accent);
    hudLabel.style.opacity = "1";
    hudCounter.innerHTML = `<b>${String(s.card).padStart(2, "0")}</b> / ${String(CARD_COUNT).padStart(2, "0")}`;
    hudCounter.style.opacity = "1";
  } else {
    hudLabel.style.opacity = "0";
    hudCounter.style.opacity = "0";
  }

  scrollHint.style.opacity = progress > 0.02 ? "0" : "0.8";

  const nearEnd = progress > 0.9;
  giftCue.style.opacity = nearEnd ? "1" : "0";
  giftCue.style.transform = `translateX(-50%) translateY(${nearEnd ? 0 : 20}px)`;
  giftCue.classList.toggle("is-live", nearEnd);
}

/* =====================================================================
   WIRING
   ===================================================================== */
function startExperience() {
  if (SHOT) {
    // debug/screenshot mode: fix the stage, jump to a state, no scroll
    document.getElementById("experience").style.height = "100vh";
    const stage = document.getElementById("stage");
    stage.style.position = "fixed";
    stage.style.inset = "0";

    if (SEEK === "gift" || SEEK === "chase") {
      document.getElementById("experience").style.display = "none";
      tl.progress(1);
    } else {
      const n = Math.max(0, Math.min(SEGS, parseFloat(SEEK || "0")));
      tl.time(n);
      updateHud(tl.progress());
    }
    return;
  }

  // smooth scroll
  if (!RM && window.Lenis) {
    const lenis = new Lenis({ duration: 1.25, smoothWheel: true, wheelMultiplier: 0.8, touchMultiplier: 1.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  // attach scroll-driven pin
  tl.scrollTrigger = ScrollTrigger.create({
    animation: tl,
    trigger: "#experience",
    start: "top top",
    // longer scroll distance per transition = lower scroll sensitivity
    end: () => "+=" + (SEGS * SCROLL_PER + 0.6) * window.innerHeight,
    pin: "#stage",
    scrub: RM ? 0.6 : 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => updateHud(self.progress),
            onRefresh: (self) => updateHud(self.progress),
  });

  updateHud(0);

  // subtle pointer parallax on the 3D cards
  if (!RM) {
    const qx = gsap.quickTo(cardsEl, "rotationY", { duration: 0.6, ease: "power2.out" });
    const qy = gsap.quickTo(cardsEl, "rotationX", { duration: 0.6, ease: "power2.out" });
    window.addEventListener("pointermove", (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5);
      const ny = (e.clientY / window.innerHeight - 0.5);
      qx(nx * 10);
      qy(-ny * 8);
    }, { passive: true });
  }

  // gift cue -> scroll to gift
  giftCue.addEventListener("click", () => {
    const target = document.getElementById("gift");
    if (window.__lenis) window.__lenis.scrollTo(target, { offset: 0 });
    else target.scrollIntoView({ behavior: "smooth" });
  });
}

/* loader + boot */
function boot() {
  startExperience();
  initGift();
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

if (SHOT) {
  loader.classList.add("is-hidden");
  boot();
} else {
  window.addEventListener("load", () => {
    boot();
    setTimeout(() => loader.classList.add("is-hidden"), 450);
  });
  // safety: hide loader even if 'load' is slow
  setTimeout(() => loader.classList.add("is-hidden"), 2600);
}

/* =====================================================================
   GIFT — runaway frame + reveal
   ===================================================================== */
function initGift() {
  const field = document.getElementById("giftField");
  const chase = document.getElementById("giftChase");
  const prize = document.getElementById("prize");
  const ticketsWrap = document.getElementById("tickets");
  const giftHint = document.getElementById("giftHint");
  const countdownEl = document.getElementById("countdown");

  // build two tickets
  ticketsWrap.innerHTML = ticketHTML("7", "14") + ticketHTML("7", "15");

  // center the tiny frame via gsap transform
  gsap.set(chase, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

  let fleeActive = false;
  let stopped = false;
  let revealed = false;
  let cur = { x: 0, y: 0 };
  const RADIUS = 280; // bails out well before the cursor arrives

  function flee(clientX, clientY) {
    if (!fleeActive || stopped) return;
    const fr = chase.getBoundingClientRect();
    const fl = field.getBoundingClientRect();
    const cx = fr.left + fr.width / 2;
    const cy = fr.top + fr.height / 2;
    const dist = Math.hypot(cx - clientX, cy - clientY) || 1;
    if (dist >= RADIUS) return;

    const maxX = Math.max(40, (fl.width - fr.width) / 2 - 16);
    const maxY = Math.max(40, (fl.height - fr.height) / 2 - 16);

    // cursor position relative to field centre -> dart to the OPPOSITE side
    const relX = clientX - (fl.left + fl.width / 2);
    const relY = clientY - (fl.top + fl.height / 2);
    const sx = relX === 0 ? (Math.random() < 0.5 ? -1 : 1) : -Math.sign(relX);
    const sy = relY === 0 ? (Math.random() < 0.5 ? -1 : 1) : -Math.sign(relY);

    let tx = sx * maxX * (0.6 + Math.random() * 0.4) + (Math.random() - 0.5) * maxX * 0.5;
    let ty = sy * maxY * (0.6 + Math.random() * 0.4) + (Math.random() - 0.5) * maxY * 0.5;
    tx = clamp(tx, -maxX, maxX);
    ty = clamp(ty, -maxY, maxY);

    cur.x = tx; cur.y = ty;
    gsap.to(chase, { x: tx, y: ty, duration: 0.42, ease: "power3.out", overwrite: true });
  }

  field.addEventListener("pointermove", (e) => flee(e.clientX, e.clientY));
  field.addEventListener("pointerdown", (e) => flee(e.clientX, e.clientY));

  function stopFleeing() {
    stopped = true; fleeActive = false;
    gsap.to(chase, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.7)" });
    chase.disabled = false;
    chase.classList.add("is-live");
    if (giftHint) giftHint.innerHTML = "Złapany! Kliknij, żeby odsłonić prezent 🎁";
  }

  function reveal() {
    if (revealed || chase.disabled) return;
    revealed = true;
    chase.classList.add("is-gone");
    prize.classList.add("is-on");
    prize.setAttribute("aria-hidden", "false");
    if (giftHint) giftHint.style.opacity = "0";
    burstConfetti();
  }

  chase.addEventListener("click", reveal);

  let started = false;
  function startCountdown() {
    if (started) return; started = true;
    fleeActive = true;
    let left = SHOT ? 0 : 30;
    if (countdownEl) countdownEl.textContent = left;
    if (left === 0) { stopFleeing(); return; }
    const iv = setInterval(() => {
      left -= 1;
      if (countdownEl) countdownEl.textContent = Math.max(0, left);
      if (left <= 0) { clearInterval(iv); stopFleeing(); }
    }, 1000);
  }

  // begin the 30s window once the gift scrolls into view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { startCountdown(); io.disconnect(); } });
  }, { threshold: 0.45 });
  io.observe(document.getElementById("gift"));

  if (SHOT && SEEK === "gift") {
    stopFleeing();
    reveal();
  } else if (SHOT && SEEK === "chase") {
    stopFleeing();
  }
}

function ticketHTML(row, seat) {
  return `
  <div class="ticket">
    <div class="ticket__main">
      <div class="ticket__top">
        <div class="crest"><span>PW</span><small>1911</small></div>
        <div class="ticket__club">CZARNE KOSZULE<b>POLONIA WARSZAWA</b></div>
      </div>
      <div class="ticket__match">POLONIA <em>vs</em> UNIA</div>
      <div class="ticket__meta">
        <span>Polonia Warszawa — Unia Skierniewice</span>
        <span><b>15.08.2026</b> · 18:00</span>
        <span>Stadion Konwiktorska 6</span>
        <span>Trybuna Kryta · Rząd <b>${row}</b> · Miejsce <b>${seat}</b></span>
      </div>
    </div>
    <div class="ticket__stub">
      <div class="ticket__barcode"></div>
      <div class="ticket__seat">RZĄD ${row} · M${seat}</div>
    </div>
  </div>`;
}

/* ---- helpers --------------------------------------------------------- */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function burstConfetti() {
  const c = document.getElementById("confetti");
  const ctx = c.getContext("2d");
  c.width = window.innerWidth; c.height = window.innerHeight;
  const colors = ["#ffffff", "#0a0a0a", "#e9bd5e", "#cfd2d8", "#ffb27a"];
  const parts = [];
  const ox = window.innerWidth / 2, oy = window.innerHeight * 0.5;
  for (let i = 0; i < 180; i++) {
    parts.push({
      x: ox, y: oy,
      vx: (Math.random() - 0.5) * 16, vy: (Math.random() * -1 - 0.2) * 15,
      g: 0.34 + Math.random() * 0.22, s: 4 + Math.random() * 7,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      col: colors[i % colors.length],
    });
  }
  let t0 = performance.now();
  function frame(now) {
    const dt = Math.min(2.2, (now - t0) / 16); t0 = now;
    ctx.clearRect(0, 0, c.width, c.height);
    let alive = false;
    for (const p of parts) {
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y < c.height + 50) alive = true;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
    }
    if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
  }
  requestAnimationFrame(frame);
}
