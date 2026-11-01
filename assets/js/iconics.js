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
    const section = createElement('section', 'iconics');
    section.id = 'iconics';
    section.setAttribute('aria-label', 'LIVINGSPACE — sociální sítě');

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
    section.append(main, copyright);

    return section;
  };

  const mount = () => {
    if (document.getElementById('iconics')) return true;

    const carousel = document.querySelector('#homeView .home-carousel');
    if (!carousel) return false;

    const section = createIconics();
    carousel.insertAdjacentElement('afterend', section);

    return true;
  };

  if (!mount()) {
    const observer = new MutationObserver(() => {
      if (!mount()) return;
      observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('pagehide', () => {
      observer.disconnect();
    }, { once: true });
  }
})();
