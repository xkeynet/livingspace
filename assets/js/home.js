'use strict';

/* =========================================================
   LIVINGSPACE — HOME
   SEVEN-SLIDE ARTICLE NAVIGATION
   ========================================================= */

(() => {
  const DIVIDER_LOGO_GAP_PX = 8;
  const SLIDE_INTERVAL_MS = 5000;
  const TRANSITION_DURATION_MS = 1050;

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  const SLIDE_COUNT = 7;

  let mainView = null;
  let homeView = null;
  let divider = null;
  let navigation = null;
  let indicators = [];

  let activeIndex = 0;
  let navigationVisible = false;
  let dividerVisible = false;
  let destroyed = false;

  let mainObserver = null;
  let controlsObserver = null;
  let menuObserver = null;

  let syncFrame = null;
  let autoplayTimer = null;
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
        count: SLIDE_COUNT
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

  const goToSlide = index => {
    if (
      destroyed ||
      isMenuOpen() ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= SLIDE_COUNT
    ) {
      return;
    }

    activeIndex = index;
    syncNavigation();
    dispatchSlideChange();
    scheduleAutoplay();
  };

  const showNextSlide = () => {
    if (destroyed) return;

    const nextIndex = (activeIndex + 1) % SLIDE_COUNT;
    goToSlide(nextIndex);
  };

  const createNavigation = () => {
    navigation = createElement('nav', 'home-carousel__navigation');

    navigation.setAttribute(
      'aria-label',
      'Navigace mezi články'
    );

    indicators = Array.from({ length: SLIDE_COUNT }, (_, index) => {
      const indicator = createElement(
        'button',
        'home-carousel__indicator'
      );

      indicator.type = 'button';

      indicator.setAttribute(
        'aria-label',
        `Zobrazit článek ${index + 1} ze ${SLIDE_COUNT}`
      );

      indicator.addEventListener('click', () => {
        goToSlide(index);
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
      !navigationVisible ||
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
     EXTERNAL NAVIGATION
     ========================================================= */

  const handleExternalSlideRequest = event => {
    if (event.detail?.index == null) return;

    const index = Number(event.detail.index);
    goToSlide(index);
  };

  /* =========================================================
     BUTTONS
     ========================================================= */

  const createActions = () => {
    const actions = createElement(
      'div',
      'home-carousel__actions'
    );

    const read = createElement(
      'button',
      'home-carousel__button home-carousel__button--read'
    );

    read.type = 'button';
    read.textContent = 'ČÍST DÁLE';
    read.disabled = true;
    read.setAttribute('aria-label', 'Článek se připravuje');

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
     SOCIAL LINKS
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

    const social = createElement('nav', 'home-social');

    social.setAttribute(
      'aria-label',
      'LIVINGSPACE — sociální sítě'
    );

    const seen = new Set();

    sourceLinks.forEach(source => {
      if (seen.has(source.href)) return;
      seen.add(source.href);

      const link = createElement('a', 'home-social__link');

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
     CREATE HOME CONTENT
     ========================================================= */

  const createHomeContent = () => {
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

    carousel.appendChild(createActions());
    carousel.appendChild(createNavigation());

    content.appendChild(carousel);

    const social = createSocialLinks();
    if (social) content.appendChild(social);

    return content;
  };

  /* =========================================================
     ARRIVAL
     ========================================================= */

  const revealNavigation = () => {
    if (!homeView || navigationVisible || destroyed) return;

    navigationVisible = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!homeView || destroyed) return;

        homeView.classList.add('is-carousel-visible');
        dispatchSlideChange();
        scheduleAutoplay();
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
          revealNavigation,
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
      if (!mainView?.classList.contains('is-controls-visible')) return;

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

  /* =========================================================
     CREATE HOME
     ========================================================= */

  const createHome = () => {
    if (!mainView || document.getElementById('homeView')) return;

    homeView = createElement('section', 'home-view');
    homeView.id = 'homeView';

    homeView.setAttribute(
      'aria-label',
      'LIVINGSPACE — hlavní stránka'
    );

    divider = createElement('div', 'home-view__divider');
    divider.setAttribute('aria-hidden', 'true');

    homeView.append(
      divider,
      createHomeContent()
    );

    mainView.appendChild(homeView);

    syncDivider();
    watchControls();
    watchMenu();
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
  };

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      scheduleAutoplay();
    }
  });

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

    stopAutoplay();

    if (revealTimer !== null) clearTimeout(revealTimer);
    if (syncFrame !== null) cancelAnimationFrame(syncFrame);

    document.removeEventListener(
      'vb:home-go-to-slide',
      handleExternalSlideRequest
    );
  }, { once: true });
})();
