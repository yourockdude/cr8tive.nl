/* CR8TIVE promo — cookie notice, consent storage and privacy sheet.

   What the page stores today (both in localStorage, nothing is sent anywhere):
     cr8tive-lang     — chosen interface language (strictly functional)
     cr8tive-consent  — the visitor's answer to this notice

   Nothing optional is loaded yet. When analytics is added, load it only after
   consent:

     if (window.cr8tiveConsent.analytics) loadAnalytics();
     document.addEventListener('cr8tive:consent', (e) => {
       if (e.detail.analytics) loadAnalytics();
     });
*/

(() => {
  'use strict';

  // ------------------------------------------------------------------ legal details
  // Fill these in: the block "Who is responsible" is built from them.
  // Empty fields are simply not shown.
  const LEGAL = {
    company: 'CR8TIVE',   // legal name of the company
    address: '',          // registered address
    registration: '',     // trade register number, e.g. "KVK 12345678"
    vat: '',              // VAT number
    email: 'hello@cr8tive.nl', // contact address for privacy requests
  };

  const STORAGE_KEY = 'cr8tive-consent';
  const CONSENT_VERSION = 1;
  const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // ask again after 12 months

  // ------------------------------------------------------------------ copy
  const T = {
    en: {
      app: 'CR8TIVE', now: 'now',
      title: 'Cookies & privacy',
      body: 'We remember your language on this device. Anything beyond that, such as analytics, runs only if you allow it.',
      details: 'Details',
      necessaryOnly: 'Only necessary',
      allowAll: 'Allow all',
      sheetTitle: 'Privacy & cookies',
      close: 'Close',
      save: 'Save choice',
      storageHead: 'What is stored on your device',
      necessary: 'Necessary',
      necessaryText: 'Your language (<code>cr8tive-lang</code>) and your answer to this notice (<code>cr8tive-consent</code>, kept 12 months). Local storage, never sent to us.',
      analytics: 'Analytics',
      analyticsText: 'Anonymous visit statistics. Off by default; nothing is loaded until you switch it on.',
      whoHead: 'Who is responsible',
      who: 'The controller of your data is {company}.',
      dataHead: 'What data we process',
      data: 'This page has no accounts and does not load third-party trackers, fonts or embeds. If you send the contact form, we use what you enter there (type of work, budget, task description and your contact details) only to reply to your request and prepare an offer (steps prior to a contract, Art. 6(1)(b) GDPR), and keep it no longer than that requires. As with any website, our hosting provider processes your IP address and browser details in server logs to deliver the page and keep it secure (legitimate interest, Art. 6(1)(f) GDPR).',
      rightsHead: 'Your rights',
      rights: 'You can ask for access to your data, its correction or deletion, restriction of or objection to processing, and data portability. You can withdraw consent at any time in this window; it is as easy as giving it. You may also complain to your data protection authority.',
      contact: 'Write to us: {email}.',
      reopen: 'Privacy & cookies',
      always: 'Always on',
    },
    es: {
      app: 'CR8TIVE', now: 'ahora',
      title: 'Cookies y privacidad',
      body: 'Recordamos tu idioma en este dispositivo. Todo lo demás, como la analítica, solo funciona si lo permites.',
      details: 'Detalles',
      necessaryOnly: 'Solo necesarias',
      allowAll: 'Permitir todo',
      sheetTitle: 'Privacidad y cookies',
      close: 'Cerrar',
      save: 'Guardar',
      storageHead: 'Qué se guarda en tu dispositivo',
      necessary: 'Necesarias',
      necessaryText: 'Tu idioma (<code>cr8tive-lang</code>) y tu respuesta a este aviso (<code>cr8tive-consent</code>, 12 meses). Almacenamiento local; no se nos envía.',
      analytics: 'Analítica',
      analyticsText: 'Estadísticas anónimas de visitas. Desactivada por defecto; no se carga nada hasta que la actives.',
      whoHead: 'Quién es el responsable',
      who: 'El responsable del tratamiento de tus datos es {company}.',
      dataHead: 'Qué datos tratamos',
      data: 'Esta página no tiene cuentas y no carga rastreadores, fuentes ni contenidos de terceros. Si envías el formulario de contacto, usamos lo que escribes en él (tipo de trabajo, presupuesto, descripción de la tarea y tus datos de contacto) solo para responder a tu solicitud y preparar una propuesta (medidas precontractuales, art. 6.1.b del RGPD), y no lo conservamos más tiempo del necesario para ello. Como en cualquier sitio web, nuestro proveedor de alojamiento trata tu dirección IP y los datos del navegador en los registros del servidor para mostrar la página y mantenerla segura (interés legítimo, art. 6.1.f del RGPD).',
      rightsHead: 'Tus derechos',
      rights: 'Puedes solicitar el acceso a tus datos, su rectificación o supresión, la limitación u oposición al tratamiento y la portabilidad. Puedes retirar tu consentimiento en cualquier momento en esta ventana, con la misma facilidad con la que lo diste. También puedes reclamar ante tu autoridad de protección de datos.',
      contact: 'Escríbenos: {email}.',
      reopen: 'Privacidad y cookies',
      always: 'Siempre activas',
    },
    ru: {
      app: 'CR8TIVE', now: 'сейчас',
      title: 'Cookies и приватность',
      body: 'Мы запоминаем выбранный язык на этом устройстве. Всё остальное, например аналитика, работает только с вашего разрешения.',
      details: 'Подробнее',
      necessaryOnly: 'Только необходимые',
      allowAll: 'Разрешить все',
      sheetTitle: 'Приватность и cookies',
      close: 'Закрыть',
      save: 'Сохранить',
      storageHead: 'Что хранится на вашем устройстве',
      necessary: 'Необходимые',
      necessaryText: 'Выбранный язык (<code>cr8tive-lang</code>) и ваш ответ на это сообщение (<code>cr8tive-consent</code>, 12 месяцев). Локальное хранилище, нам не передаётся.',
      analytics: 'Аналитика',
      analyticsText: 'Обезличенная статистика посещений. По умолчанию выключена; пока вы её не включите, ничего не загружается.',
      whoHead: 'Кто отвечает за данные',
      who: 'Оператор ваших данных — {company}.',
      dataHead: 'Какие данные мы обрабатываем',
      data: 'На странице нет учётных записей, она не загружает сторонние трекеры, шрифты и встраиваемые блоки. Если вы отправляете форму заявки, мы используем введённые в ней данные (вид работ, бюджет, описание задачи и ваши контакты) только чтобы ответить на заявку и подготовить предложение (преддоговорные действия, ст. 6(1)(b) GDPR), и храним их не дольше, чем это требуется. Как и на любом сайте, хостинг-провайдер обрабатывает ваш IP-адрес и сведения о браузере в журналах сервера, чтобы показать страницу и защитить её (законный интерес, ст. 6(1)(f) GDPR).',
      rightsHead: 'Ваши права',
      rights: 'Вы можете запросить доступ к своим данным, их исправление или удаление, ограничить обработку или возразить против неё, а также получить данные в переносимом виде. Согласие можно отозвать в любой момент в этом окне — так же просто, как дать. Вы также вправе обратиться в надзорный орган по защите данных.',
      contact: 'Напишите нам: {email}.',
      reopen: 'Приватность и cookies',
      always: 'Всегда включены',
    },
  };

  const root = document.documentElement;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = () => T[root.lang] || T.en;

  // ------------------------------------------------------------------ storage
  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!v || v.v !== CONSENT_VERSION || Date.now() - v.ts > MAX_AGE_MS) return null;
      return v;
    } catch (e) {
      return null;
    }
  }

  let consent = read();
  window.cr8tiveConsent = { analytics: consent ? !!consent.analytics : false, answered: !!consent };

  function save(analytics) {
    consent = { v: CONSENT_VERSION, analytics: !!analytics, ts: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch (e) { /* private mode */ }
    window.cr8tiveConsent = { analytics: consent.analytics, answered: true };
    document.dispatchEvent(new CustomEvent('cr8tive:consent', { detail: { analytics: consent.analytics } }));
  }

  // ------------------------------------------------------------------ DOM
  const notice = document.createElement('section');
  notice.className = 'glass notice';
  notice.setAttribute('role', 'region');

  const sheet = document.createElement('section');
  sheet.className = 'glass sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-labelledby', 'sheet-title');

  const reopen = document.createElement('button');
  reopen.type = 'button';
  reopen.className = 'legal-link';

  const copyright = document.createElement('small');
  copyright.className = 'copyright';
  copyright.textContent = '© 2026 cr8tive.nl';

  let analyticsDraft = consent ? !!consent.analytics : false;

  function controllerLine(s) {
    const parts = [LEGAL.address, LEGAL.registration, LEGAL.vat].filter(Boolean).map(esc);
    let html = `<p>${s.who.replace('{company}', `<strong>${esc(LEGAL.company)}</strong>`)}${parts.length ? ' ' + parts.join(' · ') + '.' : ''}</p>`;
    if (LEGAL.email) {
      const mail = `<a href="mailto:${esc(LEGAL.email)}">${esc(LEGAL.email)}</a>`;
      html += `<p>${s.contact.replace('{email}', mail)}</p>`;
    }
    return html;
  }

  function render() {
    const s = t();

    notice.setAttribute('aria-label', s.title);
    notice.innerHTML = `
      <div class="notice__head">
        <span class="notice__icon" aria-hidden="true">8</span>
        <span>${s.app}</span>
        <span class="notice__time">${s.now}</span>
      </div>
      <h2>${s.title}</h2>
      <p>${s.body} <button type="button" class="glass__link" data-act="details">${s.details}</button></p>
      <div class="glass__actions">
        <button type="button" class="glass__btn" data-act="necessary">${s.necessaryOnly}</button>
        <button type="button" class="glass__btn" data-act="all">${s.allowAll}</button>
      </div>`;

    const scroll = sheet.querySelector('.sheet__body');
    const scrollTop = scroll ? scroll.scrollTop : 0;
    sheet.innerHTML = `
      <div class="sheet__bar">
        <h2 id="sheet-title">${s.sheetTitle}</h2>
        <button type="button" class="sheet__close" data-act="close" aria-label="${s.close}">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="sheet__body" tabindex="0">
        <h3>${s.storageHead}</h3>
        <ul class="rows">
          <li>
            <div class="rows__text"><strong>${s.necessary}</strong><span>${s.necessaryText}</span></div>
            <label class="switch"><input type="checkbox" checked disabled aria-label="${s.necessary}: ${s.always}"><i></i></label>
          </li>
          <li>
            <div class="rows__text"><strong>${s.analytics}</strong><span>${s.analyticsText}</span></div>
            <label class="switch"><input type="checkbox" id="consent-analytics" ${analyticsDraft ? 'checked' : ''} aria-label="${s.analytics}"><i></i></label>
          </li>
        </ul>
        <h3>${s.whoHead}</h3>
        ${controllerLine(s)}
        <h3>${s.dataHead}</h3>
        <p>${s.data}</p>
        <h3>${s.rightsHead}</h3>
        <p>${s.rights}</p>
      </div>
      <div class="sheet__foot">
        <div class="glass__actions">
          <button type="button" class="glass__btn" data-act="necessary">${s.necessaryOnly}</button>
          <button type="button" class="glass__btn" data-act="save">${s.save}</button>
        </div>
      </div>`;
    sheet.querySelector('.sheet__body').scrollTop = scrollTop;

    reopen.textContent = s.reopen;
  }

  // ------------------------------------------------------------------ behaviour
  let lastFocus = null;

  const show = (el) => el.classList.add('is-open');
  const hide = (el) => el.classList.remove('is-open');

  function openSheet() {
    lastFocus = document.activeElement;
    analyticsDraft = consent ? !!consent.analytics : false;
    render();
    hide(notice);
    show(sheet);
    sheet.querySelector('.sheet__close').focus({ preventScroll: true });
  }

  function closeSheet() {
    hide(sheet);
    if (!consent) show(notice); // still unanswered → the notification comes back
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  function answer(analytics) {
    save(analytics);
    hide(notice);
    hide(sheet);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  function onClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'details') openSheet();
    else if (act === 'close') closeSheet();
    else if (act === 'necessary') answer(false);
    else if (act === 'all') answer(true);
    else if (act === 'save') answer(analyticsDraft);
  }

  notice.addEventListener('click', onClick);
  sheet.addEventListener('click', onClick);
  sheet.addEventListener('change', (e) => {
    if (e.target.id === 'consent-analytics') analyticsDraft = e.target.checked;
  });
  reopen.addEventListener('click', openSheet);
  window.cr8tivePrivacy = { open: openSheet };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
      closeSheet();
      e.stopImmediatePropagation(); // do not also close the form underneath
    }
  });

  // Follow the page language.
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['lang'] });

  render();
  document.body.append(copyright, reopen, notice, sheet);

  if (!consent) {
    // Arrive like a notification, once the intro has played.
    setTimeout(() => show(notice), 1600);
  }
})();
