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
    imageRoot: '/assets/pics/',
    arrow: '/assets/icons/arrow-right.svg',
    arrowDelay: 2000,
    arrowDuration: 1040
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
      text: 'Modulární kuchyně ON-OFF ST s minimalistickým a nadčasovým designem se vyznačuje samostatně stojící konstrukcí, která je vybavena elektronicky výklopnými čely otevírající se směrem nahoru, čímž odhalují vnitřní prostor pracovní zóny. Po zavření prostor zcela skryjí a promění tak kuchyň v monolitický kus nábytku. Spodní skříňky jsou k dispozici v bezúchytkovém provedení i s klasickým madlem, přičemž sestavu lze doplnit vysokým modulem s bočně zasouvacími dveřmi. Elektronicky motorizovaný systém zajišťuje dokonale plynulý chod a úplné skrytí výklopného panelu z dohledu. Výsledkem je elegantní designový prvek, který si bez kompromisů zachovává maximální funkčnost moderní kuchyně.'
    },
    {
      type: 'image',
      src: '004.png',
      alt: 'BOFFI ON-OFF ST — detail modulární kuchyně'
    },
    {
      type: 'image',
      src: '005.png',
      alt: 'BOFFI ON-OFF ST — detail vestavěných spotřebičů'
    },
    {
      type: 'text',
      text: 'Sofistikovaný systém elektronicky výklopných čel odhaluje špičkové vestavěné spotřebiče.'
    },
    {
      type: 'image',
      src: '006.png',
      alt: 'BOFFI ON-OFF ST — detail spodních skříněk a výsuvných zásuvek'
    },
    {
      type: 'text',
      text: 'Dvířka spodních skříněk lze dodat bez úchytek, vybavená systémem otevírání stisknutím Tip-On.'
    },
    {
      type: 'image',
      src: '007.png',
      alt: 'BOFFI ON-OFF ST — detail kuchyňské skříňky'
    },
    {
      type: 'text',
      text: 'Nabídka materiálů Boffi a jejich kompatibilita s jednotlivými produkty se neustále vyvíjejí; informujte se u svého prodejce o aktuální dostupnosti produktu v požadovaném provedení, nebo přímo na oficiálních stránkách společnosti boffi.com',
      linkText: 'boffi.com',
      linkUrl: 'https://www.boffi.com/'
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
  let backButton = null;
  let backIcon = null;

  let initialized = false;
  let articleOpen = false;
  let previousScrollTop = 0;
  let previousFocus = null;

  let observer = null;
  let iconicsObserver = null;
  let transitionFrame = null;
  let scrollFrame = null;
  let placementFrame = null;
  let arrowTimer = null;

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
     04 — ARROW STYLES

     SVG:
       /assets/icons/arrow-right.svg

     START:
       →

     AFTER 2000 MS:
       2 × 360° + 180°

     FINAL:
       ←

     Animation:
       1040ms cubic-bezier(0.2,0.9,0.2,1)
     ========================================================= */

  const installArrowStyles = () => {
    if (document.getElementById('media1-arrow-styles')) return;

    const style = createElement('style');
    style.id = 'media1-arrow-styles';

    style.textContent = `
      .media1__topbar {
        position:relative;
        display:grid;
        grid-template-columns:34px minmax(0,1fr) 34px;
        align-items:center;
        width:100%;
        min-height:34px;
        margin:0;
        padding:0;
      }

      .media1__back {
        appearance:none;
        -webkit-appearance:none;
        display:inline-flex;
        align-items:center;
        justify-content:flex-start;
        width:34px;
        height:34px;
        margin:0;
        padding:0;
        border:0;
        background:transparent;
        color:#FFFFFF;
        cursor:pointer;
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      }

      .media1__back-icon {
        display:block;
        width:30px;
        height:30px;
        object-fit:contain;
        transform-origin:50% 50%;
        transform:rotate(0deg) translateZ(0);
        will-change:transform;
        backface-visibility:hidden;
        -webkit-backface-visibility:hidden;
      }

      .media1__back-icon.is-spinning {
        animation:media1ArrowSpin 1040ms cubic-bezier(0.2,0.9,0.2,1) forwards;
      }

      @keyframes media1ArrowSpin {
        0% {
          transform:rotate(0deg) translateZ(0);
        }

        100% {
          transform:rotate(900deg) translateZ(0);
        }
      }

      .media1__topbar .media1__title {
        width:100%;
        min-width:0;
        margin:0;
        padding:0;
        text-align:center;
      }

      .media1__back:focus-visible {
        outline:2px solid #FFFFFF;
        outline-offset:4px;
      }

      @media (prefers-reduced-motion:reduce) {
        .media1__back-icon.is-spinning {
          animation-duration:0.01ms;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const stopArrowAnimation = () => {
    if (arrowTimer !== null) {
      clearTimeout(arrowTimer);
      arrowTimer = null;
    }

    backIcon?.classList.remove('is-spinning');
  };

  const startArrowAnimation = () => {
    stopArrowAnimation();

    if (!backIcon) return;

    void backIcon.offsetWidth;

    arrowTimer = window.setTimeout(() => {
      arrowTimer = null;

      if (!articleOpen || !backIcon) return;

      backIcon.classList.add('is-spinning');
    }, CONFIG.arrowDelay);
  };

  /* =========================================================
     05 — ARTICLE BLOCKS
     ========================================================= */

  const createHeader = item => {
    const header = createElement('header', 'media1__header');
    const topbar = createElement('div', 'media1__topbar');

    backButton = createElement('button', 'media1__back');
    backButton.type = 'button';
    backButton.setAttribute('aria-label', 'Zpět na hlavní stránku');

    backIcon = createElement('img', 'media1__back-icon');
    backIcon.src = CONFIG.arrow;
    backIcon.alt = '';
    backIcon.setAttribute('aria-hidden', 'true');
    backIcon.decoding = 'async';
    backIcon.draggable = false;

    backButton.appendChild(backIcon);
    backButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      closeArticle();
    });

    const title = createElement('h1', 'media1__title');
    title.textContent = item.title;

    const rightSlot = createElement('span', 'media1__right-slot');
    rightSlot.setAttribute('aria-hidden', 'true');

    topbar.append(backButton, title, rightSlot);

    const designer = createElement('p', 'media1__designer');
    designer.textContent = `Design: ${item.designer}`;

    header.append(topbar, designer);
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

    if (item.linkText && item.linkUrl && item.text.includes(item.linkText)) {
      const position = item.text.lastIndexOf(item.linkText);
      const before = item.text.slice(0, position);
      const after = item.text.slice(position + item.linkText.length);

      paragraph.appendChild(document.createTextNode(before));

      const link = createElement('a', 'media1__link');
      link.href = item.linkUrl;
      link.textContent = item.linkText;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.color = 'inherit';
      link.style.fontWeight = '700';
      link.style.textDecoration = 'none';

      paragraph.appendChild(link);
      paragraph.appendChild(document.createTextNode(after));
    } else {
      paragraph.textContent = item.text;
    }

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
     06 — ARTICLE FACTORY
     ========================================================= */

  const createArticle = () => {
    installArrowStyles();

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
     07 — ICONICS PLACEMENT

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
     08 — ARTICLE OPEN
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
    startArrowAnimation();
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
     09 — ARTICLE CLOSE

     Návrat na začátek HOME.
     Přepnutí carouselu na první článek BOFFI.
     Autoplay zůstává řízené home.js.
     ========================================================= */

  const closeArticle = () => {
    if (!initialized || !articleOpen) return;

    articleOpen = false;
    cancelFrames();
    stopArrowAnimation();

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

    setScrollTop(0);

    document.dispatchEvent(new CustomEvent('vb:home-go-to-slide', {
      detail: { index: 0 }
    }));

    if (previousFocus?.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }

    document.dispatchEvent(new CustomEvent('vb:media1-close'));
  };

  /* =========================================================
     10 — READ BUTTON CONNECTION
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
     11 — HOME INTEGRATION

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
    iconicsObserver?.disconnect();
    cancelFrames();
    stopArrowAnimation();
  }, { once: true });
})();
