(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* 1. Diner-window condensation wipe */
  const condensation = document.getElementById('dinerWindowReveal');
  if (condensation) {
    if (!coarse && !reducedMotion) {
      condensation.addEventListener('pointerenter', () => condensation.classList.add('is-wiping'));
      condensation.addEventListener('pointerleave', () => condensation.classList.remove('is-wiping'));
      condensation.addEventListener('pointermove', (event) => {
        const rect = condensation.getBoundingClientRect();
        condensation.style.setProperty('--wipe-x', `${event.clientX - rect.left}px`);
        condensation.style.setProperty('--wipe-y', `${event.clientY - rect.top}px`);
      });
    } else if ('IntersectionObserver' in window && !reducedMotion) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        condensation.classList.add('is-mobile-clear');
        io.disconnect();
      }, { threshold: 0.45 });
      io.observe(condensation);
    } else {
      condensation.classList.add('is-mobile-clear');
    }
  }

  /* 2. Wings heat pulse: one pronounced entry, then subtle ambient haze. */
  const wingItem = document.querySelector('.sig-item.b');
  if (wingItem && 'IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      wingItem.classList.add('is-heated');
      window.setTimeout(() => wingItem.classList.remove('is-heated'), 2400);
      io.disconnect();
    }, { threshold: 0.56 });
    io.observe(wingItem);
  }

  /* 3. Counter stool: one physical swivel. */
  const stool = document.getElementById('edgeDinerStool');
  if (stool) {
    if ('IntersectionObserver' in window && !reducedMotion) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        stool.classList.add('is-swiveled');
        io.disconnect();
      }, { threshold: 0.65 });
      io.observe(stool.closest('.diner-counter') || stool);
    } else {
      stool.classList.add('is-swiveled');
    }
  }

  /* 4. Kitchen pass rail: ticket arrives once; an order dispatches it. */
  const counter = document.querySelector('.diner-counter-spread');
  const passTicket = document.getElementById('kitchenPassTicket');
  const passStatus = document.getElementById('kitchenPassStatus');

  function readyPassTicket() {
    if (!counter || !passTicket) return;
    passTicket.classList.remove('is-dispatching');
    if (passStatus) passStatus.textContent = 'STATUS: HUNGRY';
    counter.classList.add('is-pass-ready');
  }

  function dispatchPassTicket(label = 'ORDER UP') {
    if (!counter || !passTicket) return;
    if (passStatus) passStatus.textContent = label;
    passTicket.classList.remove('is-dispatching');
    void passTicket.offsetWidth;
    passTicket.classList.add('is-dispatching');

    window.setTimeout(() => {
      counter.classList.remove('is-pass-ready');
      passTicket.classList.remove('is-dispatching');
      void passTicket.offsetWidth;
      if (passStatus) passStatus.textContent = 'STATUS: HUNGRY';
      counter.classList.add('is-pass-ready');
    }, reducedMotion ? 50 : 900);
  }

  if (counter && passTicket) {
    if ('IntersectionObserver' in window && !reducedMotion) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        readyPassTicket();
        io.disconnect();
      }, { threshold: 0.28 });
      io.observe(counter);
    } else {
      readyPassTicket();
    }

    counter.querySelectorAll('[data-order-platform]').forEach(link => {
      link.addEventListener('pointerdown', () => dispatchPassTicket('ORDER UP'));
      link.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') dispatchPassTicket('ORDER UP');
      });
    });

    document.getElementById('orderBellWrap')?.addEventListener('click', () => {
      dispatchPassTicket('BELL RUNG / ORDER UP');
    });
  }

  /* 5. Grub IRL: local camera exposure flash, never the whole screen. */
  document.querySelectorAll('.camera-shot').forEach((shot) => {
    let locked = false;
    const flash = () => {
      if (locked || reducedMotion) return;
      locked = true;
      shot.classList.remove('is-flashing');
      void shot.offsetWidth;
      shot.classList.add('is-flashing');
      window.setTimeout(() => {
        shot.classList.remove('is-flashing');
        locked = false;
      }, 520);
    };
    shot.addEventListener('pointerenter', flash);
    shot.addEventListener('focus', flash);
  });

  /* 6. Menu split-board + contextual food motion.
        Driven from aria-selected, so it stays in sync with the existing tab system. */
  const tabs = [...document.querySelectorAll('.menu-tab[role="tab"]')];
  const board = document.getElementById('menuSplitBoard');
  const oldFace = document.getElementById('menuSplitOld');
  const newFace = document.getElementById('menuSplitNew');
  const previewSticky = document.getElementById('menuPreviewSticky');
  const boardLive = document.getElementById('menuSplitLive');

  let currentPanel = tabs.find(tab => tab.getAttribute('aria-selected') === 'true')?.dataset.panel || 'm0';
  let flipTimer = null;

  function tabParts(tab) {
    const code = tab?.querySelector('.jcode')?.textContent?.trim() || '';
    const label = (tab?.textContent || '').replace(code, '').trim().toUpperCase();
    return { code, label };
  }

  function setFace(face, parts) {
    if (!face) return;
    const code = face.querySelector('b');
    const label = face.querySelector('strong');
    if (code) code.textContent = parts.code;
    if (label) label.textContent = parts.label;
  }

  function applyMenuMotion(tab) {
    if (!tab) return;
    const nextPanel = tab.dataset.panel;

    if (previewSticky) {
      previewSticky.classList.toggle('is-wing-heat', nextPanel === 'm1');
      previewSticky.classList.toggle('is-fizzing', nextPanel === 'm7');
    }

    if (boardLive) {
      const announced = tabParts(tab);
      boardLive.textContent = `${announced.code} ${announced.label}`;
    }

    if (!board || !oldFace || !newFace || nextPanel === currentPanel) {
      currentPanel = nextPanel;
      return;
    }

    const currentTab = tabs.find(item => item.dataset.panel === currentPanel);
    const from = tabParts(currentTab || tab);
    const to = tabParts(tab);

    if (flipTimer) window.clearTimeout(flipTimer);
    setFace(oldFace, from);
    setFace(newFace, to);

    board.classList.remove('is-flipping');
    void board.offsetWidth;
    board.classList.add('is-flipping');

    flipTimer = window.setTimeout(() => {
      setFace(oldFace, to);
      setFace(newFace, to);
      board.classList.remove('is-flipping');
      currentPanel = nextPanel;
    }, reducedMotion ? 10 : 380);
  }

  if (tabs.length) {
    const selected = tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0];
    const initial = tabParts(selected);
    setFace(oldFace, initial);
    setFace(newFace, initial);
    applyMenuMotion(selected);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type !== 'attributes' || record.attributeName !== 'aria-selected') continue;
        const tab = record.target;
        if (tab.getAttribute('aria-selected') === 'true') {
          applyMenuMotion(tab);
        }
      }
    });

    tabs.forEach(tab => observer.observe(tab, { attributes: true, attributeFilter: ['aria-selected'] }));
  }
})();


/* FINAL DETAIL PASS — THREE COUNTER RECEIPTS */
(() => {
  const stations = [...document.querySelectorAll('.receipt-station')];
  if (!stations.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let played = false;

  function printReceipts() {
    if (played) return;
    played = true;

    stations.forEach((station, index) => {
      const receipt = station.querySelector('.receipt');
      const delay = reduced ? 0 : Number(station.dataset.receiptDelay || index * 220);

      window.setTimeout(() => {
        station.classList.add('printing');
        receipt?.classList.add('in');
      }, delay);
    });
  }

  const section = document.getElementById('counterPaperwork');

  if (section && 'IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      printReceipts();
      observer.disconnect();
    }, { threshold: 0.24 });

    observer.observe(section);
  } else {
    printReceipts();
  }
})();
