'use strict';

/* =========================================================
   LIVINGSPACE — MEDIA 001
   BOFFI / ON-OFF ST

   JS  = OBSAH A STRUKTURA ČLÁNKU
   CSS = DESIGN A RESPONZIVITA

   Samostatný modul článku.
   Bez zásahů do HOME carouselu.
   ========================================================= */

(() => {
  const MEDIA_ID = 'media1';
  const MEDIA_TITLE = 'ON-OFF ST';
  const MEDIA_DESIGNER = 'Alberto Colonello';

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
      content: ''
    },
    {
      type: 'image',
      src: '/assets/pics/004.png',
      alt: 'BOFFI ON-OFF ST — pohled na kuchyň'
    },
    {
      type: 'text',
      content: ''
    },
    {
      type: 'image',
      src: '/assets/pics/005.png',
      alt: 'BOFFI ON-OFF ST — detail pracovní plochy'
    },
    {
      type: 'text',
      content: ''
    },
    {
      type: 'image',
      src: '/assets/pics/006.png',
      alt: 'BOFFI ON-OFF ST — detail úložného systému'
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
     03 — CONTENT RENDERING
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
    const article = createElement('article', 'media1');
    article.id = MEDIA_ID;
    article.setAttribute('aria-label', 'BOFFI — ON-OFF ST');

    const content = createElement('div', 'media1__content');

    MEDIA_CONTENT.forEach(item => {
      const block = createContentBlock(item);
      if (block) content.appendChild(block);
    });

    article.appendChild(content);
    return article;
  };

  /* =========================================================
     05 — PUBLIC MODULE
     ========================================================= */

  window.LivingSpaceMedia1 = Object.freeze({
    create: createArticle
  });
})();
