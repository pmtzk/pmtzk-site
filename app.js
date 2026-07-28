(() => {
  const root = document.documentElement;
  const body = document.body;
  const masthead = document.querySelector('.masthead');
  const progressFill = document.querySelector('.progress span');
  const folioCurrent = document.querySelector('.folio-nav__current');
  const indexToggle = document.querySelector('.index-toggle');
  const indexPanel = document.querySelector('.index-panel');
  const wipe = document.querySelector('.page-wipe');
  const languageButtons = [...document.querySelectorAll('[data-lang-choice]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); } catch (_) {} }
  };
  let currentLanguage = storage.get('pmtzk-language') || 'en';

  function setLanguage(language) {
    currentLanguage = language;
    root.lang = language;
    document.querySelectorAll('[data-copy-en]').forEach(node => {
      node.textContent = language === 'es' ? node.dataset.copyEs : node.dataset.copyEn;
    });
    languageButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.langChoice === language));
    });
    const diagnosticActive = document.querySelector('.diagnostic__item.is-active');
    if (diagnosticActive) updateDiagnostic(diagnosticActive);
    const constellationActive = document.querySelector('.constellation__node.is-active');
    if (constellationActive) updateConstellation(constellationActive);
    storage.set('pmtzk-language', language);
  }

  languageButtons.forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.langChoice));
  });

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
    if (output) output.textContent = currentLanguage === 'es' ? item.dataset.es : item.dataset.en;
    if (ordinal) ordinal.textContent = item.dataset.index;
  }
  diagnosticItems.forEach(item => {
    item.addEventListener('mouseenter', () => updateDiagnostic(item));
    item.addEventListener('focus', () => updateDiagnostic(item));
    item.addEventListener('click', () => updateDiagnostic(item));
  });

  const constellationNodes = [...document.querySelectorAll('.constellation__node')];
  function updateConstellation(node) {
    constellationNodes.forEach(button => button.classList.toggle('is-active', button === node));
    document.querySelectorAll('.constellation__lines line').forEach(line => {
      line.classList.toggle('is-active', line.dataset.line === node.dataset.node);
    });
    const output = document.querySelector('[data-constellation-output]');
    if (output) output.textContent = currentLanguage === 'es' ? node.dataset.es : node.dataset.en;
  }
  constellationNodes.forEach(node => {
    node.addEventListener('mouseenter', () => updateConstellation(node));
    node.addEventListener('focus', () => updateConstellation(node));
    node.addEventListener('click', () => updateConstellation(node));
  });

  const systemLab = document.querySelector('.system-lab');
  const systemButtons = [...document.querySelectorAll('[data-system-choice]')];
  const systemCaption = document.querySelector('[data-system-caption]');
  const systemCopy = {
    noise: {
      en: 'The operation depends on remembering the logic again every month.',
      es: 'La operación depende de recordar la lógica de nuevo cada mes.'
    },
    method: {
      en: 'The relationships remain visible, so attention can move to the variable that changed.',
      es: 'Las relaciones permanecen visibles, para que la atención pueda dirigirse a la variable que cambió.'
    }
  };
  systemButtons.forEach(button => {
    button.addEventListener('click', () => {
      const choice = button.dataset.systemChoice;
      systemLab.dataset.systemState = choice;
      systemButtons.forEach(other => other.classList.toggle('is-active', other === button));
      systemCaption.textContent = systemCopy[choice][currentLanguage];
    });
  });

  const perception = document.querySelector('[data-perception]');
  const perceptionHandle = document.querySelector('[data-perception-handle]');
  if (perception && perceptionHandle) {
    let dragging = false;
    const isVertical = () => window.matchMedia('(max-width: 520px)').matches;
    const setSplit = (clientX, clientY) => {
      const rect = perception.getBoundingClientRect();
      const percentage = isVertical()
        ? ((clientY - rect.top) / rect.height) * 100
        : ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(88, Math.max(12, percentage));
      perception.style.setProperty(isVertical() ? '--split-y' : '--split', `${clamped}%`);
    };
    perceptionHandle.addEventListener('pointerdown', event => {
      dragging = true;
      perceptionHandle.setPointerCapture(event.pointerId);
      setSplit(event.clientX, event.clientY);
    });
    perceptionHandle.addEventListener('pointermove', event => {
      if (dragging) setSplit(event.clientX, event.clientY);
    });
    perceptionHandle.addEventListener('pointerup', event => {
      dragging = false;
      perceptionHandle.releasePointerCapture(event.pointerId);
    });
    perception.addEventListener('click', event => {
      if (event.target !== perceptionHandle && !dragging) setSplit(event.clientX, event.clientY);
    });
    perceptionHandle.addEventListener('keydown', event => {
      const property = isVertical() ? '--split-y' : '--split';
      const current = parseFloat(getComputedStyle(perception).getPropertyValue(property)) || 50;
      const decrease = isVertical() ? event.key === 'ArrowUp' : event.key === 'ArrowLeft';
      const increase = isVertical() ? event.key === 'ArrowDown' : event.key === 'ArrowRight';
      if (decrease) perception.style.setProperty(property, `${Math.max(12, current - 4)}%`);
      if (increase) perception.style.setProperty(property, `${Math.min(88, current + 4)}%`);
    });
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

  setLanguage(currentLanguage);
  updateProgress();
})();
