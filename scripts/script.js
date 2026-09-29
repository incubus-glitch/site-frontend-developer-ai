document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* =========================================================
     НАСТРОЙКИ
     ========================================================= */

  // Плашка про cookie. Сейчас сайт не использует cookie и аналитику,
  // поэтому плашка выключена. Подключите Яндекс Метрику — поставьте true.
  const COOKIE_BANNER_ENABLED = false;
  const COOKIE_BANNER_TEXT =
    'Сайт использует cookie и сервис Яндекс Метрика, чтобы понимать, сколько людей его посещают. ' +
    'Продолжая пользоваться сайтом, вы соглашаетесь с этим.';

  /* ---------- Reveal on scroll ---------- */
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add("is-visible"));
  }

  /* ---------- Mobile menu ---------- */
  const menuButton = document.querySelector(".menu-button");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-menu a");

  function closeMenu() {
    if (!menuButton || !mobileMenu) return;
    menuButton.classList.remove("active");
    menuButton.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    body.classList.remove("menu-open");
  }

  menuButton?.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    menuButton.classList.toggle("active", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("menu-open", open);
  });

  mobileLinks.forEach(link => link.addEventListener("click", closeMenu));

  /* ---------- Current year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Custom cursor ---------- */
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  const HOVER_TARGETS = "a, button, .service, .method-card, .work-card";

  if (dot && ring && finePointer) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener("mousemove", event => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    });

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      requestAnimationFrame(animateCursor);
    }

    animateCursor();

    // Делегирование — работает и для карточек, которые создаются скриптом
    document.addEventListener("mouseover", event => {
      if (event.target.closest(HOVER_TARGETS)) body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", event => {
      const from = event.target.closest(HOVER_TARGETS);
      const to = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest(HOVER_TARGETS) : null;
      if (from && from !== to) body.classList.remove("cursor-hover");
    });
  }

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll(".magnetic").forEach(item => {
    item.addEventListener("mousemove", event => {
      if (!finePointer) return;
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate(${x * 0.10}px, ${y * 0.10}px)`;
    });

    item.addEventListener("mouseleave", () => {
      item.style.transform = "";
    });
  });

  /* ---------- Hide/show header on scroll ---------- */
  const header = document.querySelector(".header");
  let previousScroll = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;
    if (!header || body.classList.contains("menu-open") || body.classList.contains("work-modal-open")) return;

    if (currentScroll > previousScroll && currentScroll > 120) {
      header.style.transform = "translateY(-100%)";
    } else {
      header.style.transform = "translateY(0)";
    }

    previousScroll = currentScroll;
  }, { passive: true });

  /* =========================================================
     РАБОТЫ: вкладки + карусель
     ========================================================= */
  const tabsEl = document.querySelector(".works-tabs");
  const track = document.getElementById("works-track");
  const counter = document.querySelector(".works-counter");
  const arrows = document.querySelectorAll(".works-arrow");
  const works = Array.isArray(window.WORKS) ? window.WORKS : [];
  const pad2 = n => String(n).padStart(2, "0");
  const escapeHtml = str => String(str || "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  // Категории: сначала из списка CATEGORIES, затем любые новые из WORKS
  const categories = (Array.isArray(window.CATEGORIES) ? window.CATEGORIES : []).slice();
  works.forEach(work => {
    if (work.category && !categories.some(cat => cat.id === work.category)) {
      categories.push({ id: work.category, title: work.category });
    }
  });

  let activeCategory = null;

  function worksOf(catId) {
    return works.filter(work => work.category === catId);
  }

  function categoryTitle(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.title : catId;
  }

  function cardHtml(work, index) {
    const soon = !work.url;
    const catTitle = categoryTitle(work.category);
    const cover = work.image
      ? `<img src="${escapeHtml(work.image)}" alt="" loading="lazy" decoding="async" style="object-position:${escapeHtml(work.imagePosition || "center top")}">`
      : `<div class="work-cover-ph" aria-hidden="true">
           <div class="work-cover-top"><span>${escapeHtml(catTitle)}</span><span>${pad2(index + 1)}</span></div>
           <div class="work-cover-title">${escapeHtml(work.title)}</div>
           <div class="work-cover-bottom">${soon ? "скоро" : "смотреть"}</div>
         </div>`;
    const inner = `
      <div class="work-cover">
        ${cover}
        ${soon ? "" : '<span class="work-open" aria-hidden="true">↗</span>'}
      </div>
      <div class="work-meta"><span>${pad2(index + 1)}</span><span class="service-tag">${escapeHtml(catTitle)}</span></div>
      <h3>${escapeHtml(work.title)}</h3>
      ${work.description ? `<p>${escapeHtml(work.description)}</p>` : ""}
      <span class="work-status">${soon ? "Скоро" : "Смотреть ↗"}</span>`;

    return soon
      ? `<li><div class="work-card is-soon" aria-label="${escapeHtml(work.title)} — скоро">${inner}</div></li>`
      : `<li><a class="work-card" href="${escapeHtml(work.url)}" target="_blank" rel="noopener" aria-label="Открыть «${escapeHtml(work.title)}» в новой вкладке">${inner}</a></li>`;
  }

  function renderTrack() {
    const list = worksOf(activeCategory);
    track.innerHTML = list.length
      ? list.map(cardHtml).join("")
      : '<li class="works-empty">Скоро здесь появятся работы</li>';
    track.scrollLeft = 0;
    updateCarousel();
  }

  function selectCategory(catId, animate = true) {
    if (catId === activeCategory) return;
    activeCategory = catId;

    tabsEl.querySelectorAll(".works-tab").forEach(tab => {
      const selected = tab.dataset.cat === catId;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    const activeTab = tabsEl.querySelector(`.works-tab[data-cat="${CSS.escape(catId)}"]`);
    if (activeTab && tabsEl.scrollWidth > tabsEl.clientWidth) {
      tabsEl.scrollTo({ left: activeTab.offsetLeft - 20, behavior: animate ? "smooth" : "auto" });
    }

    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      renderTrack();
      return;
    }

    track.classList.add("is-switching");
    setTimeout(() => {
      renderTrack();
      requestAnimationFrame(() => track.classList.remove("is-switching"));
    }, 260);
  }

  // Карточки в треке (без плашки «Скоро здесь появятся работы»)
  function cards() {
    return [...track.querySelectorAll("li:not(.works-empty)")];
  }

  // Сколько карточек помещается целиком
  function visibleCount(list) {
    if (!list.length) return 0;
    const width = list[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    return Math.max(1, Math.floor((track.clientWidth + gap + 1) / (width + gap)));
  }

  // Индекс первой видимой карточки — по реальным позициям карточек
  function firstVisibleIndex(list) {
    const left = track.scrollLeft;
    let index = 0;
    list.forEach((card, i) => {
      if (Math.abs(card.offsetLeft - left) < Math.abs(list[index].offsetLeft - left)) index = i;
    });
    return index;
  }

  function updateCarousel() {
    const list = cards();
    const total = list.length;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const scrollable = maxScroll > 2;
    const controls = document.querySelector(".works-controls");

    if (!total) {
      if (counter) counter.textContent = "";
      controls?.classList.add("is-static");
      return;
    }

    const visible = Math.min(visibleCount(list), total);
    let first = firstVisibleIndex(list);
    if (track.scrollLeft >= maxScroll - 2) first = Math.max(0, total - visible);
    const last = Math.min(total, first + visible);

    if (counter) {
      counter.textContent = visible >= total
        ? `${total} ${plural(total, "работа", "работы", "работ")}`
        : (last === first + 1 ? `${last} из ${total}` : `${first + 1}–${last} из ${total}`);
    }

    controls?.classList.toggle("is-static", !scrollable);
    arrows.forEach(arrow => {
      const dir = Number(arrow.dataset.dir);
      arrow.disabled = !scrollable || (dir < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= maxScroll - 2);
    });
  }

  function plural(n, one, few, many) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  // Листаем на одну карточку, точно по её позиции
  function slide(dir) {
    const list = cards();
    if (!list.length) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const target = Math.min(list.length - 1, Math.max(0, firstVisibleIndex(list) + dir));
    track.scrollTo({ left: Math.min(list[target].offsetLeft, maxScroll), behavior: "smooth" });
  }

  if (tabsEl && track) {
    tabsEl.innerHTML = categories.map(cat => `
      <button class="works-tab" type="button" role="tab" data-cat="${escapeHtml(cat.id)}"
              aria-selected="false" aria-controls="works-track" tabindex="-1">
        ${escapeHtml(cat.title)}<sup class="works-tab-count" aria-label="работ: ${worksOf(cat.id).length}">${worksOf(cat.id).length}</sup>
      </button>`).join("");

    tabsEl.addEventListener("click", event => {
      const tab = event.target.closest(".works-tab");
      if (tab) selectCategory(tab.dataset.cat);
    });

    tabsEl.addEventListener("keydown", event => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const tabs = [...tabsEl.querySelectorAll(".works-tab")];
      const current = tabs.findIndex(tab => tab.dataset.cat === activeCategory);
      const next = tabs[(current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      selectCategory(next.dataset.cat);
    });

    arrows.forEach(arrow => arrow.addEventListener("click", () => slide(Number(arrow.dataset.dir))));

    // Стрелки клавиатуры, когда фокус внутри карусели
    track.addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        slide(event.key === "ArrowRight" ? 1 : -1);
      }
    });

    let scrollTick = null;
    track.addEventListener("scroll", () => {
      if (scrollTick) return;
      scrollTick = requestAnimationFrame(() => { scrollTick = null; updateCarousel(); });
    }, { passive: true });
    window.addEventListener("resize", updateCarousel);

    // Клик по карточке — обычная ссылка: сайт открывается в новой вкладке.
    // (Окно просмотра ниже больше не вызывается, но код оставлен на случай, если захотите вернуть.)

    const first = categories.find(cat => worksOf(cat.id).length) || categories[0];
    if (first) selectCategory(first.id, false);
  }

  /* =========================================================
     РАБОТЫ: окно с живым просмотром (телефон / компьютер)
     ========================================================= */
  const workModal = document.getElementById("work-modal");
  const wmStage = document.getElementById("wm-stage");
  const wmFrame = document.getElementById("wm-frame");
  const wmIframe = document.getElementById("wm-iframe");
  const wmTitle = document.getElementById("wm-title");
  const wmCategory = document.getElementById("wm-category");
  const wmLink = document.getElementById("wm-link");
  const wmNoteLink = document.getElementById("wm-note-link");
  const wmUrl = document.getElementById("wm-url");
  const deviceButtons = document.querySelectorAll(".wm-device");
  const DEVICES = {
    phone: { w: 390, h: 844 },
    desktop: { w: 1440, h: 938 } // 900 px сайта + 38 px «окна браузера»
  };
  let currentDevice = "phone";
  let lastTrigger = null;
  let clearTimer = null;

  function fitFrame() {
    if (!wmStage || !wmFrame) return;
    const size = DEVICES[currentDevice];
    const rect = wmStage.getBoundingClientRect();
    const margin = window.innerWidth < 720 ? 24 : 48;
    const scale = Math.min((rect.width - margin) / size.w, (rect.height - margin) / size.h, 1);
    wmFrame.style.setProperty("--w", `${size.w}px`);
    wmFrame.style.setProperty("--h", `${size.h}px`);
    wmFrame.style.setProperty("--s", Math.max(scale, 0.1).toFixed(4));
  }

  function setDevice(device) {
    currentDevice = device;
    deviceButtons.forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.device === device)));
    wmFrame.classList.toggle("is-desktop", device === "desktop");
    fitFrame();
  }

  function openWork(work, trigger) {
    if (!work || !work.url || !workModal) return;
    clearTimeout(clearTimer);
    lastTrigger = trigger || null;

    wmTitle.textContent = work.title || "";
    wmCategory.textContent = categoryTitle(work.category);
    wmLink.href = work.url;
    wmNoteLink.href = work.url;
    wmUrl.textContent = work.url.replace(/^https?:\/\//, "");

    wmFrame.classList.remove("is-loaded");
    wmIframe.onload = () => wmFrame.classList.add("is-loaded");
    wmIframe.src = work.url;

    setDevice(window.innerWidth < 720 ? "phone" : "desktop");
    workModal.classList.add("is-open");
    workModal.setAttribute("aria-hidden", "false");
    body.classList.add("work-modal-open");
    body.classList.remove("cursor-hover");
    requestAnimationFrame(fitFrame);
    workModal.querySelector(".wm-close").focus();
  }

  function closeWork() {
    if (!workModal || !workModal.classList.contains("is-open")) return;
    workModal.classList.remove("is-open");
    workModal.setAttribute("aria-hidden", "true");
    body.classList.remove("work-modal-open");
    // Останавливаем сайт внутри (музыку, анимации) после закрытия
    clearTimer = setTimeout(() => { wmIframe.src = "about:blank"; }, 450);
    if (lastTrigger) lastTrigger.focus();
  }

  deviceButtons.forEach(btn => btn.addEventListener("click", () => setDevice(btn.dataset.device)));
  workModal?.querySelectorAll("[data-close-work]").forEach(el => el.addEventListener("click", closeWork));
  wmStage?.addEventListener("click", event => { if (event.target === wmStage) closeWork(); });
  window.addEventListener("resize", () => { if (workModal?.classList.contains("is-open")) fitFrame(); });

  // Фокус не уходит из окна, пока оно открыто
  workModal?.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const focusable = [...workModal.querySelectorAll("button, a[href], iframe")].filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  /* =========================================================
     Окно «Ознакомьтесь с офертой»
     ========================================================= */
  const offerModal = document.getElementById("offer-modal");
  const offerAccept = document.getElementById("offer-modal-accept");
  const offerGates = document.querySelectorAll(".js-offer-gate");
  let pendingHref = null;
  let pendingTarget = null;

  function openOfferModal(href, target) {
    if (!offerModal) return;
    pendingHref = href;
    pendingTarget = target || "_self";
    offerModal.classList.add("is-open");
    offerModal.setAttribute("aria-hidden", "false");
    body.classList.add("offer-modal-open");
    offerAccept?.focus();
  }

  function closeOfferModal() {
    if (!offerModal) return;
    offerModal.classList.remove("is-open");
    offerModal.setAttribute("aria-hidden", "true");
    body.classList.remove("offer-modal-open");
    pendingHref = null;
    pendingTarget = null;
  }

  offerGates.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      openOfferModal(link.href, link.getAttribute("target") || "_self");
    });
  });

  offerAccept?.addEventListener("click", () => {
    if (!pendingHref) {
      closeOfferModal();
      return;
    }
    const href = pendingHref;
    const target = pendingTarget;
    closeOfferModal();
    if (target === "_blank") {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
  });

  offerModal?.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", closeOfferModal);
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (workModal?.classList.contains("is-open")) closeWork();
    else if (offerModal?.classList.contains("is-open")) closeOfferModal();
    else if (mobileMenu?.classList.contains("open")) closeMenu();
  });

  /* =========================================================
     Плашка про cookie (выключена — см. COOKIE_BANNER_ENABLED)
     ========================================================= */
  function initCookieBanner() {
    const KEY = "cookie-consent-v1";
    try {
      if (localStorage.getItem(KEY)) return;
    } catch (e) { /* хранилище недоступно — просто показываем плашку */ }

    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Уведомление о cookie");
    banner.innerHTML = `<p>${COOKIE_BANNER_TEXT}</p><button type="button">Хорошо</button>`;
    body.appendChild(banner);
    setTimeout(() => banner.classList.add("is-visible"), 900);

    banner.querySelector("button").addEventListener("click", () => {
      try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* без запоминания */ }
      banner.classList.remove("is-visible");
      setTimeout(() => banner.remove(), 600);
    });
  }

  if (COOKIE_BANNER_ENABLED) initCookieBanner();
});
