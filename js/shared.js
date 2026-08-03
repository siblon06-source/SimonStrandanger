// Loaded on every page. Two bits every page needs, previously copy-pasted into
// script.js/gallery.js/project.js separately: the "skip intro once" flag wiring,
// and the hero-contact click-to-copy button. querySelectorAll silently returns
// nothing for selectors a given page doesn't have, so one shared list is safe
// everywhere rather than a different hand-picked list per file.

document.addEventListener('DOMContentLoaded', () => {
  const SKIP_INTRO_KEY = 'skipIntroOnce';
  document.querySelectorAll(
    '.site-nav-link, .site-brand, .photo-gallery-back-icon, .photo-gallery-back, .project-page-back'
  ).forEach(link => {
    link.addEventListener('click', () => {
      sessionStorage.setItem(SKIP_INTRO_KEY, '1');
    });
  });

  const heroContact = document.getElementById('hero-contact');
  if (heroContact) {
    const CONTACT_EMAIL = 'siblon06@gmail.com';
    const COPIED_HOLD_MS = 1800;
    const POP_MS = 420;
    let copiedTimer = null;

    heroContact.addEventListener('click', async e => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
      } catch (err) {
        window.location.href = `mailto:${CONTACT_EMAIL}`;
        return;
      }
      heroContact.classList.add('copied');

      heroContact.classList.remove('pop');
      void heroContact.offsetWidth; // restart the pop animation on repeated clicks
      heroContact.classList.add('pop');
      setTimeout(() => heroContact.classList.remove('pop'), POP_MS);

      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => {
        heroContact.classList.remove('copied');
      }, COPIED_HOLD_MS);
    });
  }
});
