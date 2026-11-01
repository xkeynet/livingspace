'use strict';

/* =========================================================
   LIVINGSPACE — ICONICS
   SOCIAL ICONS & TRADEMARK
   ========================================================= */

(() => {
  const ICONICS = {
    alien: '/assets/img/alien.png',
    heading: 'Více z LIVINGSPACE na:',
    copyright: 'TM & © LIVINGSPACE - Všechna práva vyhrazena',
    icons: [
      { name: 'TikTok', image: '/assets/img/tik-tok.png' },
      { name: 'Instagram', image: '/assets/img/instagram.png' },
      { name: 'X', image: '/assets/img/twitter.png' },
      { name: 'Facebook', image: '/assets/img/facebook-white.png' },
      { name: 'YouTube', image: '/assets/img/youtube.png' },
      { name: 'TWINCH', image: '/assets/img/twinch.png' }
    ]
  };

  let section = null;
  let mainView = null;
  let mainObserver = null;
  let menuObserver = null;
  let destroyed = false;

  const createElement = (tag, className = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
  };

  const createIcon = ({ name, image }) => {
    const item = createElement('span', 'iconics__item');
    const icon = createElement('img', 'iconics__icon');

    icon.src = image;
    icon.alt = name;
    icon.width = 500;
    icon.height = 500;
    icon.loading = 'lazy';
    icon.decoding = 'async';
    icon.draggable = false;

    item.appendChild(icon);
    return item;
  };

  const createIconics = () => {
    const element = createElement('section', 'iconics');
    element.id = 'iconics';
    element.setAttribute('aria-label', 'LIVINGSPACE — sociální sítě');

    const main = createElement('div', 'iconics__main');

    const alien = createElement('img', 'iconics__alien');
    alien.src = ICONICS.alien;
    alien.alt = '';
    alien.setAttribute('aria-hidden', 'true');
    alien.decoding = 'async';
    alien.draggable = false;

    const content = createElement('div', 'iconics__content');

    const heading = createElement('h2', 'iconics__heading');
    heading.textContent = ICONICS.heading;

    const icons = createElement('div', 'iconics__icons');
    icons.setAttribute('aria-label', 'Sociální platformy');

    ICONICS.icons.forEach((item, index) => {
      if (index === ICONICS.icons.length - 1) {
        const divider = createElement('span', 'iconics__divider');
        divider.setAttribute('aria-hidden', 'true');
        icons.appendChild(divider);
      }

      icons.appendChild(createIcon(item));
    });

    const copyright = createElement('p', 'iconics__copyright');
    copyright.textContent = ICONICS.copyright;

    content.append(heading, icons);
    main.append(alien, content);
    element.append(main, copyright);

    return element;
  };

  const syncPlacement = () => {
    if (destroyed || !section || !mainView) return;

    const menuOpen = mainView.classList.contains('is-menu-visible');

    if (menuOpen) {
      const divider = mainView.querySelector('.main-menu__divider');
      if (!divider) return;

      if (section.previousElementSibling !== divider) {
        divider.insertAdjacentElement('afterend', section);
      }

      section.classList.add('iconics--menu');
      return;
    }

    const carousel = mainView.querySelector('#homeView .home-carousel');
    if (!carousel) return;

    if (section.previousElementSibling !== carousel) {
      carousel.insertAdjacentElement('afterend', section);
    }

    section.classList.remove('iconics--menu');
  };

  const mount = () => {
    if (destroyed) return false;

    mainView = document.getElementById('mainView');
    if (!mainView) return false;

    const carousel = mainView.querySelector('#homeView .home-carousel');
    const divider = mainView.querySelector('.main-menu__divider');

    if (!carousel || !divider) return false;

    section = document.getElementById('iconics') || createIconics();

    syncPlacement();

    if (!menuObserver) {
      menuObserver = new MutationObserver(syncPlacement);

      menuObserver.observe(mainView, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    return true;
  };

  if (!mount()) {
    mainObserver = new MutationObserver(() => {
      if (!mount()) return;

      mainObserver?.disconnect();
      mainObserver = null;
    });

    mainObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  window.addEventListener('pagehide', () => {
    destroyed = true;

    mainObserver?.disconnect();
    menuObserver?.disconnect();

    mainObserver = null;
    menuObserver = null;
    section = null;
    mainView = null;
  }, { once: true });
})();
