// ===========================
// MATHEWES — STUDIO INTERACTIONS
// ===========================

gsap.registerPlugin(ScrollTrigger);

// Prevent scroll during load
document.body.style.overflow = 'hidden';

// ===========================
// LENIS SMOOTH SCROLL
// ===========================
const lenis = new Lenis({
  duration: 1.3,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

// Official GSAP + Lenis integration
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

// ===========================
// LOADER
// ===========================
const loaderLetters = document.querySelectorAll('.loader-logo span');
const loaderProgress = document.getElementById('loaderProgress');
const loaderSub = document.querySelector('.loader-sub');
const loader = document.getElementById('loader');

// Animate letters in staggered
gsap.to(loaderLetters, {
  opacity: 1,
  y: 0,
  duration: 0.6,
  ease: 'power3.out',
  stagger: 0.05,
  delay: 0.2,
});

gsap.to(loaderSub, {
  opacity: 1,
  duration: 0.6,
  delay: 0.9,
});

// Progress bar fill
requestAnimationFrame(() => {
  loaderProgress.style.width = '100%';
});

// Hide loader after page load
window.addEventListener('load', () => {
  setTimeout(() => {
    gsap.to(loader, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        loader.style.visibility = 'hidden';
        document.body.style.overflow = '';
        introAnimations();
      },
    });
  }, 1400);
});

// ===========================
// HERO INTRO ANIMATIONS
// ===========================
function introAnimations() {
  const tl = gsap.timeline();

  // Eyebrow — slides down from above
  tl.fromTo('.hero-eyebrow',
    { opacity: 0, y: -14 },
    { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
    0.1
  );

  // Title lines slide up — wrap each line content in a div first
  const titleLines = document.querySelectorAll('.title-line');
  titleLines.forEach((line, i) => {
    const inner = document.createElement('div');
    inner.style.display = 'block';
    inner.innerHTML = line.innerHTML;
    line.innerHTML = '';
    line.appendChild(inner);

    tl.from(inner, {
      y: '105%',
      duration: 1.1,
      ease: 'power4.out',
    }, 0.2 + i * 0.1);
  });

  // Hero desc
  tl.fromTo('.hero-desc p',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' },
    0.7
  );

  // Discover button
  tl.fromTo('.btn-circle',
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' },
    0.85
  );

  // Stats
  tl.fromTo('.hero-stats',
    { opacity: 0 },
    { opacity: 1, duration: 1, ease: 'power2.out', onComplete: animateCounters },
    0.9
  );
}

// ===========================
// COUNTER ANIMATION
// ===========================
function animateCounters() {
  document.querySelectorAll('.count').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ===========================
// NAV SCROLL
// ===========================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ===========================
// MOBILE MENU
// ===========================
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const burgerSpans = burger.querySelectorAll('span');
let menuOpen = false;

burger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  mobileMenu.classList.toggle('open', menuOpen);

  if (menuOpen) {
    burgerSpans[0].style.transform = 'translateY(7px) rotate(45deg)';
    burgerSpans[1].style.transform = 'translateY(-7px) rotate(-45deg)';
    lenis.stop();
  } else {
    burgerSpans[0].style.transform = '';
    burgerSpans[1].style.transform = '';
    lenis.start();
  }
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    mobileMenu.classList.remove('open');
    burgerSpans[0].style.transform = '';
    burgerSpans[1].style.transform = '';
    lenis.start();
  });
});

// ===========================
// MAGNETIC BUTTONS
// ===========================
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;
    gsap.to(el, { x: dx, y: dy, duration: 0.5, ease: 'power3.out' });
  });

  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
  });
});

// ===========================
// SCROLL ANIMATIONS — ABOUT SECTION
// ===========================
ScrollTrigger.create({
  trigger: '.section-about',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    // Title lines
    const aboutLines = document.querySelectorAll('.about-title .split-line');
    aboutLines.forEach((line, i) => {
      const inner = document.createElement('div');
      inner.style.display = 'block';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);
      gsap.from(inner, {
        y: '110%',
        duration: 1,
        ease: 'power4.out',
        delay: i * 0.1,
      });
    });

    // About items stagger
    gsap.from('.about-item', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.3,
    });
  },
});

// ===========================
// SCROLL ANIMATIONS — STATEMENT
// ===========================
ScrollTrigger.create({
  trigger: '.statement',
  start: 'top 70%',
  once: true,
  onEnter: () => {
    const text = document.querySelector('.statement-text');
    if (!text) return;

    // Split text into word spans manually
    const words = text.textContent.trim().split(/\s+/);
    text.innerHTML = words
      .map(w => `<span style="display:inline-block;overflow:hidden;vertical-align:top"><span class="sw" style="display:inline-block">${w}&nbsp;</span></span>`)
      .join('');

    gsap.from('.sw', {
      y: '110%',
      opacity: 0,
      duration: 0.7,
      stagger: 0.03,
      ease: 'power3.out',
    });
    gsap.from('.statement-author', {
      opacity: 0,
      y: 12,
      duration: 0.8,
      ease: 'power3.out',
      delay: words.length * 0.03 + 0.2,
    });
  },
});

// ===========================
// SCROLL ANIMATIONS — LOCATIONS
// ===========================
ScrollTrigger.create({
  trigger: '.section-locations',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    const locLines = document.querySelectorAll('.locations-title .split-line');
    locLines.forEach((line, i) => {
      const inner = document.createElement('div');
      inner.style.display = 'block';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);
      gsap.from(inner, {
        y: '110%',
        duration: 1,
        ease: 'power4.out',
        delay: i * 0.12,
      });
    });

    gsap.from('.loc-item', {
      opacity: 0,
      x: -20,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.3,
    });
  },
});

// ===========================
// SCROLL ANIMATIONS — CONTACT
// ===========================
ScrollTrigger.create({
  trigger: '.section-contact',
  start: 'top 75%',
  once: true,
  onEnter: () => {
    const ctLines = document.querySelectorAll('.contact-title .split-line');
    ctLines.forEach((line, i) => {
      const inner = document.createElement('div');
      inner.style.display = 'block';
      inner.innerHTML = line.innerHTML;
      line.innerHTML = '';
      line.appendChild(inner);
      gsap.from(inner, {
        y: '110%',
        duration: 1,
        ease: 'power4.out',
        delay: i * 0.12,
      });
    });

    gsap.from('.contact-left > p', {
      opacity: 0,
      y: 16,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.4,
    });

    gsap.from('.contact-link', {
      opacity: 0,
      x: 20,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.3,
    });
  },
});

// ===========================
// HORIZONTAL SCROLL PARALLAX — HERO TITLE
// ===========================
gsap.to('.hero-title', {
  y: 80,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.5,
  },
});

// ===========================
// MARQUEE — PAUSE ON HOVER
// ===========================
const marqueeEl = document.querySelector('.marquee-content');
if (marqueeEl) {
  marqueeEl.closest('.marquee-wrap').addEventListener('mouseenter', () => {
    marqueeEl.style.animationPlayState = 'paused';
  });
  marqueeEl.closest('.marquee-wrap').addEventListener('mouseleave', () => {
    marqueeEl.style.animationPlayState = 'running';
  });
}
