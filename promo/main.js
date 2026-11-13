/* CR8TIVE promo — infinite WebGL project reel between "We Make" and "DIGITAL".
   No dependencies. Sizes and offsets are in design pixels of the 1728 × 1117 Figma frame. */

(() => {
  'use strict';

  // ---------------------------------------------------------------- slides
  // size: rendered size in the mockup; dy: vertical offset of the image centre
  // from the headline centre; rot: rotation in degrees (CSS direction).
  const SLIDES = [
    { src: 'assets/projects/food.png',   size: [371, 371],         dy: 0,   rot: 0 },
    { src: 'assets/projects/beauty.png', size: [323.703, 323.703], dy: 0,   rot: -4.15 },
    { src: 'assets/projects/drone.png',  size: [378, 189],         dy: 0,   rot: 0 },
    { src: 'assets/projects/taxi.png',   size: [428, 285],         dy: 0,   rot: 0 },
  ];
  const N = SLIDES.length;

  const SLOT_SIZE = 371;      // design px, width of the .slot element
  const RADIUS = 360;         // drum radius, design px
  const STEP = 1.2;           // angle between neighbouring slides, radians
  const AUTOPLAY_MS = 3200;
  const INTRO_HOLD_MS = 1100; // how long the two words stay together before parting (400 ms)
  const INTRO_HOLD_LANG_MS = 800; // the same hold when the intro replays after a language switch
  const SPRING = 38;          // stiffness
  const DAMPING = 10;         // slightly under-damped → soft overshoot

  const root = document.documentElement;
  const canvas = document.getElementById('gl');
  const slot = document.getElementById('slot');
  const captions = Array.from(document.querySelectorAll('#caption > span'));
  const fallbackImgs = Array.from(document.querySelectorAll('.fallback img'));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = window.matchMedia('(max-aspect-ratio: 1/1)');

  const mod = (a, n) => ((a % n) + n) % n;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ---------------------------------------------------------------- state
  const state = {
    pos: -0.49,      // continuous slide position; integer = slide at rest
    intro: false,    // true while the two words still sit together in the centre
    solo: null,      // { index, target } while a roll-in draws only the current project
    target: 0,
    vel: 0,          // slides per second
    active: -1,
    dragging: false,
    lastInteraction: 0,
    mouse: [-9999, -9999],     // css px
    mouseVel: [0, 0],          // design px per frame, smoothed
    mouseRaw: [0, 0],
    layout: { cx: 0, cy: 0, u: 1, horizontal: false },
  };

  // ---------------------------------------------------------------- WebGL
  const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;

    uniform sampler2D uTex;
    uniform vec2  uRes;       // canvas size, device px
    uniform vec2  uCenter;    // reel centre, device px, y down
    uniform float uU;         // device px per design px
    uniform vec2  uSize;      // image size, design px
    uniform vec2  uOffset;    // image centre offset, design px
    uniform float uRot;       // radians, CSS direction
    uniform float uTheta;     // slide angle on the drum
    uniform float uRadius;    // design px
    uniform float uBend;      // 0 = flat (at rest), 1 = fully wrapped on the drum
    uniform float uVel;       // slides per second, signed
    uniform float uAxis;      // 0 = reel runs vertically, 1 = horizontally
    uniform vec2  uMouse;     // design px relative to centre
    uniform vec2  uMouseVel;  // design px
    uniform float uTime;

    const int TAPS = 16;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec4 sampleImage(vec2 uv) {
      vec2 edge = 1.5 / (uSize * uU);
      vec2 m = smoothstep(vec2(0.0), edge, uv) * smoothstep(vec2(0.0), edge, 1.0 - uv);
      return texture2D(uTex, uv) * m.x * m.y;
    }

    void main() {
      vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) - uCenter;
      p /= uU;

      // Liquid drag under the cursor.
      vec2 dm = p - uMouse;
      float fall = exp(-dot(dm, dm) / (150.0 * 150.0));
      p -= uMouseVel * fall * 1.5;

      // q.y runs along the reel, q.x across it.
      vec2 q = uAxis > 0.5 ? p.yx : p;

      float s = clamp(q.y / uRadius, -0.999, 0.999);
      float a = asin(s);
      float c = cos(a);

      float alongDrum = (a - uTheta) * uRadius;
      float alongFlat = q.y - uRadius * sin(uTheta);
      float along = mix(alongFlat, alongDrum, uBend);
      float across = q.x / mix(1.0, mix(1.0, c, 0.35), uBend);

      float v = clamp(uVel, -7.0, 7.0);
      float speed = abs(v);

      // Liquid wobble while the reel is moving.
      across += sin(along * 0.028 + uTime * 5.0) * speed * 2.2;
      along  += sin(across * 0.021 - uTime * 4.0) * speed * 1.2;

      vec2 local = uAxis > 0.5 ? vec2(along, across) : vec2(across, along);
      local -= uOffset;
      float cr = cos(uRot), sr = sin(uRot);
      local = vec2(cr * local.x + sr * local.y, -sr * local.x + cr * local.y);

      vec2 uv = local / uSize + 0.5;
      vec2 dir = uAxis > 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

      // Spectral motion smear along the direction of travel.
      vec3 col = vec3(0.0);
      vec3 wsum = vec3(0.0);
      float alpha = 0.0;
      // Per-pixel jitter turns the banding between taps into fine grain.
      float jitter = (hash(gl_FragCoord.xy + uTime) - 0.5) / float(TAPS);
      for (int i = 0; i < TAPS; i++) {
        float t = float(i) / float(TAPS - 1) - 0.5 + jitter;
        vec4 smp = sampleImage(uv + dir * v * 0.06 * t);
        vec3 w = max(vec3(0.0), 1.0 - abs(vec3(t) - vec3(0.3, 0.0, -0.3)) * 2.6);
        col += smp.rgb * w;
        wsum += w;
        alpha += smp.a;
      }
      col /= wsum;
      alpha /= float(TAPS);

      float ct = cos(uTheta);
      float fade = smoothstep(0.4, 0.9, ct) * mix(1.0, smoothstep(0.1, 0.6, c), uBend);
      float light = mix(1.0, mix(0.35, 1.0, c), uBend);

      gl_FragColor = vec4(col * light, alpha) * fade;
    }
  `;

  function createGL() {
    const opts = { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' };
    const gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts);
    if (!gl) return null;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
      }
      return sh;
    };

    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'program link failed');
      }
    } catch (err) {
      console.warn('[cr8tive] WebGL unavailable, using fallback:', err);
      return null;
    }

    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {};
    ['uTex', 'uRes', 'uCenter', 'uU', 'uSize', 'uOffset', 'uRot', 'uTheta', 'uRadius',
      'uBend', 'uVel', 'uAxis', 'uMouse', 'uMouseVel', 'uTime'].forEach((name) => {
      uniforms[name] = gl.getUniformLocation(program, name);
    });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform1i(uniforms.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);

    return { gl, uniforms };
  }

  // Images are redrawn into a power-of-two canvas so mipmaps work in WebGL1 too.
  function loadTexture(gl, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const pot = 1024;
        const c = document.createElement('canvas');
        c.width = pot;
        c.height = pot;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, pot, pot);

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        resolve(tex);
      };
      img.onerror = () => reject(new Error(`failed to load ${src}`));
      img.src = src;
    });
  }

  // ---------------------------------------------------------------- layout
  let dpr = 1;

  function measure() {
    const r = slot.getBoundingClientRect();
    const l = state.layout;
    l.cx = r.left + r.width / 2;
    l.cy = r.top + r.height / 2;
    l.u = r.width / SLOT_SIZE;
    l.horizontal = portrait.matches;
    root.style.setProperty('--slot-x', `${l.cx}px`);
    root.style.setProperty('--slot-y', `${l.cy}px`);

    // Intro start position: both words together, centred in the headline box.
    // offset* ignores transforms, so this is safe to recompute at any time.
    if (state.intro) {
      const hero = slot.parentElement;
      const [make, digital] = hero.querySelectorAll('.word');
      const set = (el, x, y) => {
        el.style.setProperty('--intro-x', `${x}px`);
        el.style.setProperty('--intro-y', `${y}px`);
      };
      if (l.horizontal) {
        const top = (hero.offsetHeight - make.offsetHeight - digital.offsetHeight) / 2;
        set(make, 0, top - make.offsetTop);
        set(digital, 0, top + make.offsetHeight - digital.offsetTop);
      } else {
        const gap = parseFloat(getComputedStyle(hero).fontSize) * 0.24; // a word space
        const left = (hero.offsetWidth - make.offsetWidth - gap - digital.offsetWidth) / 2;
        set(make, left - make.offsetLeft, 0);
        set(digital, left + make.offsetWidth + gap - digital.offsetLeft, 0);
      }
    }

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  // ---------------------------------------------------------------- captions
  function setActive(index) {
    if (index === state.active) return;
    const prev = state.active;
    state.active = index;

    captions.forEach((el, i) => {
      const on = i === index;
      el.classList.toggle('is-active', on);
      el.classList.toggle('is-out', i === prev);
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (i === prev) setTimeout(() => el.classList.remove('is-out'), 450);
    });
    fallbackImgs.forEach((el, i) => el.classList.toggle('is-active', i === index));
  }

  // ---------------------------------------------------------------- input
  const touch = () => { state.lastInteraction = performance.now(); };

  function go(delta) {
    state.target = Math.round(state.target) + delta;
    touch();
  }

  // Settle on the nearest slide, but a small push in one direction is enough
  // to commit to the next one.
  function snap(direction) {
    const t = state.target;
    if (direction > 0) state.target = Math.ceil(t - 0.15);
    else if (direction < 0) state.target = Math.floor(t + 0.15);
    else state.target = Math.round(t);
  }

  let wheelTimer = 0;
  let wheelDir = 0;
  window.addEventListener('wheel', (e) => {
    if (e.target.closest && e.target.closest('.glass, .contact')) return; // let the sheets scroll
    e.preventDefault();
    const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const px = e.deltaMode === 1 ? raw * 32 : raw;
    const step = clamp(px, -90, 90) / 280;
    // Never run more than one and a half slides ahead of what is on screen.
    state.target = clamp(state.target + step, state.pos - 1.5, state.pos + 1.5);
    wheelDir = Math.sign(step) || wheelDir;
    touch();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { snap(wheelDir); wheelDir = 0; }, 140);
  }, { passive: false });

  const drag = { id: null, start: 0, startTarget: 0, last: 0, lastT: 0, speed: 0 };
  const axisValue = (e) => (state.layout.horizontal ? e.clientX : e.clientY);

  window.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a, button, .glass, .contact')) return;
    drag.id = e.pointerId;
    drag.start = drag.last = axisValue(e);
    drag.lastT = performance.now();
    drag.startTarget = state.target;
    drag.speed = 0;
    state.dragging = true;
    document.body.classList.add('is-dragging');
    touch();
  });

  window.addEventListener('pointermove', (e) => {
    state.mouseRaw[0] += e.clientX - (state.mouse[0] < -9000 ? e.clientX : state.mouse[0]);
    state.mouseRaw[1] += e.clientY - (state.mouse[1] < -9000 ? e.clientY : state.mouse[1]);
    state.mouse[0] = e.clientX;
    state.mouse[1] = e.clientY;

    if (!state.dragging || e.pointerId !== drag.id) return;
    const v = axisValue(e);
    const now = performance.now();
    const dist = 300 * state.layout.u; // drag distance for one slide
    drag.speed = (v - drag.last) / Math.max(1, now - drag.lastT);
    drag.last = v;
    drag.lastT = now;
    state.target = drag.startTarget - (v - drag.start) / dist;
    touch();
  });

  function endDrag(e) {
    if (!state.dragging || e.pointerId !== drag.id) return;
    state.dragging = false;
    drag.id = null;
    document.body.classList.remove('is-dragging');
    const moved = state.target - drag.startTarget;
    const flick = Math.abs(drag.speed) > 0.35 ? -Math.sign(drag.speed) : 0;
    snap(flick || (Math.abs(moved) > 0.02 ? Math.sign(moved) : 0));
    touch();
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  document.addEventListener('pointerleave', () => { state.mouse[0] = state.mouse[1] = -9999; });

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('.glass, .contact')) return;
    if (document.querySelector('.contact.is-open')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') { go(1); e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') { go(-1); e.preventDefault(); }
    else if (e.key === ' ' && !e.target.closest('a, button')) { go(1); e.preventDefault(); }
  });

  // ---------------------------------------------------------------- language
  // "DIGITAL" stays in English everywhere; only "We Make" and the captions change.
  const I18N = {
    en: {
      pill: 'Eng', name: 'English', make: 'We Make',
      captions: ['FOOD DELIVERY SERVICE', 'BEAUTY SERVICE', 'DRONE CONTROL APP', 'TAXI APP'],
    },
    es: {
      pill: 'Esp', name: 'Español', make: 'Hacemos',
      captions: ['SERVICIO DE ENTREGA DE COMIDA', 'SERVICIO DE BELLEZA', 'APP DE CONTROL DE DRONES', 'APP DE TAXI'],
    },
    ru: {
      pill: 'Рус', name: 'Русский', make: 'Делаем',
      captions: ['СЕРВИС ДОСТАВКИ ЕДЫ', 'СЕРВИС КРАСОТЫ', 'ПРИЛОЖЕНИЕ ДЛЯ УПРАВЛЕНИЯ ДРОНОМ', 'ПРИЛОЖЕНИЕ ТАКСИ'],
    },
  };
  const LANGS = Object.keys(I18N);
  const langButton = document.getElementById('lang');
  const makeWord = document.getElementById('make');
  const hero = document.getElementById('hero');
  let lang = 'en';
  let langTimer = 0;

  // Swap the pill label: the old name slides up and out, the new one rises in.
  function setPill(text, animate) {
    const labels = Array.from(langButton.querySelectorAll('.lang__label'));
    const current = labels.find((el) => !el.classList.contains('is-out'));
    if (current && current.textContent === text) return;

    const next = document.createElement('span');
    next.className = 'lang__label';
    next.textContent = text;

    if (!animate) {
      langButton.replaceChildren(next);
      return;
    }

    labels.forEach((el) => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 520);
    });
    next.classList.add('is-in');
    langButton.append(next);
    next.getBoundingClientRect(); // commit the starting position
    next.classList.remove('is-in');
  }

  function applyLang(code) {
    const t = I18N[code];
    lang = code;
    root.lang = code;
    makeWord.textContent = t.make;
    hero.setAttribute('aria-label', `${t.make} DIGITAL`);
    captions.forEach((el, i) => { el.textContent = t.captions[i]; });
    setPill(t.pill, false);
    langButton.setAttribute('aria-label', `Language: ${t.name}. Switch language`);
    try { localStorage.setItem('cr8tive-lang', code); } catch (e) { /* private mode */ }
    measure(); // the translated word has another width, so the slot moves
  }

  function switchLang() {
    const next = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
    clearTimeout(langTimer);
    if (reducedMotion.matches) { applyLang(next); return; }
    lang = next; // so quick repeated clicks keep cycling
    setPill(I18N[next].pill, true);
    root.classList.add('is-switching');
    langTimer = setTimeout(() => {
      // Hidden now: put the words back together, swap the texts, then fade in
      // and replay the intro in the new language.
      playIntro(INTRO_HOLD_LANG_MS);
      applyLang(next);
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-switching')));
    }, 320);
  }

  langButton.addEventListener('click', switchLang);

  let savedLang = null;
  try { savedLang = localStorage.getItem('cr8tive-lang'); } catch (e) { /* private mode */ }
  if (savedLang && I18N[savedLang] && savedLang !== 'en') applyLang(savedLang);

  // ---------------------------------------------------------------- render
  const glCtx = createGL();
  let textures = null;
  root.classList.toggle('has-webgl', !!glCtx);

  function draw(time) {
    const { gl, uniforms: U } = glCtx;
    const l = state.layout;
    const still = reducedMotion.matches;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!textures) return;

    // Idle float + a little parallax towards the cursor.
    let cx = l.cx;
    let cy = l.cy;
    if (!still) {
      cy += Math.sin(time * 1.1) * 5 * l.u;
      cx += Math.cos(time * 0.8) * 2.5 * l.u;
      if (state.mouse[0] > -9000) {
        cx += clamp((state.mouse[0] - window.innerWidth / 2) / window.innerWidth, -0.5, 0.5) * 14 * l.u;
        cy += clamp((state.mouse[1] - window.innerHeight / 2) / window.innerHeight, -0.5, 0.5) * 14 * l.u;
      }
    }

    // How far we are from a resting slide: flat at rest, wrapped while moving.
    const frac = Math.abs(state.pos - Math.round(state.pos));
    const bend = clamp(frac / 0.22, 0, 1);
    const bendEased = bend * bend * (3 - 2 * bend);

    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uCenter, cx * dpr, cy * dpr);
    gl.uniform1f(U.uU, l.u * dpr);
    gl.uniform1f(U.uRadius, RADIUS);
    gl.uniform1f(U.uBend, bendEased);
    gl.uniform1f(U.uVel, still ? 0 : state.vel);
    gl.uniform1f(U.uAxis, l.horizontal ? 1 : 0);
    gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uMouse, (state.mouse[0] - cx) / l.u, (state.mouse[1] - cy) / l.u);
    gl.uniform2f(U.uMouseVel, still ? 0 : state.mouseVel[0], still ? 0 : state.mouseVel[1]);

    for (let i = 0; i < N; i++) {
      // Shortest signed distance on the loop → the reel is endless both ways.
      let d = mod(i - state.pos + N / 2, N) - N / 2;
      const theta = d * STEP;
      if (Math.cos(theta) < 0.4) continue;
      if (state.solo && i !== state.solo.index) continue;

      const s = SLIDES[i];
      gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      gl.uniform2f(U.uSize, s.size[0], s.size[1]);
      gl.uniform2f(U.uOffset, 0, l.horizontal ? 0 : s.dy);
      gl.uniform1f(U.uRot, (s.rot * Math.PI) / 180);
      gl.uniform1f(U.uTheta, theta);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  let lastTime = 0;
  function frame(nowMs) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (nowMs - lastTime) / 1000 || 0.016);
    lastTime = nowMs;

    // Autoplay.
    if (!state.intro && !state.dragging && !reducedMotion.matches && !document.hidden &&
        nowMs - state.lastInteraction > AUTOPLAY_MS) {
      state.target = Math.round(state.target) + 1;
      state.lastInteraction = nowMs;
    }

    // Spring towards the target (sub-stepped for stability). The reel waits
    // for the intro, so its roll-in starts as the words part.
    const steps = state.intro ? 0 : 4;
    const h = dt / 4;
    for (let i = 0; i < steps; i++) {
      state.vel += ((state.target - state.pos) * SPRING - state.vel * DAMPING) * h;
      state.pos += state.vel * h;
    }

    // Smoothed cursor velocity for the liquid drag.
    const u = state.layout.u;
    const k = 0.18;
    state.mouseVel[0] += (clamp(state.mouseRaw[0] / u, -70, 70) - state.mouseVel[0]) * k;
    state.mouseVel[1] += (clamp(state.mouseRaw[1] / u, -70, 70) - state.mouseVel[1]) * k;
    state.mouseRaw[0] = state.mouseRaw[1] = 0;

    if (state.solo && (Math.abs(state.pos - state.target) < 0.03 || state.target !== state.solo.target)) state.solo = null;

    setActive(mod(Math.round(state.pos), N));

    if (glCtx) draw(nowMs / 1000);
  }

  // ---------------------------------------------------------------- boot
  // The words sit together in the centre for `hold` ms, then part (400 ms)
  // while the current project rolls in and the caption appears.
  let introTimer = 0;
  function playIntro(hold) {
    clearTimeout(introTimer);
    if (reducedMotion.matches) return;

    const current = Math.round(state.target);
    state.intro = true;
    state.target = current;
    state.pos = current - 0.49;
    state.vel = 0;
    state.solo = { index: mod(current, N), target: current };
    root.classList.add('is-intro');
    measure();

    introTimer = setTimeout(() => {
      state.intro = false;
      state.lastInteraction = performance.now();
      root.classList.remove('is-intro');
    }, hold);
  }

  function start() {
    measure();
    playIntro(INTRO_HOLD_MS);
    if (!state.intro) state.pos = state.target; // reduced motion: no roll-in
    state.lastInteraction = performance.now();
    root.classList.add('is-ready');
    // Once the first intro has played, the canvas uses the quicker language-switch fade.
    setTimeout(() => root.classList.add('is-settled'), (state.intro ? INTRO_HOLD_MS : 0) + 900);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', measure);
  portrait.addEventListener('change', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(slot);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  // The Cyrillic font loads on first use and changes the word's width.
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', measure);

  if (glCtx) {
    Promise.all(SLIDES.map((s) => loadTexture(glCtx.gl, s.src)))
      .then((t) => { textures = t; })
      .catch((err) => {
        console.warn('[cr8tive] textures failed, using fallback:', err);
        root.classList.remove('has-webgl');
      })
      .finally(start);
  } else {
    state.pos = 0;
    start();
  }
})();
