document.addEventListener('DOMContentLoaded', () => {
  // "Skip intro once" wiring lives in shared.js, loaded on every page.

  const mainImage = document.getElementById('photo-gallery-main-image');
  const current = document.getElementById('photo-gallery-current');
  const total = document.getElementById('photo-gallery-total');
  const rail = document.querySelector('.photo-gallery-rail');

  const thumbs = Array.from(document.querySelectorAll('.photo-gallery-thumb'));
  const stops = Array.from(document.querySelectorAll('.photo-gallery-stop'));
  total.textContent = String(stops.length).padStart(2, '0');
  let activeIndex = -1;

  // renderGallery runs on every scroll tick and every frame of the wheel-driven
  // glide, so the rail-layout query/reads below are cached rather than redone each
  // time — they're static until the viewport is actually resized.
  const railQuery = window.matchMedia('(min-width: 781px)');
  let thumbTop = 0;
  let thumbStep = 0;
  let thumbHeight = 0;
  let railHeight = 0;
  function remeasureRail() {
    thumbTop = thumbs[0].offsetTop;
    thumbStep = thumbs[1].offsetTop - thumbTop;
    thumbHeight = thumbs[0].offsetHeight;
    railHeight = rail.offsetHeight;
  }
  remeasureRail();
  window.addEventListener('resize', remeasureRail);

  // `position` stays fractional, so the thumbnail rail moves for every pixel of
  // scroll instead of waiting to reach the next image number.
  function renderGallery(position) {
    const baseIndex = Math.max(0, Math.min(thumbs.length - 1, Math.floor(position)));
    const selectedImage = thumbs[baseIndex].querySelector('img');
    if (mainImage.src !== selectedImage.src) mainImage.src = selectedImage.src;
    mainImage.alt = selectedImage.alt;
    current.textContent = String(baseIndex + 1).padStart(2, '0');

    thumbs.forEach((thumb, thumbIndex) => {
      const distance = Math.abs(thumbIndex - position);
      thumb.classList.toggle('is-active', thumbIndex === baseIndex);
      thumb.style.setProperty('--wave-offset', `${Math.max(0, 52 - distance * 18)}px`);
      thumb.style.setProperty('--wave-scale', Math.max(0.7, 1 - distance * 0.1));
    });
    stops.forEach((stop, stopIndex) => stop.classList.toggle('is-current', stopIndex === baseIndex));

    if (railQuery.matches) {
      const itemCentre = thumbTop + thumbHeight / 2 + position * thumbStep;
      const railShift = railHeight / 2 - itemCentre;
      rail.style.setProperty('--rail-shift', `${railShift}px`);
    } else if (baseIndex !== activeIndex) {
      thumbs[baseIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    activeIndex = baseIndex;
  }

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener('click', event => {
      event.preventDefault();
      scrollTarget = stops[index].offsetTop;
      if (!glideFrame) glideFrame = requestAnimationFrame(glideToTarget);
    });
  });

  // Each stop is one viewport tall. Keeping the decimal portion gives the image
  // transition a continuous value instead of snapping between fixed positions.
  let scrollTicking = false;
  function updateFromScrollPosition() {
    const stopHeight = Math.max(window.innerHeight, 580);
    const position = Math.max(0, Math.min(stops.length - 1, window.scrollY / stopHeight));
    renderGallery(position);
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    // Keep the custom target in sync after scrollbar, keyboard and thumbnail use.
    if (!glideFrame) scrollTarget = window.scrollY;
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateFromScrollPosition);
  }, { passive: true });

  renderGallery(0);

  // Wheel input adds energy to a target position. The browser then glides toward
  // that target over several frames, creating a continuous, water-like motion.
  let scrollTarget = window.scrollY;
  let glideFrame = null;
  const GLIDE_EASING = 0.085;
  const WHEEL_STRENGTH = 1.65;

  function glideToTarget() {
    const currentY = window.scrollY;
    const distance = scrollTarget - currentY;
    if (Math.abs(distance) < 0.35) {
      window.scrollTo(0, scrollTarget);
      glideFrame = null;
      return;
    }
    window.scrollTo(0, currentY + distance * GLIDE_EASING);
    glideFrame = requestAnimationFrame(glideToTarget);
  }

  window.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = Math.max(0, Math.min(maxScroll, scrollTarget + event.deltaY * WHEEL_STRENGTH));
    if (!glideFrame) glideFrame = requestAnimationFrame(glideToTarget);
  }, { passive: false });
});
