/* CR8TIVE promo — infinite WebGL project reel between "We Make" and "DIGITAL".
   No dependencies. Sizes and offsets are in design pixels of the 1728 × 1117 Figma frame. */

(() => {
  'use strict';

  // ---------------------------------------------------------------- slides
  // size: rendered size in the mockup; dy: vertical offset of the image centre
  // from the headline centre; rot: rotation in degrees (CSS direction).
  const SLIDES = [
    { src: 'assets/projects/tapas.webp',  size: [371, 371],         dy: 0,   rot: 0 },
    { src: 'assets/projects/beauty.webp', size: [323.703, 323.703], dy: 0,   rot: -4.15 },
    { src: 'assets/projects/drone.webp',  size: [378, 189],         dy: 0,   rot: 0 },
    { src: 'assets/projects/taxi-fasten.webp', size: [460, 306.667], dy: 0, rot: 0 },
    { src: 'assets/projects/kaspersky-promo-site.webp', size: [428, 428], dy: 0, rot: 0 },
  ];

  const HOME_SLIDES = [
    { image: 0, caption: 0 },
    { image: 1, caption: 1 },
    { image: 2, caption: 2 },
    { image: 4, caption: 7, title: 'KASPERSKY' },
  ];

  const SLOT_SIZE = 371;      // design px, width of the .slot element
  const RADIUS = 360;         // drum radius, design px
  const STEP = 1.2;           // angle between neighbouring slides, radians
  const NO_LIQUID_WORK_SLIDES = new Set([0, 1, 2, 3]);
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
  const HOME_SLIDE_COUNT = HOME_SLIDES.length;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = window.matchMedia('(max-aspect-ratio: 1/1)');

  const mod = (a, n) => ((a % n) + n) % n;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ---------------------------------------------------------------- state
  const state = {
    pos: -0.49,      // continuous slide position; integer = slide at rest
    view: 'home',    // 'home' | 'work' | 'what' | 'food' | 'studio'
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
        gl.activeTexture(gl.TEXTURE0);
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
    if (state.view !== 'home') return; // the Work page scrolls normally
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
    if (state.view !== 'home') return;
    if (e.button !== 0 || e.target.closest('a, button, .glass, .contact, .nav')) return;
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
    if (document.querySelector('.contact.is-open') || root.classList.contains('menu-open')) return;
    if (state.view !== 'home') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') { go(1); e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') { go(-1); e.preventDefault(); }
    else if (e.key === ' ' && !e.target.closest('a, button')) { go(1); e.preventDefault(); }
  });

  // ---------------------------------------------------------------- work page
  const workView = document.getElementById('work-view');
  const workItems = Array.from(document.querySelectorAll('.card')).map((el) => ({
    el,
    media: el.querySelector('.card__media'),
    slide: Number(el.dataset.slide),
    staticMedia: el.classList.contains('card--static-media'),
  }));
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function createWorkPreview(video, name) {
    let visible = false;
    let failed = false;
    function fail(error) {
      if (failed) return;
      failed = true;
      video.pause();
      video.parentElement.classList.add('card__media--video-failed');
      console.warn(`[cr8tive] ${name} preview playback failed:`, error);
    }
    function update() {
      if (state.view !== 'work' || !visible || document.hidden || reducedMotion.matches || failed) {
        video.pause();
        return;
      }
      if (!video.getAttribute('src')) video.src = video.dataset.src;
      video.play().catch((error) => {
        if (error.name !== 'AbortError') fail(error);
      });
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }, { root: workView, threshold: 0.1 });
    observer.observe(video.parentElement);
    video.addEventListener('error', () => fail(video.error));
    return update;
  }
  const workPreviewUpdates = [
    createWorkPreview(document.getElementById('dji-preview'), 'DJI'),
    createWorkPreview(document.getElementById('beyonce-preview'), 'Beyoncé'),
    createWorkPreview(document.getElementById('trump-preview'), 'Trump Inc.'),
  ];
  function updateWorkPreviews() {
    workPreviewUpdates.forEach((update) => update());
  }
  let previewReducedMotion = reducedMotion.matches;
  reducedMotion.addEventListener('change', updateWorkPreviews);
  document.addEventListener('visibilitychange', updateWorkPreviews);
  // ---------------------------------------------------------------- pages
  const VIEWS = { '#work': 'work', '#what': 'what', '#food-delivery': 'food', '#studio': 'studio' };
  const viewFromHash = () => VIEWS[location.hash] || 'home';
  const whatView = document.getElementById('what-view');
  const foodView = document.getElementById('food-view');
  const studioView = document.getElementById('studio-view');
  const stories = window.CR8TIVE_STORIES;
  if (!Array.isArray(stories)) {
    throw new TypeError('Stories data is missing: expected an array in stories.js.');
  }
  const storySection = document.querySelector('.studio__stories');
  const storyList = document.getElementById('studio-stories-list');
  const storyDialog = document.getElementById('story-viewer');
  const storyTitle = document.getElementById('story-viewer-title');
  const storyProgress = document.getElementById('story-viewer-progress');
  const storyStage = document.getElementById('story-viewer-stage');
  const storyCaption = document.getElementById('story-viewer-caption');
  const storyCloseButton = document.getElementById('story-viewer-close');
  const storyPreviousButton = document.getElementById('story-viewer-previous');
  const storyNextButton = document.getElementById('story-viewer-next');
  let activeStoryIndex = -1;
  let storyTrigger = null;
  let storyTimer = 0;
  let storySwipeStart = null;
  let viewTimer = 0;

  function applyView(view) {
    state.view = view;
    updateWorkPreviews();
    root.classList.toggle('view-work', view === 'work');
    root.classList.toggle('view-what', view === 'what');
    root.classList.toggle('view-food-delivery', view === 'food');
    root.classList.toggle('view-studio', view === 'studio');
    [[workButton, view === 'work' || view === 'food'], [whatButton, view === 'what'], [studioButton, view === 'studio']].forEach(([button, isCurrent]) => {
      if (!button) return;
      button.classList.toggle('is-current', isCurrent);
      if (isCurrent) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (view === 'what') {
      whatView.scrollTop = 0;
    } else if (view === 'work') {
      workView.scrollTop = 0;
    } else if (view === 'food') {
      foodView.scrollTop = 0;
    } else if (view === 'studio') {
      studioView.scrollTop = 0;
    } else {
      state.lastInteraction = performance.now();
      measure();
    }
    // Replace the previous view's canvas frame before the fade-in.
    if (glCtx) draw(performance.now() / 1000);
  }

  // Fade the current page out, swap, fade the next one in.
  function showView(view, animate = true) {
    if (view === state.view) return;
    clearTimeout(viewTimer);
    if (!animate || reducedMotion.matches) { applyView(view); return; }
    root.classList.add('is-switching');
    viewTimer = setTimeout(() => {
      applyView(view);
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-switching')));
    }, 320);
  }

  window.addEventListener('hashchange', () => showView(viewFromHash()));
  window.addEventListener('popstate', () => showView(viewFromHash()));

  document.querySelectorAll('.nav .touch').forEach((button) => {
    button.addEventListener('pointerdown', () => button.classList.add('is-pointer-focused'));
    button.addEventListener('keydown', () => button.classList.remove('is-pointer-focused'));
    button.addEventListener('blur', () => button.classList.remove('is-pointer-focused'));
  });

  document.getElementById('work').addEventListener('click', () => {
    if (location.hash !== '#work') location.hash = 'work';
  });

  document.getElementById('what').addEventListener('click', () => {
    if (location.hash !== '#what') location.hash = 'what';
  });

  document.getElementById('studio').addEventListener('click', () => {
    if (location.hash !== '#studio') location.hash = 'studio';
  });

  // "Start a project" at the end of What We Do opens the brief form.
  document.getElementById('what-cta').addEventListener('click', () => {
    document.getElementById('touch').click();
  });

  document.querySelectorAll('[data-open-brief]').forEach((button) => {
    button.addEventListener('click', () => document.getElementById('touch').click());
  });

  document.querySelector('.logo').addEventListener('click', (e) => {
    if (state.view === 'home' && !location.hash) return; // plain reload of the home page
    e.preventDefault();
    history.pushState(null, '', location.pathname + location.search);
    showView('home');
  });

  // ---------------------------------------------------------------- language
  // "DIGITAL" stays in English everywhere; only "We Make" and the captions change.
  const I18N = {
    en: {
      pill: 'Eng', name: 'English', make: 'We Make', work: 'Work', what: 'What We Do',
      studio: {
        nav: 'About Us',
        ariaLabel: 'About Us',
        eyebrow: 'Digital boutique agency · Based in Spain',
        title: 'Experience-led. Built by experts.',
        lead: 'CR8TIVE is a digital boutique agency based in Spain, led by Yuriy Yurchenko, a product designer with more than 25 years of experience. He has helped create digital products used by millions, with experience at Pleo and Sber.',
        experience: 'years of professional experience',
        engineering: 'years in software development',
        ios: 'years as a lead iOS developer',
        clientsEyebrow: 'Selected client experience',
        clientsTitle: 'From established companies to ambitious startups.',
        clientsCopy: 'We work with established companies, startups, and small and medium-sized businesses. Selected client experience includes:',
        clientsLabel: 'Selected clients',
        storiesTitle: 'Studio stories',
        storiesLabel: 'Studio stories',
        storyCategories: { 'work-in-progress': 'Work in progress', 'live-moments': 'Live moments' },
        storyNumber: 'Story {number}',
        storyClose: 'Close stories',
        storyPrevious: 'Previous story',
        storyNext: 'Next story',
        storyMediaError: 'This story could not be loaded.',
        teamEyebrow: 'Design and engineering',
        teamTitle: 'Senior product thinking. Expert technical delivery.',
        teamCopy: 'Co-founders Yuriy Yurchenko and Denis Kashin lead product design and technical delivery. Marina Omelchenko has more than 16 years of experience managing IT projects and client relationships. Denis works with senior engineers and has 20 years in software development, including 12 years as a lead iOS developer in large corporations.',
        founderName: 'Yuriy Yurchenko',
        founderRole: 'Co-founder · Product designer',
        founderCopy: 'More than 25 years of professional experience. Previously at Pleo and Sber.',
        cofounderName: 'Denis Kashin',
        cofounderRole: 'Co-founder · Engineering',
        cofounderCopy: '20 years in software development, including 12 years as a lead iOS developer in large corporations.',
        projectLeadName: 'Marina Omelchenko',
        projectLeadRole: 'Co-founder · Project & client lead',
        projectLeadCopy: 'More than 16 years of experience managing IT projects and client relationships.',
        awardsEyebrow: 'Recognition',
        awardsTitle: 'Work recognized by the design community.',
        awardsCopy: 'Projects have received recognition from Awwwards, CSS Design Awards, Behance Selected, Tappawards, and others.',
        awardsLabel: 'Awards and recognition',
        footer: 'Building a new product or evolving an existing one? Tell us about it.',
        footerAgency: 'We also collaborate with agencies on digital projects, including under NDA.',
        cta: 'Discuss a project',
      },
      captions: ['CDB®', 'BLOOKD', 'DJI x PolarPro', 'FASTEN', 'TRUMP INC.', 'JACK DANIEL\'S', 'BEYONCÉ WORLD TOUR', 'KASPERSKY PROMO SITE', 'MYFRESH'],
      subs: ['Mobile app · Website', 'Mobile app · Branding', 'Mobile app', 'Mobile app · Branding', 'Concierge mobile app', 'Mobile promo app', 'Promotional website · World tour', 'Promotional website', 'Online store · Mobile app'],
      whatLead: 'We turn ideas into digital things people open every day.',
      whatCta: 'Start a project',
      services: [
        ['Research & audits', 'Before we draw anything, we look. We study your users, market and product, and audit what already exists to find what holds it back.'],
        ['Web & mobile apps', 'We build products that work on day one and still work on day one thousand: web platforms and mobile apps, from the first prototype to release.'],
        ['Interface design', 'Screens that explain themselves. We design flows where the next step is always obvious and nothing gets in the way.'],
        ['Branding', 'A name, a voice, a face. We give a product a character people recognise before they read a word.'],
        ['Graphic design', 'Everything a brand shows the world: identity, packaging, illustration, motion and campaign visuals.'],
        ['Support', 'Launch is the beginning. We stay: updates, new features, fixes and a team that answers.'],
      ],
      project: {
        ariaLabel: 'CDB® case study',
        label: 'Food delivery · Spain',
        back: 'Back to Work',
        eyebrow: 'Brand identity · Mobile app · Campaign',
        title: 'Cocina de tu barrio',
        lead: 'Good food from around the corner.',
        intro: 'A neighborhood-first food delivery concept that brings independent kitchens together in one simple mobile experience. The work spans market research, brand identity, app design, packaging, and a campaign that takes the brand into the street.',
        scopeLabel: 'Scope',
        scope: 'Research · Identity · Mobile app · Packaging',
        categoryLabel: 'Category',
        category: 'Food delivery',
        opportunityKicker: '01 / The opportunity',
        opportunityTitle: 'Built around the neighborhood.',
        opportunityBody: 'We started with the idea of bringing trusted local kitchens closer to their neighbors. Research helped shape a clear proposition for discovering, ordering, and growing beyond a single district.',
        appKicker: '02 / The app',
        appTitle: 'From discovery to doorstep.',
        appBody: 'A direct path through restaurant discovery, dish search, checkout, and live order updates. Clear steps keep the experience easy to follow before and after the order.',
        brandKicker: '03 / The brand',
        brandTitle: 'Made to live beyond the screen.',
        brandBody: 'A bright, confident identity extends from the app to packaging, shopfronts, delivery concepts, and transit campaigns—meeting people where their neighborhood already is.',
        outro: 'A connected brand and product experience for local food, from the first browse to the final handoff.',
        captions: [
          'App home screen and brand identity',
          'Brand identity and app icon',
          'Market opportunity across Spain',
          'Search and account screens',
          'Basket and checkout',
          'Live order tracking',
          'A shareable gifting experience',
          'A flexible brand system across touchpoints',
          'Transit campaign in Alicante',
          'A neighborhood storefront',
          'A branded delivery robot concept',
          'Prepared fish meal packaging',
          'Drinks packaging',
          'Ready-to-heat meal packaging',
        ],
      },
    },
    es: {
      pill: 'Esp', name: 'Español', make: 'Hacemos', work: 'Proyectos', what: 'Qué hacemos',
      studio: {
        nav: 'Sobre nosotros',
        ariaLabel: 'Sobre nosotros',
        eyebrow: 'Estudio boutique digital · En España',
        title: 'Experiencia que da forma a mejores productos.',
        lead: 'CR8TIVE es un estudio boutique digital con sede en España, dirigido por Yuriy Yurchenko, diseñador de producto con más de 25 años de experiencia. Ha contribuido a crear productos digitales que utilizan millones de personas. Anteriormente trabajó en Pleo y Sber.',
        experience: 'años de experiencia profesional',
        engineering: 'años en desarrollo de software',
        ios: 'años como desarrollador líder de iOS',
        clientsEyebrow: 'Experiencia con clientes',
        clientsTitle: 'De grandes empresas a startups ambiciosas.',
        clientsCopy: 'Trabajamos con empresas consolidadas, startups y pequeñas y medianas empresas. Entre nuestra experiencia con clientes:',
        clientsLabel: 'Clientes seleccionados',
        storiesTitle: 'Historias del estudio',
        storiesLabel: 'Historias del estudio',
        storyCategories: { 'work-in-progress': 'En proceso', 'live-moments': 'Momentos en directo' },
        storyNumber: 'Historia {number}',
        storyClose: 'Cerrar historias',
        storyPrevious: 'Historia anterior',
        storyNext: 'Siguiente historia',
        storyMediaError: 'No se pudo cargar esta historia.',
        teamEyebrow: 'Diseño e ingeniería',
        teamTitle: 'Criterio de producto senior. Ejecución técnica experta.',
        teamCopy: 'Los cofundadores Yuriy Yurchenko y Denis Kashin lideran el diseño de producto y la ejecución técnica. Marina Omelchenko cuenta con más de 16 años de experiencia gestionando proyectos de TI y la relación con los clientes. Denis trabaja con ingenieros senior y cuenta con 20 años de experiencia en desarrollo de software, incluidos 12 como desarrollador líder de iOS en grandes corporaciones.',
        founderName: 'Yuriy Yurchenko',
        founderRole: 'Cofundador · Diseñador de producto',
        founderCopy: 'Más de 25 años de experiencia profesional. Anteriormente trabajó en Pleo y Sber.',
        cofounderName: 'Denis Kashin',
        cofounderRole: 'Cofundador · Ingeniería',
        cofounderCopy: '20 años de experiencia en desarrollo de software, incluidos 12 como desarrollador líder de iOS en grandes corporaciones.',
        projectLeadName: 'Marina Omelchenko',
        projectLeadRole: 'Cofundadora · Responsable de proyectos y clientes',
        projectLeadCopy: 'Más de 16 años de experiencia gestionando proyectos de TI y la relación con los clientes.',
        awardsEyebrow: 'Reconocimientos',
        awardsTitle: 'Trabajo reconocido por la comunidad del diseño.',
        awardsCopy: 'Proyectos reconocidos por Awwwards, CSS Design Awards, Behance Selected, Tappawards y otros.',
        awardsLabel: 'Premios y reconocimientos',
        footer: '¿Estás creando un producto o haciendo evolucionar uno existente? Cuéntanoslo.',
        footerAgency: 'También colaboramos con agencias en proyectos digitales, incluso bajo NDA.',
        cta: 'Hablemos de tu proyecto',
      },
      captions: ['CDB®', 'BLOOKD', 'DJI x PolarPro', 'FASTEN', 'TRUMP INC.', 'JACK DANIEL\'S', 'BEYONCÉ WORLD TOUR', 'KASPERSKY PROMO SITE', 'MYFRESH'],
      subs: ['App móvil · Sitio web', 'App móvil · Branding', 'App móvil', 'App móvil · Branding', 'App móvil de conserjería', 'App móvil promocional', 'Sitio web promocional · Gira mundial', 'Sitio web promocional', 'Tienda online · App móvil'],
      whatLead: 'Convertimos ideas en productos digitales que la gente abre cada día.',
      whatCta: 'Empezar un proyecto',
      services: [
        ['Investigación y auditoría', 'Antes de dibujar, miramos. Estudiamos a tus usuarios, tu mercado y tu producto, y auditamos lo que ya existe para encontrar qué lo frena.'],
        ['Apps web y móviles', 'Construimos productos que funcionan el primer día y el día mil: plataformas web y apps móviles, del primer prototipo al lanzamiento.'],
        ['Diseño de interfaces', 'Pantallas que se explican solas. Diseñamos flujos donde el siguiente paso siempre es evidente y nada estorba.'],
        ['Branding', 'Un nombre, una voz, un rostro. Damos al producto un carácter que se reconoce antes de leer una sola palabra.'],
        ['Diseño gráfico', 'Todo lo que una marca muestra al mundo: identidad, packaging, ilustración, motion y visuales de campaña.'],
        ['Soporte', 'El lanzamiento es el comienzo. Nos quedamos: actualizaciones, nuevas funciones, correcciones y un equipo que responde.'],
      ],
      project: {
        ariaLabel: 'Caso de estudio de CDB®',
        label: 'Reparto de comida · España',
        back: 'Volver a Proyectos',
        eyebrow: 'Identidad · App móvil · Campaña',
        title: 'Cocina de tu barrio',
        lead: 'Buen comer, a la vuelta de la esquina.',
        intro: 'Un concepto de delivery pensado para el barrio que reúne cocinas independientes en una experiencia móvil sencilla. El proyecto abarca investigación de mercado, identidad de marca, diseño de la app, packaging y una campaña que lleva la marca a la calle.',
        scopeLabel: 'Alcance',
        scope: 'Investigación · Identidad · App móvil · Packaging',
        categoryLabel: 'Categoría',
        category: 'Reparto de comida',
        opportunityKicker: '01 / La oportunidad',
        opportunityTitle: 'Pensado para el barrio.',
        opportunityBody: 'Partimos de la idea de acercar las cocinas locales de confianza a sus vecinos. La investigación ayudó a definir una propuesta clara para descubrir, pedir y crecer más allá de un solo barrio.',
        appKicker: '02 / La app',
        appTitle: 'De descubrir a recibir.',
        appBody: 'Un recorrido directo por restaurantes, búsqueda de platos, pago y seguimiento del pedido. Cada paso ayuda a entender qué ocurre antes y después de pedir.',
        brandKicker: '03 / La marca',
        brandTitle: 'Una marca que sale a la calle.',
        brandBody: 'Una identidad llena de energía conecta la app con los envases, los locales, los conceptos de reparto y las campañas de transporte, allí donde ya está el barrio.',
        outro: 'Una experiencia de marca y producto conectada, desde el primer vistazo al menú hasta la entrega.',
        captions: [
          'Inicio de la app e identidad de marca',
          'Identidad de marca e icono de la app',
          'Oportunidad de mercado en España',
          'Búsqueda y perfil',
          'Cesta y pago',
          'Seguimiento del pedido',
          'Una experiencia para regalar',
          'Sistema de marca aplicado a distintos soportes',
          'Campaña en el tranvía de Alicante',
          'Un local de barrio',
          'Concepto de robot de reparto de marca',
          'Envase para platos preparados de pescado',
          'Envases para bebidas',
          'Envase para platos listos para calentar',
        ],
      },
    },
    ru: {
      pill: 'Рус', name: 'Русский', make: 'Делаем', work: 'Работы', what: 'Что мы делаем',
      studio: {
        nav: 'О нас',
        ariaLabel: 'О нас',
        eyebrow: 'Бутик-агентство · Испания',
        title: 'Создаём продукты, за которыми стоит опыт.',
        lead: 'CR8TIVE — цифровое бутик-агентство в Испании под руководством Юрия Юрченко, продуктового дизайнера с опытом более 25 лет. Он участвовал в создании цифровых продуктов, которыми пользуются миллионы. Ранее работал в Pleo и Sber.',
        experience: 'лет профессионального опыта',
        engineering: 'лет в разработке программного обеспечения',
        ios: 'лет ведущим iOS-разработчиком',
        clientsEyebrow: 'Клиентский опыт',
        clientsTitle: 'От крупных компаний до амбициозных стартапов.',
        clientsCopy: 'Мы работаем с крупным бизнесом, стартапами, малым и средним бизнесом. Среди клиентов:',
        clientsLabel: 'Клиенты',
        storiesTitle: 'Истории студии',
        storiesLabel: 'Истории студии',
        storyCategories: { 'work-in-progress': 'В процессе', 'live-moments': 'Живые моменты' },
        storyNumber: 'История {number}',
        storyClose: 'Закрыть истории',
        storyPrevious: 'Предыдущая история',
        storyNext: 'Следующая история',
        storyMediaError: 'Не удалось загрузить эту историю.',
        teamEyebrow: 'Дизайн и инженерная экспертиза',
        teamTitle: 'Сильная продуктовая экспертиза. Техническая реализация высокого уровня.',
        teamCopy: 'Сооснователи Юрий Юрченко и Денис Кашин отвечают за продуктовый дизайн и техническую реализацию. Марина Омельченко более 16 лет управляет IT-проектами и выстраивает отношения с клиентами. Денис работает с командой опытных инженеров; у него 20 лет опыта в разработке, включая 12 лет работы ведущим iOS-разработчиком в крупных корпорациях.',
        founderName: 'Юрий Юрченко',
        founderRole: 'Сооснователь · Продуктовый дизайнер',
        founderCopy: 'Более 25 лет профессионального опыта. Ранее работал в Pleo и Sber.',
        cofounderName: 'Денис Кашин',
        cofounderRole: 'Сооснователь · Инженерия',
        cofounderCopy: '20 лет в разработке программного обеспечения, включая 12 лет работы ведущим iOS-разработчиком в крупных корпорациях.',
        projectLeadName: 'Марина Омельченко',
        projectLeadRole: 'Сооснователь · Руководитель проектов и работы с клиентами',
        projectLeadCopy: 'Более 16 лет управляет IT-проектами и выстраивает отношения с клиентами.',
        awardsEyebrow: 'Признание',
        awardsTitle: 'Работы, отмеченные дизайн-сообществом.',
        awardsCopy: 'Проекты получали признание Awwwards, CSS Design Awards, Behance Selected, Tappawards и других площадок.',
        awardsLabel: 'Награды и признание',
        footer: 'Запускаете новый продукт или развиваете существующий? Расскажите нам о задаче.',
        footerAgency: 'Также сотрудничаем с агентствами в цифровых проектах, в том числе по NDA.',
        cta: 'Обсудить проект',
      },
      captions: ['CDB®', 'BLOOKD', 'DJI x PolarPro', 'FASTEN', 'TRUMP INC.', 'JACK DANIEL\'S', 'МИРОВОЙ ТУР БЕЙОНСЕ', 'KASPERSKY PROMO SITE', 'MYFRESH'],
      subs: ['Мобильное приложение · Сайт', 'Мобильное приложение · Брендинг', 'Мобильное приложение', 'Мобильное приложение · Брендинг', 'Мобильное приложение консьержа', 'Мобильное промо-приложение', 'Промосайт мирового тура', 'Промосайт', 'Интернет-магазин · Мобильное приложение'],
      whatLead: 'Превращаем идеи в цифровые продукты, которые открывают каждый день.',
      whatCta: 'Начать проект',
      services: [
        ['Исследования и аудит проектов', 'Прежде чем рисовать, смотрим. Изучаем ваших пользователей, рынок и продукт и проводим аудит того, что уже есть, чтобы найти, что его тормозит.'],
        ['Веб- и мобильные приложения', 'Строим продукты, которые работают в первый день и в тысячный: веб-платформы и мобильные приложения — от первого прототипа до релиза.'],
        ['Дизайн интерфейсов', 'Экраны, которые объясняют себя сами. Проектируем сценарии, где следующий шаг всегда очевиден и ничто не мешает.'],
        ['Брендинг', 'Имя, голос, лицо. Даём продукту характер, который узнают раньше, чем прочитают хоть слово.'],
        ['Графический дизайн', 'Всё, что бренд показывает миру: айдентика, упаковка, иллюстрации, моушн и визуалы для кампаний.'],
        ['Поддержка', 'Запуск — это начало. Мы остаёмся: обновления, новые функции, исправления и команда, которая отвечает.'],
      ],
      project: {
        ariaLabel: 'Кейс CDB®',
        label: 'Доставка еды · Испания',
        back: 'Назад к проектам',
        eyebrow: 'Айдентика · Мобильное приложение · Кампания',
        title: 'Cocina de tu barrio',
        lead: 'Любимая еда совсем рядом.',
        intro: 'Концепция сервиса доставки, который объединяет независимые кухни района в простом мобильном приложении. В проект вошли исследование рынка, айдентика, дизайн приложения, упаковка и городская кампания.',
        scopeLabel: 'Задачи',
        scope: 'Исследование · Айдентика · Приложение · Упаковка',
        categoryLabel: 'Категория',
        category: 'Доставка еды',
        opportunityKicker: '01 / Возможность',
        opportunityTitle: 'С опорой на местное сообщество.',
        opportunityBody: 'В основе — идея познакомить жителей с проверенными местными заведениями. Исследование помогло сформировать понятный сервис для поиска, заказа и дальнейшего развития.',
        appKicker: '02 / Приложение',
        appTitle: 'От поиска до двери.',
        appBody: 'Простой путь от выбора ресторана и поиска блюда до оплаты и отслеживания заказа. Каждый этап понятен до и после оформления.',
        brandKicker: '03 / Бренд',
        brandTitle: 'Бренд за пределами экрана.',
        brandBody: 'Яркая айдентика объединяет приложение, упаковку, витрины, концепции доставки и рекламу в городском транспорте — всё, что встречает жителей района.',
        outro: 'Цельный опыт бренда и продукта — от выбора еды до момента доставки.',
        captions: [
          'Главный экран приложения и айдентика',
          'Айдентика и иконка приложения',
          'Исследование рынка Испании',
          'Поиск и профиль пользователя',
          'Корзина и оформление заказа',
          'Отслеживание заказа',
          'Сценарий подарка и обмена',
          'Система бренда на разных носителях',
          'Реклама в трамвае Аликанте',
          'Витрина районного кафе',
          'Концепт фирменного робота-доставщика',
          'Упаковка готового блюда из рыбы',
          'Упаковка напитков',
          'Упаковка готового блюда с говядиной',
        ],
      },
    },
  };
  const LANGS = Object.keys(I18N);
  const langButton = document.getElementById('lang');
  const makeWord = document.getElementById('make');
  const workButton = document.getElementById('work');
  const whatButton = document.getElementById('what');
  const studioButton = document.getElementById('studio');
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
    if (workButton) workButton.textContent = t.work;
    workItems.forEach((it) => {
      it.el.querySelector('.card__title').textContent = t.captions[it.slide];
      it.el.querySelector('.card__sub').textContent = t.subs[it.slide];
    });
    workView.setAttribute('aria-label', t.work);

    const what = document.getElementById('what-view');
    what.setAttribute('aria-label', t.what);
    document.getElementById('what-lead').textContent = t.whatLead;
    document.getElementById('what-cta-label').textContent = t.whatCta;
    what.querySelectorAll('.svc').forEach((row, i) => {
      row.querySelector('.svc__title').textContent = t.services[i][0];
      row.querySelector('.svc__text').textContent = t.services[i][1];
    });
    const project = t.project;
    foodView.setAttribute('aria-label', project.ariaLabel);
    document.getElementById('food-project-label').textContent = project.label;
    document.getElementById('food-project-eyebrow').textContent = project.eyebrow;
    document.getElementById('food-project-title').textContent = project.title;
    document.getElementById('food-project-lead').textContent = project.lead;
    document.getElementById('food-project-intro').textContent = project.intro;
    document.getElementById('food-project-scope-label').textContent = project.scopeLabel;
    document.getElementById('food-project-scope').textContent = project.scope;
    document.getElementById('food-project-category-label').textContent = project.categoryLabel;
    document.getElementById('food-project-category').textContent = project.category;
    document.getElementById('food-opportunity-kicker').textContent = project.opportunityKicker;
    document.getElementById('food-opportunity-title').textContent = project.opportunityTitle;
    document.getElementById('food-opportunity-copy').textContent = project.opportunityBody;
    document.getElementById('food-app-kicker').textContent = project.appKicker;
    document.getElementById('food-app-title').textContent = project.appTitle;
    document.getElementById('food-app-copy').textContent = project.appBody;
    document.getElementById('food-brand-kicker').textContent = project.brandKicker;
    document.getElementById('food-brand-title').textContent = project.brandTitle;
    document.getElementById('food-brand-copy').textContent = project.brandBody;
    document.getElementById('food-project-outro').textContent = project.outro;
    foodView.querySelectorAll('[data-food-back]').forEach((label) => { label.textContent = project.back; });
    foodView.querySelectorAll('[data-food-caption]').forEach((caption, i) => { caption.textContent = project.captions[i]; });
    if (whatButton) whatButton.textContent = t.what;
    if (studioButton) studioButton.textContent = t.studio.nav;
    const studio = t.studio;
    studioView.setAttribute('aria-label', studio.ariaLabel);
    document.querySelector('.studio__name-list').setAttribute('aria-label', studio.clientsLabel);
    document.querySelector('.studio__award-list').setAttribute('aria-label', studio.awardsLabel);
    document.getElementById('studio-stories-title').textContent = studio.storiesTitle;
    storyList.setAttribute('aria-label', studio.storiesLabel);
    storyDialog.setAttribute('aria-label', studio.storiesTitle);
    storyCloseButton.setAttribute('aria-label', studio.storyClose);
    storyPreviousButton.setAttribute('aria-label', studio.storyPrevious);
    storyNextButton.setAttribute('aria-label', studio.storyNext);
    renderStories();
    if (storyDialog.open && activeStoryIndex >= 0) renderStory();
    Object.entries({
      'studio-eyebrow': 'eyebrow',
      'studio-title': 'title',
      'studio-lead': 'lead',
      'studio-experience': 'experience',
      'studio-engineering': 'engineering',
      'studio-ios': 'ios',
      'studio-clients-eyebrow': 'clientsEyebrow',
      'studio-clients-title': 'clientsTitle',
      'studio-clients-copy': 'clientsCopy',
      'studio-team-eyebrow': 'teamEyebrow',
      'studio-team-title': 'teamTitle',
      'studio-team-copy': 'teamCopy',
      'studio-founder-name': 'founderName',
      'studio-founder-role': 'founderRole',
      'studio-founder-copy': 'founderCopy',
      'studio-cofounder-name': 'cofounderName',
      'studio-cofounder-role': 'cofounderRole',
      'studio-cofounder-copy': 'cofounderCopy',
      'studio-project-lead-name': 'projectLeadName',
      'studio-project-lead-role': 'projectLeadRole',
      'studio-project-lead-copy': 'projectLeadCopy',
      'studio-awards-eyebrow': 'awardsEyebrow',
      'studio-awards-title': 'awardsTitle',
      'studio-awards-copy': 'awardsCopy',
      'studio-footer-copy': 'footer',
      'studio-footer-agency': 'footerAgency',
    }).forEach(([id, key]) => {
      document.getElementById(id).textContent = studio[key];
    });
    studioView.querySelectorAll('[data-studio-cta]').forEach((label) => {
      label.textContent = studio.cta;
    });
    hero.setAttribute('aria-label', `${t.make} DIGITAL`);
    captions.forEach((el, i) => { el.textContent = HOME_SLIDES[i].title ?? t.captions[HOME_SLIDES[i].caption]; });
    setPill(t.pill, false);
    langButton.setAttribute('aria-label', `Language: ${t.name}. Switch language`);
    try { localStorage.setItem('cr8tive-lang', code); } catch (e) { /* private mode */ }
    measure(); // the translated word has another width, so the slot moves
  }

  function storyCategoryLabel(story) {
    return I18N[lang].studio.storyCategories[story.category] || story.category;
  }

  function renderStories() {
    storyList.replaceChildren();
    storySection.hidden = stories.length === 0;
    stories.forEach((story, index) => {
      if (!story.id || !story.category || !story.src || (story.type !== 'image' && story.type !== 'video')) {
        throw new TypeError(`Story at index ${index} is missing a valid id, category, type, or src.`);
      }

      const label = storyCategoryLabel(story);
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      const cover = document.createElement('span');
      const badge = document.createElement('span');
      const imageSource = story.cover || story.poster || (story.type === 'image' ? story.src : '');

      button.className = 'studio__story';
      button.type = 'button';
      button.setAttribute('aria-label', story.alt || story.caption ||
        `${label}, ${I18N[lang].studio.storyNumber.replace('{number}', String(index + 1))}`);
      cover.className = 'studio__story-cover';
      if (!imageSource) {
        badge.className = 'studio__story-badge';
        badge.textContent = label.slice(0, 3).toUpperCase();
        cover.append(badge);
      }
      if (imageSource) {
        const image = document.createElement('img');
        image.src = imageSource;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => image.remove(), { once: true });
        cover.append(image);
      }
      button.append(cover);
      button.addEventListener('click', () => openStory(index, button));
      listItem.append(button);
      storyList.append(listItem);
    });
  }

  function clearStoryMedia() {
    clearTimeout(storyTimer);
    storyTimer = 0;
    storyStage.querySelectorAll('img, video, .story-viewer__empty').forEach((media) => {
      if (media instanceof HTMLVideoElement) media.pause();
      media.remove();
    });
  }

  function showStoryNotice(message) {
    const notice = document.createElement('p');
    notice.className = 'story-viewer__empty';
    notice.setAttribute('role', 'status');
    notice.textContent = message;
    storyStage.insertBefore(notice, storyPreviousButton);
  }

  function startStoryTimer(duration) {
    clearTimeout(storyTimer);
    if (reducedMotion.matches || !storyDialog.open) return;
    const requestedDuration = Number(duration);
    const boundedDuration = Math.max(1000, Number.isFinite(requestedDuration) && requestedDuration > 0 ? requestedDuration : 5000);
    const fill = storyProgress.querySelector('.story-viewer__progress-segment.is-active .story-viewer__progress-fill');
    if (!fill) return;
    fill.style.transition = `width ${boundedDuration}ms linear`;
    requestAnimationFrame(() => {
      if (storyDialog.open) fill.style.width = '100%';
    });
    storyTimer = window.setTimeout(nextStory, boundedDuration);
  }

  function renderStory() {
    clearStoryMedia();
    storyProgress.replaceChildren();
    const story = stories[activeStoryIndex];
    if (!story) return;
    const label = storyCategoryLabel(story);
    storyTitle.textContent = label;
    storyCaption.textContent = '';
    storyCaption.hidden = true;
    storyPreviousButton.disabled = activeStoryIndex === 0;
    storyNextButton.disabled = stories.length === 0;

    stories.forEach((_, index) => {
      const segment = document.createElement('span');
      const fill = document.createElement('span');
      segment.className = 'story-viewer__progress-segment';
      if (index < activeStoryIndex) segment.classList.add('is-complete');
      if (index === activeStoryIndex) segment.classList.add('is-active');
      fill.className = 'story-viewer__progress-fill';
      segment.append(fill);
      storyProgress.append(segment);
    });

    storyCaption.textContent = story.caption || '';
    storyCaption.hidden = !story.caption;

    if (story.type === 'image') {
      const image = document.createElement('img');
      image.alt = story.alt || story.caption || label;
      image.decoding = 'async';
      image.addEventListener('load', () => startStoryTimer(story.duration), { once: true });
      image.addEventListener('error', () => {
        if (storyDialog.open) showStoryNotice(I18N[lang].studio.storyMediaError);
      }, { once: true });
      image.src = story.src;
      storyStage.insertBefore(image, storyPreviousButton);
      if (image.complete) {
        if (image.naturalWidth > 0) startStoryTimer(story.duration);
        else showStoryNotice(I18N[lang].studio.storyMediaError);
      }
      return;
    }

    const video = document.createElement('video');
    video.autoplay = !reducedMotion.matches;
    video.controls = reducedMotion.matches;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    if (story.poster) video.poster = story.poster;
    video.setAttribute('aria-label', story.alt || story.caption || label);
    video.addEventListener('loadedmetadata', () => {
      const duration = story.duration || (Number.isFinite(video.duration) ? video.duration * 1000 : 15000);
      startStoryTimer(duration);
    }, { once: true });
    if (!reducedMotion.matches) video.addEventListener('ended', nextStory, { once: true });
    video.addEventListener('error', () => {
      if (storyDialog.open) showStoryNotice(I18N[lang].studio.storyMediaError);
    }, { once: true });
    video.src = story.src;
    storyStage.insertBefore(video, storyPreviousButton);
    if (!reducedMotion.matches) {
      video.play().catch(() => {
        video.controls = true;
        clearTimeout(storyTimer);
        storyTimer = 0;
        const fill = storyProgress.querySelector('.story-viewer__progress-segment.is-active .story-viewer__progress-fill');
        if (fill) {
          fill.style.transition = 'none';
          fill.style.width = '0';
        }
      });
    }
  }

  function openStory(index, trigger) {
    if (index < 0 || index >= stories.length) return;
    activeStoryIndex = index;
    storyTrigger = trigger;
    if (!storyDialog.open) storyDialog.showModal();
    renderStory();
  }

  function nextStory() {
    if (activeStoryIndex < 0) return;
    if (activeStoryIndex + 1 < stories.length) {
      activeStoryIndex += 1;
      renderStory();
      return;
    }
    if (storyDialog.open) storyDialog.close();
  }

  function previousStory() {
    if (activeStoryIndex <= 0) return;
    activeStoryIndex -= 1;
    renderStory();
  }

  storyCloseButton.addEventListener('click', () => storyDialog.close());
  storyPreviousButton.addEventListener('click', previousStory);
  storyNextButton.addEventListener('click', nextStory);
  storyDialog.addEventListener('click', (event) => {
    if (event.target === storyDialog) storyDialog.close();
  });
  storyDialog.addEventListener('close', () => {
    clearStoryMedia();
    storyProgress.replaceChildren();
    storyCaption.textContent = '';
    activeStoryIndex = -1;
    if (storyTrigger && storyTrigger.isConnected) storyTrigger.focus({ preventScroll: true });
    storyTrigger = null;
  });
  storyStage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' || event.target.closest('button, video')) return;
    storySwipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  storyStage.addEventListener('pointerup', (event) => {
    if (!storySwipeStart || storySwipeStart.id !== event.pointerId) return;
    const deltaX = event.clientX - storySwipeStart.x;
    const deltaY = event.clientY - storySwipeStart.y;
    storySwipeStart = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    if (deltaX < 0) nextStory();
    else previousStory();
  });
  storyStage.addEventListener('pointercancel', () => { storySwipeStart = null; });
  document.addEventListener('keydown', (event) => {
    if (!storyDialog.open) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextStory();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previousStory();
    }
  });
  renderStories();

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
      if (state.view === 'home') playIntro(INTRO_HOLD_LANG_MS);
      applyLang(next);
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-switching')));
    }, 320);
  }

  langButton.addEventListener('click', switchLang);

  let savedLang = null;
  try { savedLang = localStorage.getItem('cr8tive-lang'); } catch (e) { /* private mode */ }
  if (savedLang && I18N[savedLang] && savedLang !== 'en') applyLang(savedLang);

  // ---------------------------------------------------------------- mobile menu
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const phone = window.matchMedia('(max-width: 620px)');

  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      const first = nav.querySelector('button, a');
      if (first) first.focus({ preventScroll: true });
    }
  }

  if (burger && nav) {
    burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
    // Any link closes the menu; "Get in touch" then opens its form as usual.
    nav.addEventListener('click', (e) => {
      if (e.target.closest('button, a')) setMenu(false);
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) {
        setMenu(false);
        burger.focus({ preventScroll: true });
      }
    });
    phone.addEventListener('change', () => setMenu(false));
  }

  // ---------------------------------------------------------------- render
  const glCtx = createGL();
  let textures = null;
  root.classList.toggle('has-webgl', !!glCtx);

  function draw(time) {
    const { gl, uniforms: U } = glCtx;
    const l = state.layout;
    const still = reducedMotion.matches;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.SCISSOR_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!textures) return;
    gl.enable(gl.SCISSOR_TEST);

    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uRadius, RADIUS);
    gl.uniform1f(U.uTime, time);

    if (state.view === 'what' || state.view === 'food' || state.view === 'studio') return;
    if (state.view === 'work') { drawWork(still); return; }

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

    setReel(cx, cy, l.u, bendEased, still ? 0 : state.vel, l.horizontal, still);

    for (let i = 0; i < HOME_SLIDE_COUNT; i++) {
      // Shortest signed distance on the loop → the reel is endless both ways.
      let d = mod(i - state.pos + HOME_SLIDE_COUNT / 2, HOME_SLIDE_COUNT) - HOME_SLIDE_COUNT / 2;
      const theta = d * STEP;
      if (Math.cos(theta) < 0.4) continue;
      if (state.solo && i !== state.solo.index) continue;

      const slide = HOME_SLIDES[i].image;
      drawSlide(slide, theta, l.horizontal ? 0 : SLIDES[slide].dy);
    }
  }

  // Uniforms shared by everything drawn on one reel, plus a scissor box so the
  // full-screen quad only shades the pixels that reel can reach.
  function setReel(cx, cy, u, bend, vel, horizontal, still, liquid = true) {
    const { gl, uniforms: U } = glCtx;
    gl.uniform2f(U.uCenter, cx * dpr, cy * dpr);
    gl.uniform1f(U.uU, u * dpr);
    gl.uniform1f(U.uBend, bend);
    gl.uniform1f(U.uVel, vel);
    gl.uniform1f(U.uAxis, horizontal ? 1 : 0);
    gl.uniform2f(U.uMouse, (state.mouse[0] - cx) / u, (state.mouse[1] - cy) / u);
    const mouseVelocity = !still && liquid ? state.mouseVel : [0, 0];
    gl.uniform2f(U.uMouseVel, mouseVelocity[0], mouseVelocity[1]);

    const along = (RADIUS + 120) * u;
    const across = 450 * u;
    const hx = (horizontal ? along : across) * dpr;
    const hy = (horizontal ? across : along) * dpr;
    const x0 = Math.max(0, Math.floor(cx * dpr - hx));
    const y0 = Math.max(0, Math.floor(canvas.height - cy * dpr - hy));
    const x1 = Math.min(canvas.width, Math.ceil(cx * dpr + hx));
    const y1 = Math.min(canvas.height, Math.ceil(canvas.height - cy * dpr + hy));
    gl.scissor(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0));
  }

  function drawSlide(i, theta, dy) {
    const { gl, uniforms: U } = glCtx;
    const s = SLIDES[i];
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    gl.uniform2f(U.uSize, s.size[0], s.size[1]);
    gl.uniform2f(U.uOffset, 0, dy);
    gl.uniform1f(U.uRot, (s.rot * Math.PI) / 180);
    gl.uniform1f(U.uTheta, theta);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function drawWork(still) {
    const vh = window.innerHeight;
    const effectsEnabled = finePointer.matches && !reducedMotion.matches;
    workItems.forEach((it) => {
      const r = it.media.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200 || r.width === 0) return;

      if (it.staticMedia) return;

      const u = r.width / 460; // the widest picture (428) fits the box with air
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      setReel(cx, cy, u, 0, 0, false, still, effectsEnabled && !NO_LIQUID_WORK_SLIDES.has(it.slide));
      drawSlide(it.slide, 0, 0);
    });
  }

  let lastTime = 0;
  function frame(nowMs) {
    requestAnimationFrame(frame);
    if (previewReducedMotion !== reducedMotion.matches) {
      previewReducedMotion = reducedMotion.matches;
      updateWorkPreviews();
    }
    const dt = Math.min(0.05, (nowMs - lastTime) / 1000 || 0.016);
    lastTime = nowMs;

    // Autoplay.
    if (state.view === 'home' && !state.intro && !state.dragging && !reducedMotion.matches && !document.hidden &&
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

    setActive(mod(Math.round(state.pos), HOME_SLIDE_COUNT));

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
    state.solo = { index: mod(current, HOME_SLIDE_COUNT), target: current };
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
    if (viewFromHash() !== 'home') {
      // Opened straight on an inner page: no home intro.
      state.pos = state.target;
      applyView(viewFromHash());
    } else {
      playIntro(INTRO_HOLD_MS);
      if (!state.intro) state.pos = state.target; // reduced motion: no roll-in
    }
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
