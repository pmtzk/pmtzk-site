(() => {
  const root = document.documentElement;
  const body = document.body;
  const masthead = document.querySelector('.masthead');
  const progressFill = document.querySelector('.progress span');
  const folioCurrent = document.querySelector('.folio-nav__current');
  const indexToggle = document.querySelector('.index-toggle');
  const indexPanel = document.querySelector('.index-panel');
  const wipe = document.querySelector('.page-wipe');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function openIndex(open) {
    indexPanel.classList.toggle('is-open', open);
    indexPanel.setAttribute('aria-hidden', String(!open));
    indexToggle.setAttribute('aria-expanded', String(open));
    body.classList.toggle('index-open', open);
    masthead.dataset.tone = open ? 'cream' : masthead.dataset.sectionTone || 'dark';
  }

  indexToggle.addEventListener('click', () => {
    openIndex(indexToggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && body.classList.contains('index-open')) openIndex(false);
  });

  function transitionTo(target) {
    if (!target) return;
    if (reducedMotion) {
      target.scrollIntoView();
      return;
    }
    wipe.classList.remove('is-revealing');
    wipe.classList.add('is-covering');
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      openIndex(false);
      wipe.classList.remove('is-covering');
      wipe.classList.add('is-revealing');
      window.setTimeout(() => wipe.classList.remove('is-revealing'), 520);
    }, 470);
  }

  document.querySelectorAll('[data-chapter-link]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      transitionTo(target);
    });
  });

  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  const toneSections = [...document.querySelectorAll('[data-masthead-tone]')];
  const toneObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const tone = visible.target.dataset.mastheadTone;
    masthead.dataset.sectionTone = tone;
    if (!body.classList.contains('index-open')) masthead.dataset.tone = tone;
  }, { rootMargin: '-42% 0px -42% 0px', threshold: [0, .15, .35, .65] });
  toneSections.forEach(section => toneObserver.observe(section));

  const chapterSections = [...document.querySelectorAll('[data-chapter]')];
  const chapterObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible && folioCurrent) folioCurrent.textContent = visible.target.dataset.chapter;
  }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, .1, .4] });
  chapterSections.forEach(section => chapterObserver.observe(section));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(node => revealObserver.observe(node));

  const coverTitle = document.querySelector('[data-parallax]');
  const cover = document.querySelector('.cover');
  if (coverTitle && cover && !reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    cover.addEventListener('pointermove', event => {
      const rect = cover.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      coverTitle.style.transform = `translate3d(${x * 10}px, ${y * 8}px, 0)`;
    });
    cover.addEventListener('pointerleave', () => { coverTitle.style.transform = ''; });
  }

  const diagnosticItems = [...document.querySelectorAll('.diagnostic__item')];
  function updateDiagnostic(item) {
    diagnosticItems.forEach(button => button.classList.toggle('is-active', button === item));
    const output = document.querySelector('[data-diagnostic-output]');
    const ordinal = document.querySelector('.diagnostic__ordinal');
    if (output) output.textContent = item.dataset.copy;
    if (ordinal) ordinal.textContent = item.dataset.index;
  }
  diagnosticItems.forEach(item => {
    item.addEventListener('mouseenter', () => updateDiagnostic(item));
    item.addEventListener('focus', () => updateDiagnostic(item));
    item.addEventListener('click', () => updateDiagnostic(item));
  });

  const constellation = document.querySelector('[data-constellation]');
  const constellationNodes = constellation
    ? [...constellation.querySelectorAll('.constellation__node')]
    : [];

  function updateConstellation(node) {
    if (!node || !constellation) return;

    constellationNodes.forEach(button => {
      const active = button === node;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    constellation.querySelectorAll('.constellation__lines line').forEach(line => {
      line.classList.toggle('is-active', line.dataset.line === node.dataset.node);
    });

    const output = constellation.querySelector('[data-constellation-output]');
    if (output) output.textContent = node.dataset.copy;
  }

  constellationNodes.forEach(node => {
    node.setAttribute('aria-pressed', 'false');
    node.addEventListener('pointerup', event => {
      event.preventDefault();
      updateConstellation(node);
    });
    node.addEventListener('click', () => updateConstellation(node));
    node.addEventListener('focus', () => updateConstellation(node));
  });

  if (constellationNodes[0]) updateConstellation(constellationNodes[0]);

  const systemCarousel = document.querySelector('[data-system-carousel]');
  if (systemCarousel) {
    const track = systemCarousel.querySelector('[data-system-track]');
    const viewport = systemCarousel.querySelector('[data-system-viewport]');
    const slides = [...systemCarousel.querySelectorAll('.system-slide')];
    const tabs = [...systemCarousel.querySelectorAll('[data-system-slide]')];
    const previous = systemCarousel.querySelector('[data-system-previous]');
    const next = systemCarousel.querySelector('[data-system-next]');
    const currentLabel = systemCarousel.querySelector('[data-system-current]');
    let current = 0;
    let pointerStart = null;

    const showSystemSlide = index => {
      current = (index + slides.length) % slides.length;
      systemCarousel.dataset.slide = String(current);
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === current;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      slides.forEach((slide, slideIndex) => {
        slide.setAttribute('aria-hidden', String(slideIndex !== current));
      });
      if (currentLabel) currentLabel.textContent = String(current + 1).padStart(2, '0');
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => showSystemSlide(index));
      tab.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); showSystemSlide(current - 1); tabs[(current + tabs.length) % tabs.length].focus(); }
        if (event.key === 'ArrowRight') { event.preventDefault(); showSystemSlide(current + 1); tabs[current].focus(); }
      });
    });
    previous?.addEventListener('click', () => showSystemSlide(current - 1));
    next?.addEventListener('click', () => showSystemSlide(current + 1));

    viewport?.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerStart = event.clientX;
      viewport.setPointerCapture?.(event.pointerId);
    });
    viewport?.addEventListener('pointerup', event => {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) > 55) showSystemSlide(current + (distance < 0 ? 1 : -1));
      viewport.releasePointerCapture?.(event.pointerId);
    });
    viewport?.addEventListener('pointercancel', () => { pointerStart = null; });

    systemCarousel.addEventListener('keydown', event => {
      if (event.target.matches('[data-system-slide]')) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); showSystemSlide(current - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showSystemSlide(current + 1); }
    });

    showSystemSlide(0);
  }


  const inspection = document.querySelector('[data-inspection]');
  const inspectionWord = document.querySelector('[data-inspection-word]');
  if (inspection && inspectionWord) {
    inspectionWord.addEventListener('click', () => {
      const open = !inspection.classList.contains('is-open');
      inspection.classList.toggle('is-open', open);
      inspectionWord.setAttribute('aria-expanded', String(open));
    });
  }

  updateProgress();
})();
