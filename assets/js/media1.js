'use strict';

/* =========================================================
   LIVINGSPACE — MEDIA 001
   BOFFI / ON-OFF ST

   ARTICLE ENGINE — HOME INTEGRATION

   Článek je součástí existující HOME.
   Žádné přesměrování ani samostatná stránka.

   home.js / home.css / main.js = BEZE ZMĚN
   iconics.js / iconics.css = BEZE ZMĚN
   ========================================================= */

(() => {
  const CONFIG = Object.freeze({
    id: 'media1',
    title: 'ON-OFF ST',
    designer: 'Alberto Colonello',
    imageRoot: '/assets/pics/'
  });

  const SELECTORS = Object.freeze({
    main: '#mainView',
    home: '#homeView',
    content: '.home-view__content',
    carousel: '.home-carousel',
    firstSlide: '.home-carousel__slide:first-child',
    read: '.home-carousel__button--read',
    iconics: '#iconics'
  });

  /* =========================================================
     01 — ARTICLE CONTENT
     ========================================================= */

  const CONTENT = [
    {
      type: 'header',
      title: CONFIG.title,
      designer: CONFIG.designer
    },
    {
      type: 'image',
      src: '003.png',
      alt: 'BOFFI ON-OFF ST — otevřená kuchyně'
    },
    {
      type: 'text',
      text: 'Modulární kuchyně ON-OFF ST se vyznačuje samostatně stojící konstrukcí vybavenou skládacími dvířky, která se elektronicky otevírají směrem vzhůru a odhalují pracovní prostor uvnitř. Po uzavření pracovní část zcela skryjí a promění kuchyni v monolitický nábytkový prvek.'
    },
    {
      type: 'text',
      text: 'Spodní skříňky jsou dostupné v provedení s úchytkami i bez nich. Vedle nich lze umístit vysokou skříň s dvířky, která se při otevření zasouvají do bočních prostorů.'
    },
    {
      type: 'image',
      src: '004.png',
      alt: 'BOFFI ON-OFF ST — boční pohled na kuchyni'
    },
    {
      type: 'text',
      text: 'Skládací dvířka systému ON-OFF ST, která zakrývají pracovní desku, jsou vybavena elektronickým mechanismem umožňujícím plynulé otevření a úplné skrytí dvířek. Když je kuchyně zavřená, působí jako elegantní designový prvek, přesto si zachovává veškerou funkčnost moderní kuchyně.'
    },
    {
      type: 'image',
      src: '005.png',
      alt: 'BOFFI ON-OFF ST — detail pracovní plochy'
    },
    {
      type: 'text',
      text: 'Dvířka spodních skříněk mohou být dodávána bez úchytek, se systémem otevírání zatlačením Tip-On.'
    },
    {
      type: 'image',
      src: '006.png',
      alt: 'BOFFI ON-OFF ST — detail úložného systému'
    },
    {
      type: 'text',
      text: 'Skládací dvířka se elektronicky otevírají směrem vzhůru a odhalují vše, co je v kuchyni potřeba.'
    },
    {
      type: 'image',
      src: '007.png',
      alt: 'BOFFI ON-OFF ST — detail mechanismu'
    }
  ];

  /* =========================================================
     02 — STATE
     ========================================================= */

  let main = null;
  let home = null;
  let homeContent = null;
  let carousel = null;
  let article = null;
  let readButton = null;

  let initialized = false;
  let articleOpen = false;
  let previousScrollTop = 0;
  let previousFocus = null;

  let observer = null;
  let iconicsObserver = null;
  let transitionFrame = null;
  let scrollFrame = null;
  let placementFrame = null;

  /* =========================================================
     03 — HELPERS
     ========================================================= */

  const createElement = (tag, className = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  };

  const getScrollTop = () => main?.scrollTop || 0;

  const setScrollTop = value => {
    if (main) main.scrollTop = value;
  };

  const cancelFrames = () => {
    if (transitionFrame !== null) {
      cancelAnimationFrame(transitionFrame);
      transitionFrame = null;
    }

    if (scrollFrame !== null) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    }

    if (placementFrame !== null) {
      cancelAnimationFrame(placementFrame);
      placementFrame = null;
    }
  };

  /* =========================================================
     04 — ARTICLE BLOCKS
     ========================================================= */

  const createHeader = item => {
    const header = createElement('header', 'media1__header');

    const title = createElement('h1', 'media1__title');
    title.textContent = item.title;

    const designer = createElement('p', 'media1__designer');
    designer.textContent = `Design: ${item.designer}`;

    header.append(title, designer);
    return header;
  };

  const createImage = (item, index) => {
    const figure = createElement('figure', 'media1__figure');
    const image = createElement('img', 'media1__image');

    image.src = `${CONFIG.imageRoot}${item.src}`;
    image.alt = item.alt;
    image.decoding = 'async';
    image.loading = index === 1 ? 'eager' : 'lazy';
    image.draggable = false;

    if (index === 1) image.fetchPriority = 'high';

    figure.appendChild(image);
    return figure;
  };

  const createText = item => {
    const section = createElement('section', 'media1__text');
    const paragraph = createElement('p', 'media1__paragraph');

    paragraph.textContent = item.text;
    section.appendChild(paragraph);

    return section;
  };

  const createBlock = (item, index) => {
    switch (item.type) {
      case 'header': return createHeader(item);
      case 'image': return createImage(item, index);
      case 'text': return createText(item);
      default: return null;
    }
  };

  /* =========================================================
     05 — ARTICLE FACTORY

     Bez tlačítka ZPĚT.
     Navigační šipka bude doplněna
     podle dodaných keyframes.
     ========================================================= */

  const createArticle = () => {
    const element = createElement('article', 'media1');

    element.id = CONFIG.id;
    element.hidden = true;
    element.setAttribute('aria-label', 'BOFFI — ON-OFF ST');

    const content = createElement('div', 'media1__content');

    CONTENT.forEach((item, index) => {
      const block = createBlock(item, index);
      if (block) content.appendChild(block);
    });

    element.appendChild(content);
    return element;
  };

  /* =========================================================
     06 — ICONICS PLACEMENT

     HOME:
       CAROUSEL
       ICONICS

     ARTICLE:
       CAROUSEL (SKRYTÝ)
       ARTICLE
       ICONICS

     MENU:
       Původní iconics.js spravuje
       umístění v menu.

     Sledujeme pouze přemístění #iconics.
     Žádné kopírování ani úprava obsahu.
     ========================================================= */

  const getIconics = () => document.querySelector(SELECTORS.iconics);

  const syncIconicsPlacement = () => {
    if (!initialized || !articleOpen || !article || !homeContent || !main) return;
    if (main.classList.contains('is-menu-visible')) return;

    const iconics = getIconics();
    if (!iconics) return;

    if (iconics.parentElement !== homeContent || iconics.previousElementSibling !== article) {
      article.insertAdjacentElement('afterend', iconics);
    }

    iconics.classList.remove('iconics--menu');
  };

  const scheduleIconicsPlacement = () => {
    if (!articleOpen || placementFrame !== null) return;

    placementFrame = requestAnimationFrame(() => {
      placementFrame = null;
      syncIconicsPlacement();
    });
  };

  const watchIconics = () => {
    if (iconicsObserver || !main) return;

    iconicsObserver = new MutationObserver(mutations => {
      if (!articleOpen) return;

      const iconics = getIconics();

      if (!iconics) {
        scheduleIconicsPlacement();
        return;
      }

      const moved = mutations.some(mutation => {
        if (mutation.type !== 'childList') return false;

        return [...mutation.addedNodes].includes(iconics) ||
          [...mutation.removedNodes].includes(iconics);
      });

      if (moved || iconics.previousElementSibling !== article) {
        scheduleIconicsPlacement();
      }
    });

    iconicsObserver.observe(main, {
      childList: true,
      subtree: true
    });
  };

  /* =========================================================
     07 — ARTICLE OPEN
     ========================================================= */

  const openArticle = () => {
    if (!initialized || articleOpen || !main || !home || !article) return;
    if (main.classList.contains('is-menu-visible')) return;

    articleOpen = true;
    previousScrollTop = getScrollTop();
    previousFocus = document.activeElement;

    cancelFrames();

    article.hidden = false;
    home.classList.add('media1-is-open');

    carousel?.setAttribute('aria-hidden', 'true');

    if (carousel && 'inert' in carousel) {
      carousel.inert = true;
    }

    syncIconicsPlacement();
    setScrollTop(0);

    transitionFrame = requestAnimationFrame(() => {
      transitionFrame = null;
      if (!articleOpen) return;

      article.classList.add('is-visible');
      syncIconicsPlacement();

      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        if (articleOpen) setScrollTop(0);
      });
    });

    document.dispatchEvent(new CustomEvent('vb:media1-open'));
  };

  /* =========================================================
     08 — ARTICLE CLOSE
     ========================================================= */

  const closeArticle = () => {
    if (!initialized || !articleOpen) return;

    articleOpen = false;
    cancelFrames();

    article.classList.remove('is-visible');
    home.classList.remove('media1-is-open');
    article.hidden = true;

    carousel?.removeAttribute('aria-hidden');

    if (carousel && 'inert' in carousel) {
      carousel.inert = false;
    }

    const iconics = getIconics();

    if (iconics && !main.classList.contains('is-menu-visible')) {
      carousel.insertAdjacentElement('afterend', iconics);
      iconics.classList.remove('iconics--menu');
    }

    setScrollTop(previousScrollTop);

    if (previousFocus?.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }

    document.dispatchEvent(new CustomEvent('vb:media1-close'));
  };

  /* =========================================================
     09 — READ BUTTON CONNECTION
     ========================================================= */

  const connectReadButton = () => {
    const firstSlide = home?.querySelector(SELECTORS.firstSlide);
    const button = firstSlide?.querySelector(SELECTORS.read);

    if (!button) return false;
    if (button === readButton) return true;

    readButton = button;

    if (button instanceof HTMLButtonElement) {
      button.disabled = false;
    }

    button.setAttribute('aria-label', 'Číst článek BOFFI ON-OFF ST');

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openArticle();
    });

    return true;
  };

  /* =========================================================
     10 — HOME INTEGRATION

     DOM:
       .home-carousel
       #media1
       .home-social

     ICONICS se při otevření článku
     přesune mezi #media1 a .home-social.
     ========================================================= */

  const initialize = () => {
    if (initialized) return true;

    main = document.querySelector(SELECTORS.main);
    home = document.querySelector(SELECTORS.home);
    homeContent = home?.querySelector(SELECTORS.content);
    carousel = homeContent?.querySelector(SELECTORS.carousel);

    if (!main || !home || !homeContent || !carousel) return false;

    article = createArticle();
    carousel.insertAdjacentElement('afterend', article);

    initialized = true;

    connectReadButton();
    watchIconics();

    return true;
  };

  /* =========================================================
     11 — STARTUP
     ========================================================= */

  const start = () => {
    if (initialize()) return;

    observer = new MutationObserver(() => {
      if (!initialize()) return;

      observer.disconnect();
      observer = null;
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  };

  /* =========================================================
     12 — PUBLIC API
     ========================================================= */

  window.LivingSpaceMedia1 = Object.freeze({
    create: createArticle,
    open: openArticle,
    close: closeArticle,
    isOpen: () => articleOpen
  });

  /* =========================================================
     13 — KEYBOARD
     ========================================================= */

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !articleOpen) return;
    if (main?.classList.contains('is-menu-visible')) return;
    closeArticle();
  });

  /* =========================================================
     14 — START
     ========================================================= */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  /* =========================================================
     15 — CLEANUP
     ========================================================= */

  window.addEventListener('pagehide', () => {
    observer?.disconnect();
    iconicsObserver?.disconnect();
    cancelFrames();
  }, { once: true });
})();
