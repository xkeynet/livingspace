'use strict';

/* =========================================================
   LIVINGSPACE — HOME
   ADAPTIVE SEVEN-SLIDE ARTICLE CAROUSEL
   ========================================================= */

(() => {
  const DIVIDER_LOGO_GAP_PX = 8;
  const SLIDE_INTERVAL_MS = 5000;
  const TRANSITION_DURATION_MS = 1050;
  const TRANSITION_FALLBACK_MS = 150;

  /* =========================================================
     01 — ARTICLE DATA

     image       = cesta k fotografii
     alt         = alternativní text fotografie
     brandLogo   = cesta k logu značky
     brandAlt    = alternativní text loga
     title       = nadpis článku
     description = krátký popis
     url         = odkaz na celý článek

     Fotografie zachovávají původní poměr stran.
     Prázdné image nevytváří žádný obrazový prostor.
     ========================================================= */

  const HOME_SLIDES = [
    {
      image: '/assets/pics/001.png',
      alt: 'BOFFI — kuchyně ON-OFF ST',
      brandLogo: '/assets/pics/002.png',
      brandAlt: 'BOFFI',
      title: 'ON-OFF ST',
      description: 'Kuchyň, která dokáže zmizet',
      url: ''
    },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' }
  ];

  /* =========================================================
     02 — STATE
     ========================================================= */

  let mainView = null;
  let homeView = null;
  let viewport = null;
  let slides = [];
  let indicators = [];

  let activeIndex = 0;
  let transitioning = false;
  let carouselVisible = false;
  let dividerVisible = false;
  let destroyed = false;

  let mainObserver = null;
  let controlsObserver = null;
  let menuObserver = null;
  let layoutObserver = null;
  let panelObserver = null;

  let syncFrame = null;
  let trackingFrame = null;
  let trackingTimer = null;
  let autoplayTimer = null;
  let transitionTimer = null;
  let revealTimer = null;
  let controlsTimer = null;
  let arrivalTimer = null;

  let transitionEndHandler = null;
  let transitionEndElement = null;
  let arrivalEndHandler = null;
  let controlsEndHandler = null;
  let controlsEndElement = null;

  const createElement = (tag, className = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  };

  const isMenuOpen = () =>
    Boolean(mainView?.classList.contains('is-menu-visible'));

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const dispatchSlideChange = () => {
    document.dispatchEvent(new CustomEvent('vb:home-slide-change', {
      detail: {
        index: activeIndex,
        count: slides.length
      }
    }));
  };

  /* =========================================================
     03 — DIVIDER
     ========================================================= */

  const getClosedDividerY = () => {
    const logo = mainView?.querySelector('.main-view__logo');
    if (!mainView || !logo) return 0;

    const mainRect = mainView.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();

    return logoRect.bottom - mainRect.top + DIVIDER_LOGO_GAP_PX;
  };

  const getOpenDividerY = () => {
    const originalDivider = mainView?.querySelector('.main-menu__divider');

    if (!mainView || !originalDivider) return getClosedDividerY();

    return (
      originalDivider.getBoundingClientRect().top -
      mainView.getBoundingClientRect().top
    );
  };

  const syncDivider = () => {
    if (!homeView || destroyed) return;

    const y = isMenuOpen()
      ? getOpenDividerY()
      : getClosedDividerY();

    homeView.style.setProperty('--home-divider-y', `${y}px`);
  };

  const scheduleDividerSync = () => {
    if (destroyed) return;

    if (syncFrame !== null) cancelAnimationFrame(syncFrame);

    syncFrame = requestAnimationFrame(() => {
      syncFrame = null;
      syncDivider();
    });
  };

  const stopDividerTracking = () => {
    if (trackingFrame !== null) {
      cancelAnimationFrame(trackingFrame);
      trackingFrame = null;
    }

    if (trackingTimer !== null) {
      clearTimeout(trackingTimer);
      trackingTimer = null;
    }

    if (!homeView || destroyed) return;

    syncDivider();
    homeView.classList.remove('is-divider-tracking');
  };

  const startDividerTracking = () => {
    if (!homeView || destroyed || !isMenuOpen()) return;

    if (trackingFrame !== null) {
      cancelAnimationFrame(trackingFrame);
      trackingFrame = null;
    }

    if (trackingTimer !== null) {
      clearTimeout(trackingTimer);
      trackingTimer = null;
    }

    homeView.classList.add('is-divider-tracking');
    syncDivider();

    const track = () => {
      if (destroyed || !homeView || !isMenuOpen()) {
        stopDividerTracking();
        return;
      }

      syncDivider();
      trackingFrame = requestAnimationFrame(track);
    };

    trackingFrame = requestAnimationFrame(track);

    trackingTimer = window.setTimeout(() => {
      stopDividerTracking();
    }, 500);
  };

  /* =========================================================
     04 — ADAPTIVE CAROUSEL HEIGHT

     Výška vychází ze skutečného obsahu snímku.

     Fotografie 16:9 → odpovídající výška.
     Fotografie 4:3  → odpovídající výška.
     Fotografie 3:2  → odpovídající výška.
     Fotografie 4:5  → odpovídající výška.

     Bez fotografie → pouze text a tlačítka.
     ========================================================= */

  const getSlideHeight = index => {
    const slide = slides[index];
    if (!slide) return 0;

    return Math.ceil(slide.getBoundingClientRect().height);
  };

  const syncViewportHeight = (index, immediate = false) => {
    if (!viewport || destroyed) return;

    const height = getSlideHeight(index);

    viewport.classList.toggle('is-height-jump', immediate);
    viewport.style.height = `${height}px`;

    if (immediate) {
      viewport.getBoundingClientRect();

      requestAnimationFrame(() => {
        if (!destroyed) {
          viewport?.classList.remove('is-height-jump');
        }
      });
    }
  };

  /* =========================================================
     05 — NAVIGATION
     ========================================================= */

  const syncNavigation = () => {
    indicators.forEach((indicator, index) => {
      const active = index === activeIndex;

      indicator.classList.toggle('is-active', active);
      indicator.setAttribute('aria-pressed', String(active));

      if (active) {
        indicator.setAttribute('aria-current', 'true');
      } else {
        indicator.removeAttribute('aria-current');
      }
    });

    slides.forEach((slide, index) => {
      const active = index === activeIndex;

      slide.setAttribute('aria-hidden', String(!active));

      if ('inert' in slide) {
        slide.inert = !active;
      } else {
        slide.querySelectorAll('a, button').forEach(element => {
          if (active) {
            element.removeAttribute('tabindex');
          } else {
            element.setAttribute('tabindex', '-1');
          }
        });
      }
    });
  };

  const createNavigation = () => {
    const navigation = createElement(
      'nav',
      'home-carousel__navigation'
    );

    navigation.setAttribute(
      'aria-label',
      'Navigace mezi články'
    );

    indicators = HOME_SLIDES.map((_, index) => {
      const indicator = createElement(
        'button',
        'home-carousel__indicator'
      );

      indicator.type = 'button';

      indicator.setAttribute(
        'aria-label',
        `Zobrazit článek ${index + 1} ze ${HOME_SLIDES.length}`
      );

      indicator.addEventListener('click', () => {
        if (destroyed || isMenuOpen()) return;

        if (index === activeIndex) {
          scheduleAutoplay();
          return;
        }

        transitionTo(index);
      });

      navigation.appendChild(indicator);
      return indicator;
    });

    syncNavigation();
    return navigation;
  };

  /* =========================================================
     06 — AUTOPLAY
     ========================================================= */

  const stopAutoplay = () => {
    if (autoplayTimer === null) return;

    clearTimeout(autoplayTimer);
    autoplayTimer = null;
  };

  const scheduleAutoplay = () => {
    stopAutoplay();

    if (
      destroyed ||
      !carouselVisible ||
      transitioning ||
      isMenuOpen() ||
      document.hidden
    ) {
      return;
    }

    autoplayTimer = window.setTimeout(() => {
      autoplayTimer = null;
      showNextSlide();
    }, SLIDE_INTERVAL_MS);
  };

  /* =========================================================
     07 — TRANSITION CLEANUP
     ========================================================= */

  const clearTransitionListener = () => {
    if (transitionEndElement && transitionEndHandler) {
      transitionEndElement.removeEventListener(
        'transitionend',
        transitionEndHandler
      );
    }

    transitionEndElement = null;
    transitionEndHandler = null;

    if (transitionTimer !== null) {
      clearTimeout(transitionTimer);
      transitionTimer = null;
    }
  };

  const finishTransition = (current, next) => {
    if (destroyed || !transitioning) return;

    clearTransitionListener();

    current.classList.remove(
      'is-active',
      'is-exiting',
      'is-entering',
      'is-prepared'
    );

    next.classList.remove(
      'is-entering',
      'is-prepared'
    );

    next.classList.add('is-active');

    transitioning = false;

    syncViewportHeight(activeIndex);
    syncNavigation();
    scheduleAutoplay();
  };

  /* =========================================================
     08 — SLIDE TRANSITION
     ========================================================= */

  const transitionTo = nextIndex => {
    if (
      destroyed ||
      transitioning ||
      isMenuOpen() ||
      nextIndex === activeIndex ||
      !slides[nextIndex]
    ) {
      return;
    }

    stopAutoplay();
    transitioning = true;

    const current = slides[activeIndex];
    const next = slides[nextIndex];

    next.classList.remove(
      'is-active',
      'is-exiting',
      'is-entering',
      'is-prepared'
    );

    next.classList.add('is-prepared');

    syncViewportHeight(nextIndex);

    next.getBoundingClientRect();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (destroyed || !current || !next) return;

        next.classList.remove('is-prepared');
        next.classList.add('is-entering');

        current.classList.remove(
          'is-entering',
          'is-prepared'
        );

        current.classList.add('is-exiting');

        activeIndex = nextIndex;

        syncNavigation();
        dispatchSlideChange();

        if (prefersReducedMotion()) {
          finishTransition(current, next);
          return;
        }

        transitionEndElement = next;

        transitionEndHandler = event => {
          if (
            event.target !== next ||
            event.propertyName !== 'transform'
          ) {
            return;
          }

          finishTransition(current, next);
        };

        next.addEventListener(
          'transitionend',
          transitionEndHandler
        );

        transitionTimer = window.setTimeout(() => {
          finishTransition(current, next);
        }, TRANSITION_DURATION_MS + TRANSITION_FALLBACK_MS);
      });
    });
  };

  const showNextSlide = () => {
    if (destroyed || !slides.length) return;

    transitionTo((activeIndex + 1) % slides.length);
  };

  const handleExternalSlideRequest = event => {
    if (event.detail?.index == null) return;

    const index = Number(event.detail.index);

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= slides.length
    ) {
      return;
    }

    if (index === activeIndex) {
      scheduleAutoplay();
      return;
    }

    transitionTo(index);
  };

  /* =========================================================
     09 — ARTICLE ACTIONS
     ========================================================= */

  const createActions = item => {
    const actions = createElement(
      'div',
      'home-carousel__actions'
    );

    /*
     * ČÍST
     * Aktivní pouze při existujícím odkazu na článek.
     */

    let read;

    if (item.url) {
      read = createElement(
        'a',
        'home-carousel__button home-carousel__button--read'
      );

      read.href = item.url;
    } else {
      read = createElement(
        'button',
        'home-carousel__button home-carousel__button--read'
      );

      read.type = 'button';
      read.disabled = true;
      read.setAttribute(
        'aria-label',
        'Článek se připravuje'
      );
    }

    read.textContent = 'ČÍST';

    /*
     * DALŠÍ
     * Přechod na následující snímek.
     */

    const next = createElement(
      'button',
      'home-carousel__button home-carousel__button--next'
    );

    next.type = 'button';
    next.textContent = 'DALŠÍ';

    next.addEventListener('click', () => {
      if (destroyed || isMenuOpen()) return;
      showNextSlide();
    });

    actions.append(read, next);

    return actions;
  };

  /* =========================================================
     10 — ARTICLE CONTENT
     ========================================================= */

  const createArticleContent = item => {
    const article = createElement(
      'div',
      'home-carousel__article'
    );

    if (item.title) {
      const title = createElement(
        'h2',
        'home-carousel__title'
      );

      title.textContent = item.title;
      article.appendChild(title);
    }

    if (item.description) {
      const description = createElement(
        'p',
        'home-carousel__description'
      );

      description.textContent = item.description;
      article.appendChild(description);
    }

    article.appendChild(createActions(item));

    return article;
  };

  /* =========================================================
     11 — CREATE SLIDES
     ========================================================= */

  const createSlides = () => {
    slides = HOME_SLIDES.map((item, index) => {
      const slide = createElement(
        'article',
        'home-carousel__slide'
      );

      slide.setAttribute(
        'aria-label',
        `Článek ${index + 1} ze ${HOME_SLIDES.length}`
      );

      /*
       * Úvodní fotografie.
       * Zachovává původní poměr stran.
       */

      if (item.image) {
        const image = document.createElement('img');

        image.className = 'home-carousel__image';
        image.src = item.image;
        image.alt = item.alt || `LIVINGSPACE — fotografie ${index + 1}`;
        image.decoding = 'async';
        image.draggable = false;

        if (index === 0) {
          image.fetchPriority = 'high';
        } else {
          image.loading = 'lazy';
        }

        image.addEventListener('load', () => {
          if (index === activeIndex) {
            syncViewportHeight(index, !carouselVisible);
          }
        });

        image.addEventListener('error', () => {
          image.remove();

          if (index === activeIndex) {
            syncViewportHeight(index, !carouselVisible);
          }
        });

        slide.appendChild(image);
      }

      /*
       * Logo značky.
       * Samostatný obrazový prvek pod úvodní fotografií.
       * Velikost a centrování řídí home.css.
       */

      if (item.brandLogo) {
        const brandLogo = document.createElement('img');

        brandLogo.className = 'home-carousel__brand-logo';
        brandLogo.src = item.brandLogo;
        brandLogo.alt = item.brandAlt || 'Logo značky';
        brandLogo.decoding = 'async';
        brandLogo.draggable = false;

        brandLogo.addEventListener('load', () => {
          if (index === activeIndex) {
            syncViewportHeight(index, !carouselVisible);
          }
        });

        brandLogo.addEventListener('error', () => {
          brandLogo.remove();

          if (index === activeIndex) {
            syncViewportHeight(index, !carouselVisible);
          }
        });

        slide.appendChild(brandLogo);
      }

      slide.appendChild(createArticleContent(item));
      viewport.appendChild(slide);

      return slide;
    });

    if (slides[0]) {
      slides[0].classList.add('is-prepared');
    }
  };

  /* =========================================================
     12 — SOCIAL LINKS
     ========================================================= */

  const createSocialLinks = () => {
    if (!mainView) return null;

    const sourceLinks = [
      ...mainView.querySelectorAll('.main-menu a[href]')
    ].filter(link => {
      try {
        const url = new URL(link.href, document.baseURI);
        const host = url.hostname.toLowerCase();

        return [
          'instagram.com',
          'tiktok.com',
          'facebook.com',
          'youtube.com',
          'youtu.be',
          'x.com',
          'twitter.com',
          'pinterest.com',
          'linkedin.com'
        ].some(domain =>
          host === domain || host.endsWith(`.${domain}`)
        );
      } catch {
        return false;
      }
    });

    if (!sourceLinks.length) return null;

    const social = createElement(
      'nav',
      'home-social'
    );

    social.setAttribute(
      'aria-label',
      'LIVINGSPACE — sociální sítě'
    );

    const seen = new Set();

    sourceLinks.forEach(source => {
      if (seen.has(source.href)) return;
      seen.add(source.href);

      const link = createElement(
        'a',
        'home-social__link'
      );

      link.href = source.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      const label =
        source.getAttribute('aria-label') ||
        source.getAttribute('title') ||
        source.textContent.trim() ||
        'Sociální síť';

      link.setAttribute('aria-label', label);

      const icon = source.querySelector('img, svg');

      if (icon) {
        const clonedIcon = icon.cloneNode(true);

        clonedIcon.removeAttribute('id');

        if (clonedIcon.tagName.toLowerCase() === 'img') {
          clonedIcon.alt = '';
        } else {
          clonedIcon.setAttribute('aria-hidden', 'true');
        }

        link.appendChild(clonedIcon);
      } else {
        const text = createElement('span');
        text.textContent = label;
        link.appendChild(text);
      }

      social.appendChild(link);
    });

    return social.childElementCount ? social : null;
  };

  /* =========================================================
     13 — CREATE CAROUSEL
     ========================================================= */

  const createCarousel = () => {
    const content = createElement(
      'div',
      'home-view__content'
    );

    const carousel = createElement(
      'section',
      'home-carousel'
    );

    carousel.setAttribute(
      'aria-label',
      'LIVINGSPACE — doporučené články'
    );

    viewport = createElement(
      'div',
      'home-carousel__viewport'
    );

    createSlides();

    carousel.appendChild(viewport);
    carousel.appendChild(createNavigation());

    content.appendChild(carousel);

    const social = createSocialLinks();

    if (social) {
      content.appendChild(social);
    }

    return content;
  };

  /* =========================================================
     14 — ARRIVAL
     ========================================================= */

  const revealCarousel = () => {
    if (!homeView || carouselVisible || destroyed) return;

    carouselVisible = true;
    syncViewportHeight(0, true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!homeView || !slides[0] || destroyed) return;

        homeView.classList.add('is-carousel-visible');

        slides[0].classList.remove('is-prepared');
        slides[0].classList.add('is-active');

        syncNavigation();
        dispatchSlideChange();

        if (prefersReducedMotion()) {
          scheduleAutoplay();
          return;
        }

        arrivalEndHandler = event => {
          if (
            event.target !== slides[0] ||
            event.propertyName !== 'transform'
          ) {
            return;
          }

          slides[0].removeEventListener(
            'transitionend',
            arrivalEndHandler
          );

          arrivalEndHandler = null;
          scheduleAutoplay();
        };

        slides[0].addEventListener(
          'transitionend',
          arrivalEndHandler
        );

        arrivalTimer = window.setTimeout(() => {
          if (arrivalEndHandler) {
            slides[0]?.removeEventListener(
              'transitionend',
              arrivalEndHandler
            );

            arrivalEndHandler = null;
          }

          scheduleAutoplay();
        }, TRANSITION_DURATION_MS + TRANSITION_FALLBACK_MS);
      });
    });
  };

  const revealDivider = () => {
    if (!homeView || dividerVisible || destroyed) return;

    syncDivider();
    dividerVisible = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!homeView || destroyed) return;

        homeView.classList.add('is-divider-visible');

        revealTimer = window.setTimeout(
          revealCarousel,
          180
        );
      });
    });
  };

  /* =========================================================
     15 — MAIN WATCHERS
     ========================================================= */

  const watchControls = () => {
    if (!mainView) return;

    const waitForArrival = () => {
      const control = mainView.querySelector(
        '.main-view__header-button'
      );

      if (!control) {
        revealDivider();
        return;
      }

      controlsEndElement = control;

      controlsEndHandler = event => {
        if (
          event.target !== control ||
          event.propertyName !== 'transform'
        ) {
          return;
        }

        control.removeEventListener(
          'transitionend',
          controlsEndHandler
        );

        controlsEndHandler = null;
        controlsEndElement = null;

        revealDivider();
      };

      control.addEventListener(
        'transitionend',
        controlsEndHandler
      );

      controlsTimer = window.setTimeout(() => {
        if (controlsEndHandler) {
          control.removeEventListener(
            'transitionend',
            controlsEndHandler
          );

          controlsEndHandler = null;
          controlsEndElement = null;
        }

        revealDivider();
      }, TRANSITION_DURATION_MS + TRANSITION_FALLBACK_MS);
    };

    if (mainView.classList.contains('is-controls-visible')) {
      waitForArrival();
      return;
    }

    controlsObserver = new MutationObserver(() => {
      if (!mainView?.classList.contains('is-controls-visible')) {
        return;
      }

      controlsObserver.disconnect();
      controlsObserver = null;

      waitForArrival();
    });

    controlsObserver.observe(mainView, {
      attributes: true,
      attributeFilter: ['class']
    });
  };

  const watchMenu = () => {
    menuObserver = new MutationObserver(() => {
      if (!isMenuOpen()) stopDividerTracking();

      scheduleDividerSync();

      if (isMenuOpen()) {
        stopAutoplay();
      } else {
        scheduleAutoplay();
      }
    });

    menuObserver.observe(mainView, {
      attributes: true,
      attributeFilter: ['class']
    });
  };

  const watchPanels = () => {
    const list = mainView?.querySelector('.main-menu__list');
    if (!list) return;

    panelObserver = new MutationObserver(mutations => {
      if (!isMenuOpen()) return;

      const changed = mutations.some(mutation =>
        mutation.target.classList.contains('main-menu__item') &&
        mutation.oldValue?.includes('is-open') !==
          mutation.target.classList.contains('is-open')
      );

      if (changed) startDividerTracking();
    });

    panelObserver.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      attributeOldValue: true
    });
  };

  const watchLayout = () => {
    if (typeof ResizeObserver === 'undefined') return;

    layoutObserver = new ResizeObserver(() => {
      if (trackingFrame === null) scheduleDividerSync();
      syncViewportHeight(activeIndex);
    });

    [
      mainView.querySelector('.main-menu__content'),
      mainView.querySelector('.main-menu__list'),
      mainView.querySelector('.main-view__logo'),
      ...mainView.querySelectorAll('.main-menu__panel'),
      ...slides
    ]
      .filter(Boolean)
      .forEach(element => {
        layoutObserver.observe(element);
      });
  };

  /* =========================================================
     16 — CREATE HOME
     ========================================================= */

  const createHome = () => {
    if (!mainView || document.getElementById('homeView')) return;

    homeView = createElement(
      'section',
      'home-view'
    );

    homeView.id = 'homeView';

    homeView.setAttribute(
      'aria-label',
      'LIVINGSPACE — hlavní stránka'
    );

    const divider = createElement(
      'div',
      'home-view__divider'
    );

    divider.setAttribute('aria-hidden', 'true');

    homeView.append(
      divider,
      createCarousel()
    );

    mainView.appendChild(homeView);

    syncDivider();
    watchControls();
    watchMenu();
    watchPanels();
    watchLayout();
  };

  const findMain = () => {
    mainView = document.getElementById('mainView');

    if (!mainView) return false;

    createHome();
    return true;
  };

  /* =========================================================
     17 — GLOBAL EVENTS
     ========================================================= */

  const handleResize = () => {
    scheduleDividerSync();
    syncViewportHeight(activeIndex);
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      scheduleAutoplay();
    }
  };

  window.addEventListener(
    'resize',
    handleResize,
    { passive: true }
  );

  window.addEventListener(
    'orientationchange',
    handleResize,
    { passive: true }
  );

  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange
  );

  document.addEventListener(
    'vb:home-go-to-slide',
    handleExternalSlideRequest
  );

  if (!findMain()) {
    mainObserver = new MutationObserver(() => {
      if (!findMain()) return;

      mainObserver.disconnect();
      mainObserver = null;
    });

    mainObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /* =========================================================
     18 — CLEANUP
     ========================================================= */

  window.addEventListener('pagehide', () => {
    destroyed = true;

    mainObserver?.disconnect();
    controlsObserver?.disconnect();
    menuObserver?.disconnect();
    panelObserver?.disconnect();
    layoutObserver?.disconnect();

    stopAutoplay();
    clearTransitionListener();

    if (revealTimer !== null) clearTimeout(revealTimer);
    if (controlsTimer !== null) clearTimeout(controlsTimer);
    if (arrivalTimer !== null) clearTimeout(arrivalTimer);
    if (syncFrame !== null) cancelAnimationFrame(syncFrame);
    if (trackingFrame !== null) cancelAnimationFrame(trackingFrame);
    if (trackingTimer !== null) clearTimeout(trackingTimer);

    if (arrivalEndHandler && slides[0]) {
      slides[0].removeEventListener(
        'transitionend',
        arrivalEndHandler
      );
    }

    if (controlsEndHandler && controlsEndElement) {
      controlsEndElement.removeEventListener(
        'transitionend',
        controlsEndHandler
      );
    }

    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);

    document.removeEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    document.removeEventListener(
      'vb:home-go-to-slide',
      handleExternalSlideRequest
    );
  }, { once: true });
})();
