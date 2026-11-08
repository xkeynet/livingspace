'use strict';

/* =========================================================
   LIVINGSPACE — MEDIA 001
   BOFFI / ON-OFF ST

   Samostatný článek a propojení s HOME.
   Bez úprav home.js, home.css nebo main.js.
   ========================================================= */

(() => {
  const MEDIA_ID = 'media1';
  const MEDIA_TITLE = 'ON-OFF ST';
  const MEDIA_DESIGNER = 'Alberto Colonello';

  const SELECTORS = {
    main: '#mainView',
    home: '#homeView',
    carousel: '.home-carousel',
    firstSlide: '.home-carousel__slide:first-child',
    readButton: '.home-carousel__button--read'
  };

  let article = null;
  let articleOpen = false;
  let readButton = null;
  let observer = null;
  let previousScrollTop = 0;
  let previousFocus = null;

  /* =========================================================
     01 — ARTICLE CONTENT
     ========================================================= */

  const MEDIA_CONTENT = [
    {
      type: 'header',
      title: MEDIA_TITLE,
      designer: MEDIA_DESIGNER
    },
    {
      type: 'image',
      src: '/assets/pics/003.png',
      alt: 'BOFFI ON-OFF ST — otevřená kuchyně'
    },
    {
      type: 'text',
      content: 'Modulární kuchyně ON-OFF ST se vyznačuje samostatně stojící konstrukcí vybavenou skládacími dvířky, která se elektronicky otevírají směrem vzhůru a odhalují pracovní prostor uvnitř. Po uzavření pracovní část zcela skryjí a promění kuchyni v monolitický nábytkový prvek.'
    },
    {
      type: 'text',
      content: 'Spodní skříňky jsou dostupné v provedení s úchytkami i bez nich. Vedle nich lze umístit vysokou skříň s dvířky, která se při otevření zasouvají do bočních prostorů.'
    },
    {
      type: 'image',
      src: '/assets/pics/004.png',
      alt: 'BOFFI ON-OFF ST — boční pohled na kuchyni'
    },
    {
      type: 'text',
      content: 'Skládací dvířka systému ON-OFF ST, která zakrývají pracovní desku, jsou vybavena elektronickým mechanismem umožňujícím plynulé otevření a úplné skrytí dvířek. Když je kuchyně zavřená, působí jako elegantní designový prvek, přesto si zachovává veškerou funkčnost moderní kuchyně.'
    },
    {
      type: 'image',
      src: '/assets/pics/005.png',
      alt: 'BOFFI ON-OFF ST — detail pracovní plochy'
    },
    {
      type: 'text',
      content: 'Dvířka spodních skříněk mohou být dodávána bez úchytek, se systémem otevírání zatlačením Tip-On.'
    },
    {
      type: 'image',
      src: '/assets/pics/006.png',
      alt: 'BOFFI ON-OFF ST — detail úložného systému'
    },
    {
      type: 'text',
      content: 'Skládací dvířka se elektronicky otevírají směrem vzhůru a odhalují vše, co je v kuchyni potřeba.'
    },
    {
      type: 'image',
      src: '/assets/pics/007.png',
      alt: 'BOFFI ON-OFF ST — detail mechanismu'
    }
  ];

  /* =========================================================
     02 — ELEMENT FACTORY
     ========================================================= */

  const createElement = (tag, className = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  };

  /* =========================================================
     03 — ARTICLE BLOCKS
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

  const createImage = item => {
    const figure = createElement('figure', 'media1__figure');
    const image = createElement('img', 'media1__image');

    image.src = item.src;
    image.alt = item.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.draggable = false;

    figure.appendChild(image);
    return figure;
  };

  const createText = item => {
    const section = createElement('section', 'media1__text');
    const paragraph = createElement('p', 'media1__paragraph');

    paragraph.textContent = item.content;
    section.appendChild(paragraph);

    return section;
  };

  const createContentBlock = item => {
    switch (item.type) {
      case 'header': return createHeader(item);
      case 'image': return createImage(item);
      case 'text': return createText(item);
      default: return null;
    }
  };

  /* =========================================================
     04 — ARTICLE FACTORY
     ========================================================= */

  const createArticle = () => {
    const element = createElement('article', 'media1');

    element.id = MEDIA_ID;
    element.setAttribute('aria-label', 'BOFFI — ON-OFF ST');

    const back = createElement('button', 'media1__back');
    back.type = 'button';
    back.textContent = '← ZPĚT';
    back.setAttribute('aria-label', 'Zpět na hlavní stránku');

    back.addEventListener('click', closeArticle);

    const content = createElement('div', 'media1__content');

    MEDIA_CONTENT.forEach(item => {
      const block = createContentBlock(item);
      if (block) content.appendChild(block);
    });

    element.append(back, content);

    return element;
  };

  /* =========================================================
     05 — ARTICLE OPEN / CLOSE
     ========================================================= */

  const openArticle = () => {
    if (articleOpen) return;

    const main = document.querySelector(SELECTORS.main);
    const home = document.querySelector(SELECTORS.home);

    if (!main || !home) return;
    if (main.classList.contains('is-menu-visible')) return;

    articleOpen = true;
    previousFocus = document.activeElement;
    previousScrollTop = main.scrollTop;

    if (!article) article = createArticle();

    home.appendChild(article);

    home.classList.add('media1-is-open');

    article.hidden = false;

    main.scrollTop = 0;

    requestAnimationFrame(() => {
      if (!articleOpen) return;

      const back = article.querySelector('.media1__back');
      back?.focus({ preventScroll: true });
    });
  };

  const closeArticle = () => {
    if (!articleOpen) return;

    const main = document.querySelector(SELECTORS.main);
    const home = document.querySelector(SELECTORS.home);

    articleOpen = false;

    if (home) home.classList.remove('media1-is-open');
    if (article) article.hidden = true;

    if (main) main.scrollTop = previousScrollTop;

    if (previousFocus?.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }
  };

  /* =========================================================
     06 — HOME READ BUTTON CONNECTION
     ========================================================= */

  const connectReadButton = () => {
    const firstSlide = document.querySelector(SELECTORS.firstSlide);
    if (!firstSlide) return false;

    const button = firstSlide.querySelector(SELECTORS.readButton);
    if (!button) return false;

    if (button === readButton) return true;

    readButton = button;

    if (button.tagName === 'BUTTON') {
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
     07 — ARTICLE STYLES
     ========================================================= */

  const installArticleStyles = () => {
    if (document.getElementById('media1-integration-styles')) return;

    const style = createElement('style');
    style.id = 'media1-integration-styles';

    style.textContent = `
      .home-view.media1-is-open {
        background: #FFFFFF;
        min-height: 100%;
      }

      .home-view.media1-is-open .home-view__content,
      .home-view.media1-is-open .home-view__divider {
        display: none !important;
      }

      .home-view.media1-is-open .media1 {
        display: block;
        position: relative;
        width: 100%;
        min-height: 100svh;
        padding-top: 150px;
        background: #FFFFFF;
        color: #000000;
        pointer-events: auto;
      }

      .home-view.media1-is-open .media1__back {
        display: block;
        margin: 0 0 20px 20px;
        padding: 8px 12px;
        border: 0;
        background: transparent;
        color: #000000;
        font-family: 'Titillium Web', sans-serif;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }

      .home-view.media1-is-open .media1__back:focus-visible {
        outline: 2px solid #000000;
        outline-offset: 3px;
      }

      .media1[hidden] {
        display: none !important;
      }
    `;

    document.head.appendChild(style);
  };

  /* =========================================================
     08 — INIT
     ========================================================= */

  const init = () => {
    installArticleStyles();

    if (connectReadButton()) return;

    observer = new MutationObserver(() => {
      if (!connectReadButton()) return;

      observer.disconnect();
      observer = null;
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  };

  /* =========================================================
     09 — PUBLIC MODULE
     ========================================================= */

  window.LivingSpaceMedia1 = Object.freeze({
    create: createArticle,
    open: openArticle,
    close: closeArticle
  });

  /* =========================================================
     10 — START
     ========================================================= */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  /* =========================================================
     11 — CLEANUP
     ========================================================= */

  window.addEventListener('pagehide', () => {
    observer?.disconnect();
    observer = null;
  }, { once: true });
})();
