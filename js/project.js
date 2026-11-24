// Script for standalone project pages (hero video, project galleries, progress
// dots). shared.js (loaded alongside this) covers what every page needs; the
// rest of index.html's script.js (intro, carousel) doesn't apply here.

document.addEventListener('DOMContentLoaded', () => {
  // "Skip intro once" wiring and the hero-contact button live in shared.js,
  // loaded on every page.

  // ---------- Hero video: plays inline in the same box the image sits in ----------
  // Pausing crossfades back to the thumbnail + play button; the <video> element
  // itself is never removed, so pressing play again resumes from the same spot
  // rather than restarting.

  document.querySelectorAll('.project-page-media--video').forEach(media => {
    const src = media.dataset.video;
    if (!src) return;
    let video = null;

    function ensureVideo() {
      if (video) return video;
      video = document.createElement('video');
      video.className = 'project-page-media-video';
      video.src = src;
      video.controls = true;
      video.playsInline = true;
      video.addEventListener('play', () => media.classList.remove('is-paused'));
      video.addEventListener('pause', () => media.classList.add('is-paused'));
      video.addEventListener('ended', () => media.classList.add('is-paused'));
      media.appendChild(video);
      media.classList.add('is-playing');
      return video;
    }

    media.addEventListener('click', () => {
      const v = ensureVideo();
      if (v.paused) v.play().catch(() => {});
    });
  });

  // ---------- Facts strip: counts are computed from the page itself so they never
  // go stale. Anything written by hand in a <dl class="project-page-facts"> in the
  // HTML (Roll, Tid, Verktyg, ...) comes first and the counts are appended. ----------

  const story = document.querySelector('.project-page-story');
  if (story) {
    let facts = document.querySelector('.project-page-facts');
    const imageCount = document.querySelectorAll('.project-page-gallery-item img').length;
    const videoCount = document.querySelectorAll(
      '.project-page-gallery-item video, .project-page-media--video, .project-page-media--youtube'
    ).length;
    const counts = [];
    if (imageCount) counts.push(['Bilder', imageCount]);
    if (videoCount) counts.push(['Video', videoCount]);

    if (counts.length) {
      if (!facts) {
        facts = document.createElement('dl');
        facts.className = 'project-page-facts';
        story.after(facts);
      }
      counts.forEach(([label, value]) => {
        const cell = document.createElement('div');
        cell.innerHTML = `<dt>${label}</dt><dd>${value}</dd>`;
        facts.appendChild(cell);
      });
    }
  }

  // ---------- Gallery reveal: tiles fade up as they scroll into view. Only when
  // the browser supports it and motion isn't reduced; otherwise everything is
  // simply visible. ----------

  const revealTiles = Array.from(document.querySelectorAll('.project-page-gallery-item'));
  if (revealTiles.length && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-reveal');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealTiles.forEach(tile => revealObserver.observe(tile));
  }

  // ---------- Project gallery: click a tile to view it large, with prev/next
  // through the rest of the set. One lightbox built once and reused, rather
  // than per-page markup, since every project page has the same gallery shape. ----------

  // Only image tiles open in the lightbox; video tiles play inline with their own
  // controls (they have no <img>, which used to throw on click).
  const galleryItems = Array.from(document.querySelectorAll('.project-page-gallery-item'))
    .filter(item => item.querySelector('img'));

  if (galleryItems.length) {
    const EXPAND_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>`;

    galleryItems.forEach(item => {
      const expand = document.createElement('span');
      expand.className = 'project-page-gallery-expand';
      expand.setAttribute('aria-hidden', 'true');
      expand.innerHTML = EXPAND_ICON;
      item.appendChild(expand);
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
    });

    const lightbox = document.createElement('div');
    lightbox.className = 'project-lightbox';
    lightbox.innerHTML = `
      <button type="button" class="project-lightbox-prev" aria-label="Föregående bild"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg></button>
      <img class="project-lightbox-img" alt="">
      <button type="button" class="project-lightbox-next" aria-label="Nästa bild"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg></button>
      <button type="button" class="project-lightbox-close" aria-label="Stäng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('.project-lightbox-img');
    let activeIndex = -1;

    function openLightbox(index) {
      activeIndex = index;
      const sourceImg = galleryItems[index].querySelector('img');
      lightboxImg.src = sourceImg.src;
      lightboxImg.alt = sourceImg.alt;
      lightbox.classList.add('is-open');
      document.body.classList.add('lightbox-open');
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
    }

    function showRelative(delta) {
      openLightbox((activeIndex + delta + galleryItems.length) % galleryItems.length);
    }

    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index));
      item.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openLightbox(index);
      });
    });

    lightbox.querySelector('.project-lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.project-lightbox-prev').addEventListener('click', () => showRelative(-1));
    lightbox.querySelector('.project-lightbox-next').addEventListener('click', () => showRelative(1));
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', event => {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showRelative(-1);
      if (event.key === 'ArrowRight') showRelative(1);
    });
  }

  // ---------- Projects showcase: progress dots tracking scroll position ----------

  const showcaseProgress = document.getElementById('projects-showcase-progress');
  const showcaseItems = Array.from(document.querySelectorAll('.projects-showcase-item'));

  if (showcaseProgress && showcaseItems.length) {
    const dots = showcaseItems.map((item, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'projects-showcase-dot';
      dot.textContent = String(i + 1);
      dot.setAttribute('aria-label', `Gå till projekt ${i + 1}`);
      dot.addEventListener('click', () => {
        showcaseItems[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      showcaseProgress.appendChild(dot);
      return dot;
    });

    const showcaseObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.intersectionRatio >= 0.5) {
          const index = showcaseItems.indexOf(entry.target);
          dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
        }
      });
    }, { threshold: 0.5 });
    showcaseItems.forEach(item => showcaseObserver.observe(item));
  }
});
