// Reloading is meant to always replay the intro from the top. Without this, the
// browser's own scroll restoration can jump straight back to wherever you'd
// scrolled to (Photograph/footer are normal page height regardless of whether
// the curtain has handed off yet) before any of this file has run — a visible
// flash of not-yet-initialized content that then snaps back up to the top.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', () => {
  // "Skip intro once" wiring and the hero-contact button live in shared.js,
  // loaded on every page — not duplicated here.

  const intro = document.getElementById('intro');
  const wordEl = document.getElementById('intro-word');
  const main = document.getElementById('main-content');

  const fastGreetings = ['Hello', 'Hola', 'Bonjour', 'Ciao', 'Hallo', 'こんにちは', '你好'];

  const LETTER_DELAY = 140; // ms between each letter's stair-step entrance
  const LETTER_ANIM = 420;
  const HEJ_HOLD = 300;
  const HEJ_EXIT = 180;

  const BLINK_ON = 260;
  const START_DELAY = 500; // ms before "Hej" starts animating in

  let skipped = false;
  let introReady = false;
  let lockProjectReveal = true;

  function markIntroReady() {
    if (introReady) return;
    introReady = true;
    window.dispatchEvent(new Event('introready'));
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function playHej() {
    return new Promise(resolve => {
      wordEl.innerHTML = '';
      'Hej'.split('').forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'hej-letter';
        span.textContent = ch;
        span.style.animationDelay = `${i * LETTER_DELAY}ms`;
        wordEl.appendChild(span);
      });
      const totalIn = 2 * LETTER_DELAY + LETTER_ANIM;
      setTimeout(resolve, totalIn);
    });
  }

  function hideHej() {
    return new Promise(resolve => {
      wordEl.style.transition = `opacity ${HEJ_EXIT}ms ease`;
      wordEl.style.opacity = '0';
      setTimeout(() => {
        wordEl.style.transition = '';
        wordEl.style.opacity = '';
        wordEl.innerHTML = '';
        resolve();
      }, HEJ_EXIT);
    });
  }

  function blinkWord(word) {
    return new Promise(resolve => {
      wordEl.textContent = word;
      setTimeout(resolve, BLINK_ON);
    });
  }

  function finishIntro() {
    if (intro.classList.contains('hide')) return;
    intro.classList.add('hide');
    main.classList.add('visible');
    markIntroReady();
    const leftCurtain = intro.querySelector('.curtain-left');
    leftCurtain.addEventListener('transitionend', () => {
      intro.style.display = 'none';
      // scrolling stays locked until 1s after the curtain has fully finished opening
      setTimeout(() => {
        document.documentElement.style.overflow = '';
      }, 1000);
    }, { once: true });
  }

  function skipIntro() {
    skipped = true;
    finishIntro();
  }

  window.addEventListener('click', skipIntro, { once: true });
  window.addEventListener('keydown', skipIntro, { once: true });

  const SKIP_INTRO_KEY = 'skipIntroOnce';

  async function playIntro() {
    // plays on every real page load/reload — the ONE exception is coming back from a
    // project page via its "Alla projekt" link, which sets this single-use flag right
    // before navigating so you're not forced through "Hej" again just to get back
    if (sessionStorage.getItem(SKIP_INTRO_KEY)) {
      sessionStorage.removeItem(SKIP_INTRO_KEY);
      lockProjectReveal = false;
      intro.style.display = 'none';
      main.classList.add('visible');
      markIntroReady();
      return;
    }

    document.documentElement.style.overflow = 'hidden';

    await wait(START_DELAY);
    if (!skipped) {
      await playHej();
      await wait(HEJ_HOLD);
      await hideHej();
    }
    for (const word of fastGreetings) {
      if (skipped) break;
      await blinkWord(word);
    }
    finishIntro();
  }

  playIntro();

  // ---------- Projects: curtain-reveal anchor, unfold outward, then drag/scroll gallery ----------

  const projectsSection = document.getElementById('projects');
  const projectsTrack = document.getElementById('projects-track');
  const projectsProgress = document.getElementById('projects-progress');

  if (projectsSection && projectsTrack) {
    const projectItems = Array.from(projectsTrack.querySelectorAll('.project-item'));
    const anchorItem = projectsTrack.querySelector('.project-item.anchor');

    // A real infinite loop, not just a wraparound number: clone the whole set a few
    // times on each side ([...clones][real 1-9][...clones]) so scrolling past either
    // end always shows a continuation instead of a hard cut. The moment the wheel/drag
    // crosses into a clone, an invisible jump lands on the equivalent spot in the real
    // set — since the clone is pixel-identical, nothing appears to happen. Multiple
    // copies (not just one) on each side means even a large single-tick jump — a fast
    // trackpad fling, or a dot click landing several projects away — still has enough
    // buffer to land on real, rendered content instead of scrolling past it into blank
    // track space.
    const LOOP_BUFFER_SETS = 3;
    function cloneRealItems(before) {
      const ordered = before ? [...projectItems].reverse() : projectItems;
      ordered.forEach(item => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('tabindex', '-1');
        clone.classList.remove('anchor', 'revealed');
        // Clones never play the stack-and-fly-out reveal animation (that only ever
        // runs on the real projectItems), so without this they'd sit forever at the
        // CSS default of `.project-item:not(.anchor) { opacity: 0 }` — invisible but
        // still occupying their correct layout position, which is exactly what showed
        // up as a "white void": empty-looking space that was actually just fully
        // transparent clone items. flown-in is what the real items get once the
        // reveal finishes, so give it to clones immediately — they should always be
        // visible from the start, no animation to wait for.
        clone.classList.add('flown-in');
        clone.style.transform = '';
        clone.style.opacity = '';
        if (before) projectsTrack.insertBefore(clone, projectsTrack.firstChild);
        else projectsTrack.appendChild(clone);
      });
    }
    for (let i = 0; i < LOOP_BUFFER_SETS; i++) {
      cloneRealItems(true);
      cloneRealItems(false);
    }
    // Every copy on screen — real items AND the loop-buffer clones alike. Clicking
    // and the "everything else retreats" animation both need this, not just
    // projectItems (the 9 real ones): depending on scroll position, some of what's
    // actually visible at click time is a clone, and a clone with no click handler
    // silently did nothing when clicked, while other visible clones never joined
    // the retreat-and-fade since that loop only ever walked the real 9.
    const allProjectItems = Array.from(projectsTrack.querySelectorAll('.project-item'));

    // Centering item 1/2 (or 8/9) can legitimately need a scrollLeft outside
    // [loopStart, loopStart+loopWidth) once the viewport is wider than a couple of
    // items (their centering math pushes past the real-set span into a clone) —
    // that's fine, it's still inside the cloned buffer, but enforceLoopBounds can't
    // tell "deliberately centering" from "overscroll" and will yank the position
    // mid-animation, fighting the native smooth-scroll frame by frame (this is what
    // showed up as a blank/white flash when clicking dot 1 or 2). Suppressing the
    // correction for the duration of a dot-click's scroll, then letting it run once
    // more after, avoids that fight while still keeping the long-term invariant.
    let suppressLoopCorrection = false;
    let suppressLoopTimer = null;

    // build the progress dots, one per real project — hover reveals the number, click
    // smooth-scrolls the track to bring that project into view
    projectItems.forEach((item, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'progress-dot';
      dot.setAttribute('aria-label', `Gå till projekt ${i + 1}`);
      const number = document.createElement('span');
      number.className = 'progress-dot-number';
      number.textContent = String(i + 1);
      dot.appendChild(number);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        const rawTarget = item.offsetLeft - (projectsTrack.clientWidth - item.offsetWidth) / 2;
        // Shift by whole loop-widths to the copy nearest the current position, so the
        // animation covers the shortest possible distance instead of always crossing
        // back to one fixed absolute spot.
        let target = rawTarget;
        if (loopWidth > 0) {
          const wraps = Math.round((target - projectsTrack.scrollLeft) / loopWidth);
          target -= wraps * loopWidth;
        }
        suppressLoopCorrection = true;
        clearTimeout(suppressLoopTimer);
        projectsTrack.scrollTo({ left: target, behavior: 'smooth' });
        suppressLoopTimer = setTimeout(() => {
          suppressLoopCorrection = false;
          enforceLoopBounds();
        }, 900);
      });
      projectsProgress.appendChild(dot);
    });
    const dots = Array.from(projectsProgress.children);

    function centerAnchor() {
      if (!anchorItem) return;
      const targetScroll = anchorItem.offsetLeft - (projectsTrack.clientWidth - anchorItem.offsetWidth) / 2;
      projectsTrack.scrollLeft = Math.max(0, targetScroll);
    }

    // every item keeps its natural width the whole time (nothing stretches) — non-anchor
    // items just start translated exactly on top of the anchor, stacked and invisible,
    // ready to fly straight out to their real spot in either direction
    function parkItemsOnAnchor() {
      if (!anchorItem) return;
      const anchorLeft = anchorItem.offsetLeft;
      projectItems.forEach(item => {
        if (item === anchorItem) return;
        item.style.transform = `translateX(${anchorLeft - item.offsetLeft}px)`;
      });
    }

    // cached instead of read fresh on every wheel tick — offsetLeft/offsetWidth force a
    // synchronous layout, and doing that on every single wheel event (they can fire dozens
    // of times a second) is what made the scroll handling feel janky. loopStart/loopWidth
    // bound just the real (uncloned) set: scrollLeft below loopStart or at/past
    // loopStart+loopWidth means the wheel/drag has crossed into a clone.
    let loopStart = 0;
    let loopWidth = 0;
    // each real item's own centered scrollLeft (same formula the dots' click handler
    // and centerAnchor use) — cached here so the active-dot lookup in updateProgress
    // can just compare against these instead of reading layout on every scroll tick.
    // Needed because items don't all share the same width, so a plain fraction of
    // loopWidth doesn't land on the right item.
    let itemCenterTargets = [];
    function updateLoopBounds() {
      const firstReal = projectItems[0];
      const lastReal = projectItems[projectItems.length - 1];
      loopStart = firstReal.offsetLeft;
      loopWidth = lastReal.offsetLeft + lastReal.offsetWidth - loopStart;
      itemCenterTargets = projectItems.map(item =>
        item.offsetLeft - (projectsTrack.clientWidth - item.offsetWidth) / 2
      );
    }

    // if scrolling (wheel, drag, or the dots' smooth-scroll) ever lands inside a cloned
    // copy, silently re-land on the equivalent spot in the real set — same pixels either
    // side of the jump, so it reads as an uninterrupted loop rather than a snap. Uses
    // modulo rather than a single +/- loopWidth so it still lands correctly even when
    // scrollLeft has overshot by more than one loop's width in a single tick (a hard
    // fling can do this) — otherwise one correction wouldn't be enough and the gallery
    // would briefly show blank track before a second 'scroll' event corrects it again.
    function enforceLoopBounds() {
      if (loopWidth <= 0 || suppressLoopCorrection) return;
      const sl = projectsTrack.scrollLeft;
      if (sl < loopStart || sl >= loopStart + loopWidth) {
        projectsTrack.scrollLeft = loopStart + (((sl - loopStart) % loopWidth) + loopWidth) % loopWidth;
      }
    }
    projectsTrack.addEventListener('scroll', enforceLoopBounds, { passive: true });

    centerAnchor();
    parkItemsOnAnchor();
    updateLoopBounds();
    window.addEventListener('resize', () => {
      centerAnchor();
      if (!projectsTrack.classList.contains('expanded')) {
        parkItemsOnAnchor();
      }
      updateLoopBounds();
    });

    // stays false until the reveal + fly-out sequence has fully finished — horizontal
    // scroll (below) is blocked until then so a fast scroller can't interrupt/fight it,
    // while plain vertical scrolling up/down keeps working the whole time
    let revealComplete = false;
    // Each of playReveal's two stages (anchor curtain-open, then the rest flying out)
    // takes this long — the site-brand entrance below is timed to the same total
    // (2x this) so both finish together as one beat, not two staggered ones.
    const REVEAL_STAGE_MS = 750;

    // Kept invisible until this exact moment (see .site-brand's default opacity:0 in
    // CSS) so it enters alongside the carousel's own reveal instead of just sitting
    // on screen the whole time the "Hej" intro plays. brand-intro temporarily swaps
    // its transition to match the carousel's full reveal duration; the forced reflow
    // between the two class adds is what makes the transition actually pick up that
    // longer duration instead of still running on the fast 200ms hover/curtain-hide
    // one it had a moment ago. Removed again once the reveal is over so hover and the
    // curtain-hide toggle go back to their normal snappy 200ms.
    function revealSiteBrand() {
      const brand = document.querySelector('.site-brand');
      if (!brand) return;
      brand.classList.add('brand-intro');
      void brand.offsetWidth;
      brand.classList.add('is-revealed');
      setTimeout(() => brand.classList.remove('brand-intro'), REVEAL_STAGE_MS * 2);
    }

    function playReveal() {
      revealSiteBrand();
      if (anchorItem) anchorItem.classList.add('revealed');
      setTimeout(() => {
        projectItems.forEach(item => {
          if (item === anchorItem) return;
          item.style.transform = 'translateX(0)';
          item.classList.add('flown-in');
        });
        projectsTrack.classList.add('expanded');
        setTimeout(() => {
          revealComplete = true;
          document.body.classList.remove('projects-locked');
        }, REVEAL_STAGE_MS);
      }, REVEAL_STAGE_MS);
    }

    let revealQueued = false;
    function queueRevealAfterIntro() {
      if (revealQueued) return;
      revealQueued = true;
      // Locked for the full ~1.5s the reveal animation takes, on a fresh load AND
      // on a return from a project page — the animation should always actually
      // play (never skipped), so scrolling needs to stay blocked the whole time
      // it's running or a scroll could interrupt/fight it mid-flight.
      document.body.classList.add('projects-locked');
      // The 1s beat only makes sense after the "Hej" intro has actually played on a
      // real load — coming back from a project page skips that intro entirely, so
      // the reveal should just start right away instead of sitting on a dead pause.
      const revealDelay = lockProjectReveal ? 1000 : 0;
      const startReveal = () => setTimeout(playReveal, revealDelay);
      if (introReady) startReveal();
      else window.addEventListener('introready', startReveal, { once: true });
    }

    if ('IntersectionObserver' in window) {
      const projectsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            queueRevealAfterIntro();
            projectsObserver.disconnect();
          }
        });
      }, { threshold: 0.3 });
      projectsObserver.observe(projectsSection);
    } else {
      queueRevealAfterIntro();
    }

    // vertical wheel drives horizontal movement once the section has fully scrolled into
    // place — based purely on scroll position, not on where the cursor happens to be, so
    // it doesn't matter whether the mouse is over the images or anywhere else on the page.
    // The IntersectionObserver is just a cheap gate so the wheel handler below only ever
    // does real work near the section, not on every single wheel tick for the entire page.
    let nearProjects = false;
    const nearProjectsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { nearProjects = entry.isIntersecting; });
    }, { threshold: 0 });
    nearProjectsObserver.observe(projectsSection);

    // About doubles as the curtain: while riding up over the carousel it's fixed
    // full-screen (.curtain-mode, set in the HTML), so its own heading/cards are the
    // thing printed on the curtain, moving with it as one piece — not a separate
    // blank panel with real content revealed only afterwards.
    const aboutSection = document.getElementById('about');
    const aboutReveal = aboutSection && aboutSection.querySelector('.about-reveal');

    const FORWARD_LAPS_BEFORE_RELEASE = 0.5;
    // Caps how much a single wheel tick can move curtainProgress. Without this, one
    // big deltaY spike (a hard trackpad fling, or its momentum tail) can satisfy the
    // lap gate AND push curtainProgress from 0 straight past 1 in the same tick —
    // handing off to page content instantly instead of visibly rising, and then the
    // rest of that same fling's momentum continues as uncapped native scroll straight
    // through About into Photograph. Clamping forces the rise to always take a
    // minimum number of ticks, so handoff can't happen mid-fling before the curtain
    // has actually had a chance to animate into view.
    const CURTAIN_MAX_DELTA_PER_TICK = 260;
    let forwardScrolled = 0; // net forward accumulator, floored at 0 — see the wheel handler
    let curtainProgress = 0; // 0 = parked below the viewport, 1 = fully covering it
    // Once the curtain fully covers the carousel, control hands off to normal page
    // scrolling through About/Photograph/footer — this flag tracks which mode we're in.
    let handedOff = false;
    // A hard fling's momentum keeps sending wheel events for a while after the one
    // that triggered handoff — and once handed off, forward scrolling is normal
    // uncapped native scroll, so that leftover momentum could otherwise carry
    // straight through the whole About section into Photograph in one continuous
    // motion. Briefly absorbing forward scroll right at the handoff moment gives the
    // fling's momentum somewhere to bleed off instead of the page.
    const HANDOFF_GRACE_MS = 220;
    let handoffGraceUntil = 0;

    // Scroll-scrubbed, not animated: progress tracks the wheel 1:1, so scrolling
    // further pulls the curtain further up and reversing pushes it back down.
    //
    // The number itself still updates synchronously every tick (the wheel handler's
    // own state machine — forwardScrolled, the handoff check — reads curtainProgress
    // immediately after calling this, so that can't be deferred). Only the actual DOM
    // writes are batched to once per animation frame: a fast trackpad can fire this
    // dozens of times between two paints, and since setting --about-progress forces a
    // style recalc of the heading + its 4 underline marks on top of the curtain's own
    // transform, writing it on every single tick (instead of once per frame like the
    // Photograph section already does for its own per-tick math) is what made the
    // curtain rise feel newly hackig once the heading started reading this value.
    let curtainVisualUpdateQueued = false;
    let headerHidden = null;
    function setHeaderHidden(hidden) {
      if (headerHidden === hidden) return;
      headerHidden = hidden;
      document.body.classList.toggle('curtain-covers-header', hidden);
    }
    // The curtain's rising edge only reaches the header's own small strip near the top
    // of the screen very late in the rise — this measures exactly which curtainProgress
    // that is (from real layout, so it holds at any viewport height) rather than
    // guessing a fixed fraction, so the header hides and reveals in sync with the
    // curtain actually covering/uncovering it, symmetrically in both directions
    // (matching how the carousel underneath it works), instead of firing early on the
    // way up or waiting for a full return to the very top on the way down.
    let headerCoverProgress = 1;
    // Small buffer so reveal-again needs the curtain to have receded a bit past the
    // same line, not the exact same value hide used — without this, a single jitter
    // tick right at that boundary could hide and reveal the header back to back.
    const HEADER_REVEAL_HYSTERESIS = 0.02;
    function measureHeaderCoverProgress() {
      const brand = document.querySelector('.site-brand');
      const nav = document.querySelector('.site-nav');
      const headerBottom = Math.max(
        brand ? brand.getBoundingClientRect().bottom : 0,
        nav ? nav.getBoundingClientRect().bottom : 0
      );
      headerCoverProgress = window.innerHeight > 0 ? Math.max(0, 1 - headerBottom / window.innerHeight) : 1;
    }
    measureHeaderCoverProgress();
    window.addEventListener('resize', measureHeaderCoverProgress);

    function setCurtainProgress(p) {
      curtainProgress = Math.max(0, Math.min(1, p));
      if (!aboutSection || curtainVisualUpdateQueued) return;
      curtainVisualUpdateQueued = true;
      requestAnimationFrame(() => {
        curtainVisualUpdateQueued = false;
        // Only touch the header/transform/pointerEvents while still riding as the
        // fixed curtain — by the time this fires, handOffToContent() may already have
        // revealed the header and cleared the other two to normal-flow defaults, and
        // curtainProgress is deliberately left sitting at 1 forever after that (so the
        // heading keeps rendering correctly) — without this guard, this same queued
        // frame would reread that stale 1 and hide the header right back again the
        // instant after handoff had just shown it.
        if (aboutSection.classList.contains('curtain-mode')) {
          // Reading curtainProgress here rather than at call time is what gives this
          // the same jitter-immunity as the transform below: trackpad momentum
          // routinely sends a stray reverse-sign tick mid-gesture, and toggling the
          // header's visibility synchronously on every tick made that single-frame
          // dip visible as a flash-back-in — reading the settled value once per frame
          // instead means a dip that gets overwritten before this callback runs never
          // gets painted at all, exactly like the transform never visibly jitters.
          if (curtainProgress >= headerCoverProgress) setHeaderHidden(true);
          else if (curtainProgress <= headerCoverProgress - HEADER_REVEAL_HYSTERESIS) setHeaderHidden(false);
          aboutSection.style.transform = `translateY(${(1 - curtainProgress) * 100}%)`;
          aboutSection.style.pointerEvents = curtainProgress > 0 ? 'auto' : 'none';
        }
        // The curtain-face heading/marks read this directly in CSS (see .about-heading
        // and .hl::after). Intentionally never reset on handoff: it stays at 1 so the
        // heading renders pixel-identically across the fixed-to-static swap.
        aboutSection.style.setProperty('--about-progress', String(curtainProgress));
      });
    }

    // Once fully covered, About gets out of fixed "curtain" mode and settles into its
    // real spot in the page flow — the scroll jump lands it in exactly the same
    // on-screen spot, so the switch itself is invisible.
    function handOffToContent() {
      handedOff = true;
      handoffGraceUntil = Date.now() + HANDOFF_GRACE_MS;
      if (aboutSection) {
        aboutSection.classList.remove('curtain-mode');
        aboutSection.style.transform = '';
        aboutSection.style.pointerEvents = '';
        window.scrollTo(0, aboutSection.offsetTop);
      }
      // The header stays hidden here on purpose — it should read as covered by the
      // curtain for as long as the carousel underneath it effectively is, only
      // reappearing once actually scrolled back toward the carousel (returnFromContent
      // sets curtainProgress back to 1, then it counts back down from there — see
      // setCurtainProgress), not the instant the curtain finishes its rise.
      // curtainProgress itself intentionally stays at 1 forever after this too, so
      // both stay in the same "covered" state throughout About/Photograph/footer.
      // pointer-events:none (in CSS) keeps mouse/touch off .about-reveal while it's
      // still below the curtain's fold, but does nothing about keyboard focus — a
      // Tab-only visitor could still land on the CV link inside it while it's
      // genuinely off-screen and unreachable by any scroll. `inert` removes it from
      // the tab order (and hover/AT) too, so it only lifts once the content is real.
      if (aboutReveal) aboutReveal.inert = false;

      // The carousel's own wheel handler is `{ passive: false }` — it has to be, to
      // hijack vertical wheel into horizontal scroll — but that same flag forces the
      // browser to wait for this JS to run before it's allowed to start scrolling on
      // every single wheel tick, for as long as the listener stays attached. Once
      // handed off there's nothing left for it to intercept except the brief grace
      // window below, so it comes back off right after that expires — the rest of
      // About/Photograph/footer scrolls with zero JS in the loop, exactly as smooth
      // as a plain page. The passive scroll listener above takes over watching for
      // the scroll-back-up case in the meantime.
      clearTimeout(removeCarouselWheelTimer);
      removeCarouselWheelTimer = setTimeout(() => {
        window.removeEventListener('wheel', handleCarouselWheel);
      }, HANDOFF_GRACE_MS);
    }

    function returnFromContent() {
      handedOff = false;
      if (aboutSection) aboutSection.classList.add('curtain-mode');
      if (aboutReveal) aboutReveal.inert = true;
      // Synchronous, mirroring handOffToContent()'s own synchronous setHeaderHidden(false)
      // — setCurtainProgress(1) below only re-hides it on the next rAF tick, which left a
      // one-frame window where a fast return-then-forward flick could show it again before
      // that frame ever ran.
      setHeaderHidden(true);
      setCurtainProgress(1);
      window.scrollTo(0, 0);
      // Back in carousel/curtain territory — re-arm the wheel hijack (a no-op if the
      // handoff grace window hasn't actually expired yet and it was never removed).
      clearTimeout(removeCarouselWheelTimer);
      window.addEventListener('wheel', handleCarouselWheel, { passive: false });
    }

    // Scrolling back up to the very top of About hands control back to the
    // carousel+curtain, however far down the page (About/Photograph/footer) the
    // visitor has scrolled since handoff. A plain passive scroll listener can detect
    // this by direction-of-travel alone (current position vs. the last tick's) just
    // as reliably as reading the wheel event's deltaY — without needing a non-passive
    // listener to stay attached for the rest of the page's scroll lifetime just to
    // watch for it.
    let lastKnownScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const scrollingUp = y < lastKnownScrollY;
      lastKnownScrollY = y;
      if (!handedOff || !aboutSection || !scrollingUp) return;
      if (y <= aboutSection.offsetTop + 10) returnFromContent();
    }, { passive: true });

    let removeCarouselWheelTimer = null;

    function handleCarouselWheel(e) {
      if (document.body.classList.contains('projects-locked')) {
        e.preventDefault();
        return;
      }

      if (handedOff) {
        // Absorb the tail end of whatever scroll gesture just triggered the handoff,
        // so it can't also carry straight through About into Photograph in one motion.
        // (The reverse case — scrolling back up — is handled above by the passive
        // scroll listener instead, since this listener is removed shortly after this
        // grace window closes.)
        if (e.deltaY > 0 && Date.now() < handoffGraceUntil) {
          e.preventDefault();
        }
        return;
      }

      // Not handed off yet: every wheel tick belongs to the carousel+curtain, full
      // stop — `handedOff` above is already the single source of truth for which mode
      // we're in. This used to also require window.scrollY<=2 before capturing the
      // tick; any stray pixel of native scroll drift (elastic bounce, or a tick
      // arriving right as the IntersectionObserver below first attaches) then fell
      // through un-prevented as a normal page scroll — which is how a scroll could
      // sail straight past the carousel with the curtain never rising at all — and
      // re-arriving at scrollY<=2 afterwards forced curtainProgress back to 0,
      // yanking a mid-rise curtain back down out of nowhere.
      if (!nearProjects || !revealComplete) return;
      e.preventDefault();

      const scrollingForward = e.deltaY > 0;

      // The gallery keeps looping on every tick, full stop — it never stops responding
      // to the wheel just because a lap has passed, so the scroll always feels
      // continuous/infinite instead of hitching to a halt once the curtain arms.
      // (enforceLoopBounds, on the 'scroll' event this triggers, is what actually keeps
      // it seamless once this crosses into the cloned buffer on either side.)
      projectsTrack.scrollLeft += e.deltaY;

      // Net-forward accumulator, floored at 0 rather than snapped to 0 the instant a
      // single tick goes backward — real trackpad scrolling is never perfectly
      // monotonic (momentum deceleration and small finger drift both routinely emit a
      // stray reverse-sign tick), and hard-resetting on any one of those wiped out
      // almost-there progress, which is what made the curtain feel like it sometimes
      // just refused to show up no matter how much the visitor kept scrolling forward.
      forwardScrolled = Math.max(0, forwardScrolled + e.deltaY);

      // After 1 gallery lap, forward scrolling ALSO drags the curtain up over the
      // (still-looping) gallery underneath — and once it's fully up, one more nudge
      // forward hands off to normal scrolling through the page below.
      if (curtainProgress > 0 || forwardScrolled >= loopWidth * FORWARD_LAPS_BEFORE_RELEASE) {
        const clampedDelta = Math.max(-CURTAIN_MAX_DELTA_PER_TICK, Math.min(CURTAIN_MAX_DELTA_PER_TICK, e.deltaY));
        const nextCurtain = curtainProgress + clampedDelta / window.innerHeight;
        if (scrollingForward && nextCurtain >= 1) {
          setCurtainProgress(1);
          handOffToContent();
        } else {
          setCurtainProgress(nextCurtain);
        }
      }
    }

    window.addEventListener('wheel', handleCarouselWheel, { passive: false });

    window.addEventListener('keydown', e => {
      if (!document.body.classList.contains('projects-locked')) return;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });

    // click-and-drag to pan horizontally — only counts as a drag past a small movement
    // threshold, so a plain click on a thumbnail still fires normally
    let isPointerDown = false;
    let isDragging = false;
    let didDrag = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    const DRAG_THRESHOLD = 6; // px

    projectsTrack.addEventListener('pointerdown', e => {
      isPointerDown = true;
      isDragging = false;
      didDrag = false;
      dragStartX = e.clientX;
      dragStartScroll = projectsTrack.scrollLeft;
    });

    projectsTrack.addEventListener('pointermove', e => {
      if (!isPointerDown) return;
      const deltaX = e.clientX - dragStartX;
      if (!isDragging && Math.abs(deltaX) > DRAG_THRESHOLD) {
        isDragging = true;
        didDrag = true;
        projectsTrack.classList.add('dragging');
        projectsTrack.setPointerCapture(e.pointerId);
      }
      if (isDragging) {
        projectsTrack.scrollLeft = dragStartScroll - deltaX;
      }
    });

    function endDrag() {
      isPointerDown = false;
      isDragging = false;
      projectsTrack.classList.remove('dragging');
    }
    projectsTrack.addEventListener('pointerup', endDrag);
    projectsTrack.addEventListener('pointercancel', endDrag);

    function updateProgress() {
      if (!itemCenterTargets.length) return;
      const scrollLeft = projectsTrack.scrollLeft;
      let closestIndex = 0;
      let closestDist = Infinity;
      for (let i = 0; i < itemCenterTargets.length; i++) {
        const rawDist = itemCenterTargets[i] - scrollLeft;
        // With multiple loop-buffer copies, the current view can be showing an item's
        // position in a different copy than the one itemCenterTargets recorded — wrap
        // the distance into its shortest form (mod loopWidth) so the item that's
        // actually centered on screen is the one that gets marked active, regardless
        // of which repeat of it we're looking at.
        const dist = loopWidth > 0
          ? Math.abs(rawDist - Math.round(rawDist / loopWidth) * loopWidth)
          : Math.abs(rawDist);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      }
      dots.forEach((dot, i) => dot.classList.toggle('active', i === closestIndex));
    }
    // The gallery's wheel-driven scrollLeft changes can fire this scroll event dozens
    // of times a second — coalescing to one rAF per frame (same pattern as the other
    // continuous-update handlers in this file) is free here since it only moves a
    // visual active-dot indicator, nothing time-sensitive.
    let progressTicking = false;
    projectsTrack.addEventListener('scroll', () => {
      if (progressTicking) return;
      progressTicking = true;
      requestAnimationFrame(() => {
        progressTicking = false;
        updateProgress();
      });
    }, { passive: true });

    // each thumbnail is a real link to its own project page (projects/project-N.html).
    // Before actually navigating there, play a quick transition on this page: every
    // other thumbnail retreats toward the clicked one and fades, then the clicked
    // image grows (FLIP) to fill the screen — then the browser navigates for real.
    const NAVIGATE_RETREAT_MS = 400;
    const NAVIGATE_GROW_MS = 550;

    allProjectItems.forEach(item => {
      item.addEventListener('click', e => {
        if (didDrag) {
          e.preventDefault();
          return;
        }

        e.preventDefault();
        const href = item.getAttribute('href');
        const clip = item.querySelector('.project-item-clip');
        const startRect = clip.getBoundingClientRect();

        const selectedLeft = item.offsetLeft;
        allProjectItems.forEach(other => {
          if (other === item) return;
          const delta = selectedLeft - other.offsetLeft;
          other.style.transition = `transform ${NAVIGATE_RETREAT_MS}ms cubic-bezier(0.65, 0, 0.35, 1), opacity ${NAVIGATE_RETREAT_MS}ms ease`;
          other.style.transform = `translateX(${delta}px)`;
          other.style.opacity = '0';
        });
        const footer = projectsSection.querySelector('.projects-footer');
        footer.style.transition = `opacity ${NAVIGATE_RETREAT_MS}ms ease`;
        footer.style.opacity = '0';

        setTimeout(() => {
          // Grow the clip's actual box (top/left/width/height), not a transform:
          // scale. Scaling would blow up the already-cropped small image like a
          // zoomed-in photo (blurry, and it looks "corrected" the instant the real
          // project page paints its own crisp full-size image). Animating the real
          // box dimensions instead lets object-fit: cover keep recalculating the
          // crop live at every frame's true size, so it's always rendered crisp —
          // what's visible is more a widening window onto the same full-resolution
          // image, like a curtain pulling back, never a raster zoom.
          item.style.transition = 'none';
          item.style.transform = 'none';
          void item.offsetWidth;

          // The cursor stays over the (still-growing) box the whole time, so the
          // :hover image-scale effect would otherwise keep applying throughout —
          // stacking a small extra zoom on top of the grow animation, which is
          // exactly the raster-zoom look this transition is meant to avoid.
          const img = clip.querySelector('.project-item-img');
          if (img) {
            img.style.transition = 'none';
            img.style.transform = 'none';
            void img.offsetWidth;
          }

          clip.style.position = 'fixed';
          clip.style.top = `${startRect.top}px`;
          clip.style.left = `${startRect.left}px`;
          clip.style.width = `${startRect.width}px`;
          clip.style.height = `${startRect.height}px`;
          clip.style.zIndex = '1000';
          void clip.offsetWidth; // apply the starting position before animating

          clip.style.transition = [
            `top ${NAVIGATE_GROW_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
            `left ${NAVIGATE_GROW_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
            `width ${NAVIGATE_GROW_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
            `height ${NAVIGATE_GROW_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
          ].join(', ');
          requestAnimationFrame(() => {
            clip.style.top = '0px';
            clip.style.left = '0px';
            clip.style.width = `${window.innerWidth}px`;
            clip.style.height = `${window.innerHeight}px`;
          });

          setTimeout(() => {
            window.location.href = href;
          }, NAVIGATE_GROW_MS);
        }, NAVIGATE_RETREAT_MS);
      });
    });
  }

  // The curtain face (eyebrow/heading) is driven entirely by the --about-progress
  // custom property written in setCurtainProgress() above. Everything below the
  // fold (.about-reveal) gets a one-shot fade+rise instead — plain IntersectionObserver,
  // no continuous scroll-scrub, since this content only ever needs to arrive once.
  const aboutRevealTargets = document.querySelectorAll('.about-reveal-item, .about-timeline-item, .about-timeline');
  if (aboutRevealTargets.length) {
    if ('IntersectionObserver' in window) {
      const aboutRevealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          aboutRevealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
      aboutRevealTargets.forEach(el => aboutRevealObserver.observe(el));
    } else {
      aboutRevealTargets.forEach(el => el.classList.add('in-view'));
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) document.documentElement.classList.add('reduce-motion');

  // ---------- Photograph: "Photograph" sits still and centred first, then more scrolling flies the images in ----------

  const photoShowcase = document.querySelector('.photo-showcase');
  if (photoShowcase) {
    const photoStage = photoShowcase.querySelector('.photo-showcase-stage');
    const photoCards = Array.from(photoShowcase.querySelectorAll('.photo-showcase-card'));
    // [x vw, y vh, rotateX deg, rotateY deg, z px, start scale, arrival rank] — each card
    // leans in on ONE dominant axis (a clean "card tilting into place" read) with just a
    // little of the other axis for texture, rather than tumbling on both at once. Kept
    // close to its final size throughout (scale stays near 0.85-0.9) so the arrival reads
    // through rotation/position/depth, not a dramatic grow-from-tiny.
    // "rank" (a shuffle of 0-11) drives the stagger order instead of grid position, so
    // cards don't land left-to-right/top-to-bottom in sequence — corners, edges and the
    // middle arrive in a scattered order while still never landing all at once.
    const photoStarts = [
      [-16, -10, 18, -108, -900, .88, 5], [-8, -16, -84, 22, -950, .86, 9], [8, -14, -19, 102, -880, .9, 1], [16, -8, 78, -24, -950, .87, 7],
      [-18, -4, 22, 120, -1000, .85, 3], [-8, 4, -96, -18, -880, .89, 11], [8, 3, 17, 90, -900, .88, 0], [18, -2, -82, -22, -980, .86, 8],
      [-14, 12, 19, -106, -920, .87, 4], [-6, 16, 84, -20, -950, .86, 2], [6, 14, -18, 108, -900, .89, 6], [16, 10, -86, 19, -980, .85, 10]
    ];
    const SETTLE_VH = 0.6; // scroll room (in viewport heights), once pinned, before the fly-in starts at all
    const HOLD_VH = 0.6; // scroll room held after landing, fully still, before the section releases
    let photoTicking = false;

    // .about switches between fixed "curtain" (zero document height) and normal flow
    // the moment it hands off, which shifts this section's offsetTop — so this can't be
    // measured once at setup. But re-reading offsetTop/offsetHeight (both force a layout
    // flush) on every single scroll tick was real, measurable jank during the fly-in.
    // Cache it instead, and only remeasure on resize or the rare tick where About's own
    // curtain-mode class just flipped — checking a classList is free, layout is not.
    const aboutEl = document.getElementById('about');
    let cachedPinStart = 0;
    let cachedPinDuration = 0;
    let wasCurtainMode = null;

    function remeasurePhotoShowcase() {
      cachedPinStart = photoShowcase.offsetTop;
      cachedPinDuration = photoShowcase.offsetHeight - photoStage.offsetHeight;
    }
    remeasurePhotoShowcase();

    let lastSectionProgress = -1; // -1 so the very first real frame always runs

    function updatePhotoShowcase() {
      const isCurtainMode = !!aboutEl && aboutEl.classList.contains('curtain-mode');
      if (isCurtainMode !== wasCurtainMode) {
        wasCurtainMode = isCurtainMode;
        remeasurePhotoShowcase();
      }

      const settleDistance = window.innerHeight * SETTLE_VH;
      const holdDistance = window.innerHeight * HOLD_VH;
      const revealDistance = Math.max(1, cachedPinDuration - settleDistance - holdDistance);
      const scrolledPastSettle = window.scrollY - cachedPinStart - settleDistance;
      const sectionProgress = Math.max(0, Math.min(1, scrolledPastSettle / revealDistance));

      // settle and hold alone are 1.2 viewport-heights of scroll where nothing should
      // move at all — skip the 12-card update entirely rather than rewriting the same
      // opacity/transform values on every tick through those dead zones
      if (sectionProgress === lastSectionProgress) {
        photoTicking = false;
        return;
      }
      lastSectionProgress = sectionProgress;

      photoCards.forEach((card, index) => {
        const [x, y, rotateX, rotateY, z, startScale, rank] = photoStarts[index];
        // A narrower per-card window than before (was .52, ~12 cards could be mid-flight
        // at once) — .38 caps it around 6 simultaneously, roughly halving how many
        // elements the GPU has to rasterize a 3D transform for on any single frame,
        // while still reading as "several cards tumbling in 3D together" rather than
        // just one at a time. Stagger is sized so the last-ranked card's window still
        // lands fully by sectionProgress 1.
        const cardProgress = Math.max(0, Math.min(1, (sectionProgress - rank * .056) / .38));

        // Opacity ramps up over just the first third of the card's own window, so it's
        // fully visible while it's still tumbling — otherwise the flip is mostly hidden
        // behind low opacity and only whichever card is mid-transition right now reads
        // as "doing" anything in 3D.
        const opacityProgress = Math.min(1, cardProgress / 0.3);
        const opacityEased = opacityProgress * opacityProgress * (3 - 2 * opacityProgress);
        card.style.opacity = opacityEased;

        // ease-out-back: overshoots slightly past the resting position before settling,
        // a snappier "pop into place" landing instead of a flat linear settle
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const shifted = cardProgress - 1;
        const eased = 1 + c3 * shifted * shifted * shifted + c1 * shifted * shifted;
        const remaining = 1 - eased;

        card.style.transform = `translate3d(${x * remaining}vw, ${y * remaining}vh, ${z * remaining}px) rotateX(${rotateX * remaining}deg) rotateY(${rotateY * remaining}deg) scale(${startScale + (1 - startScale) * eased})`;
      });
      photoTicking = false;
    }

    updatePhotoShowcase();
    window.addEventListener('scroll', () => {
      if (photoTicking) return;
      photoTicking = true;
      requestAnimationFrame(updatePhotoShowcase);
    }, { passive: true });
    window.addEventListener('resize', () => {
      remeasurePhotoShowcase();
      lastSectionProgress = -1; // viewport size feeds the math too — force a real recompute
      updatePhotoShowcase();
    });
  }

  // ---------- Footer ----------

  const footerTopButton = document.querySelector('.site-footer-top');
  if (footerTopButton) {
    footerTopButton.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
