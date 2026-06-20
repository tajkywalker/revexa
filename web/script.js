/* =============================================
   KOMINICEK.EU – Main Script
   - Navbar scroll effect
   - Mobile hamburger menu
   - Reveal on scroll (IntersectionObserver)
   - Smooth anchor scroll offset
   ============================================= */

(function () {
  'use strict';

  /* ---- Navbar scroll effect ---- */
  const navbar = document.getElementById('navbar');
  function updateNavbar() {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  /* ---- Hamburger menu ---- */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click (overlay)
  document.addEventListener('click', function (e) {
    if (
      navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Stagger siblings within the same parent
            const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
            const index    = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = (index * 100) + 'ms';
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    // Fallback: show all immediately
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---- Smooth scroll with navbar offset ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navH   = navbar ? navbar.offsetHeight : 70;
      const top    = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---- Active nav link highlight on scroll ---- */
  const sections    = document.querySelectorAll('section[id]');
  const navAnchors  = document.querySelectorAll('.nav-links a[href^="#"]');

  function highlightNav() {
    let current = '';
    sections.forEach(function (sec) {
      const top   = sec.offsetTop - (navbar ? navbar.offsetHeight : 70) - 60;
      const bot   = top + sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bot) {
        current = '#' + sec.id;
      }
    });
    navAnchors.forEach(function (a) {
      a.style.color = a.getAttribute('href') === current ? 'var(--orange)' : '';
    });
  }
  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  /* ---- Animated counter for hero stats ---- */
  function animateCounter(el, target, duration) {
    const start   = 0;
    const step    = 16; // ~60fps
    const steps   = Math.ceil(duration / step);
    let   current = start;
    const increment = (target - start) / steps;

    const timer = setInterval(function () {
      current += increment;
      if (current >= target) {
        el.textContent = target + (el.dataset.suffix || '');
        clearInterval(timer);
      } else {
        el.textContent = Math.round(current) + (el.dataset.suffix || '');
      }
    }, step);
  }

  // Trigger counters when hero stats become visible
  const heroStats = document.querySelectorAll('.stat-num[data-count]');
  if (heroStats.length) {
    const statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.count, 10);
          animateCounter(el, target, 1200);
          statsObs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    heroStats.forEach(function (el) { statsObs.observe(el); });
  }

})();
