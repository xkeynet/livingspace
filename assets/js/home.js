'use strict';

/* =========================================================
   LIVINGSPACE — HOME
   SEVEN-SLIDE ADAPTIVE ARTICLE CAROUSEL
   ========================================================= */

(() => {
  const DIVIDER_LOGO_GAP_PX = 8;
  const SLIDE_INTERVAL_MS = 5000;
  const TRANSITION_DURATION_MS = 1050;

  /* =========================================================
     ARTICLE DATA
     ========================================================= */

  const HOME_SLIDES = [
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' },
    { image: null, alt: '', title: '', description: '', url: '' }
  ];

  let mainView = null;
  let homeView = null;
  let divider = null;
  let viewport = null;
  let navigation = null;
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

  let syncFrame = null;
  let autoplayTimer = null;
  let transitionTimer = null;
  let revealTimer = null;

  const createElement = (tag, className = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  };

  const isMenuOpen = () =>
    Boolean(mainView?.classList.contains('is-menu-visible'));

  const dispatchSlideChange = () => {
    document.dispatchEvent(new CustomEvent('vb:home-slide-change', {
      detail: {
        index: activeIndex,
        count: slides.length
      }
    }));
  };

  /* =========================================================
     DIVIDER
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
    if (syncFrame !== null) cancelAnimationFrame(syncFrame);

    syncFrame = requestAnimationFrame(() => {
      syncFrame = null;
      syncDivider();
    });
  };

  /* =========================================================
     ADAPTIVE SLIDE HEIGHT
     ========================================================= */

  const getSlideHeight = index => {
    const slide = slides[index];
    if (!slide) return 0;

    /*
     * The slide's natural content height determines the viewport.
     *
     * No photograph:
     *   Only article content and buttons occupy space.
     *
     * Photograph:
     *   The image retains its original aspect ratio.
     *   Title, description and buttons follow underneath.
     */

    return Math.ceil(slide.scrollHeight);
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
     NAVIGATION
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
  };

  const createNavigation = () => {
    navigation = createElement(
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
     AUTOPLAY
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
      isMenuOpen() ||
      document.hidden ||
      transitioning
    ) {
      return;
    }

    autoplayTimer = window.setTimeout(() => {
      autoplayTimer = null;
      showNextSlide();
    }, SLIDE_INTERVAL_MS);
  };

  /* =========================================================
     SLIDE TRANSITION
     ========================================================= */

  const finishTransition = (current, next) => {
    if (destroyed || !transitioning) return;

    if (transitionTimer !== null) {
      clearTimeout(transitionTimer);
      transitionTimer = null;
    }

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
    scheduleAutoplay();
  };

  const transitionTo = nextIndex => {
    if (
      destroyed ||
      transitioning ||
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

        const onEnd = event => {
          if (
            event.target !== next ||
            event.propertyName !== 'transform'
          ) {
            return;
          }

          next.removeEventListener('transitionend', onEnd);
          finishTransition(current, next);
        };

        next.addEventListener('transitionend', onEnd);

        /*
         * Fallback for interrupted or disabled CSS transitions.
         */

        transitionTimer = window.setTimeout(() => {
          next.removeEventListener('transitionend', onEnd);
          finishTransition(current, next);
        }, TRANSITION_DURATION_MS + 150);
      });
    });
  };

  const showNextSlide = () => {
    if (!slides.length || destroyed) return;

    const nextIndex =
      activeIndex === slides.length - 1
        ? 0
        : activeIndex + 1;

    transitionTo(nextIndex);
  };

  const handleExternalSlideRequest = event => {
    const index = Number(event.detail?.index);

    if (
      destroyed ||
      event.detail?.index == null ||
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
     ARTICLE CONTENT
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

    const actions = createElement(
      'div',
      'home-carousel__actions'
    );

    /*
     * READ:
     * Becomes a real link when an article URL is configured.
     * No navigation to nonexistent article pages.
     */

    if (item.url) {
      const read = createElement(
        'a',
        'home-carousel__button home-carousel__button--read'
      );

      read.href = item.url;
      read.textContent = 'ČÍST';

      actions.appendChild(read);
    } else {
      const read = createElement(
        'button',
        'home-carousel__button home-carousel__button--read'
      );

      read.type = 'button';
      read.textContent = 'ČÍST';
      read.disabled = true;
      read.setAttribute('aria-label', 'Článek se připravuje');

      actions.appendChild(read);
    }

    /*
     * NEXT:
     * Advances to the next slide using the existing carousel.
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

    actions.appendChild(next);
    article.appendChild(actions);

    return article;
  };

  /* =========================================================
     SOCIAL LINKS
     ========================================================= */

  const createSocialLinks = () => {
    /*
     * Reuse existing social links from the main menu.
     * Do not invent social profile URLs or icon paths.
     *
     * The selector targets links containing recognizable
     * social-network destinations.
     */

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

        if (clonedIcon.tagName.toLowerCase() === 'img') {
          clonedIcon.alt = '';
          clonedIcon.removeAttribute('id');
        } else {
          clonedIcon.setAttribute('aria-hidden', 'true');
          clonedIcon.removeAttribute('id');
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
     CREATE CAROUSEL
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

    viewport = createElement(
      'div',
      'home-carousel__viewport'
    );

    carousel.setAttribute(
      'aria-label',
      'LIVINGSPACE — doporučené články'
    );

    slides = HOME_SLIDES.map((item, index) => {
      const slide = createElement(
        'article',
        'home-carousel__slide'
      );

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

        slide.appendChild(image);
      }

      slide.appendChild(createArticleContent(item));
      viewport.appendChild(slide);

      return slide;
    });

    if (slides[0]) {
      slides[0].classList.add('is-prepared');
    }

    carousel.appendChild(viewport);
    carousel.appendChild(createNavigation());

    content.appendChild(carousel);

    const social = createSocialLinks();
    if (social) content.appendChild(social);

    return content;
  };

  /* =========================================================
     ARRIVAL
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

        dispatchSlideChange();

        const onEnd = event => {
          if (
            event.target !== slides[0] ||
            event.propertyName !== 'transform'
          ) {
            return;
          }

          slides[0].removeEventListener('transitionend', onEnd);
          scheduleAutoplay();
        };

        slides[0].addEventListener('transitionend', onEnd);

        window.setTimeout(() => {
          slides[0]?.removeEventListener('transitionend', onEnd);
          scheduleAutoplay();
        }, TRANSITION_DURATION_MS + 150);
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
     MAIN WATCHERS
     ========================================================= */

  const watchControls = () => {
    if (!mainView) return;

    const waitForArrival = () => {
      const control = mainView.querySelector(
        '.main-view__header-button'
      );

      if (!control) return revealDivider();

      const onEnd = event => {
        if (
          event.target !== control ||
          event.propertyName !== 'transform'
        ) {
          return;
        }

        control.removeEventListener('transitionend', onEnd);
        revealDivider();
      };

      control.addEventListener('transitionend', onEnd);

      window.setTimeout(() => {
        control.removeEventListener('transitionend', onEnd);
        revealDivider();
      }, TRANSITION_DURATION_MS + 150);
    };

    if (mainView.classList.contains('is-controls-visible')) {
      return waitForArrival();
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

  const watchLayout = () => {
    if (typeof ResizeObserver === 'undefined') return;

    layoutObserver = new ResizeObserver(() => {
      scheduleDividerSync();
      syncViewportHeight(activeIndex);
    });

    [
      mainView.querySelector('.main-menu__content'),
      mainView.querySelector('.main-menu__list'),
      mainView.querySelector('.main-view__logo'),
      ...mainView.querySelectorAll('.main-menu__panel')
    ]
      .filter(Boolean)
      .forEach(element => {
        layoutObserver.observe(element);
      });

    /*
     * Observe the slide contents, not the viewport itself.
     * This avoids resize feedback loops.
     */

    slides.forEach(slide => {
      layoutObserver.observe(slide);
    });
  };

  /* =========================================================
     CREATE HOME
     ========================================================= */

  const createHome = () => {
    if (
      !mainView ||
      document.getElementById('homeView')
    ) {
      return;
    }

    homeView = createElement(
      'section',
      'home-view'
    );

    homeView.id = 'homeView';

    homeView.setAttribute(
      'aria-label',
      'LIVINGSPACE — hlavní stránka'
    );

    divider = createElement(
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
    watchLayout();
  };

  const findMain = () => {
    mainView = document.getElementById('mainView');

    if (!mainView) return false;

    createHome();
    return true;
  };

  /* =========================================================
     GLOBAL EVENTS
     ========================================================= */

  const handleResize = () => {
    scheduleDividerSync();
    syncViewportHeight(activeIndex);
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
    () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        scheduleAutoplay();
      }
    }
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
     CLEANUP
     ========================================================= */

  window.addEventListener('pagehide', () => {
    destroyed = true;

    mainObserver?.disconnect();
    controlsObserver?.disconnect();
    menuObserver?.disconnect();
    layoutObserver?.disconnect();

    stopAutoplay();

    if (transitionTimer !== null) {
      clearTimeout(transitionTimer);
    }

    if (revealTimer !== null) {
      clearTimeout(revealTimer);
    }

    if (syncFrame !== null) {
      cancelAnimationFrame(syncFrame);
    }

    document.removeEventListener(
      'vb:home-go-to-slide',
      handleExternalSlideRequest
    );
  }, { once: true });
})();
