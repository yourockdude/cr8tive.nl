/* CR8TIVE promo — "Get in touch": header button and the project brief form.

   Delivery:
     ENDPOINT set   → the brief is POSTed there as JSON (see `payload()` below).
                      The endpoint must answer 2xx and allow cross-origin
                      requests from https://cr8tive.nl (CORS, including the
                      preflight for Content-Type: application/json).
     ENDPOINT empty → the visitor's mail app opens with the brief as a ready
                      letter to EMAIL.
*/

(() => {
  'use strict';

  const ENDPOINT = '';               // e.g. 'https://api.example.com/requests'
  const EMAIL = 'hello@cr8tive.nl';  // fallback and "write to us" address

  const TYPES = ['website', 'mobile-app', 'graphic-design'];

  const T = {
    en: {
      touch: 'Get in touch',
      title: 'Tell us about your project',
      sub: 'A short brief is enough. We will reply by email or messenger.',
      type: 'What do you need',
      types: ['Website', 'Mobile app', 'Graphic design'],
      budget: 'Budget up to',
      task: 'About the task',
      taskPh: 'What are we making, for whom, and by when?',
      contacts: 'How to reach you',
      email: 'Email', phone: 'Phone', messenger: 'Messenger: Telegram, WhatsApp…',
      send: 'Send request', sending: 'Sending…',
      needContact: 'Leave at least one contact: email, phone or messenger.',
      badEmail: 'Check the email address.',
      note: 'By sending the request you agree that we use these details to reply to you.',
      privacy: 'Privacy',
      okTitle: 'Request sent',
      okText: 'Thank you. We will get back to you soon.',
      mailTitle: 'One more step',
      mailText: 'Your mail app has opened with the brief filled in. Press Send there to finish. Nothing opened? Write to {email}.',
      error: 'Could not send the request. Try again or write to {email}.',
      close: 'Close',
      subject: 'Project request — CR8TIVE',
      none: '—',
    },
    es: {
      touch: 'Contacto',
      title: 'Cuéntanos tu proyecto',
      sub: 'Basta con un brief corto. Te responderemos por email o mensajería.',
      type: 'Qué necesitas',
      types: ['Sitio web', 'App móvil', 'Diseño gráfico'],
      budget: 'Presupuesto hasta',
      task: 'Sobre la tarea',
      taskPh: '¿Qué hacemos, para quién y para cuándo?',
      contacts: 'Cómo contactarte',
      email: 'Email', phone: 'Teléfono', messenger: 'Mensajería: Telegram, WhatsApp…',
      send: 'Enviar solicitud', sending: 'Enviando…',
      needContact: 'Deja al menos un contacto: email, teléfono o mensajería.',
      badEmail: 'Revisa la dirección de email.',
      note: 'Al enviar la solicitud aceptas que usemos estos datos para responderte.',
      privacy: 'Privacidad',
      okTitle: 'Solicitud enviada',
      okText: 'Gracias. Te responderemos pronto.',
      mailTitle: 'Un paso más',
      mailText: 'Se ha abierto tu programa de correo con el brief ya escrito. Pulsa Enviar allí para terminar. ¿No se abrió nada? Escribe a {email}.',
      error: 'No se pudo enviar la solicitud. Inténtalo de nuevo o escribe a {email}.',
      close: 'Cerrar',
      subject: 'Solicitud de proyecto — CR8TIVE',
      none: '—',
    },
    ru: {
      touch: 'Связаться',
      title: 'Расскажите о проекте',
      sub: 'Достаточно короткого брифа. Ответим на почту или в мессенджер.',
      type: 'Что нужно сделать',
      types: ['Сайт', 'Мобильное приложение', 'Графический дизайн'],
      budget: 'Бюджет проекта до',
      task: 'Описание задачи',
      taskPh: 'Что делаем, для кого и к какому сроку?',
      contacts: 'Как с вами связаться',
      email: 'Email', phone: 'Телефон', messenger: 'Мессенджер: Telegram, WhatsApp…',
      send: 'Отправить заявку', sending: 'Отправляем…',
      needContact: 'Оставьте хотя бы один контакт: email, телефон или мессенджер.',
      badEmail: 'Проверьте адрес почты.',
      note: 'Отправляя заявку, вы соглашаетесь, что мы используем эти данные для ответа вам.',
      privacy: 'Приватность',
      okTitle: 'Заявка отправлена',
      okText: 'Спасибо. Мы скоро свяжемся с вами.',
      mailTitle: 'Остался один шаг',
      mailText: 'Открылась ваша почтовая программа с готовым письмом-брифом. Нажмите в ней «Отправить». Ничего не открылось? Напишите на {email}.',
      error: 'Не удалось отправить заявку. Попробуйте ещё раз или напишите на {email}.',
      close: 'Закрыть',
      subject: 'Заявка на проект — CR8TIVE',
      none: '—',
    },
  };

  const root = document.documentElement;
  const t = () => T[root.lang] || T.en;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mailLink = () => `<a href="mailto:${EMAIL}">${EMAIL}</a>`;

  const touch = document.getElementById('touch');
  if (!touch) return;

  // Form values live here so a language switch can re-render without losing them.
  const values = { types: new Set(), budget: '', task: '', email: '', phone: '', messenger: '' };
  let view = 'form'; // 'form' | 'sent' | 'mail'
  let errorKey = '';
  let invalid = '';
  let busy = false;
  let lastFocus = null;

  const overlay = document.createElement('div');
  overlay.className = 'contact';
  overlay.innerHTML = '<section class="contact__panel" role="dialog" aria-modal="true" aria-labelledby="contact-title"></section>';
  const panel = overlay.firstElementChild;

  // ------------------------------------------------------------------ render
  function formHTML(s) {
    const chips = TYPES.map((key, i) => `
      <label class="chip"><input type="checkbox" name="type" value="${key}" ${values.types.has(key) ? 'checked' : ''}><span>${s.types[i]}</span></label>`).join('');
    const err = errorKey === 'error' ? s.error.replace('{email}', mailLink()) : (s[errorKey] || '');

    return `
      <form novalidate>
        <fieldset class="group">
          <legend>${s.type}</legend>
          <div class="chips">${chips}</div>
        </fieldset>

        <div class="group">
          <label class="label" for="c-budget">${s.budget}</label>
          <span class="field field--budget">
            <input id="c-budget" name="budget" type="text" inputmode="numeric" autocomplete="off" placeholder="10 000" value="${esc(values.budget)}">
          </span>
        </div>

        <div class="group">
          <label class="label" for="c-task">${s.task}</label>
          <textarea id="c-task" name="task" rows="4" placeholder="${esc(s.taskPh)}">${esc(values.task)}</textarea>
        </div>

        <fieldset class="group">
          <legend>${s.contacts}</legend>
          <div class="contacts">
            <span class="field"><input name="email" type="email" autocomplete="email" inputmode="email" placeholder="${esc(s.email)}" aria-label="${esc(s.email)}" value="${esc(values.email)}" ${invalid === 'email' || invalid === 'contact' ? 'aria-invalid="true"' : ''}></span>
            <span class="field"><input name="phone" type="tel" autocomplete="tel" placeholder="${esc(s.phone)}" aria-label="${esc(s.phone)}" value="${esc(values.phone)}" ${invalid === 'contact' ? 'aria-invalid="true"' : ''}></span>
            <span class="field"><input name="messenger" type="text" autocomplete="off" placeholder="${esc(s.messenger)}" aria-label="${esc(s.messenger)}" value="${esc(values.messenger)}" ${invalid === 'contact' ? 'aria-invalid="true"' : ''}></span>
          </div>
        </fieldset>

        <div class="hp" aria-hidden="true"><label>Company website <input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>

        <p class="contact__error" role="alert">${err}</p>
        <button class="contact__submit" type="submit" ${busy ? 'disabled' : ''}>${busy ? s.sending : s.send}</button>
        <p class="contact__note">${s.note} <button type="button" data-act="privacy">${s.privacy}</button></p>
      </form>`;
  }

  function doneHTML(s) {
    const mail = view === 'mail';
    return `
      <div class="contact__done" role="status">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
          <circle cx="28" cy="28" r="27" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
          ${mail
            ? '<path d="M16 21h24v15H16z M16 22l12 9 12-9" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>'
            : '<path d="M18 29l7 7 14-15" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'}
        </svg>
        <h3>${mail ? s.mailTitle : s.okTitle}</h3>
        <p>${mail ? s.mailText.replace('{email}', mailLink()) : s.okText}</p>
        <button class="contact__submit" type="button" data-act="close">${s.close}</button>
      </div>`;
  }

  function render() {
    const s = t();
    touch.textContent = s.touch;

    const active = document.activeElement;
    const focusName = panel.contains(active) ? active.getAttribute('name') : null;
    const sel = focusName && 'selectionStart' in active && active.type !== 'email' && active.type !== 'checkbox'
      ? [active.selectionStart, active.selectionEnd] : null;
    const body = panel.querySelector('.contact__body');
    const scrollTop = body ? body.scrollTop : 0;

    panel.innerHTML = `
      <div class="contact__bar">
        <div>
          <h2 id="contact-title">${s.title}</h2>
          ${view === 'form' ? `<p>${s.sub}</p>` : ''}
        </div>
        <button type="button" class="contact__close" data-act="close" aria-label="${s.close}">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="contact__body">${view === 'form' ? formHTML(s) : doneHTML(s)}</div>`;

    panel.querySelector('.contact__body').scrollTop = scrollTop;
    if (focusName) {
      const el = panel.querySelector(`[name="${focusName}"]${active.type === 'checkbox' ? `[value="${active.value}"]` : ''}`);
      if (el) {
        el.focus({ preventScroll: true });
        if (sel) { try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* not a text field */ } }
      }
    }
  }

  // ------------------------------------------------------------------ data
  function sync(target) {
    if (!target || !target.name) return;
    if (target.name === 'type') {
      if (target.checked) values.types.add(target.value);
      else values.types.delete(target.value);
    } else if (target.name === 'budget') {
      // Digits only, grouped by thousands: 10 000
      const digits = target.value.replace(/\D/g, '').slice(0, 9);
      target.value = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      values.budget = target.value;
    } else if (target.name in values) {
      values[target.name] = target.value;
    }
  }

  function payload() {
    return {
      types: TYPES.filter((k) => values.types.has(k)),
      budgetUpTo: values.budget ? Number(values.budget.replace(/\D/g, '')) : null,
      currency: 'EUR',
      task: values.task.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      messenger: values.messenger.trim(),
      lang: root.lang || 'en',
      page: location.href,
    };
  }

  function mailtoURL(p) {
    const s = t();
    const names = p.types.map((k) => s.types[TYPES.indexOf(k)]).join(', ') || s.none;
    const lines = [
      `${s.type}: ${names}`,
      `${s.budget}: ${p.budgetUpTo ? values.budget + ' €' : s.none}`,
      '',
      `${s.task}:`,
      p.task || s.none,
      '',
      `${s.contacts}:`,
      `Email: ${p.email || s.none}`,
      `${s.phone}: ${p.phone || s.none}`,
      `Messenger: ${p.messenger || s.none}`,
    ];
    return `mailto:${EMAIL}?subject=${encodeURIComponent(s.subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  function validate(p) {
    if (!p.email && !p.phone && !p.messenger) return ['needContact', 'contact'];
    if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)) return ['badEmail', 'email'];
    return ['', ''];
  }

  async function submit(form) {
    if (busy) return;
    const p = payload();
    [errorKey, invalid] = validate(p);
    if (errorKey) {
      render();
      const bad = panel.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }

    // A filled honeypot means a bot: pretend it worked, send nothing.
    if (form.elements.website && form.elements.website.value) {
      view = 'sent';
      render();
      return;
    }

    if (!ENDPOINT) {
      location.href = mailtoURL(p);
      view = 'mail';
      render();
      panel.querySelector('[data-act="close"]').focus();
      return;
    }

    busy = true;
    render();
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      view = 'sent';
      values.types.clear();
      values.budget = values.task = values.email = values.phone = values.messenger = '';
    } catch (err) {
      console.warn('[cr8tive] request failed:', err);
      errorKey = 'error';
    }
    busy = false;
    render();
    const focusTarget = panel.querySelector(view === 'sent' ? '.contact__submit' : '.contact__error');
    if (focusTarget && view === 'sent') focusTarget.focus();
  }

  // ------------------------------------------------------------------ open / close
  const isOpen = () => overlay.classList.contains('is-open');
  const privacyOpen = () => !!document.querySelector('.sheet.is-open');

  function open() {
    lastFocus = document.activeElement;
    if (view !== 'form') { view = 'form'; }
    errorKey = invalid = '';
    render();
    overlay.classList.add('is-open');
    const first = panel.querySelector('input[name="type"]');
    if (first) first.focus({ preventScroll: true });
  }

  function close() {
    overlay.classList.remove('is-open');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  touch.addEventListener('click', open);

  overlay.addEventListener('pointerdown', (e) => {
    if (e.target === overlay) close(); // click on the dimmed backdrop
  });

  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'close') close();
    else if (btn.dataset.act === 'privacy' && window.cr8tivePrivacy) window.cr8tivePrivacy.open();
  });

  panel.addEventListener('input', (e) => {
    sync(e.target);
    if (invalid) {
      invalid = errorKey = '';
      panel.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
      const err = panel.querySelector('.contact__error');
      if (err) err.textContent = '';
    }
  });
  panel.addEventListener('change', (e) => sync(e.target));

  panel.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(e.target);
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen() || privacyOpen()) return;
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'Tab') {
      // Keep focus inside the dialog.
      const items = Array.from(panel.querySelectorAll('button, input:not([tabindex="-1"]), textarea, a[href]'))
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!panel.contains(document.activeElement)) { first.focus(); e.preventDefault(); }
      else if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['lang'] });

  render();
  document.body.append(overlay);
})();
