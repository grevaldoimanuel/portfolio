(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ---------- Body scroll lock utility ---------- */
  let scrollLockCount = 0;
  function lockBodyScroll() {
    scrollLockCount++;
    if (scrollLockCount === 1) {
      document.body.classList.add("modal-open");
    }
  }
  function unlockBodyScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.body.classList.remove("modal-open");
    }
  }

  /* ---------- Year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  const preloader = $("#preloader");
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add("hidden");
    setTimeout(() => preloader.remove(), 700);
  }
  window.addEventListener("load", () => setTimeout(hidePreloader, 700));
  setTimeout(hidePreloader, 3500);

  /* ---------- Theme: light / dark / OLED + system auto ---------- */
  const root = document.documentElement;
  const themeToggle = $("#themeToggle");
  const themeModeLabel = $("#themeModeLabel");
  const STORAGE_KEY = "grev-theme";

  const THEME_CYCLE = ["light", "dark", "oled"];
  const THEME_META = {
    light: { color: "#ffffff", label: "Light", confetti: "#5e5ce6" },
    dark:  { color: "#000000", label: "Dark",  confetti: "#0a84ff" },
    oled:  { color: "#000000", label: "OLED",  confetti: "#ffffff" },
  };

  function systemPrefersDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function applyTheme(theme, persist = true) {
    if (!THEME_META[theme]) theme = "light";
    root.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute("content", THEME_META[theme].color);
    if (themeModeLabel) themeModeLabel.textContent = THEME_META[theme].label;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    }
    // Update mobile browser UI color too
    document.querySelectorAll('meta[name="theme-color"][media]').forEach((m) => {
      m.setAttribute("content", THEME_META[theme].color);
    });
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    const initial = saved && THEME_META[saved] ? saved : (systemPrefersDark() ? "dark" : "light");
    applyTheme(initial, false);
  }

  themeToggle?.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "light";
    const idx = THEME_CYCLE.indexOf(current);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    applyTheme(next);
    if (!prefersReduced) launchConfetti(THEME_META[next].confetti);
    if (soundOn) playClickSound();
    showToast(`Theme: ${THEME_META[next].label}`, "info", next === "light" ? "bi-sun-fill" : next === "dark" ? "bi-moon-stars-fill" : "bi-circle-half");
    if (next === "oled") unlockAchievement("oled_mode");
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (err) {}
    if (!saved || !THEME_META[saved]) applyTheme(e.matches ? "dark" : "light", false);
  });

  initTheme();

  /* ---------- Confetti burst on theme toggle ---------- */
  function launchConfetti(accent) {
    const colors = [accent, "#5e5ce6", "#ff375f", "#30d158", "#ff9f0a", "#ffffff"];
    const count = 36;
    const originX = window.innerWidth - 80;
    const originY = 60;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = originX + "px";
      piece.style.top = originY + "px";
      piece.style.background = colors[i % colors.length];
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const velocity = 120 + Math.random() * 180;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity - 80;
      const rot = (Math.random() - 0.5) * 720;
      piece.style.transform = "translate(0,0) rotate(0)";
      document.body.appendChild(piece);
      const start = performance.now();
      const duration = 1100 + Math.random() * 500;
      const gravity = 600;
      function frame(now) {
        const t = (now - start) / 1000;
        if (t * 1000 >= duration) {
          piece.remove();
          return;
        }
        const x = dx * t;
        const y = dy * t + 0.5 * gravity * t * t;
        const op = Math.max(0, 1 - (t * 1000) / duration);
        piece.style.transform = `translate(${x}px, ${y}px) rotate(${rot * t}deg)`;
        piece.style.opacity = op;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  }

  /* ---------- Bootstrap navbar toggle ---------- */
  const navToggle = $("#navToggle");
  const navMenu   = $("#navMenu");
  navToggle?.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navMenu?.classList.toggle("show", !expanded);
  });
  $$("#navMenu .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (navMenu?.classList.contains("show")) {
        navMenu.classList.remove("show");
        navToggle?.setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 76;
        window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
      }
    });
  });

  /* ---------- Scroll progress bar + navbar + back-to-top + active link ---------- */
  const progressBar = $("#scrollProgress");
  const nav = $("#topNav");
  const backToTop = $("#backToTop");
  const sections = $$("main section[id]");
  const navLinks = $$("#navMenu .nav-link");

  function updateProgress() {
    const h = document.documentElement;
    const scrollable = h.scrollHeight - h.clientHeight;
    const pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + "%";
  }

  function onScroll() {
    const y = window.pageYOffset;
    nav?.classList.toggle("scrolled", y > 30);
    backToTop?.classList.toggle("show", y > 600);
    updateProgress();
    let currentId = "";
    const offset = 120;
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const top = sec.offsetTop - offset;
      if (y >= top) currentId = sec.id;
    }
    navLinks.forEach((l) => {
      const href = l.getAttribute("href") || "";
      l.classList.toggle("active", href === "#" + currentId);
    });
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const counters = $$(".counter", entry.target);
            counters.forEach(animateCounter);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 0.08 + "s";
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
    $$(".counter").forEach(animateCounter);
  }

  /* ---------- Animate language bars ---------- */
  $$(".lang-bar span").forEach((span) => {
    span.dataset.target = span.style.width;
    span.style.width = "0%";
  });
  if ("IntersectionObserver" in window) {
    const langIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bar = $(".lang-bar span", entry.target);
            if (bar && bar.dataset.target) {
              requestAnimationFrame(() => { bar.style.width = bar.dataset.target; });
            }
            langIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    $$(".lang-card").forEach((c) => langIO.observe(c));
  }

  /* ---------- Number counter ---------- */
  function animateCounter(el) {
    if (!el || el.dataset.done) return;
    el.dataset.done = "1";
    const target = parseInt(el.dataset.target || "0", 10);
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Text scramble for hero title ---------- */
  const scrambleEl = $("[data-scramble]");
  if (scrambleEl && !prefersReduced) {
    const original = scrambleEl.innerHTML;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    function wrapChars(html) {
      let out = "";
      let inTag = false;
      for (let i = 0; i < html.length; i++) {
        const ch = html[i];
        if (ch === "<") { inTag = true; out += ch; continue; }
        if (ch === ">") { inTag = false; out += ch; continue; }
        if (inTag) { out += ch; continue; }
        if (ch === " ") { out += '<span class="char space">&nbsp;</span>'; continue; }
        if (ch === "\n") { out += ch; continue; }
        out += '<span class="char">' + ch + "</span>";
      }
      return out;
    }
    scrambleEl.innerHTML = wrapChars(original);
    const spans = $$(".char", scrambleEl);
    spans.forEach((sp) => { if (!sp.classList.contains("space")) sp.dataset.real = sp.textContent; });
    let frame = 0;
    const totalFrames = 36;
    let raf;
    function scrambleStep() {
      const reveal = Math.floor((frame / totalFrames) * spans.length);
      spans.forEach((sp, idx) => {
        if (sp.classList.contains("space")) return;
        if (idx <= reveal) {
          if (sp.dataset.real) sp.textContent = sp.dataset.real;
        } else {
          sp.textContent = chars[Math.floor(Math.random() * chars.length)];
        }
      });
      frame++;
      if (frame > totalFrames + 6) {
        spans.forEach((sp) => { if (sp.dataset.real) sp.textContent = sp.dataset.real; });
        cancelAnimationFrame(raf);
        return;
      }
      raf = requestAnimationFrame(scrambleStep);
    }
    setTimeout(() => { raf = requestAnimationFrame(scrambleStep); }, 1100);

    setInterval(() => {
      if (document.hidden) return;
      spans.forEach((sp, i) => {
        if (sp.classList.contains("space")) return;
        setTimeout(() => {
          sp.classList.add("flip");
          setTimeout(() => sp.classList.remove("flip"), 600);
        }, i * 30);
      });
    }, 8000);
  }

  /* ---------- Custom round cursor ---------- */
  const cursorDot  = $("#cursorDot");
  const cursorRing = $("#cursorRing");
  if (cursorDot && cursorRing && !isTouch) {
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    let dotX  = mouseX, dotY  = mouseY;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    document.addEventListener("mousedown", () => {
      cursorDot.classList.add("clicking");
      cursorRing.classList.add("clicking");
    });
    document.addEventListener("mouseup", () => {
      cursorDot.classList.remove("clicking");
      cursorRing.classList.remove("clicking");
    });

    const hoverables = "a, button, .nav-link, .skill-chip, .glass-card, .meta-pill, .theme-toggle, .back-to-top, .timeline-dot, input, textarea";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) cursorRing.classList.add("hovering");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) cursorRing.classList.remove("hovering");
    });
    document.addEventListener("mouseleave", () => {
      cursorDot.style.opacity = "0";
      cursorRing.style.opacity = "0";
    });
    document.addEventListener("mouseenter", () => {
      cursorDot.style.opacity = "1";
      cursorRing.style.opacity = "1";
    });

    function tick() {
      dotX += (mouseX - dotX) * 0.55;
      dotY += (mouseY - dotY) * 0.55;
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorDot.style.transform  = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Spotlight cursor on cards ---------- */
  if (!isTouch && !prefersReduced) {
    $$("[data-spotlight]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty("--mx", x + "%");
        card.style.setProperty("--my", y + "%");
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (!isTouch && !prefersReduced) {
    $$(".magnetic").forEach((btn) => {
      const strength = 18;
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${(x / r.width) * strength}px, ${(y / r.height) * strength}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ---------- Ripple effect on click ---------- */
  $$("[data-ripple]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const span = document.createElement("span");
      span.className = "ripple-span";
      span.style.left = x + "px";
      span.style.top = y + "px";
      span.style.width = span.style.height = size + "px";
      btn.appendChild(span);
      setTimeout(() => span.remove(), 700);
    });
  });

  /* ---------- Floating particles canvas ---------- */
  const canvas = $("#particles");
  let particleRafId = null;
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext("2d");
    let w, h, particles = [];
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      const count = Math.min(70, Math.floor(window.innerWidth / 22));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (Math.random() * 1.8 + 0.6) * dpr,
          vx: (Math.random() - 0.5) * 0.35 * dpr,
          vy: (Math.random() - 0.5) * 0.35 * dpr,
          a: Math.random() * 0.5 + 0.2,
          dpr: dpr
        });
      }
    }
    resize();
    window.addEventListener("resize", resize);
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const dark = root.getAttribute("data-theme") === "dark";
      ctx.fillStyle = dark ? "rgba(200,210,255,0.9)" : "rgba(10,132,255,0.9)";
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      const maxDist = 120 * (window.devicePixelRatio || 1);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            ctx.globalAlpha = (1 - d / maxDist) * 0.18;
            ctx.strokeStyle = dark ? "rgba(120,180,255,1)" : "rgba(94,92,230,1)";
            ctx.lineWidth = 0.6 * (window.devicePixelRatio || 1);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      particleRafId = requestAnimationFrame(draw);
    }
    draw();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (particleRafId) cancelAnimationFrame(particleRafId);
      } else if (!particleRafId) {
        draw();
      }
    });
  }

  /* ---------- Liquid morphing blob ---------- */
  const blobPath = $("#blobPath");
  if (blobPath && !prefersReduced) {
    const cx = 100, cy = 100;
    const points = 6;
    let t = 0;
    let blobRaf;
    function blob() {
      t += 0.005;
      let path = "";
      for (let i = 0; i <= points; i++) {
        const ang = (i / points) * Math.PI * 2;
        const rad = 70 + Math.sin(t + i * 1.3) * 12 + Math.cos(t * 1.5 + i * 0.7) * 8;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        if (i === 0) {
          path += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
        } else {
          const prevAng = ((i - 1) / points) * Math.PI * 2;
          const prevRad = 70 + Math.sin(t + (i - 1) * 1.3) * 12 + Math.cos(t * 1.5 + (i - 1) * 0.7) * 8;
          const px = cx + Math.cos(prevAng) * prevRad;
          const py = cy + Math.sin(prevAng) * prevRad;
          const cpx = (px + x) / 2;
          const cpy = (py + y) / 2;
          path += `Q ${px.toFixed(2)} ${py.toFixed(2)} ${cpx.toFixed(2)} ${cpy.toFixed(2)} `;
        }
      }
      path += "Z";
      blobPath.setAttribute("d", path);
      blobRaf = requestAnimationFrame(blob);
    }
    blob();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (blobRaf) cancelAnimationFrame(blobRaf);
      } else {
        blob();
      }
    });
  }

  /* ---------- Subtle parallax on hero profile ---------- */
  const profile = $(".profile-wrap");
  if (profile && !prefersReduced && !isTouch) {
    let raf = null;
    document.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        profile.style.transform = `translate(${dx * 10}px, ${dy * 10}px)`;
        raf = null;
      });
    });
  }

  /* ---------- Pre-load reveal of hero ---------- */
  window.addEventListener("load", () => {
    const heroReveal = $$("#hero [data-reveal]");
    heroReveal.forEach((el, i) => {
      setTimeout(() => el.classList.add("visible"), 80 * i + 300);
    });
  });

  /* ---------- Page visibility: pause heavy animations ---------- */
  document.addEventListener("visibilitychange", () => {
    document.body.style.animationPlayState = document.hidden ? "paused" : "running";
  });

  /* ---------- 3D tilt on cards (desktop) ---------- */
  if (!isTouch && !prefersReduced) {
    $$(".skill-chip, .edu-card, .lang-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-4px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ===========================================================
     UPGRADE 3 FEATURES
     =========================================================== */

  /* ---------- Sound effects via Web Audio API ---------- */
  const soundToggle = $("#soundToggle");
  let soundOn = false;
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function playTone(freq, duration = 0.08, type = "sine", volume = 0.05) {
    if (!soundOn || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playClickSound() { playTone(880, 0.06, "sine", 0.04); }
  function playHoverSound() { playTone(1200, 0.04, "sine", 0.025); }
  function playSuccessSound() {
    playTone(523, 0.1, "sine", 0.05);
    setTimeout(() => playTone(659, 0.1, "sine", 0.05), 90);
    setTimeout(() => playTone(784, 0.16, "sine", 0.05), 180);
  }
  function playToggleSound() { playTone(440, 0.08, "triangle", 0.04); }

  if (soundToggle) {
    soundToggle.classList.add("sound-off-state");
    soundToggle.addEventListener("click", () => {
      soundOn = !soundOn;
      ensureAudio();
      soundToggle.classList.toggle("sound-on-state", soundOn);
      soundToggle.classList.toggle("sound-off-state", !soundOn);
      if (soundOn) {
        playToggleSound();
        showToast("Sound effects enabled", "info", "bi-volume-up-fill");
      } else {
        showToast("Sound effects muted", "info", "bi-volume-mute-fill");
      }
    });
  }

  // Wire sound to clicks and hovers globally
  document.addEventListener("click", (e) => {
    if (!soundOn) return;
    if (e.target.closest("a, button, .nav-link, .dock-item, .meta-pill")) playClickSound();
  });
  document.addEventListener("mouseover", (e) => {
    if (!soundOn) return;
    if (e.target.closest("a, button, .nav-link, .dock-item, .skill-chip, .meta-pill, .theme-toggle, .icon-toggle")) playHoverSound();
  });

  /* ---------- Live digital clock (Jakarta/WIB) ---------- */
  const clockEl = $("#navClockTime");
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const jakarta = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const hh = String(jakarta.getHours()).padStart(2, "0");
    const mm = String(jakarta.getMinutes()).padStart(2, "0");
    const ss = String(jakarta.getSeconds()).padStart(2, "0");
    clockEl.textContent = `${hh}:${mm}:${ss}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- Cursor trail particles ---------- */
  if (!isTouch && !prefersReduced) {
    const trailColors = ["#0a84ff", "#5e5ce6", "#ff375f", "#30d158", "#ff9f0a", "#bf5af2"];
    let lastTrailTime = 0;
    document.addEventListener("mousemove", (e) => {
      const now = performance.now();
      if (now - lastTrailTime < 30) return;
      lastTrailTime = now;
      const p = document.createElement("span");
      p.className = "trail-particle";
      const color = trailColors[Math.floor(Math.random() * trailColors.length)];
      p.style.background = color;
      p.style.boxShadow = `0 0 10px ${color}`;
      p.style.left = e.clientX + "px";
      p.style.top = e.clientY + "px";
      const size = 4 + Math.random() * 6;
      p.style.width = size + "px";
      p.style.height = size + "px";
      document.body.appendChild(p);
      const startTime = performance.now();
      const lifespan = 600 + Math.random() * 200;
      const dx = (Math.random() - 0.5) * 30;
      const dy = (Math.random() - 0.5) * 30 - 10;
      function anim(now) {
        const t = (now - startTime) / lifespan;
        if (t >= 1) { p.remove(); return; }
        p.style.transform = `translate(${dx * t}px, ${dy * t + 30 * t * t}px) scale(${1 - t})`;
        p.style.opacity = 1 - t;
        requestAnimationFrame(anim);
      }
      requestAnimationFrame(anim);
    });
  }

  /* ---------- Hero title glitch effect (random) ---------- */
  const glitchEl = $("[data-glitch]");
  if (glitchEl && !prefersReduced) {
    // Set data-text attribute for ::before/::after
    function setGlitchText() {
      const txt = glitchEl.textContent.replace(/\s+/g, " ").trim();
      glitchEl.setAttribute("data-text", txt);
    }
    setTimeout(setGlitchText, 2500);
    setInterval(() => {
      if (document.hidden) return;
      if (Math.random() < 0.35) {
        setGlitchText();
        glitchEl.classList.add("glitching");
        if (soundOn) playTone(120, 0.2, "sawtooth", 0.02);
        setTimeout(() => glitchEl.classList.remove("glitching"), 400);
      }
    }, 5000);
  }

  /* ---------- Typewriter effect for hero summary ---------- */
  const typeEl = $("[data-typewriter]");
  if (typeEl && !prefersReduced) {
    const fullText = typeEl.textContent.trim();
    typeEl.textContent = "";
    typeEl.classList.add("typewriting");
    let typeI = 0;
    let typeStarted = false;
    function startTyping() {
      if (typeStarted) return;
      typeStarted = true;
      function step() {
        if (typeI <= fullText.length) {
          typeEl.textContent = fullText.slice(0, typeI);
          typeI++;
          if (soundOn && typeI % 2 === 0) playTone(1500 + Math.random() * 200, 0.015, "square", 0.012);
          setTimeout(() => requestAnimationFrame(step), 18 + Math.random() * 24);
        } else {
          typeEl.classList.add("done");
          setTimeout(() => typeEl.classList.remove("typewriting"), 800);
        }
      }
      requestAnimationFrame(step);
    }
    // Wait until reveal animation finishes
    const heroRevealObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setTimeout(startTyping, 2500); // after scramble completes
          heroRevealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    heroRevealObs.observe(typeEl);
  }

  /* ---------- Toast notifications ---------- */
  const toastContainer = $("#toastContainer");
  function showToast(message, type = "info", icon = "bi-info-circle-fill") {
    if (!toastContainer) return;
    const t = document.createElement("div");
    t.className = `toast-item toast-${type}`;
    t.innerHTML = `<i class="bi ${icon}"></i><span>${message}</span>`;
    toastContainer.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => {
      t.classList.remove("show");
      t.classList.add("hide");
      setTimeout(() => t.remove(), 400);
    }, 3000);
  }

  /* ---------- Clipboard copy on meta pills ---------- */
  $$("[data-copy]").forEach((pill) => {
    pill.addEventListener("click", async (e) => {
      e.preventDefault();
      const value = pill.dataset.value || "";
      const type = pill.dataset.copy || "text";
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else {
          const ta = document.createElement("textarea");
          ta.value = value;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        pill.classList.add("copied");
        const originalHTML = pill.innerHTML;
        const iconClass = type === "phone" ? "bi-telephone-fill" : "bi-envelope-fill";
        pill.innerHTML = `<i class="bi bi-check-lg"></i> Copied!`;
        showToast(`${type === "phone" ? "Phone number" : "Email"} copied to clipboard`, "success", "bi-clipboard-check-fill");
        if (soundOn) playSuccessSound();
        setTimeout(() => {
          pill.classList.remove("copied");
          pill.innerHTML = originalHTML;
        }, 1500);
      } catch (err) {
        showToast("Failed to copy", "warn", "bi-exclamation-triangle-fill");
      }
    });
  });

  /* ---------- Floating Quick-Contact Dock ---------- */
  const quickDock = $("#quickDock");
  const dockFab = $("#dockFab");
  const dockMenu = $("#dockMenu");
  const dockTop = $("#dockTop");
  dockFab?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = quickDock.classList.toggle("open");
    dockFab.classList.toggle("open", isOpen);
    dockFab.setAttribute("aria-expanded", String(isOpen));
    if (soundOn) playClickSound();
  });
  document.addEventListener("click", (e) => {
    if (!quickDock?.classList.contains("open")) return;
    if (!quickDock.contains(e.target)) {
      quickDock.classList.remove("open");
      dockFab?.classList.remove("open");
      dockFab?.setAttribute("aria-expanded", "false");
    }
  });
  dockTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  /* ---------- Back to top with rocket animation ---------- */
  const backToTopBtn = $("#backToTop");
  backToTopBtn?.addEventListener("click", () => {
    backToTopBtn.classList.add("launch");
    if (soundOn) playTone(660, 0.2, "sawtooth", 0.04);
    setTimeout(() => backToTopBtn.classList.remove("launch"), 700);
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  /* ---------- Section progress rail (right side mini nav) ---------- */
  const spvRail = $("#sectionProgressRail");
  const spvSections = $$("main section[id]");
  if (spvRail && spvSections.length) {
    spvSections.forEach((sec) => {
      const a = document.createElement("a");
      a.className = "spv";
      a.href = "#" + sec.id;
      a.dataset.target = sec.id;
      const label = ($(".section-title", sec)?.textContent || sec.id).trim();
      a.innerHTML = `
        <span class="spv-label">${label}</span>
        <span class="spv-bar"><span class="spv-fill" style="position:absolute;left:0;top:0;height:100%;background:var(--accent-grad);transform:scaleX(0);transform-origin:left;transition:transform 0.1s linear;"></span></span>
      `;
      spvRail.appendChild(a);
    });
    const spvItems = $$(".spv", spvRail);
    function updateSpv() {
      const scrollY = window.pageYOffset;
      const viewportH = window.innerHeight;
      spvItems.forEach((item) => {
        const sec = document.getElementById(item.dataset.target);
        if (!sec) return;
        const rect = sec.getBoundingClientRect();
        const top = rect.top + scrollY;
        const bottom = top + sec.offsetHeight;
        let progress = 0;
        if (scrollY >= top - viewportH * 0.4 && scrollY < bottom) {
          progress = Math.min(1, Math.max(0, (scrollY - top + viewportH * 0.4) / sec.offsetHeight));
        } else if (scrollY >= bottom) {
          progress = 1;
        }
        const fill = $(".spv-fill", item);
        if (fill) fill.style.transform = `scaleX(${progress})`;
        // Active detection
        const center = scrollY + viewportH / 2;
        item.classList.toggle("active", center >= top && center < bottom);
      });
    }
    let spvTicking = false;
    window.addEventListener("scroll", () => {
      if (!spvTicking) {
        requestAnimationFrame(() => { updateSpv(); spvTicking = false; });
        spvTicking = true;
      }
    }, { passive: true });
    updateSpv();
  }

  /* ---------- Konami code easter egg ---------- */
  const konamiHint = $("#konamiHint");
  let konamiHintShown = false;
  setTimeout(() => {
    if (!konamiHintShown) {
      konamiHint?.classList.add("show");
      konamiHintShown = true;
      setTimeout(() => konamiHint?.classList.remove("show"), 6000);
    }
  }, 8000);

  const konamiCode = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let konamiIndex = 0;
  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        konamiIndex = 0;
        triggerKonami();
      }
    } else {
      konamiIndex = (key === konamiCode[0]) ? 1 : 0;
    }
  });

  function triggerKonami() {
    showToast("Konami code activated! Enjoy the show", "success", "bi-stars");
    if (soundOn) {
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.18, "sine", 0.06), i * 100);
      });
    }
    // Rainbow confetti explosion from center
    const colors = ["#ff375f", "#ff9f0a", "#ffd60a", "#30d158", "#0a84ff", "#5e5ce6", "#bf5af2"];
    const count = 120;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = cx + "px";
      piece.style.top = cy + "px";
      piece.style.background = colors[i % colors.length];
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 200 + Math.random() * 300;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity;
      const rot = (Math.random() - 0.5) * 1080;
      document.body.appendChild(piece);
      const start = performance.now();
      const duration = 1800 + Math.random() * 800;
      const gravity = 800;
      function frame(now) {
        const t = (now - start) / 1000;
        if (t * 1000 >= duration) { piece.remove(); return; }
        const x = dx * t;
        const y = dy * t + 0.5 * gravity * t * t;
        const op = Math.max(0, 1 - (t * 1000) / duration);
        piece.style.transform = `translate(${x}px, ${y}px) rotate(${rot * t}deg)`;
        piece.style.opacity = op;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    // Briefly flash rainbow on hero title
    const heroTitle = $(".hero-title");
    if (heroTitle) {
      let i = 0;
      const rainbow = ["#ff375f", "#ff9f0a", "#ffd60a", "#30d158", "#0a84ff", "#5e5ce6", "#bf5af2"];
      const interval = setInterval(() => {
        if (i >= rainbow.length * 2) {
          clearInterval(interval);
          heroTitle.style.color = "";
          heroTitle.style.webkitTextFillColor = "";
          return;
        }
        heroTitle.style.color = rainbow[i % rainbow.length];
        heroTitle.style.webkitTextFillColor = rainbow[i % rainbow.length];
        i++;
      }, 120);
    }
  }

  /* ---------- Download Resume as PDF (browser print) ---------- */
  const dlBtn = $("#downloadResume");
  dlBtn?.addEventListener("click", () => {
    if (soundOn) playClickSound();
    showToast("Generating resume PDF...", "info", "bi-file-earmark-pdf-fill");

    // Build a clean printable resume HTML
    const resumeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Grevaldo Imanuel Dharmadi — Resume</title>
<style>
  @page { margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1d1d1f; line-height: 1.5; margin: 0; }
  h1 { font-size: 24pt; margin: 0 0 4pt; letter-spacing: -0.02em; }
  h2 { font-size: 12pt; margin: 18pt 0 6pt; padding-bottom: 4pt; border-bottom: 2px solid #0a84ff; color: #0a84ff; letter-spacing: 0.04em; text-transform: uppercase; }
  h3 { font-size: 11pt; margin: 10pt 0 2pt; color: #1d1d1f; }
  .role-meta { display: flex; justify-content: space-between; font-size: 9.5pt; color: #6e6e73; margin-bottom: 2pt; }
  .role-company { font-weight: 600; color: #424245; margin: 0 0 4pt; font-size: 10pt; }
  ul { padding-left: 16pt; margin: 4pt 0; }
  li { font-size: 9.5pt; margin-bottom: 3pt; color: #2c2c2e; }
  .contact { font-size: 9.5pt; color: #424245; margin: 4pt 0 10pt; }
  .summary { font-size: 10pt; color: #2c2c2e; margin: 8pt 0 4pt; line-height: 1.55; }
  .skills span { display: inline-block; background: #f0f0f5; border: 1px solid #d2d2d7; border-radius: 999px; padding: 3pt 10pt; font-size: 9pt; margin: 2pt 3pt 2pt 0; color: #1d1d1f; }
  .edu-row { margin-bottom: 6pt; }
  .edu-row .name { font-weight: 600; font-size: 10.5pt; }
  .edu-row .field { color: #424245; font-size: 10pt; }
  .edu-row .year { color: #6e6e73; font-size: 9.5pt; }
  .lang-row { font-size: 10pt; margin-bottom: 3pt; }
  .lang-row b { color: #1d1d1f; }
  .lang-row span { color: #6e6e73; }
  header { border-bottom: 3px solid #0a84ff; padding-bottom: 8pt; margin-bottom: 8pt; }
</style>
</head>
<body>
<header>
  <h1>Grevaldo Imanuel Dharmadi</h1>
  <div class="contact">IT Support · Shopee &nbsp;|&nbsp; Bekasi, Indonesia &nbsp;|&nbsp; +6281311893917 &nbsp;|&nbsp; grevaldom@gmail.com</div>
  <p class="summary">An IT graduate with a strong dedication to continuous learning and a keen curiosity about technological innovation. Experienced in IT support and customer service roles, with hands-on expertise in developing desktop and Android applications. Demonstrates proficiency in Windows and Linux systems, along with practical skills in network configuration, particularly using MikroTik technologies.</p>
</header>

<h2>Work Experience</h2>

<h3>IT Support</h3>
<div class="role-meta"><span>PT Shopee International Indonesia</span><span>February 2026 — Present</span></div>
<ul>
<li>Delivered day-to-day IT technical support to end users, ensuring the reliable operation of workstations, network-connected devices, and printers within the organizational environment.</li>
<li>Diagnosed and resolved end-user software and application issues, while maintaining and regularly updating comprehensive technical support documentation and troubleshooting records.</li>
<li>Managed IT asset lifecycle and inventory tracking, maintaining accurate records of hardware and software assets and coordinating procurement and technical services with external vendors.</li>
<li>Monitored and maintained office network infrastructure, including connectivity, endpoint security configurations, and antivirus solutions to ensure stable and secure IT operations.</li>
<li>Provided first-level technical support for server operations, including scheduled backup procedures, routine system monitoring, and preparation of operational status reports.</li>
</ul>

<h3>Advisor 1</h3>
<div class="role-meta"><span>PT Concentrix Services Indonesia</span><span>October 2025 — January 2026</span></div>
<ul>
<li>Engaged with customers through email and digital messaging platforms, responding to inquiries, providing detailed information, and delivering timely assistance to ensure a positive customer experience.</li>
<li>Assisted customers in navigating company products and services, addressing questions, concerns, and technical issues while offering clear guidance and practical solutions.</li>
<li>Diagnosed and resolved customer service and technical support issues, escalating complex or specialized cases to senior support teams when necessary to ensure efficient resolution.</li>
<li>Maintained a consistently high standard of professional communication and customer service etiquette across all customer interactions.</li>
<li>Accurately documented customer interactions and service activities, including inquiry details, troubleshooting steps, solutions provided, and required follow-up actions within support records.</li>
<li>Achieved and consistently met key performance indicators (KPIs), including response time targets, customer satisfaction ratings, and high-volume email handling metrics.</li>
<li>Continuously updated product knowledge and company policy awareness to ensure customers received accurate, relevant, and up-to-date information.</li>
<li>Collaborated with cross-functional teams and internal departments to ensure consistent, efficient, and high-quality customer support delivery.</li>
</ul>

<h3>Customer Experience Officer</h3>
<div class="role-meta"><span>PT Shopee International Indonesia</span><span>June 2024 — October 2025</span></div>
<ul>
<li>Managed the end-to-end customer service process, handling inquiries, requests, and complaints through multiple communication channels, including email and live chat, while ensuring timely and professional responses.</li>
<li>Investigated, managed, and resolved customer-related issues and escalations, delivering effective solutions while maintaining a high standard of customer satisfaction and service quality.</li>
<li>Represented the voice of the customer by communicating user feedback, concerns, and recurring issues to internal teams to support service improvements and business decision-making.</li>
<li>Analyzed customer experience reports, service metrics, and user insights to identify trends, propose process improvements, and initiate strategies aimed at enhancing overall customer satisfaction and operational efficiency.</li>
</ul>

<h3>IT Support</h3>
<div class="role-meta"><span>PT Mattel Indonesia</span><span>July 2021 — January 2022</span></div>
<ul>
<li>Performed comprehensive IT troubleshooting and maintenance for client hardware and software systems, ensuring reliable workstation performance and minimizing operational downtime.</li>
<li>Provided technical guidance and consultation to clients on IT-related matters, delivering clear solutions and practical recommendations for system usage and issue resolution.</li>
<li>Delivered daily technical support to end users, maintaining the stable operation of workstations, printers, and network-connected devices within the organizational environment.</li>
<li>Diagnosed and resolved software and application issues, while maintaining accurate, well-structured, and up-to-date technical support documentation and service records.</li>
<li>Managed IT asset inventory, maintained detailed tracking records for hardware and software resources, and coordinated procurement or technical assistance with external vendors and service providers.</li>
<li>Monitored and maintained office network infrastructure, including system connectivity, endpoint security policies, and antivirus protection to ensure stable and secure IT operations.</li>
<li>Provided first-level operational support for server maintenance, including scheduled backup processes, system monitoring, and reporting to ensure data integrity and system availability.</li>
<li>Configured and administered network connectivity for clients, including provisioning internet access, configuring MikroTik routers and wireless access points, and implementing user network access controls and basic network security policies.</li>
</ul>

<h3>Data Entry</h3>
<div class="role-meta"><span>Lembaga Riset dan Pengabdian kepada Masyarakat</span><span>April 2021 — May 2021</span></div>
<ul>
<li>Organized and categorized academic journals to support efficient editorial processing and publication workflows.</li>
<li>Ensured accurate data entry and indexing of journal records within the server-based database system.</li>
<li>Performed routine verification, monitoring, and maintenance of the journal database to ensure data integrity and system reliability.</li>
<li>Prepared and managed official documentation, including cover letters and library publication agreements, in accordance with institutional standards.</li>
<li>Reviewed and validated document metadata and required attributes to ensure completeness, consistency, and compliance with publication requirements.</li>
</ul>

<h2>Education</h2>
<div class="edu-row"><div class="name">President University</div><div class="field">Information Technology</div><div class="year">2018 — 2022</div></div>
<div class="edu-row"><div class="name">SMAS Pangudi Luhur Bernardus</div><div class="field">Natural Sciences</div><div class="year">2015 — 2018</div></div>

<h2>Skills</h2>
<div class="skills">
<span>IT Support</span><span>Networking</span><span>Data Entry</span><span>Windows</span><span>Linux</span><span>Microsoft Office</span><span>Customer Relationship Management (CRM)</span><span>Active Directory</span><span>MikroTik</span><span>Google Workspace</span>
</div>

<h2>Languages</h2>
<div class="lang-row"><b>Indonesian</b> — <span>Native or Bilingual</span></div>
<div class="lang-row"><b>English</b> — <span>Fluent</span></div>

</body>
</html>`;

    // Open print window
    const w = window.open("", "_blank");
    if (!w) {
      showToast("Pop-up blocked. Please allow pop-ups to download resume.", "warn", "bi-exclamation-triangle-fill");
      return;
    }
    w.document.open();
    w.document.write(resumeHTML);
    w.document.close();
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (e) {}
    }, 600);
  });

  /* ---------- Welcome toast after preloader ---------- */
  window.addEventListener("load", () => {
    setTimeout(() => {
      showToast("Welcome! Press the speaker icon for sound effects", "info", "bi-hand-thumbs-up-fill");
    }, 2200);
  });

  /* ---------- Section title mouse-follow glow ---------- */
  if (!isTouch && !prefersReduced) {
    $$(".section-head").forEach((head) => {
      head.addEventListener("mousemove", (e) => {
        const r = head.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        head.style.background = `radial-gradient(400px circle at ${x}% ${y}%, rgba(10,132,255,0.08), transparent 70%)`;
      });
      head.addEventListener("mouseleave", () => { head.style.background = ""; });
    });
  }

  /* ===========================================================
     UPGRADE 4 FEATURES
     =========================================================== */

  /* ---------- Theme picker popover ---------- */
  const themePicker = $("#themePicker");
  const themePickerBackdrop = $("#themePickerBackdrop");
  const accentPickerBtn = $("#accentPickerBtn");
  const ACCENT_KEY = "grev-accent";

  const accentPresets = {
    blue:   { c1: "#0a84ff", c2: "#5e5ce6" },
    purple: { c1: "#bf5af2", c2: "#5e5ce6" },
    pink:   { c1: "#ff375f", c2: "#bf5af2" },
    orange: { c1: "#ff9f0a", c2: "#ff375f" },
    green:  { c1: "#30d158", c2: "#0a84ff" },
    teal:   { c1: "#64d2ff", c2: "#5e5ce6" },
  };

  function applyAccent(name) {
    const p = accentPresets[name];
    if (!p) return;
    root.style.setProperty("--accent", p.c1);
    root.style.setProperty("--accent-2", p.c2);
    root.style.setProperty("--accent-grad", `linear-gradient(135deg, ${p.c1} 0%, ${p.c2} 100%)`);
    root.style.setProperty("--progress-grad", `linear-gradient(90deg, ${p.c1}, ${p.c2})`);
    try { localStorage.setItem(ACCENT_KEY, name); } catch (e) {}
    $$(".tp-swatch").forEach((s) => s.classList.toggle("active", s.dataset.accent === name));
  }

  // Init accent from storage
  let savedAccent = null;
  try { savedAccent = localStorage.getItem(ACCENT_KEY); } catch (e) {}
  if (savedAccent && accentPresets[savedAccent]) applyAccent(savedAccent);
  else $$(".tp-swatch").forEach((s) => s.classList.toggle("active", s.dataset.accent === "blue"));

  $$(".tp-swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
      applyAccent(sw.dataset.accent);
      if (soundOn) playClickSound();
      showToast(`Accent changed to ${sw.dataset.accent}`, "info", "bi-palette-fill");
      setTimeout(closeThemePicker, 200);
    });
  });

  accentPickerBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    const willShow = !themePicker?.classList.contains("show");
    if (willShow) openThemePicker();
    else closeThemePicker();
  });
  function openThemePicker() {
    themePicker?.classList.add("show");
    themePickerBackdrop?.classList.add("show");
    if (themePicker) themePicker.setAttribute("aria-hidden", "false");
    if (themePickerBackdrop) themePickerBackdrop.setAttribute("aria-hidden", "false");
    // Close mobile navbar menu if open
    if (navMenu?.classList.contains("show")) {
      navMenu.classList.remove("show");
      navToggle?.setAttribute("aria-expanded", "false");
    }
    lockBodyScroll();
    if (soundOn) playClickSound();
  }
  function closeThemePicker() {
    themePicker?.classList.remove("show");
    themePickerBackdrop?.classList.remove("show");
    if (themePicker) themePicker.setAttribute("aria-hidden", "true");
    if (themePickerBackdrop) themePickerBackdrop.setAttribute("aria-hidden", "true");
    unlockBodyScroll();
  }
  // Close button
  $("#tpClose")?.addEventListener("click", closeThemePicker);
  // Close on backdrop click
  themePickerBackdrop?.addEventListener("click", closeThemePicker);
  // Close on outside click (extra safety)
  document.addEventListener("click", (e) => {
    if (!themePicker?.classList.contains("show")) return;
    if (!themePicker.contains(e.target) && !accentPickerBtn?.contains(e.target) && !themePickerBackdrop?.contains(e.target)) {
      closeThemePicker();
    }
  });
  // Close on Escape — handled by unified Escape handler in main keydown listener below (do not duplicate)

  /* ---------- Command palette ---------- */
  const cmdk = $("#cmdk");
  const cmdkBackdrop = $("#cmdkBackdrop");
  const cmdkBtn = $("#cmdkBtn");
  const cmdkInput = $("#cmdkInput");
  const cmdkList = $("#cmdkList");

  const cmdkCommands = [
    { id: "home",      title: "Go to Home",       sub: "Top of the page",         icon: "bi-house-fill",         keys: ["G","H"], action: () => scrollTo("#hero") },
    { id: "about",     title: "Go to About",      sub: "Profile summary",         icon: "bi-person-fill",        keys: ["G","A"], action: () => scrollTo("#about") },
    { id: "exp",       title: "Go to Experience", sub: "Work history timeline",   icon: "bi-briefcase-fill",     keys: ["G","E"], action: () => scrollTo("#experience") },
    { id: "edu",       title: "Go to Education",  sub: "Academic background",     icon: "bi-mortarboard-fill",   keys: ["G","D"], action: () => scrollTo("#education") },
    { id: "skills",    title: "Go to Skills",     sub: "Capabilities overview",   icon: "bi-stars",              keys: ["G","S"], action: () => scrollTo("#skills") },
    { id: "langs",     title: "Go to Languages",  sub: "Spoken languages",        icon: "bi-translate",          keys: ["G","L"], action: () => scrollTo("#languages") },
    { id: "contact",   title: "Go to Contact",    sub: "Get in touch",            icon: "bi-chat-dots-fill",     keys: ["G","C"], action: () => scrollTo("#contact") },
    { id: "theme",     title: "Toggle Theme",     sub: "Light / Dark mode",       icon: "bi-moon-stars-fill",    keys: ["T"],     action: () => themeToggle?.click() },
    { id: "sound",     title: "Toggle Sound",     sub: "Click & hover effects",   icon: "bi-volume-up-fill",     keys: ["M"],     action: () => soundToggle?.click() },
    { id: "resume",    title: "Download Resume",  sub: "Print as PDF",            icon: "bi-file-earmark-pdf-fill", keys: ["R"],  action: () => dlBtn?.click() },
    { id: "top",       title: "Back to Top",      sub: "Scroll to top",           icon: "bi-arrow-up-short",     keys: ["B"],     action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { id: "konami",    title: "Trigger Konami",   sub: "Secret confetti",         icon: "bi-controller",         keys: ["&uarr;&uarr;&darr;&darr;..."], action: () => triggerKonami() },
    { id: "shortcuts", title: "Keyboard Shortcuts", sub: "Show all shortcuts",    icon: "bi-keyboard-fill",      keys: ["?"],     action: () => openShortcuts() },
  ];

  function scrollTo(sel) {
    const t = document.querySelector(sel);
    if (t) {
      const top = t.getBoundingClientRect().top + window.pageYOffset - 76;
      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
    }
  }

  let cmdkActiveIndex = 0;
  let cmdkFiltered = cmdkCommands.slice();

  function renderCmdk(filter = "") {
    cmdkFiltered = cmdkCommands.filter((c) => {
      const q = filter.toLowerCase().trim();
      if (!q) return true;
      return c.title.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q) || c.id.includes(q);
    });
    cmdkList.innerHTML = cmdkFiltered.map((c, i) => `
      <div class="cmdk-item ${i === cmdkActiveIndex ? "active" : ""}" role="option" data-i="${i}">
        <span class="cmdk-icon"><i class="bi ${c.icon}"></i></span>
        <div class="cmdk-body">
          <div class="cmdk-title">${c.title}</div>
          <div class="cmdk-sub">${c.sub}</div>
        </div>
        <div class="cmdk-keys">${c.keys.map((k) => `<kbd>${k}</kbd>`).join("")}</div>
      </div>
    `).join("");
    if (cmdkFiltered.length === 0) {
      cmdkList.innerHTML = `<div style="padding:1.5rem;text-align:center;color:var(--text-mute);font-size:0.9rem">No results found</div>`;
    }
    cmdkActiveIndex = 0;
    // Click handlers
    $$(".cmdk-item", cmdkList).forEach((el) => {
      el.addEventListener("click", () => {
        const i = parseInt(el.dataset.i, 10);
        if (cmdkFiltered[i]) {
          cmdkFiltered[i].action();
          closeCmdk();
        }
      });
      el.addEventListener("mouseenter", () => {
        const i = parseInt(el.dataset.i, 10);
        cmdkActiveIndex = i;
        updateCmdkActive();
      });
    });
  }

  function updateCmdkActive() {
    $$(".cmdk-item", cmdkList).forEach((el, i) => {
      el.classList.toggle("active", i === cmdkActiveIndex);
    });
    const active = $(".cmdk-item.active", cmdkList);
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  function openCmdk() {
    cmdk.classList.add("show");
    cmdkBackdrop.classList.add("show");
    cmdk.setAttribute("aria-hidden", "false");
    cmdkBackdrop.setAttribute("aria-hidden", "false");
    renderCmdk("");
    setTimeout(() => cmdkInput?.focus(), 80);
    lockBodyScroll();
    if (soundOn) playClickSound();
  }

  function closeCmdk() {
    cmdk.classList.remove("show");
    cmdkBackdrop.classList.remove("show");
    cmdk.setAttribute("aria-hidden", "true");
    cmdkBackdrop.setAttribute("aria-hidden", "true");
    if (cmdkInput) cmdkInput.value = "";
    unlockBodyScroll();
  }

  function toggleCmdk() {
    if (cmdk.classList.contains("show")) closeCmdk();
    else openCmdk();
  }

  cmdkBtn?.addEventListener("click", openCmdk);
  cmdkBackdrop?.addEventListener("click", closeCmdk);
  cmdkInput?.addEventListener("input", (e) => renderCmdk(e.target.value));
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      toggleCmdk();
      return;
    }
    if (e.key === "Escape") {
      // Unified Escape handler — closes ALL open popovers/modals in priority order
      if (cmdk.classList.contains("show")) { closeCmdk(); return; }
      if (shortcutsModal?.classList.contains("show")) { closeShortcuts(); return; }
      if (themePicker?.classList.contains("show")) { closeThemePicker(); return; }
      if (typingModal?.classList.contains("show")) { closeTyping(); return; }
      if (achGalleryModal?.classList.contains("show")) { closeAchGallery(); return; }
      if (snakeModal?.classList.contains("show")) { closeSnake(); return; }
      if (qrModal?.classList.contains("show")) {
        qrModal.classList.remove("show");
        qrModal.setAttribute("aria-hidden", "true");
        unlockBodyScroll();
        return;
      }
      if (aiChat?.classList.contains("show")) { closeAiChat(); return; }
      if (matrixRunning) { stopMatrixRain(); return; }
      if (quickDock?.classList.contains("open")) {
        quickDock.classList.remove("open");
        dockFab?.classList.remove("open");
        dockFab?.setAttribute("aria-expanded", "false");
        return;
      }
      if (navMenu?.classList.contains("show")) {
        navMenu.classList.remove("show");
        navToggle?.setAttribute("aria-expanded", "false");
        return;
      }
    }
    if (cmdk.classList.contains("show")) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        cmdkActiveIndex = Math.min(cmdkFiltered.length - 1, cmdkActiveIndex + 1);
        updateCmdkActive();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        cmdkActiveIndex = Math.max(0, cmdkActiveIndex - 1);
        updateCmdkActive();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const c = cmdkFiltered[cmdkActiveIndex];
        if (c) { c.action(); closeCmdk(); }
      }
    }
  });

  /* ---------- Keyboard shortcuts modal ---------- */
  const shortcutsFab = $("#shortcutsFab");
  const shortcutsModal = $("#shortcutsModal");
  const shortcutsClose = $("#shortcutsClose");

  function openShortcuts() {
    shortcutsModal?.classList.add("show");
    shortcutsModal?.setAttribute("aria-hidden", "false");
    lockBodyScroll();
    if (soundOn) playClickSound();
  }
  function closeShortcuts() {
    shortcutsModal?.classList.remove("show");
    shortcutsModal?.setAttribute("aria-hidden", "true");
    unlockBodyScroll();
  }
  shortcutsFab?.addEventListener("click", openShortcuts);
  shortcutsClose?.addEventListener("click", closeShortcuts);
  shortcutsModal?.addEventListener("click", (e) => {
    if (e.target === shortcutsModal) closeShortcuts();
  });

  /* ---------- Per-section share buttons ---------- */
  $$("main section[id]").forEach((sec) => {
    const head = $(".section-head", sec);
    if (!head) return;
    const share = document.createElement("button");
    share.className = "section-share";
    share.type = "button";
    share.title = "Share this section";
    share.setAttribute("aria-label", `Share ${sec.id} section`);
    share.innerHTML = '<i class="bi bi-share-fill"></i>';
    share.addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}#${sec.id}`;
      const shareData = {
        title: `Grevaldo — ${$(".section-title", sec)?.textContent || sec.id}`,
        text: $(".section-title", sec)?.textContent || "Portfolio section",
        url: url,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          showToast("Section shared", "success", "bi-share-fill");
        } else {
          await navigator.clipboard.writeText(url);
          showToast("Section link copied to clipboard", "success", "bi-link-45deg");
          if (soundOn) playSuccessSound();
        }
      } catch (err) {
        try {
          await navigator.clipboard.writeText(url);
          showToast("Section link copied to clipboard", "success", "bi-link-45deg");
        } catch (e2) {
          showToast("Unable to share", "warn", "bi-exclamation-triangle-fill");
        }
      }
    });
    head.appendChild(share);
  });

  /* ---------- Idle detection ---------- */
  const idleIndicator = $("#idleIndicator");
  let idleTimer = null;
  const IDLE_MS = 60000; // 60 seconds
  function resetIdle() {
    if (idleIndicator?.classList.contains("show")) {
      idleIndicator.classList.remove("show");
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleIndicator?.classList.add("show");
    }, IDLE_MS);
  }
  ["mousemove", "keydown", "touchstart", "click", "scroll"].forEach((ev) => {
    window.addEventListener(ev, resetIdle, { passive: true });
  });
  resetIdle();
  idleIndicator?.addEventListener("click", () => {
    idleIndicator.classList.remove("show");
    resetIdle();
  });

  /* ---------- Page transition on first load ---------- */
  const pageTransition = $("#pageTransition");
  window.addEventListener("load", () => {
    setTimeout(() => {
      pageTransition?.classList.add("show");
      setTimeout(() => {
        pageTransition?.classList.add("exit");
        setTimeout(() => {
          pageTransition?.classList.remove("show", "exit");
        }, 700);
      }, 100);
    }, 200);
  });

  /* ---------- Global keyboard shortcuts (single-char triggers) ---------- */
  let gKeyTimer = null;
  let gKeyBuffer = "";
  document.addEventListener("keydown", (e) => {
    // Skip if user is typing in an input
    const tag = (e.target.tagName || "").toLowerCase();
    const isEditable = tag === "input" || tag === "textarea" || e.target.isContentEditable;
    if (isEditable) return;
    // Skip if any modifier (including shift — shift+key combos like Shift+A are handled by a separate listener)
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    // Skip if command palette or shortcuts modal is open
    if (cmdk.classList.contains("show") || shortcutsModal?.classList.contains("show")) return;

    const key = e.key.toLowerCase();

    // Two-key sequence: G + letter
    if (gKeyBuffer === "g") {
      const map = { h: "#hero", a: "#about", e: "#experience", d: "#education", s: "#skills", l: "#languages", c: "#contact" };
      if (map[key]) {
        e.preventDefault();
        scrollTo(map[key]);
        if (soundOn) playClickSound();
      }
      gKeyBuffer = "";
      clearTimeout(gKeyTimer);
      return;
    }

    if (key === "g") {
      // If gKeyBuffer already set (user pressed G twice quickly), treat as single G = achievement gallery
      if (gKeyBuffer === "g" && !snakeModal?.classList.contains("show")) {
        gKeyBuffer = "";
        clearTimeout(gKeyTimer);
        e.preventDefault();
        openAchGallery();
        return;
      }
      // First G press — set buffer, wait 800ms for next letter
      gKeyBuffer = "g";
      clearTimeout(gKeyTimer);
      gKeyTimer = setTimeout(() => {
        // If timeout fires (no second key), open achievement gallery
        if (gKeyBuffer === "g" && !snakeModal?.classList.contains("show")) {
          openAchGallery();
        }
        gKeyBuffer = "";
      }, 800);
      return;
    }

    // Single-key actions (T = cycle theme, others remapped per user request)
    if (key === "t") { e.preventDefault(); themeToggle?.click(); }
    else if (key === "m") { e.preventDefault(); soundToggle?.click(); }
    else if (key === "b") { e.preventDefault(); backToTopBtn?.click(); }
    else if (key === "r") { e.preventDefault(); dlBtn?.click(); }
    else if (key === "/") { e.preventDefault(); openCmdk(); }
    else if (key === "?") { e.preventDefault(); openShortcuts(); }
    // F = FPS counter toggle
    else if (key === "f" && !snakeModal?.classList.contains("show")) { e.preventDefault(); toggleFps(); }
    // A = toggle auto theme (only if not in G+letter nav sequence)
    else if (key === "a" && gKeyBuffer !== "g" && !snakeModal?.classList.contains("show")) {
      e.preventDefault();
      autoThemeEnabled = !autoThemeEnabled;
      try { localStorage.setItem(AUTO_THEME_KEY, String(autoThemeEnabled)); } catch (e) {}
      showToast(autoThemeEnabled ? "Auto theme enabled — will follow time of day" : "Auto theme disabled", "info", "bi-clock-history");
      if (autoThemeEnabled) checkAutoTheme();
      if (soundOn) playClickSound();
    }
    // O = view achievements summary toast
    else if (key === "o" && !achGalleryModal?.classList.contains("show")) {
      e.preventDefault();
      const unlocked = Object.keys(unlockedAchievements).length;
      const total = achievementDefs.length;
      showToast(`Achievements: ${unlocked}/${total} unlocked — press G to open gallery`, "info", "bi-trophy-fill");
    }
    // C = Show contact QR (replaces old Q+R)
    else if (key === "c" && gKeyBuffer !== "g" && !snakeModal?.classList.contains("show")) {
      e.preventDefault();
      qrBtn?.click();
    }
    // I = Toggle AI assistant (single key, easier than Shift+A)
    else if (key === "i") {
      e.preventDefault();
      aiFab?.click();
    }
    // N = Focus mode (hide all floating elements for distraction-free reading)
    else if (key === "n") {
      e.preventDefault();
      toggleFocusMode();
    }
    // U = Copy page URL to clipboard
    else if (key === "u") {
      e.preventDefault();
      copyPageUrl();
    }
    // Z = Toggle custom cursor on/off
    else if (key === "z") {
      e.preventDefault();
      toggleCursor();
    }
    // J = Next section (vim-style)
    else if (key === "j" && !snakeModal?.classList.contains("show")) {
      e.preventDefault();
      scrollToNextSection();
    }
    // K = Previous section (vim-style)
    else if (key === "k" && !snakeModal?.classList.contains("show") && !cmdk.classList.contains("show")) {
      e.preventDefault();
      scrollToPrevSection();
    }
    // W = accent picker (skip when Snake open to avoid WASD conflict)
    else if (key === "w" && !snakeModal?.classList.contains("show")) { e.preventDefault(); accentPickerBtn?.click(); }
    // Q = Quick Contact dock (direct, no more Q+R sequence)
    else if (key === "q" && !snakeModal?.classList.contains("show")) {
      e.preventDefault();
      dockFab?.click();
    }
  });

  /* ---------- New utility functions for shortcuts ---------- */

  // Focus mode: hide all floating UI for clean reading
  let focusModeEnabled = false;
  function toggleFocusMode() {
    focusModeEnabled = !focusModeEnabled;
    document.body.classList.toggle("focus-mode", focusModeEnabled);
    showToast(focusModeEnabled ? "Focus mode on — UI hidden. Press N again to restore." : "Focus mode off — all UI restored", "info", focusModeEnabled ? "bi-eye-slash-fill" : "bi-eye-fill");
    if (soundOn) playClickSound();
  }

  // Toggle custom cursor
  let cursorEnabled = true;
  function toggleCursor() {
    cursorEnabled = !cursorEnabled;
    document.body.classList.toggle("cursor-disabled", !cursorEnabled);
    showToast(cursorEnabled ? "Custom cursor enabled" : "Custom cursor disabled — using system cursor", "info", cursorEnabled ? "bi-arrow-pointer" : "bi-cursor-text");
    if (soundOn) playClickSound();
  }

  // Copy page URL
  async function copyPageUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Page URL copied to clipboard", "success", "bi-link-45deg");
      if (soundOn) playSuccessSound();
    } catch (e) {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); showToast("Page URL copied", "success", "bi-link-45deg"); } catch (e2) { showToast("Failed to copy URL", "warn", "bi-exclamation-triangle-fill"); }
      ta.remove();
    }
  }

  // Scroll to next section
  function scrollToNextSection() {
    const secs = $$("main section[id]");
    const scrollY = window.pageYOffset + window.innerHeight * 0.4;
    for (let i = 0; i < secs.length; i++) {
      if (secs[i].offsetTop > scrollY) {
        scrollTo("#" + secs[i].id);
        if (soundOn) playClickSound();
        return;
      }
    }
    // Already at last section
    showToast("Already at the last section", "info", "bi-arrow-down-circle");
  }

  // Scroll to previous section
  function scrollToPrevSection() {
    const secs = $$("main section[id]");
    const scrollY = window.pageYOffset + window.innerHeight * 0.4;
    for (let i = secs.length - 1; i >= 0; i--) {
      if (secs[i].offsetTop + secs[i].offsetHeight < scrollY) {
        scrollTo("#" + secs[i].id);
        if (soundOn) playClickSound();
        return;
      }
    }
    // Already at first section
    if (window.pageYOffset > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      showToast("Already at the first section", "info", "bi-arrow-up-circle");
    }
  }

  /* ---------- PWA registration ---------- */
  if ("serviceWorker" in navigator) {
    // Inline minimal service worker for offline support (registered via blob URL)
    const swCode = `
      const CACHE = "grev-portfolio-v4";
      self.addEventListener("install", (e) => { self.skipWaiting(); });
      self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
      self.addEventListener("fetch", (e) => {
        if (e.request.method !== "GET") return;
        e.respondWith(
          caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(e.request);
            const network = fetch(e.request).then((res) => {
              if (res && res.status === 200 && e.request.url.startsWith("http")) {
                cache.put(e.request, res.clone());
              }
              return res;
            }).catch(() => cached);
            return cached || network;
          })
        );
      });
    `;
    try {
      const blob = new Blob([swCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      navigator.serviceWorker.register(url).then(() => {
        // console.log("PWA service worker registered");
      }).catch(() => {});
    } catch (e) {}
  }

  /* ---------- Install prompt capture (PWA) ---------- */
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showToast("Install this portfolio as an app!", "info", "bi-box-arrow-down");
  });
  window.addEventListener("appinstalled", () => {
    showToast("Portfolio installed as an app", "success", "bi-check-circle-fill");
    deferredPrompt = null;
  });

  /* ---------- Welcome tips rotation ---------- */
  const welcomeTips = [
    "Tip: Press Ctrl+K to open command palette",
    "Tip: Press ? to see all keyboard shortcuts",
    "Tip: Click the palette icon to change accent color",
    "Tip: Try the Konami code for a surprise",
    "Tip: Click phone/email to copy to clipboard",
    "Tip: Hover section titles to share them",
    "Tip: Try the AI assistant (bottom-right robot icon)",
    "Tip: Press V to use voice navigation",
    "Tip: Press P to play ambient music",
    "Tip: Click 'Save Contact (QR)' to scan vCard",
  ];
  let tipIndex = 0;
  setInterval(() => {
    if (document.hidden) return;
    tipIndex = (tipIndex + 1) % welcomeTips.length;
    showToast(welcomeTips[tipIndex], "info", "bi-lightbulb-fill");
  }, 35000);

  /* ===========================================================
     UPGRADE 5 FEATURES — AI, Voice, QR, Music
     =========================================================== */

  /* ---------- AI Chat Assistant (rule-based) ---------- */
  const aiFab = $("#aiFab");
  const aiChat = $("#aiChat");
  const aiClose = $("#aiClose");
  const aiInput = $("#aiInput");
  const aiSend = $("#aiSend");
  const aiChatBody = $("#aiChatBody");
  const aiSuggestions = $("#aiSuggestions");

  const aiKnowledge = [
    {
      keys: ["about", "who", "grevaldo", "tell me", "introduce", "yourself", "summary", "profile"],
      answer: "Grevaldo Imanuel Dharmadi is an IT graduate with a strong dedication to continuous learning and a keen curiosity about technological innovation. He is experienced in IT support and customer service roles, with hands-on expertise in developing desktop and Android applications. He demonstrates proficiency in Windows and Linux systems, along with practical skills in network configuration, particularly using MikroTik technologies. He currently works as IT Support at Shopee in Bekasi, Indonesia.",
      action: () => scrollTo("#about"),
    },
    {
      keys: ["experience", "work", "job", "career", "role", "shopee", "concentrix", "mattel", "data entry", "customer"],
      answer: "Grevaldo has 5 work experiences:\n\n1. IT Support at PT Shopee International Indonesia (Feb 2026 — Present) — day-to-day IT technical support, asset lifecycle, network infrastructure, first-level server support.\n\n2. Advisor 1 at PT Concentrix Services Indonesia (Oct 2025 — Jan 2026) — email/messaging customer engagement, KPI achievement, cross-functional collaboration.\n\n3. Customer Experience Officer at PT Shopee International Indonesia (Jun 2024 — Oct 2025) — end-to-end customer service, escalations, voice-of-customer reporting.\n\n4. IT Support at PT Mattel Indonesia (Jul 2021 — Jan 2022) — troubleshooting, MikroTik router/AP configuration, server backup, network access controls.\n\n5. Data Entry at Lembaga Riset dan Pengabdian kepada Masyarakat (Apr 2021 — May 2021) — academic journal indexing, document metadata validation.\n\nWould you like me to scroll to the Experience section?",
      action: () => scrollTo("#experience"),
    },
    {
      keys: ["skill", "good at", "expert", "capabilit", "tech stack", "tools"],
      answer: "Grevaldo's skills include: IT Support, Networking, Data Entry, Windows, Linux, Microsoft Office, Customer Relationship Management (CRM), Active Directory, MikroTik, and Google Workspace. He also has hands-on expertise in developing desktop and Android applications, MikroTik router and wireless access point configuration, network access controls, and endpoint security/antivirus solutions.",
      action: () => scrollTo("#skills"),
    },
    {
      keys: ["education", "school", "university", "college", "study", "academic", "degree"],
      answer: "Grevaldo's education:\n\n• President University — Information Technology (2018 — 2022)\n\n• SMAS Pangudi Luhur Bernardus — Natural Sciences (2015 — 2018)",
      action: () => scrollTo("#education"),
    },
    {
      keys: ["language", "speak", "english", "indonesian", "fluent", "native"],
      answer: "Grevaldo speaks two languages:\n\n• Indonesian — Native or Bilingual\n\n• English — Fluent",
      action: () => scrollTo("#languages"),
    },
    {
      keys: ["contact", "email", "phone", "reach", "call", "how", "location", "where", "address"],
      answer: "You can reach Grevaldo via:\n\n• Location: Bekasi, Indonesia\n\n• Phone: +6281311893917\n\n• Email: grevaldom@gmail.com\n\nYou can also click the 'Save Contact (QR)' button in the Contact section to scan a vCard QR code with your phone camera and save his contact instantly.",
      action: () => scrollTo("#contact"),
    },
    {
      keys: ["mikrotik", "router", "network", "wireless", "access point", "active directory", "google workspace", "domain"],
      answer: "Grevaldo has practical MikroTik networking skills from his time at PT Mattel Indonesia. He configured MikroTik routers and wireless access points, provisioned internet access, and implemented user network access controls and basic network security policies. He is also proficient in Active Directory and Google Workspace.",
    },
    {
      keys: ["resume", "cv", "download", "pdf", "print"],
      answer: "You can download Grevaldo's resume as a PDF! Just click the 'Download Resume' button in the hero section, or press R on your keyboard. It will open your browser's print dialog where you can save as PDF.",
      action: () => dlBtn?.click(),
    },
    {
      keys: ["theme", "dark", "light", "color", "accent", "palette", "oled", "pitch black", "battery"],
      answer: "You can cycle through THREE themes using the theme button in the navbar (or press T): Light (bright daytime), Dark (soft black), and OLED (true pitch black — perfect for OLED/AMOLED screens, saves battery). To change the accent color, click the palette icon next to it — there are 6 accent presets: iOS Blue, Purple Haze, Hot Pink, Sunset, Mint, and Teal. Your preference is saved automatically.\n\nFor voice navigation, say 'OLED', 'dark', or 'light' to switch directly.",
    },
    {
      keys: ["hello", "hi", "hey", "halo", "greeting", "morning", "evening", "afternoon"],
      answer: "Hello! 👋 I'm Grevaldo's portfolio assistant. I can tell you about his experience, skills, education, languages, or how to contact him. Just type your question or pick one of the suggestions below.",
    },
    {
      keys: ["thank", "thanks", "thx", "appreciate", "great", "awesome", "cool", "nice"],
      answer: "You're welcome! 😊 Feel free to explore the portfolio — there are lots of interactive features to discover. Press Ctrl+K for the command palette, or V for voice navigation.",
    },
    {
      keys: ["help", "what can you do", "commands", "feature"],
      answer: "I can help you with:\n• Information about Grevaldo (try 'about', 'experience', 'skills', 'education', 'contact')\n• Navigation (I can scroll to any section)\n• Resume download ('resume')\n• Theme info ('theme')\n• Specific tech like MikroTik\n\nJust type naturally — I'll do my best to help!",
    },
    {
      keys: ["bye", "goodbye", "exit", "close", "quit"],
      answer: "Goodbye! 👋 Thanks for visiting Grevaldo's portfolio. Click the X button to close this chat, or press Escape.",
      action: () => closeAiChat(),
    },
  ];

  function aiFindAnswer(query) {
    const q = query.toLowerCase().trim();
    if (!q) return null;
    let bestMatch = null;
    let bestScore = 0;
    aiKnowledge.forEach((entry) => {
      let score = 0;
      entry.keys.forEach((k) => {
        if (q.includes(k)) score += k.length;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    });
    return bestMatch;
  }

  function aiAddMessage(text, isUser = false) {
    const msg = document.createElement("div");
    msg.className = "ai-msg " + (isUser ? "ai-user" : "ai-bot");
    msg.innerHTML = `
      <div class="ai-msg-avatar"><i class="bi ${isUser ? "bi-person-fill" : "bi-robot"}"></i></div>
      <div class="ai-msg-bubble"></div>
    `;
    msg.querySelector(".ai-msg-bubble").textContent = text;
    aiChatBody?.appendChild(msg);
    aiChatBody?.scrollTo({ top: aiChatBody.scrollHeight, behavior: "smooth" });
  }

  function aiAddTyping() {
    const typing = document.createElement("div");
    typing.className = "ai-msg ai-bot";
    typing.id = "aiTypingIndicator";
    typing.innerHTML = `
      <div class="ai-msg-avatar"><i class="bi bi-robot"></i></div>
      <div class="ai-typing"><span></span><span></span><span></span></div>
    `;
    aiChatBody?.appendChild(typing);
    aiChatBody?.scrollTo({ top: aiChatBody.scrollHeight, behavior: "smooth" });
  }

  function aiRemoveTyping() {
    $("#aiTypingIndicator")?.remove();
  }

  function aiRespond(query) {
    aiAddMessage(query, true);
    if (soundOn) playClickSound();
    aiAddTyping();
    setTimeout(() => {
      aiRemoveTyping();
      const match = aiFindAnswer(query);
      if (match) {
        // Split by newlines for better display
        const lines = match.answer.split("\n");
        const bubble = document.createElement("div");
        bubble.className = "ai-msg ai-bot";
        bubble.innerHTML = `
          <div class="ai-msg-avatar"><i class="bi bi-robot"></i></div>
          <div class="ai-msg-bubble"></div>
        `;
        const bubbleEl = bubble.querySelector(".ai-msg-bubble");
        bubbleEl.textContent = match.answer;
        aiChatBody?.appendChild(bubble);
        aiChatBody?.scrollTo({ top: aiChatBody.scrollHeight, behavior: "smooth" });
        if (soundOn) playTone(660, 0.1, "sine", 0.04);
        // Optional action
        if (match.action && /scroll|go to|take me|show me/i.test(query)) {
          setTimeout(() => match.action(), 800);
        }
      } else {
        aiAddMessage("I'm not sure about that yet, but I can help with: about, experience, skills, education, languages, contact, resume, theme, or MikroTik. Try asking in a different way!", false);
      }
    }, 700 + Math.random() * 600);
  }

  function openAiChat() {
    aiChat?.classList.add("show");
    aiChat?.setAttribute("aria-hidden", "false");
    aiFab?.classList.add("open");
    setTimeout(() => aiInput?.focus(), 300);
    lockBodyScroll();
    if (soundOn) playClickSound();
  }
  function closeAiChat() {
    aiChat?.classList.remove("show");
    aiChat?.setAttribute("aria-hidden", "true");
    aiFab?.classList.remove("open");
    unlockBodyScroll();
  }
  aiFab?.addEventListener("click", () => {
    if (aiChat?.classList.contains("show")) closeAiChat();
    else openAiChat();
  });
  aiClose?.addEventListener("click", closeAiChat);
  aiSend?.addEventListener("click", () => {
    const v = aiInput?.value?.trim();
    if (v) { aiRespond(v); if (aiInput) aiInput.value = ""; }
  });
  aiInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      aiSend?.click();
    }
  });
  $$(".ai-sugg", aiSuggestions).forEach((btn) => {
    btn.addEventListener("click", () => {
      aiRespond(btn.dataset.q);
    });
  });

  /* ---------- Voice Navigation (Web Speech API) ---------- */
  const voiceFab = $("#voiceFab");
  const voiceStatus = $("#voiceStatus");
  const voiceStatusText = $("#voiceStatusText");
  let recognition = null;
  let isListening = false;

  function initVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      voiceFab?.addEventListener("click", () => {
        showToast("Voice navigation not supported in this browser. Try Chrome or Edge.", "warn", "bi-exclamation-triangle-fill");
      });
      return;
    }
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isListening = true;
      voiceFab?.classList.add("listening");
      voiceStatus?.classList.add("show");
      if (voiceStatusText) voiceStatusText.textContent = "Listening... say a command";
      showToast("Voice navigation active — try: 'go to experience', 'dark mode', 'top'", "info", "bi-mic-fill");
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase().trim();
      if (voiceStatusText) voiceStatusText.textContent = `"${transcript}"`;
      handleVoiceCommand(transcript);
    };
    recognition.onerror = (e) => {
      showToast("Voice error: " + e.error, "warn", "bi-exclamation-triangle-fill");
    };
    recognition.onend = () => {
      isListening = false;
      voiceFab?.classList.remove("listening");
      setTimeout(() => voiceStatus?.classList.remove("show"), 1500);
    };
  }

  function handleVoiceCommand(text) {
    const map = [
      { keys: ["home", "top", "start", "hero"], action: () => scrollTo("#hero"), label: "Going to Home" },
      { keys: ["about", "profile", "who"], action: () => scrollTo("#about"), label: "Going to About" },
      { keys: ["experience", "work", "career", "job"], action: () => scrollTo("#experience"), label: "Going to Experience" },
      { keys: ["education", "school", "study", "university"], action: () => scrollTo("#education"), label: "Going to Education" },
      { keys: ["skill", "capability"], action: () => scrollTo("#skills"), label: "Going to Skills" },
      { keys: ["language", "speak"], action: () => scrollTo("#languages"), label: "Going to Languages" },
      { keys: ["contact", "email", "phone", "reach"], action: () => scrollTo("#contact"), label: "Going to Contact" },
      { keys: ["oled", "pitch black", "true black", "battery"], action: () => {
        const cur = root.getAttribute("data-theme");
        if (cur !== "oled") {
          // Cycle until we reach OLED
          let tries = 0;
          const cycleToOled = () => {
            const c = root.getAttribute("data-theme");
            if (c === "oled") return;
            themeToggle?.click();
            tries++;
            if (tries < 4) setTimeout(cycleToOled, 250);
          };
          applyTheme("oled");
          if (soundOn) playClickSound();
          showToast("Theme: OLED", "info", "bi-circle-half");
        }
      }, label: "Switching to OLED pitch black" },
      { keys: ["dark", "night"], action: () => { if (root.getAttribute("data-theme") !== "dark") { applyTheme("dark"); showToast("Theme: Dark", "info", "bi-moon-stars-fill"); if (soundOn) playClickSound(); } }, label: "Switching to dark mode" },
      { keys: ["light", "day"], action: () => { if (root.getAttribute("data-theme") !== "light") { applyTheme("light"); showToast("Theme: Light", "info", "bi-sun-fill"); if (soundOn) playClickSound(); } }, label: "Switching to light mode" },
      { keys: ["theme", "toggle"], action: () => themeToggle?.click(), label: "Cycling theme" },
      { keys: ["sound", "mute", "unmute"], action: () => soundToggle?.click(), label: "Toggling sound" },
      { keys: ["resume", "cv", "download"], action: () => dlBtn?.click(), label: "Downloading resume" },
      { keys: ["back", "up", "top of page"], action: () => window.scrollTo({ top: 0, behavior: "smooth" }), label: "Going back to top" },
      { keys: ["konami", "secret", "party"], action: () => triggerKonami(), label: "Triggering Konami" },
      { keys: ["help", "command", "shortcut"], action: () => openShortcuts(), label: "Opening shortcuts" },
      { keys: ["close", "stop", "exit"], action: () => { recognition?.stop(); }, label: "Stopping" },
    ];
    for (const cmd of map) {
      for (const k of cmd.keys) {
        if (text.includes(k)) {
          showToast(cmd.label, "info", "bi-mic-fill");
          if (soundOn) playClickSound();
          cmd.action();
          return;
        }
      }
    }
    showToast(`Command not recognized: "${text}"`, "warn", "bi-question-circle-fill");
  }

  voiceFab?.addEventListener("click", () => {
    if (!recognition) initVoice();
    if (!recognition) return;
    if (isListening) recognition.stop();
    else {
      try { recognition.start(); } catch (e) { showToast("Could not start voice. Try again.", "warn", "bi-exclamation-triangle-fill"); }
    }
  });

  /* ---------- QR VCard Modal ---------- */
  const qrModal = $("#qrModal");
  const qrBtn = $("#qrBtn");
  const qrClose = $("#qrClose");
  const qrCanvas = $("#qrCanvas");
  const qrVcf = $("#qrVcf");
  const qrCopy = $("#qrCopy");

  const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Grevaldo Imanuel Dharmadi
