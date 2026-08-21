/* =========================================================
   $MOMS interactions
   - Falling petals
   - Reveal on scroll
   - Copy contract
   ========================================================= */

(() => {
  // ---------- FALLING PETALS ----------
  const petalLayer = document.querySelector('.petals');
  if (petalLayer) {
    const PETAL_COUNT = 22;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      const size      = 12 + Math.random() * 18;          // 12-30px
      const startX    = Math.random() * 100;              // % across viewport
      const drift     = (Math.random() * 240) - 120;      // -120 to 120px sideways drift
      const duration  = 9 + Math.random() * 9;            // 9-18s
      const delay     = Math.random() * -18;              // start mid-animation
      const hueShift  = Math.random() * 18 - 9;           // tiny color variety
      p.style.left      = startX + 'vw';
      p.style.width     = size + 'px';
      p.style.height    = size + 'px';
      p.style.setProperty('--drift', drift + 'px');
      p.style.animationDuration = duration + 's';
      p.style.animationDelay    = delay + 's';
      p.style.filter = `hue-rotate(${hueShift}deg) drop-shadow(0 2px 4px rgba(231,84,128,.25))`;
      petalLayer.appendChild(p);
    }
  }

  // ---------- REVEAL ON SCROLL ----------
  const revealTargets = document.querySelectorAll(
    '.section, .hero__title, .hero__sub, .hero__cta, .hero__stats, ' +
    '.value-card, .tk-card, .howto__steps li, .journey__timeline li, ' +
    '.tribute__grid figure, .charity__inner, .story__media, .story__text'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  // ---------- COPY CONTRACT ----------
  const copyBtn = document.querySelector('.contract__copy');
  const code    = document.getElementById('contract');
  if (copyBtn && code) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent.trim());
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" style="fill:none;stroke:#e75480;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"><path d="M5 12l5 5 9-12"/></svg>';
        setTimeout(() => { copyBtn.innerHTML = original; }, 1500);
      } catch (e) {
        // silently fail (clipboard not available)
      }
    });
  }

  // ---------- TRIBUTE WALL (rendered from the database) ----------
  const tributeGrid = document.getElementById('tribute-grid');

  const loadTributes = () => {
    if (!tributeGrid) return Promise.resolve();
    return fetch('/api/tributes-list')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('bad status')))
      .then(data => {
        const tributes = Array.isArray(data.tributes) ? data.tributes : [];
        tributeGrid.innerHTML = '';
        tributeGrid.removeAttribute('data-loading');
        if (tributes.length === 0) {
          tributeGrid.setAttribute('data-loading', 'Be the first to leave a tribute.');
          return;
        }
        tributes.forEach(t => {
          const figure = document.createElement('figure');
          if (t.image_url) {
            const img = document.createElement('img');
            img.src = t.image_url;
            img.alt = '';
            img.loading = 'lazy';
            figure.appendChild(img);
          } else {
            figure.classList.add('is-text');
          }
          const figcaption = document.createElement('figcaption');
          figcaption.textContent = `"${t.quote_text}" · ${t.display_name}`;
          figure.appendChild(figcaption);
          tributeGrid.appendChild(figure);
        });
      })
      .catch(() => {
        if (tributeGrid.children.length === 0) {
          tributeGrid.setAttribute('data-loading', 'Could not load tributes right now.');
        }
      });
  };

  loadTributes();

  // ---------- TRIBUTE MODAL OPEN/CLOSE ----------
  const tributeModal   = document.getElementById('tribute-modal');
  const tributeOpenBtn = document.getElementById('tribute-open-btn');
  if (tributeModal && tributeOpenBtn) {
    const openModal = () => {
      tributeModal.classList.add('is-open');
      tributeModal.setAttribute('aria-hidden', 'false');
      const firstField = tributeModal.querySelector('#tribute-name');
      if (firstField) firstField.focus();
      document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
      tributeModal.classList.remove('is-open');
      tributeModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    tributeOpenBtn.addEventListener('click', openModal);
    tributeModal.querySelectorAll('[data-tribute-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tributeModal.classList.contains('is-open')) closeModal();
    });
  }

  // ---------- TRIBUTE FORM SUBMISSION ----------
  const tributeForm = document.getElementById('tribute-form');
  if (tributeForm) {
    const statusEl = tributeForm.querySelector('.tribute-form__status');
    tributeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = tributeForm.querySelector('button[type="submit"]');
      const display_name = tributeForm.display_name.value.trim();
      const quote_text = tributeForm.quote_text.value.trim();

      if (!display_name || !quote_text) {
        statusEl.textContent = 'Please fill in both fields.';
        return;
      }

      submitBtn.disabled = true;
      statusEl.textContent = 'Sending...';

      try {
        const res = await fetch('/api/tribute-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_name, quote_text }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          statusEl.textContent = data.message || 'Thank you for sharing your tribute.';
          tributeForm.reset();
          loadTributes();
          setTimeout(() => {
            if (tributeModal) {
              tributeModal.classList.remove('is-open');
              tributeModal.setAttribute('aria-hidden', 'true');
              document.body.style.overflow = '';
            }
            statusEl.textContent = '';
          }, 1800);
        } else {
          statusEl.textContent = data.error || 'Something went wrong. Please try again.';
        }
      } catch (err) {
        statusEl.textContent = 'Network error. Please try again.';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ---------- SOFT PARALLAX ON HERO BG ----------
  const heroBg = document.querySelector('.hero__bg img');
  if (heroBg) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = Math.min(window.scrollY, 800);
          heroBg.style.transform = `scale(1.05) translateY(${y * 0.15}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
})();
