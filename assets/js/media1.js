'use strict';

/* =========================================================
   LIVINGSPACE — MEDIA 001
   BOFFI / ON-OFF ST

   ARTICLE ENGINE — HOME INTEGRATION

   Článek je součástí existující HOME.
   Žádné přesměrování ani samostatná stránka.

   home.js / home.css / main.js = BEZE ZMĚN
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
    social: '.home-social'
  });

  /* =========================================================
     01 — ARTICLE CONTENT

     Fotografie a texty jsou samostatné bloky.
     Jejich pořadí lze upravovat bez změny rendereru.
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
  let social = null;
  let article = null;
  let readButton = null;

  let initialized = false;
  let articleOpen = false;
  let previousScrollTop = 0;
  let previousFocus = null;

  let observer = null;
  let transitionFrame = null;
  let scrollFrame = null;

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
    if (!main) return;

    main.scrollTop = value;
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
  };

  /* =========================================================
     04 — ARTICLE HEADER
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

  /* =========================================================
     05 — ARTICLE PHOTOGRAPHY
     ========================================================= */

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

  /* =========================================================
     06 — ARTICLE TEXT
     ========================================================= */

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
     07 — ARTICLE FACTORY
     ========================================================= */

  const createArticle = () => {
    const element = createElement('article', 'media1');

    element.id = CONFIG.id;
    element.hidden = true;
    element.setAttribute('aria-label', 'BOFFI — ON-OFF ST');

    const navigation = createElement('div', 'media1__navigation');

    const back = createElement('button', 'media1__back');

    back.type = 'button';
    back.textContent = '← ZPĚT';
    back.setAttribute('aria-label', 'Zpět na HOME');
    back.addEventListener('click', closeArticle);

    navigation.appendChild(back);

    const content = createElement('div', 'media1__content');

    CONTENT.forEach((item, index) => {
      const block = createBlock(item, index);

      if (block) content.appendChild(block);
    });

    element.append(navigation, content);

    return element;
  };

  /* =========================================================
     08 — ARTICLE OPEN

     HOME zůstává zachovaný.
     Skrývá se pouze carousel.

     Header, logo, menu, divider a sociální
     sekce zůstávají součástí původní stránky.
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

    setScrollTop(0);

    transitionFrame = requestAnimationFrame(() => {
      transitionFrame = null;

      if (!articleOpen) return;

      article.classList.add('is-visible');

      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;

        if (!articleOpen) return;

        setScrollTop(0);
      });
    });

    document.dispatchEvent(new CustomEvent('vb:media1-open'));
  };

  /* =========================================================
     09 — ARTICLE CLOSE

     Obnoví původní HOME bez vytváření
     nového carouselu.
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

    setScrollTop(previousScrollTop);

    if (previousFocus?.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }

    document.dispatchEvent(new CustomEvent('vb:media1-close'));
  };

  /* =========================================================
     10 — READ BUTTON CONNECTION

     Aktivuje původní tlačítko ČÍST.
     Nemění jeho design ani HTML strukturu.
     ========================================================= */

  const connectReadButton = () => {
    const firstSlide = home?.querySelector(SELECTORS.firstSlide);
    const button = firstSlide?.querySelector(SELECTORS.read);

    if (!button) return false;
    if (button === readButton) return true;

    readButton = button;

    if (button instanceof HTMLButtonElement) {
      button.disabled = false;
      button.removeAttribute('aria-label');
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
     11 — HOME INTEGRATION

     Pořadí DOM:

     HOME CONTENT
       CAROUSEL
       ARTICLE
       SOCIAL

     Při čtení:
       CAROUSEL = SKRYTÝ
       ARTICLE  = VIDITELNÝ
       SOCIAL   = POD ČLÁNKEM
     ========================================================= */

  const initialize = () => {
    if (initialized) return true;

    main = document.querySelector(SELECTORS.main);
    home = document.querySelector(SELECTORS.home);

    homeContent = home?.querySelector(SELECTORS.content);
    carousel = homeContent?.querySelector(SELECTORS.carousel);
    social = homeContent?.querySelector(SELECTORS.social);

    if (!main || !home || !homeContent || !carousel) return false;

    article = createArticle();

    if (social) {
      homeContent.insertBefore(article, social);
    } else {
      carousel.insertAdjacentElement('afterend', article);
    }

    initialized = true;

    connectReadButton();

    return true;
  };

  /* =========================================================
     12 — STARTUP
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
     13 — PUBLIC API
     ========================================================= */

  window.LivingSpaceMedia1 = Object.freeze({
    create: createArticle,
    open: openArticle,
    close: closeArticle,
    isOpen: () => articleOpen
  });

  /* =========================================================
     14 — KEYBOARD
     ========================================================= */

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !articleOpen) return;
    if (main?.classList.contains('is-menu-visible')) return;

    closeArticle();
  });

  /* =========================================================
     15 — START
     ========================================================= */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  /* =========================================================
     16 — CLEANUP
     ========================================================= */

  window.addEventListener('pagehide', () => {
    observer?.disconnect();
    cancelFrames();
  }, { once: true });
})();