N:Dharmadi;Grevaldo;Imanuel;;
ORG:Shopee
TITLE:IT Support
TEL;TYPE=CELL:+6281311893917
EMAIL:grevaldom@gmail.com
ADR;TYPE=WORK:;;Bekasi;;;Indonesia
URL:https://grevaldo-portfolio.example.com/
NOTE:IT graduate with expertise in IT support, Windows/Linux systems, and MikroTik networking.
END:VCARD`;

  // Minimal QR Code generator (numeric/alphanumeric/byte mode, level L)
  // We'll use a lightweight inline QR algorithm via Google Chart API fallback
  // For offline use, we generate a simple SVG-based QR using a small embedded algorithm.
  // To keep things robust, we use the api.qrserver.com public API (works online).

  function generateQR(text, size = 220) {
    qrCanvas.innerHTML = "";
    qrCanvas.classList.add("empty");
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=0a84ff&bgcolor=ffffff&margin=8`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.alt = "Grevaldo vCard QR Code";
    img.onload = () => {
      qrCanvas.classList.remove("empty");
      qrCanvas.appendChild(img);
    };
    img.onerror = () => {
      // Fallback: text representation
      qrCanvas.classList.remove("empty");
      const pre = document.createElement("pre");
      pre.style.cssText = "font-size:9px;line-height:1.1;color:#000;white-space:pre-wrap;max-width:200px;word-break:break-all;";
      pre.textContent = text;
      qrCanvas.appendChild(pre);
    };
    img.src = url;
  }

  qrBtn?.addEventListener("click", () => {
    qrModal?.classList.add("show");
    qrModal?.setAttribute("aria-hidden", "false");
    generateQR(vcardData);
    lockBodyScroll();
    if (soundOn) playClickSound();
  });
  qrClose?.addEventListener("click", () => {
    qrModal?.classList.remove("show");
    qrModal?.setAttribute("aria-hidden", "true");
    unlockBodyScroll();
  });
  qrModal?.addEventListener("click", (e) => {
    if (e.target === qrModal) {
      qrModal.classList.remove("show");
      qrModal.setAttribute("aria-hidden", "true");
      unlockBodyScroll();
    }
  });
  qrVcf?.addEventListener("click", () => {
    const blob = new Blob([vcardData], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grevaldo-imanuel-dharmadi.vcf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("vCard downloaded", "success", "bi-check-circle-fill");
    if (soundOn) playSuccessSound();
  });
  qrCopy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(vcardData);
      showToast("vCard copied to clipboard", "success", "bi-clipboard-check-fill");
      if (soundOn) playSuccessSound();
    } catch (e) {
      showToast("Failed to copy vCard", "warn", "bi-exclamation-triangle-fill");
    }
  });

  /* ---------- Ambient Music Generator (Web Audio) ---------- */
  const musicFab = $("#musicFab");
  let musicPlaying = false;
  let musicNodes = [];
  let musicGainNode = null;
  let musicInterval = null;

  function startMusic() {
    if (!audioCtx) ensureAudio();
    if (!audioCtx) return;
    musicGainNode = audioCtx.createGain();
    musicGainNode.gain.value = 0.06;
    musicGainNode.connect(audioCtx.destination);

    // Pad chord (Cmaj7)
    const chordFreqs = [261.63, 329.63, 392.0, 493.88]; // C4 E4 G4 B4
    chordFreqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.25;
      // LFO for slow tremolo
      lfo.frequency.value = 0.15 + i * 0.05;
      lfoGain.gain.value = 0.1;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(musicGainNode);
      osc.start();
      lfo.start();
      musicNodes.push(osc, lfo);
    });

    // Random bell melody every 4 seconds
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5 D5 E5 G5 A5
    musicInterval = setInterval(() => {
      if (!musicPlaying || !audioCtx) return;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2);
      osc.connect(gain);
      gain.connect(musicGainNode);
      osc.start();
      osc.stop(audioCtx.currentTime + 2);
    }, 2200);

    musicPlaying = true;
    musicFab?.classList.add("playing");
    showToast("Ambient music started — press again to stop", "info", "bi-music-note-beamed");
  }

  function stopMusic() {
    musicNodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    musicNodes = [];
    if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
    if (musicGainNode) { try { musicGainNode.disconnect(); } catch (e) {} musicGainNode = null; }
    musicPlaying = false;
    musicFab?.classList.remove("playing");
    showToast("Ambient music stopped", "info", "bi-volume-mute-fill");
  }

  musicFab?.addEventListener("click", () => {
    if (musicPlaying) stopMusic();
    else startMusic();
  });

  /* ---------- Add shortcuts V, P to global keyboard handler ---------- */
  // Hook into the existing keyboard handler by checking if aiChat and musicFab exist
  // (Already handled in the global keydown — extending here via a separate listener for clarity)
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    const isEditable = tag === "input" || tag === "textarea" || e.target.isContentEditable;
    if (isEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    if (cmdk.classList.contains("show") || shortcutsModal?.classList.contains("show")) return;
    const key = e.key.toLowerCase();
    if (key === "v") {
      e.preventDefault();
      voiceFab?.click();
    } else if (key === "p") {
      e.preventDefault();
      musicFab?.click();
    }
    // Note: 'A' key is now reserved for "toggle auto theme" (handled in main keydown handler above).
    // AI assistant is toggled via 'I' key (single key) or Shift+A (handled by separate listener below).
  });

  // Add AI chat open shortcut: Shift + A
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    const isEditable = tag === "input" || tag === "textarea" || e.target.isContentEditable;
    if (isEditable) return;
    if (e.ctrlKey || e.metaKey) return;
    if (cmdk.classList.contains("show") || shortcutsModal?.classList.contains("show")) return;
    if (e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      aiFab?.click();
    }
    // Note: Escape for AI chat & QR modal now handled by unified Escape handler in main keydown listener above.
  });

  /* ---------- Add AI command to command palette ---------- */
  // Append AI-related command
  cmdkCommands.push(
    { id: "ai", title: "Open AI Assistant", sub: "Chat with portfolio bot", icon: "bi-robot", keys: ["I"], action: () => openAiChat() },
    { id: "voice", title: "Start Voice Nav", sub: "Speak commands via microphone", icon: "bi-mic-fill", keys: ["V"], action: () => voiceFab?.click() },
    { id: "music", title: "Toggle Ambient Music", sub: "Lo-fi pad + bells", icon: "bi-music-note-list", keys: ["P"], action: () => musicFab?.click() },
    { id: "qr", title: "Show Contact QR", sub: "Scan vCard with phone camera to save contact", icon: "bi-qr-code", keys: ["C"], action: () => qrBtn?.click() }
  );

  /* ---------- Add AI welcome nudge after delay ---------- */
  setTimeout(() => {
    if (!aiChat?.classList.contains("show") && !aiFab?.classList.contains("dismissed")) {
      showToast("New! Try the AI assistant (bottom-right) or press V for voice nav", "info", "bi-robot");
    }
  }, 12000);

  /* ===========================================================
     UPGRADE 6 FEATURES — Snake, Achievements, FPS, Net, Battery
     =========================================================== */

  /* ---------- Achievement System ---------- */
  const achievementPopup = $("#achievementPopup");
  const achTitle = $("#achTitle");
  const achDesc = $("#achDesc");
  const achIcon = $("#achIcon");
  const ACH_KEY = "grev-achievements";

  const achievementDefs = [
    { id: "first_visit", title: "First Visit", desc: "You opened the portfolio", icon: "bi-door-open-fill" },
    { id: "scrolled_half", title: "Halfway Explorer", desc: "Scrolled 50% of the page", icon: "bi-arrow-down-circle-fill" },
    { id: "scrolled_full", title: "Completionist", desc: "Reached the bottom of the page", icon: "bi-flag-fill" },
    { id: "theme_switch", title: "Shape Shifter", desc: "Toggled light/dark theme", icon: "bi-moon-stars-fill" },
    { id: "sound_on", title: "Sound Engineer", desc: "Enabled sound effects", icon: "bi-volume-up-fill" },
    { id: "ai_chat", title: "Conversationalist", desc: "Used the AI assistant", icon: "bi-robot" },
    { id: "voice_nav", title: "Voice Commander", desc: "Used voice navigation", icon: "bi-mic-fill" },
    { id: "snake_play", title: "Game On", desc: "Started the Snake game", icon: "bi-controller" },
    { id: "snake_score10", title: "Snake Charmer", desc: "Scored 10+ in Snake", icon: "bi-trophy-fill" },
    { id: "konami", title: "Cheat Code Master", desc: "Triggered the Konami code", icon: "bi-stars" },
    { id: "bookmark", title: "Bookworm", desc: "Bookmarked a section", icon: "bi-bookmarks-fill" },
    { id: "resume_download", title: "Resume Hunter", desc: "Downloaded the resume PDF", icon: "bi-file-earmark-pdf-fill" },
    { id: "qr_view", title: "Contact Saver", desc: "Viewed the contact QR code", icon: "bi-qr-code" },
    { id: "long_visit", title: "Loyal Visitor", desc: "Stayed for 2+ minutes", icon: "bi-clock-history" },
    { id: "all_sections", title: "Section Voyager", desc: "Visited all 7 sections", icon: "bi-compass-fill" },
    { id: "cmdk_use", title: "Power User", desc: "Used the command palette", icon: "bi-command" },
    { id: "music_listen", title: "Music Lover", desc: "Listened to ambient music", icon: "bi-music-note-beamed" },
    { id: "accent_change", title: "Style Designer", desc: "Changed the accent color", icon: "bi-palette-fill" },
    { id: "oled_mode", title: "Battery Saver", desc: "Switched to OLED pitch black mode", icon: "bi-circle-half" },
  ];

  let unlockedAchievements = {};
  try {
    const stored = localStorage.getItem(ACH_KEY);
    if (stored) unlockedAchievements = JSON.parse(stored);
  } catch (e) {}

  function unlockAchievement(id) {
    const def = achievementDefs.find((a) => a.id === id);
    if (!def || unlockedAchievements[id]) return;
    unlockedAchievements[id] = Date.now();
    try { localStorage.setItem(ACH_KEY, JSON.stringify(unlockedAchievements)); } catch (e) {}
    if (achTitle) achTitle.textContent = def.title;
    if (achDesc) achDesc.textContent = def.desc;
    if (achIcon) achIcon.className = "bi " + def.icon;
    achievementPopup?.classList.add("show");
    if (soundOn) {
      playTone(659, 0.1, "sine", 0.05);
      setTimeout(() => playTone(880, 0.15, "sine", 0.05), 100);
    }
    setTimeout(() => achievementPopup?.classList.remove("show"), 3500);
  }

  /* ---------- Visit counter ---------- */
  const VISIT_KEY = "grev-visits";
  let visitCount = 0;
  try {
    visitCount = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(visitCount));
  } catch (e) { visitCount = 1; }
  const visitCountEl = $("#visitCount");
  const visitBadge = $("#visitBadge");
  if (visitCountEl) visitCountEl.textContent = visitCount;
  if (visitBadge && visitCount > 1) {
    visitBadge.classList.add("show");
  }
  // Unlock achievements based on visit count
  if (visitCount === 1) unlockAchievement("first_visit");
  else if (visitCount >= 5) unlockAchievement("long_visit"); // reuse for repeat visitor

  /* ---------- Time on page tracker ---------- */
  const timeIndicator = $("#timeIndicator");
  const timeValue = $("#timeValue");
  const startTime = Date.now();
  let visitedSections = new Set();
  let timeShown = false;

  function updateTime() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mm = Math.floor(elapsed / 60);
    const ss = String(elapsed % 60).padStart(2, "0");
    if (timeValue) timeValue.textContent = `${mm}:${ss}`;
    if (!timeShown && elapsed > 10) {
      timeIndicator?.classList.add("show");
      timeShown = true;
    }
    if (elapsed >= 120) unlockAchievement("long_visit");
  }
  setInterval(updateTime, 1000);

  /* ---------- FPS counter ---------- */
  const fpsCounter = $("#fpsCounter");
  const fpsValue = $("#fpsValue");
  let fpsEnabled = false;
  let fpsLastTime = performance.now();
  let fpsFrames = 0;
  let fpsRafId = null;

  function fpsTick(now) {
    fpsFrames++;
    if (now - fpsLastTime >= 1000) {
      const fps = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
      if (fpsValue) fpsValue.textContent = fps;
      fpsCounter?.classList.toggle("low", fps < 50 && fps >= 30);
      fpsCounter?.classList.toggle("crit", fps < 30);
      fpsLastTime = now;
      fpsFrames = 0;
    }
    if (fpsEnabled) fpsRafId = requestAnimationFrame(fpsTick);
  }

  function toggleFps() {
    fpsEnabled = !fpsEnabled;
    fpsCounter?.classList.toggle("show", fpsEnabled);
    if (fpsEnabled) {
      fpsLastTime = performance.now();
      fpsFrames = 0;
      fpsRafId = requestAnimationFrame(fpsTick);
      showToast("FPS counter enabled", "info", "bi-speedometer2");
    } else {
      if (fpsRafId) cancelAnimationFrame(fpsRafId);
      showToast("FPS counter disabled", "info", "bi-speedometer2");
    }
  }

  /* ---------- Network status indicator ---------- */
  const netIndicator = $("#netIndicator");
  function updateNetStatus() {
    if (navigator.onLine) {
      netIndicator?.classList.remove("show");
    } else {
      netIndicator?.classList.add("show");
    }
  }
  window.addEventListener("online", () => {
    netIndicator?.classList.add("online");
    netIndicator.querySelector("i").className = "bi bi-wifi";
    netIndicator.querySelector("span").textContent = "Back online!";
    netIndicator?.classList.add("show");
    setTimeout(() => {
      netIndicator?.classList.remove("show");
      setTimeout(() => netIndicator?.classList.remove("online"), 400);
    }, 2500);
    showToast("You're back online!", "success", "bi-wifi");
  });
  window.addEventListener("offline", () => {
    netIndicator?.classList.remove("online");
    netIndicator.querySelector("i").className = "bi bi-wifi-off";
    netIndicator.querySelector("span").textContent = "You're offline. Some features may be limited.";
    netIndicator?.classList.add("show");
    showToast("You're offline. Some features may be limited.", "warn", "bi-wifi-off");
  });
  updateNetStatus();

  /* ---------- Battery API ---------- */
  const batteryIndicator = $("#batteryIndicator");
  const batteryIcon = $("#batteryIcon");
  const batteryText = $("#batteryText");

  if ("getBattery" in navigator) {
    navigator.getBattery().then((battery) => {
      function updateBattery() {
        const level = Math.round(battery.level * 100);
        if (batteryText) batteryText.textContent = level + "%";
        batteryIndicator?.classList.remove("low", "crit", "charging");
        if (battery.charging) {
          batteryIndicator?.classList.add("charging");
          if (batteryIcon) batteryIcon.className = "bi bi-battery-charging";
        } else if (level <= 15) {
          batteryIndicator?.classList.add("crit");
          if (batteryIcon) batteryIcon.className = "bi bi-battery";
        } else if (level <= 30) {
          batteryIndicator?.classList.add("low");
          if (batteryIcon) batteryIcon.className = "bi bi-battery-half";
        } else if (level <= 60) {
          if (batteryIcon) batteryIcon.className = "bi bi-battery-half";
        } else {
          if (batteryIcon) batteryIcon.className = "bi bi-battery-full";
        }
        batteryIndicator?.classList.add("show");
      }
      updateBattery();
      battery.addEventListener("levelchange", updateBattery);
      battery.addEventListener("chargingchange", updateBattery);
    }).catch(() => {});
  }

  /* ---------- Reading time per section ---------- */
  $$("main section[id]").forEach((sec) => {
    const head = $(".section-head", sec);
    if (!head) return;
    const text = sec.textContent || "";
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    const badge = document.createElement("div");
    badge.className = "reading-time";
    badge.innerHTML = `<i class="bi bi-clock"></i> ${minutes} min read · ${words} words`;
    head.appendChild(badge);
  });

  /* ---------- Per-section bookmark buttons ---------- */
  const bookmarkBar = $("#bookmarkBar");
  const bookmarkList = $("#bookmarkList");
  const BOOKMARK_KEY = "grev-bookmarks";
  let bookmarks = [];
  try {
    const stored = localStorage.getItem(BOOKMARK_KEY);
    if (stored) bookmarks = JSON.parse(stored);
  } catch (e) {}

  function saveBookmarks() {
    try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks)); } catch (e) {}
  }

  function renderBookmarks() {
    if (!bookmarkList) return;
    bookmarkList.innerHTML = "";
    if (bookmarks.length === 0) {
      bookmarkBar?.classList.remove("show");
      return;
    }
    bookmarkBar?.classList.add("show");
    bookmarks.forEach((bm) => {
      const item = document.createElement("button");
      item.className = "bm-item";
      item.innerHTML = `<span>${bm.label}</span><i class="bi bi-x-lg bm-remove"></i>`;
      item.addEventListener("click", (e) => {
        if (e.target.closest(".bm-remove")) {
          e.stopPropagation();
          bookmarks = bookmarks.filter((b) => b.id !== bm.id);
          saveBookmarks();
          renderBookmarks();
          // Update section bookmark button state
          const sec = document.getElementById(bm.id);
          if (sec) $(".section-bookmark", sec)?.classList.remove("active");
          showToast(`Bookmark removed: ${bm.label}`, "info", "bi-bookmark-dash");
        } else {
          scrollTo("#" + bm.id);
        }
      });
      bookmarkList.appendChild(item);
    });
  }

  $$("main section[id]").forEach((sec) => {
    const head = $(".section-head", sec);
    if (!head) return;
    const bmBtn = document.createElement("button");
    bmBtn.className = "section-bookmark";
    bmBtn.type = "button";
    bmBtn.title = "Bookmark this section";
    bmBtn.setAttribute("aria-label", `Bookmark ${sec.id} section`);
    bmBtn.innerHTML = '<i class="bi bi-bookmark-fill"></i>';
    if (bookmarks.some((b) => b.id === sec.id)) bmBtn.classList.add("active");
    bmBtn.addEventListener("click", () => {
      const label = ($(".section-title", sec)?.textContent || sec.id).trim();
      const existing = bookmarks.findIndex((b) => b.id === sec.id);
      if (existing >= 0) {
        bookmarks.splice(existing, 1);
        bmBtn.classList.remove("active");
        showToast(`Bookmark removed: ${label}`, "info", "bi-bookmark-dash");
      } else {
        bookmarks.push({ id: sec.id, label });
        bmBtn.classList.add("active");
        showToast(`Bookmarked: ${label}`, "success", "bi-bookmark-check-fill");
        unlockAchievement("bookmark");
        if (soundOn) playSuccessSound();
      }
      saveBookmarks();
      renderBookmarks();
    });
    head.appendChild(bmBtn);
  });
  renderBookmarks();

  /* ---------- Snake Game ---------- */
  const snakeModal = $("#snakeModal");
  const snakeCanvas = $("#snakeCanvas");
  const snakeCtx = snakeCanvas?.getContext("2d");
  const snakeScoreEl = $("#snakeScore");
  const snakeBestEl = $("#snakeBest");
  const snakeStartBtn = $("#snakeStart");
  const snakePauseBtn = $("#snakePause");
  const snakeCloseBtn = $("#snakeClose");

  let snakeGame = null;
  const SNAKE_KEY = "grev-snake-best";
  let snakeBest = 0;
  try { snakeBest = parseInt(localStorage.getItem(SNAKE_KEY) || "0", 10); } catch (e) {}
  if (snakeBestEl) snakeBestEl.textContent = snakeBest;

  function initSnake() {
    if (!snakeCtx) return;
    const grid = 20;
    const cellSize = snakeCanvas.width / grid;
    snakeGame = {
      grid,
      cellSize,
      snake: [{ x: 10, y: 10 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 5, y: 5 },
      score: 0,
      running: false,
      paused: false,
      lastTick: 0,
      speed: 130,
    };
    placeFood();
    drawSnake();
  }

  function placeFood() {
    if (!snakeGame) return;
    while (true) {
      const x = Math.floor(Math.random() * snakeGame.grid);
      const y = Math.floor(Math.random() * snakeGame.grid);
      if (!snakeGame.snake.some((s) => s.x === x && s.y === y)) {
        snakeGame.food = { x, y };
        return;
      }
    }
  }

  function drawSnake() {
    if (!snakeCtx || !snakeGame) return;
    const g = snakeGame;
    snakeCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bg-2").trim() || "#0a0a0c";
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    // grid lines
    snakeCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--border").trim() || "rgba(255,255,255,0.1)";
    snakeCtx.lineWidth = 0.5;
    for (let i = 0; i <= g.grid; i++) {
      snakeCtx.beginPath();
      snakeCtx.moveTo(i * g.cellSize, 0);
      snakeCtx.lineTo(i * g.cellSize, snakeCanvas.height);
      snakeCtx.stroke();
      snakeCtx.beginPath();
      snakeCtx.moveTo(0, i * g.cellSize);
      snakeCtx.lineTo(snakeCanvas.width, i * g.cellSize);
      snakeCtx.stroke();
    }
    // food (apple)
    snakeCtx.fillStyle = "#ff375f";
    snakeCtx.beginPath();
    snakeCtx.arc(g.food.x * g.cellSize + g.cellSize / 2, g.food.y * g.cellSize + g.cellSize / 2, g.cellSize / 2 - 2, 0, Math.PI * 2);
    snakeCtx.fill();
    // snake
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#0a84ff";
    g.snake.forEach((s, i) => {
      const isHead = i === 0;
      snakeCtx.fillStyle = isHead ? accent : (i % 2 === 0 ? accent : "rgba(10,132,255,0.7)");
      snakeCtx.fillRect(s.x * g.cellSize + 1, s.y * g.cellSize + 1, g.cellSize - 2, g.cellSize - 2);
      if (isHead) {
        // eyes
        snakeCtx.fillStyle = "#fff";
        const eyeSize = 2;
        const eyeOffset = 4;
        let ex1, ey1, ex2, ey2;
        if (g.dir.x === 1) {
          ex1 = s.x * g.cellSize + g.cellSize - eyeOffset;
          ey1 = s.y * g.cellSize + 4;
          ex2 = s.x * g.cellSize + g.cellSize - eyeOffset;
          ey2 = s.y * g.cellSize + g.cellSize - 4;
        } else if (g.dir.x === -1) {
          ex1 = s.x * g.cellSize + eyeOffset;
          ey1 = s.y * g.cellSize + 4;
          ex2 = s.x * g.cellSize + eyeOffset;
          ey2 = s.y * g.cellSize + g.cellSize - 4;
        } else if (g.dir.y === 1) {
          ex1 = s.x * g.cellSize + 4;
          ey1 = s.y * g.cellSize + g.cellSize - eyeOffset;
          ex2 = s.x * g.cellSize + g.cellSize - 4;
          ey2 = s.y * g.cellSize + g.cellSize - eyeOffset;
        } else {
          ex1 = s.x * g.cellSize + 4;
          ey1 = s.y * g.cellSize + eyeOffset;
          ex2 = s.x * g.cellSize + g.cellSize - 4;
          ey2 = s.y * g.cellSize + eyeOffset;
        }
        snakeCtx.fillRect(ex1 - 1, ey1 - 1, eyeSize, eyeSize);
        snakeCtx.fillRect(ex2 - 1, ey2 - 1, eyeSize, eyeSize);
      }
    });
    // Game state text
    if (!g.running) {
      snakeCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#fff";
      snakeCtx.font = "bold 18px -apple-system, sans-serif";
      snakeCtx.textAlign = "center";
      snakeCtx.fillText("Press Start to play", snakeCanvas.width / 2, snakeCanvas.height / 2);
    } else if (g.paused) {
      snakeCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#fff";
      snakeCtx.font = "bold 24px -apple-system, sans-serif";
      snakeCtx.textAlign = "center";
      snakeCtx.fillText("PAUSED", snakeCanvas.width / 2, snakeCanvas.height / 2);
    }
  }

  function snakeTick() {
    if (!snakeGame || !snakeGame.running || snakeGame.paused) return;
    const g = snakeGame;
    g.dir = g.nextDir;
    const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
    // wall collision
    if (head.x < 0 || head.x >= g.grid || head.y < 0 || head.y >= g.grid) {
      gameOver();
      return;
    }
    // self collision
    if (g.snake.some((s) => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }
    g.snake.unshift(head);
    if (head.x === g.food.x && head.y === g.food.y) {
      g.score += 10;
      if (snakeScoreEl) snakeScoreEl.textContent = g.score;
      if (g.score >= 10) unlockAchievement("snake_score10");
      placeFood();
      if (soundOn) playTone(880, 0.08, "sine", 0.04);
    } else {
      g.snake.pop();
    }
    drawSnake();
  }

  function gameOver() {
    if (!snakeGame) return;
    snakeGame.running = false;
    if (snakeGame.score > snakeBest) {
      snakeBest = snakeGame.score;
      try { localStorage.setItem(SNAKE_KEY, String(snakeBest)); } catch (e) {}
      if (snakeBestEl) snakeBestEl.textContent = snakeBest;
      showToast(`New high score: ${snakeBest}!`, "success", "bi-trophy-fill");
    } else {
      showToast(`Game over! Score: ${snakeGame.score}`, "info", "bi-controller");
    }
    if (soundOn) {
      playTone(220, 0.2, "sawtooth", 0.05);
      setTimeout(() => playTone(180, 0.3, "sawtooth", 0.05), 150);
    }
    drawSnake();
  }

  let snakeLoopId = null;
  function snakeLoop(now) {
    if (!snakeGame) return;
    if (snakeGame.running && !snakeGame.paused && now - snakeGame.lastTick >= snakeGame.speed) {
      snakeGame.lastTick = now;
      snakeTick();
    }
    snakeLoopId = requestAnimationFrame(snakeLoop);
  }

  function openSnake() {
    snakeModal?.classList.add("show");
    snakeModal?.setAttribute("aria-hidden", "false");
    initSnake();
    if (!snakeLoopId) snakeLoopId = requestAnimationFrame(snakeLoop);
    lockBodyScroll();
    if (soundOn) playClickSound();
  }
  function closeSnake() {
    snakeModal?.classList.remove("show");
    snakeModal?.setAttribute("aria-hidden", "true");
    if (snakeGame) snakeGame.running = false;
    unlockBodyScroll();
  }

  snakeCloseBtn?.addEventListener("click", closeSnake);
  snakeModal?.addEventListener("click", (e) => { if (e.target === snakeModal) closeSnake(); });
  snakeStartBtn?.addEventListener("click", () => {
    if (!snakeGame) initSnake();
    initSnake();
    snakeGame.running = true;
    snakeGame.paused = false;
    snakeGame.lastTick = performance.now();
    unlockAchievement("snake_play");
    if (soundOn) playClickSound();
    drawSnake();
  });
  snakePauseBtn?.addEventListener("click", () => {
    if (!snakeGame || !snakeGame.running) return;
    snakeGame.paused = !snakeGame.paused;
    if (soundOn) playClickSound();
    drawSnake();
  });

  // D-pad buttons
  $$(".dpad-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!snakeGame) return;
      const dir = btn.dataset.dir;
      const map = { up: {x:0,y:-1}, down: {x:0,y:1}, left: {x:-1,y:0}, right: {x:1,y:0} };
      const newDir = map[dir];
      if (newDir && (newDir.x !== -snakeGame.dir.x || newDir.y !== -snakeGame.dir.y)) {
        snakeGame.nextDir = newDir;
      }
    });
  });

  // Keyboard controls for snake (when modal is open)
  document.addEventListener("keydown", (e) => {
    if (!snakeModal?.classList.contains("show")) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (!snakeGame) return;
    const key = e.key.toLowerCase();
    let newDir = null;
    if (e.key === "ArrowUp" || key === "w") newDir = { x: 0, y: -1 };
    else if (e.key === "ArrowDown" || key === "s") newDir = { x: 0, y: 1 };
    else if (e.key === "ArrowLeft" || key === "a") newDir = { x: -1, y: 0 };
    else if (e.key === "ArrowRight" || key === "d") newDir = { x: 1, y: 0 };
    else if (e.key === " ") {
      e.preventDefault();
      if (snakeGame.running) {
        snakeGame.paused = !snakeGame.paused;
        drawSnake();
      }
      return;
    }
    if (newDir && (newDir.x !== -snakeGame.dir.x || newDir.y !== -snakeGame.dir.y)) {
      e.preventDefault();
      snakeGame.nextDir = newDir;
    }
  });

  /* ---------- Hook achievements into existing actions ---------- */
  // Theme toggle achievement
  const origThemeHandler = themeToggle?.onclick;
  themeToggle?.addEventListener("click", () => unlockAchievement("theme_switch"), { once: true });
  // Sound on achievement
  soundToggle?.addEventListener("click", () => {
    if (!soundOn) setTimeout(() => { if (soundOn) unlockAchievement("sound_on"); }, 100);
  });
  // AI chat achievement
  aiFab?.addEventListener("click", () => unlockAchievement("ai_chat"), { once: true });
  // Voice nav achievement
  voiceFab?.addEventListener("click", () => unlockAchievement("voice_nav"), { once: true });
  // Music achievement
  musicFab?.addEventListener("click", () => unlockAchievement("music_listen"), { once: true });
  // Konami achievement (hook into triggerKonami)
  const origKonami = triggerKonami;
  // We can't easily reassign function declarations; instead, hook via event listener on konami success
  // Use a custom event approach
  document.addEventListener("konami:triggered", () => unlockAchievement("konami"));
  // Resume download achievement
  dlBtn?.addEventListener("click", () => unlockAchievement("resume_download"), { once: true });
  // QR view achievement
  qrBtn?.addEventListener("click", () => unlockAchievement("qr_view"), { once: true });
  // Accent change achievement
  $$(".tp-swatch").forEach((sw) => {
    sw.addEventListener("click", () => unlockAchievement("accent_change"), { once: true });
  });
  // Command palette achievement
  cmdkBtn?.addEventListener("click", () => unlockAchievement("cmdk_use"), { once: true });

  /* ---------- Trigger konami event from existing function ---------- */
  // Wrap triggerKonami to dispatch event
  const _origTriggerKonami = triggerKonami;
  // Since triggerKonami is a function declaration, we patch it by adding event dispatch inside
  // We'll use a custom approach: monitor for confetti > 100 pieces
  const konamiObserver = new MutationObserver(() => {
    const confettiCount = $$(".confetti-piece").length;
    if (confettiCount > 100) {
      document.dispatchEvent(new CustomEvent("konami:triggered"));
      konamiObserver.disconnect();
      setTimeout(() => konamiObserver.observe(document.body, { childList: true }), 5000);
    }
  });
  konamiObserver.observe(document.body, { childList: true });

  /* ---------- Scroll-based achievements ---------- */
  let lastScrollY = 0;
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    if (pct >= 50) unlockAchievement("scrolled_half");
    if (pct >= 95) unlockAchievement("scrolled_full");
    // Track visited sections
    $$("main section[id]").forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5) {
        if (!visitedSections.has(sec.id)) {
          visitedSections.add(sec.id);
          if (visitedSections.size >= 7) unlockAchievement("all_sections");
        }
      }
    });
  }, { passive: true });

  /* ---------- Keyboard shortcuts for Snake (S key) ---------- */
  // Note: F (FPS) and other shortcuts now handled in main keydown handler above.
  // S for snake (only if not in G-sequence and snake modal not already open)
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    const isEditable = tag === "input" || tag === "textarea" || e.target.isContentEditable;
    if (isEditable) return;
    if (e.ctrlKey || e.metaKey) return;
    if (cmdk.classList.contains("show") || shortcutsModal?.classList.contains("show") || qrModal?.classList.contains("show")) return;
    if (document.activeElement === aiInput) return;
    const key = e.key.toLowerCase();
    // S for snake (but only if not in G-sequence)
    if (key === "s" && gKeyBuffer !== "g" && !snakeModal?.classList.contains("show")) {
      // Only trigger if not in input
      if (tag !== "input" && tag !== "textarea") {
        e.preventDefault();
        openSnake();
      }
    }
  });

  /* ---------- Add Snake command to command palette ---------- */
  cmdkCommands.push(
    { id: "snake", title: "Play Snake Game", sub: "Mini-game easter egg", icon: "bi-controller", keys: ["S"], action: () => openSnake() },
    { id: "fps", title: "Toggle FPS Counter", sub: "Show/hide performance monitor", icon: "bi-speedometer2", keys: ["F"], action: () => toggleFps() },
    { id: "theme-cycle", title: "Cycle Theme", sub: "Light → Dark → OLED (press T to cycle)", icon: "bi-moon-stars-fill", keys: ["T"], action: () => themeToggle?.click() },
    { id: "achievements-summary", title: "View Achievements Summary", sub: "Show progress toast", icon: "bi-trophy-fill", keys: ["O"], action: () => {
      const unlocked = Object.keys(unlockedAchievements).length;
      const total = achievementDefs.length;
      showToast(`Achievements: ${unlocked}/${total} unlocked — press G to open gallery`, "info", "bi-trophy-fill");
    } }
  );

  /* ---------- Welcome achievement on load ---------- */
  setTimeout(() => {
    if (visitCount === 1) {
      // Already unlocked via first_visit
    } else if (visitCount >= 5) {
      showToast(`Welcome back! This is your visit #${visitCount}`, "info", "bi-arrow-clockwise");
    }
  }, 3000);

  /* ---------- Tips rotation expansion ---------- */
  welcomeTips.push(
    "Tip: Press S to play the Snake mini-game",
    "Tip: Press F to toggle the FPS counter",
    "Tip: Hover section titles to bookmark them",
    "Tip: Unlock all 20 achievements by exploring!",
    "Tip: Each section shows reading time & word count",
    "Tip: Press T to cycle Light → Dark → OLED (battery saver!)",
    "Tip: Try OLED mode on AMOLED phones to save battery",
    "Tip: Press Y for typing speed test",
    "Tip: Press O to view achievement gallery",
    "Tip: Press X for a Matrix surprise"
  );

  /* ===========================================================
     UPGRADE 8 FEATURES — Typing, Gallery, Radar, Matrix, Geo
     =========================================================== */

  /* ---------- Typing Speed Test ---------- */
  const typingModal = $("#typingModal");
  const typingClose = $("#typingClose");
  const typingStartBtn = $("#typingStart");
  const typingInput = $("#typingInput");
  const typingTextEl = $("#typingText");
  const typingWpm = $("#typingWpm");
  const typingAcc = $("#typingAcc");
  const typingTime = $("#typingTime");
  const typingBestEl = $("#typingBest");
  const typingMode = $("#typingMode");

  const TYPING_TEXTS = {
    bio: "An IT graduate with a strong dedication to continuous learning and a keen curiosity about technological innovation. Experienced in IT support and customer service roles, with hands-on expertise in developing desktop and Android applications.",
    skills: "IT Support, Networking, Data Entry, Windows, Linux, Microsoft Office, Customer Relationship Management, Active Directory, MikroTik, Google Workspace. Proficiency in router configuration, wireless access points, endpoint security, and antivirus solutions.",
    quote: "The only way to do great work is to love what you do. Continuous learning is the key to staying ahead in technology. Every challenge is an opportunity to grow and innovate.",
  };

  const TYPING_BEST_KEY = "grev-typing-best";
  let typingBest = 0;
  try { typingBest = parseInt(localStorage.getItem(TYPING_BEST_KEY) || "0", 10); } catch (e) {}
  if (typingBestEl) typingBestEl.textContent = typingBest;

  let typingState = { running: false, text: "", startTime: 0, errors: 0, typed: 0, intervalId: null };

  function openTyping() {
    typingModal?.classList.add("show");
    typingModal?.setAttribute("aria-hidden", "false");
    loadTypingText();
    lockBodyScroll();
    if (soundOn) playClickSound();
  }
  function closeTyping() {
    typingModal?.classList.remove("show");
    typingModal?.setAttribute("aria-hidden", "true");
    stopTypingTest();
    unlockBodyScroll();
  }

  function loadTypingText() {
    const mode = typingMode?.value || "bio";
    typingState.text = TYPING_TEXTS[mode] || TYPING_TEXTS.bio;
    renderTypingText();
  }

  function renderTypingText(typedCount = 0) {
    const text = typingState.text;
    typingTextEl.innerHTML = text.split("").map((ch, i) => {
      let cls = "char";
      if (i < typedCount) cls += " correct";
      else if (i === typedCount) cls += " current";
      // Use regular space (not &nbsp;) so the text can wrap naturally.
      // white-space: pre-wrap on .typing-text preserves the space.
      const safe = ch === " " ? " " : (ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "&" ? "&amp;" : ch);
      return `<span class="${cls}">${safe}</span>`;
    }).join("");
  }

  function startTypingTest() {
    typingState.running = true;
    typingState.startTime = performance.now();
    typingState.errors = 0;
    typingState.typed = 0;
    if (typingInput) {
      typingInput.value = "";
      typingInput.disabled = false;
      typingInput.focus();
    }
    if (typingWpm) typingWpm.textContent = "0";
    if (typingAcc) typingAcc.textContent = "100%";
    if (typingTime) typingTime.textContent = "0s";
    typingState.intervalId = setInterval(updateTypingStats, 100);
    if (soundOn) playClickSound();
    showToast("Typing test started! Type the text above.", "info", "bi-keyboard-fill");
  }

  function stopTypingTest() {
    typingState.running = false;
    if (typingState.intervalId) { clearInterval(typingState.intervalId); typingState.intervalId = null; }
    if (typingInput) typingInput.disabled = true;
  }

  function updateTypingStats() {
    if (!typingState.running) return;
    const elapsed = (performance.now() - typingState.startTime) / 1000;
    if (typingTime) typingTime.textContent = Math.floor(elapsed) + "s";
    const wordsTyped = typingState.typed / 5;
    const wpm = elapsed > 0 ? Math.round((wordsTyped / elapsed) * 60) : 0;
    if (typingWpm) typingWpm.textContent = wpm;
    const totalTyped = typingState.typed + typingState.errors;
    const acc = totalTyped > 0 ? Math.max(0, Math.round(((typingState.typed) / totalTyped) * 100)) : 100;
    if (typingAcc) typingAcc.textContent = acc + "%";
  }

  function finishTypingTest() {
    const elapsed = (performance.now() - typingState.startTime) / 1000;
    const wordsTyped = typingState.typed / 5;
    const wpm = elapsed > 0 ? Math.round((wordsTyped / elapsed) * 60) : 0;
    if (wpm > typingBest) {
      typingBest = wpm;
      try { localStorage.setItem(TYPING_BEST_KEY, String(typingBest)); } catch (e) {}
      if (typingBestEl) typingBestEl.textContent = typingBest;
      showToast(`New best WPM: ${wpm}! 🎉`, "success", "bi-trophy-fill");
      unlockAchievement("typing_test");
    } else {
      showToast(`Test complete! WPM: ${wpm}`, "info", "bi-keyboard-fill");
    }
    stopTypingTest();
    if (soundOn) playSuccessSound();
  }

  typingClose?.addEventListener("click", closeTyping);
  typingModal?.addEventListener("click", (e) => { if (e.target === typingModal) closeTyping(); });
  typingStartBtn?.addEventListener("click", startTypingTest);
  typingMode?.addEventListener("change", () => {
    loadTypingText();
    stopTypingTest();
  });
  typingInput?.addEventListener("input", (e) => {
    if (!typingState.running) return;
    const input = e.target.value;
    const text = typingState.text;
    let correct = 0;
    let errors = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === text[i]) correct++;
      else errors++;
    }
    typingState.typed = correct;
    typingState.errors = errors;
    renderTypingText(input.length);
    // Auto-scroll so the current character stays visible
    const currentChar = typingTextEl?.querySelector(".char.current");
    if (currentChar) {
      const textRect = typingTextEl.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      if (charRect.bottom > textRect.bottom - 10 || charRect.top < textRect.top + 10) {
        currentChar.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
    if (input.length >= text.length) {
      // Check if all correct
      if (input === text) finishTypingTest();
      else {
        // Auto-correct: prevent overtyping wrong
        e.target.value = input.slice(0, -1);
      }
    }
  });

  /* ---------- Achievement Gallery Modal ---------- */
  const achGalleryModal = $("#achGalleryModal");
  const achGalleryClose = $("#achGalleryClose");
  const achGrid = $("#achGrid");
  const achCounter = $("#achCounter");
  const achProgressBar = $("#achProgressBar");

  function renderAchGallery() {
    if (!achGrid) return;
    const unlocked = Object.keys(unlockedAchievements).length;
    const total = achievementDefs.length;
    if (achCounter) achCounter.textContent = `${unlocked}/${total}`;
    if (achProgressBar) achProgressBar.style.width = (unlocked / total * 100) + "%";
    achGrid.innerHTML = achievementDefs.map((a) => {
      const isUnlocked = !!unlockedAchievements[a.id];
      return `
        <div class="ach-card ${isUnlocked ? "unlocked" : ""}">
          <i class="bi ${a.icon} ach-card-icon"></i>
          <div class="ach-card-title">${isUnlocked ? a.title : "???"}</div>
          <div class="ach-card-desc">${isUnlocked ? a.desc : "Locked — keep exploring to unlock"}</div>
        </div>
      `;
    }).join("");
  }

  function openAchGallery() {
    renderAchGallery();
    achGalleryModal?.classList.add("show");
    achGalleryModal?.setAttribute("aria-hidden", "false");
    lockBodyScroll();
    if (soundOn) playClickSound();
  }
  function closeAchGallery() {
    achGalleryModal?.classList.remove("show");
    achGalleryModal?.setAttribute("aria-hidden", "true");
    unlockBodyScroll();
  }
  achGalleryClose?.addEventListener("click", closeAchGallery);
  achGalleryModal?.addEventListener("click", (e) => { if (e.target === achGalleryModal) closeAchGallery(); });

  // Add typing_test achievement
  achievementDefs.push(
    { id: "typing_test", title: "Speed Typist", desc: "Completed the typing speed test", icon: "bi-keyboard-fill" },
    { id: "matrix_rain", title: "Wake Up, Neo", desc: "Triggered the Matrix rain", icon: "bi-magic" }
  );

  /* ---------- Skill Radar Chart (auto-injected into About section) ---------- */
  const aboutCard = $("#about .glass-card");
  if (aboutCard) {
    const radarWrap = document.createElement("div");
    radarWrap.className = "skill-radar-wrap";
    radarWrap.innerHTML = `
      <h4>Technical Skill Radar</h4>
      <svg class="skill-radar-svg" viewBox="0 0 200 200" id="skillRadarSvg"></svg>
    `;
    aboutCard.appendChild(radarWrap);

    const skills = [
      { label: "IT Support", value: 0.95 },
      { label: "Networking", value: 0.95 },
      { label: "CRM", value: 0.95 },
      { label: "Microsoft Office", value: 0.95 },
      { label: "Google Workspace", value: 0.95 },
      { label: "Linux", value: 0.95 },
      { label: "Windows", value: 0.95 },
    ];
    const cx = 100, cy = 100, maxR = 70;
    const n = skills.length;
    const svg = $("#skillRadarSvg");
    if (svg) {
      // Grid circles
      for (let level = 1; level <= 4; level++) {
        const r = (maxR / 4) * level;
        const pts = [];
        for (let i = 0; i < n; i++) {
          const ang = (Math.PI * 2 * i / n) - Math.PI / 2;
          pts.push(`${cx + Math.cos(ang) * r},${cy + Math.sin(ang) * r}`);
        }
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        poly.setAttribute("class", "radar-grid");
        poly.setAttribute("points", pts.join(" "));
        svg.appendChild(poly);
      }
      // Axes
      for (let i = 0; i < n; i++) {
        const ang = (Math.PI * 2 * i / n) - Math.PI / 2;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("class", "radar-axis");
        line.setAttribute("x1", cx);
        line.setAttribute("y1", cy);
        line.setAttribute("x2", cx + Math.cos(ang) * maxR);
        line.setAttribute("y2", cy + Math.sin(ang) * maxR);
        svg.appendChild(line);
        // Label
        const labelR = maxR + 14;
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("class", "radar-label");
        text.setAttribute("x", cx + Math.cos(ang) * labelR);
        text.setAttribute("y", cy + Math.sin(ang) * labelR);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.textContent = skills[i].label;
        svg.appendChild(text);
      }
      // Data shape
      const dataPts = [];
      for (let i = 0; i < n; i++) {
        const ang = (Math.PI * 2 * i / n) - Math.PI / 2;
        const r = maxR * skills[i].value;
        dataPts.push(`${cx + Math.cos(ang) * r},${cy + Math.sin(ang) * r}`);
      }
      const shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      shape.setAttribute("class", "radar-shape");
      shape.setAttribute("points", dataPts.join(" "));
      svg.appendChild(shape);
      // Dots
      for (let i = 0; i < n; i++) {
        const ang = (Math.PI * 2 * i / n) - Math.PI / 2;
        const r = maxR * skills[i].value;
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("class", "radar-dot");
        dot.setAttribute("cx", cx + Math.cos(ang) * r);
        dot.setAttribute("cy", cy + Math.sin(ang) * r);
        dot.setAttribute("r", 2.5);
        svg.appendChild(dot);
      }

      // Animate when visible
      const radarObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            shape.classList.add("drawn");
            radarObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.3 });
      radarObserver.observe(svg);
    }
  }

  /* ---------- Matrix Rain Easter Egg ---------- */
  const matrixCanvas = $("#matrixRain");
  let matrixCtx = null;
  let matrixRunning = false;
  let matrixRafId = null;
  let matrixDrops = [];
  let matrixChars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789ABCDEF";

  function startMatrixRain() {
    if (!matrixCanvas) return;
    matrixCtx = matrixCanvas.getContext("2d");
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    const cols = Math.floor(matrixCanvas.width / 14);
    matrixDrops = Array(cols).fill(0).map(() => Math.random() * -100);
    matrixCanvas.classList.add("show");
    matrixRunning = true;
    showToast("Wake up, Neo... The Matrix has you. Click to exit.", "info", "bi-magic");
    unlockAchievement("matrix_rain");
    if (soundOn) playTone(80, 1, "sawtooth", 0.03);
    function draw() {
      if (!matrixRunning) return;
      matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
      matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      matrixCtx.fillStyle = "#30d158";
      matrixCtx.font = "14px monospace";
      for (let i = 0; i < matrixDrops.length; i++) {
        const ch = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        matrixCtx.fillStyle = Math.random() > 0.95 ? "#ffffff" : "#30d158";
        matrixCtx.fillText(ch, i * 14, matrixDrops[i] * 14);
        if (matrixDrops[i] * 14 > matrixCanvas.height && Math.random() > 0.975) {
          matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
      }
      matrixRafId = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopMatrixRain() {
    matrixRunning = false;
    if (matrixRafId) cancelAnimationFrame(matrixRafId);
    matrixCanvas?.classList.remove("show");
    showToast("Matrix exited. Welcome back to reality.", "info", "bi-arrow-return-left");
  }

  matrixCanvas?.addEventListener("click", stopMatrixRain);
  // Note: Escape for Matrix rain now handled by unified Escape handler in main keydown listener above.

  /* ---------- Geolocation Greeting (timezone-based) ---------- */
  const geoGreeting = $("#geoGreeting");
  const geoGreetingText = $("#geoGreetingText");

  function showGeoGreeting() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
      const hour = new Date().getHours();
      let greeting = "Hello";
      if (hour < 5) greeting = "Good night";
      else if (hour < 12) greeting = "Good morning";
      else if (hour < 17) greeting = "Good afternoon";
      else if (hour < 21) greeting = "Good evening";
      else greeting = "Good night";
      // Extract city/region from timezone
      const parts = tz.split("/");
      const region = parts[parts.length - 1].replace(/_/g, " ");
      if (geoGreetingText) geoGreetingText.textContent = `${greeting} from ${region}! (${tz})`;
      geoGreeting?.classList.add("show");
      setTimeout(() => geoGreeting?.classList.remove("show"), 8000);
    } catch (e) {}
  }
  setTimeout(showGeoGreeting, 2500);

  /* ---------- Auto Theme Scheduler (day/night/oled) ---------- */
  const AUTO_THEME_KEY = "grev-auto-theme";
  let autoThemeEnabled = false;
  try { autoThemeEnabled = localStorage.getItem(AUTO_THEME_KEY) === "true"; } catch (e) {}

  function getAutoTheme() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) return "light";      // 6am - 6pm: light
    if (hour >= 18 && hour < 22) return "dark";      // 6pm - 10pm: dark
    return "oled";                                    // 10pm - 6am: OLED
  }

  function checkAutoTheme() {
    if (!autoThemeEnabled) return;
    // Only auto-switch if user hasn't manually set theme recently (within 1 hour)
    let lastManual = 0;
    try { lastManual = parseInt(localStorage.getItem("grev-theme-manual") || "0", 10); } catch (e) {}
    if (Date.now() - lastManual < 3600000) return; // Skip if manual change in last hour
    const target = getAutoTheme();
    if (root.getAttribute("data-theme") !== target) {
      applyTheme(target, false);
      showToast(`Auto theme: ${THEME_META[target].label} (time-based)`, "info", target === "light" ? "bi-sun-fill" : target === "dark" ? "bi-moon-stars-fill" : "bi-circle-half");
    }
  }

  // Check every 10 minutes
  setInterval(checkAutoTheme, 600000);
  // Check on load
  setTimeout(() => { if (autoThemeEnabled) checkAutoTheme(); }, 5000);

  // Track manual theme changes
  const origApplyTheme = applyTheme;
  // Note: applyTheme is a function declaration
  themeToggle?.addEventListener("click", () => {
    try { localStorage.setItem("grev-theme-manual", String(Date.now())); } catch (e) {}
  });

  /* ---------- Battery-aware OLED auto-switch ---------- */
  if ("getBattery" in navigator) {
    navigator.getBattery().then((battery) => {
      function checkBatteryOled() {
        if (!battery.charging && battery.level <= 0.15) {
          // Auto switch to OLED if battery < 15% and not charging
          if (root.getAttribute("data-theme") !== "oled") {
            applyTheme("oled");
            showToast("Battery low — switched to OLED mode to save power", "warn", "bi-battery");
            if (soundOn) playTone(440, 0.2, "triangle", 0.05);
          }
        }
      }
      battery.addEventListener("levelchange", checkBatteryOled);
      // Check on initial load
      setTimeout(checkBatteryOled, 2000);
    }).catch(() => {});
  }

  /* ---------- Cursor auto-hide on idle ---------- */
  let cursorIdleTimer = null;
  if (!isTouch) {
    document.addEventListener("mousemove", () => {
      cursorDot?.classList.remove("idle");
      cursorRing?.classList.remove("idle");
      clearTimeout(cursorIdleTimer);
      cursorIdleTimer = setTimeout(() => {
        cursorDot?.classList.add("idle");
        cursorRing?.classList.add("idle");
      }, 3000);
    });
  }

  /* ---------- Keyboard shortcuts: Y (typing), O (achievements), X (matrix) ---------- */
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    const isEditable = tag === "input" || tag === "textarea" || e.target.isContentEditable;
    if (isEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    if (cmdk.classList.contains("show") || shortcutsModal?.classList.contains("show")) return;
    if (document.activeElement === aiInput) return;
    const key = e.key.toLowerCase();
    if (key === "y" && !snakeModal?.classList.contains("show") && !typingModal?.classList.contains("show")) {
      e.preventDefault();
      openTyping();
    } else if (key === "x" && !matrixRunning) {
      e.preventDefault();
      startMatrixRain();
    }
  });

  // Note: Escape for typing/ach gallery now handled by unified Escape handler in main keydown listener above.

  /* ---------- Add new commands to command palette ---------- */
  cmdkCommands.push(
    { id: "typing", title: "Typing Speed Test", sub: "Test your WPM", icon: "bi-keyboard-fill", keys: ["Y"], action: () => openTyping() },
    { id: "ach-gallery", title: "Achievement Gallery", sub: "View all unlocked &amp; locked achievements", icon: "bi-trophy-fill", keys: ["G"], action: () => openAchGallery() },
    { id: "matrix", title: "Matrix Rain", sub: "Enter the Matrix (full-screen animation)", icon: "bi-magic", keys: ["X"], action: () => startMatrixRain() },
    { id: "auto-theme", title: autoThemeEnabled ? "Disable Auto Theme" : "Enable Auto Theme", sub: "Time-based: light by day, dark by evening, OLED by night", icon: "bi-clock-history", keys: ["A"], action: () => {
      autoThemeEnabled = !autoThemeEnabled;
      try { localStorage.setItem(AUTO_THEME_KEY, String(autoThemeEnabled)); } catch (e) {}
      showToast(autoThemeEnabled ? "Auto theme enabled — will follow time of day" : "Auto theme disabled", "info", "bi-clock-history");
      if (autoThemeEnabled) checkAutoTheme();
    } }
  );
})();