/**
 * 服務平臺 — Design Tokens Site
 * Interactive JavaScript
 */
(function () {
  'use strict';

  // ---- Sidebar Navigation Active State ----
  const navLinks = document.querySelectorAll('.sidebar__nav a');
  const sections = document.querySelectorAll('.section');

  function setActiveLink() {
    let current = '';
    const scrollY = window.scrollY + 120;

    sections.forEach((section) => {
      const top = section.offsetTop;
      if (scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  // ---- Smooth scroll for nav links ----
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Close sidebar on mobile
      sidebar.classList.remove('open');
    });
  });

  // ---- Mobile Sidebar Toggle ----
  const mobileToggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (
        window.innerWidth < 992 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== mobileToggle
      ) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ---- Copy color value on click ----
  const swatches = document.querySelectorAll('.color-swatch');
  swatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const value = swatch.querySelector('.color-swatch__value');
      if (value) {
        const text = value.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const original = value.textContent;
          value.textContent = '✓ 已複製！';
          value.style.color = 'var(--color-primary-500)';
          setTimeout(() => {
            value.textContent = original;
            value.style.color = '';
          }, 1200);
        });
      }
    });
  });

  // ---- Copy token name on click for semantic cards ----
  const semanticCards = document.querySelectorAll('.semantic-card');
  semanticCards.forEach((card) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const token = card.querySelector('.semantic-card__token');
      if (token) {
        const text = token.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const original = token.textContent;
          token.textContent = '✓ 已複製！';
          setTimeout(() => {
            token.textContent = original;
          }, 1200);
        });
      }
    });
  });

  // ---- Copy token from table rows ----
  document.querySelectorAll('.token-name').forEach((el) => {
    el.style.cursor = 'pointer';
    el.title = '點擊複製';
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.textContent).then(() => {
        const original = el.textContent;
        el.textContent = '✓ copied!';
        setTimeout(() => {
          el.textContent = original;
        }, 1200);
      });
    });
  });
})();
