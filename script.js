// === Customize these two values ===
const FIRST_MET = new Date('2024-11-11'); // YYYY-MM-DD
const COUPLE_NAMES = 'D ♡ C';

// === Simple computed stats ===
const today = new Date();
const days = Math.floor((today - FIRST_MET) / (1000 * 60 * 60 * 24));
const years = (today - FIRST_MET) / (1000 * 60 * 60 * 24 * 365.25);

document.getElementById('daysTogether').textContent = days.toLocaleString();
document.getElementById('yearsTogether').textContent = years.toFixed(1);
document.getElementById('sinceText').textContent = FIRST_MET.getFullYear();

// Pretty date for hero stamp
const opts = { year: 'numeric', month: 'short', day: '2-digit' };
document.getElementById('firstMet').textContent = FIRST_MET.toLocaleDateString(undefined, opts);
document.getElementById('firstMetDetail').textContent = FIRST_MET.toISOString().slice(0, 10);

// Footer year and brand
document.getElementById('year').textContent = new Date().getFullYear();
document.title = `${COUPLE_NAMES} — Our Love Story`;
document.querySelector('.brand span').textContent = COUPLE_NAMES;

// === Burger menu toggle ===
const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav .links');

if (burger && navLinks) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

// === Animate stats number when visible ===
function animateCounter(el, target, duration = 1500, decimals = 0) {
  let start = 0;
  const startTime = performance.now();
  
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = start + (target - start) * progress;
    el.textContent = decimals ? value.toFixed(decimals) : Math.floor(value);
    if (progress < 1) requestAnimationFrame(update);
  }
  
  requestAnimationFrame(update);
}

statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const targetValue = parseFloat(el.dataset.target);

      // Skip kalau bukan angka valid
      if (isNaN(targetValue)) return;

      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      el.textContent = '0';
      animateCounter(el, targetValue, 1200, decimals);
    }
  });
}, { threshold: 0.6 });

// Simpan nilai asli di data-target
document.querySelectorAll('.stat .num').forEach(el => {
  const original = el.textContent.trim();
  el.dataset.target = original;
  if (original.includes('.')) {
    el.dataset.decimals = original.split('.')[1].length;
  }
  statObserver.observe(el);
});

// Lightbox behavior (supports <img> and <video>)
const dialog = document.getElementById('lightbox');
const lightImg = document.getElementById('lightbox-img');
const lightVideo = document.getElementById('lightbox-video');

document.querySelectorAll('[data-lightbox]').forEach(el => {
  el.style.cursor = 'zoom-in';
  el.addEventListener('click', () => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'video') {
      // Show video in lightbox
      if (lightImg) { lightImg.style.display = 'none'; lightImg.removeAttribute('src'); }
      if (lightVideo) {
        lightVideo.src = el.currentSrc || el.src || (el.querySelector('source') ? el.querySelector('source').src : '');
        lightVideo.style.display = 'block';
      }
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      lightVideo?.play?.().catch(() => {});
    } else {
      // Show image in lightbox
      if (lightVideo) {
        try { lightVideo.pause(); } catch (e) {}
        lightVideo.removeAttribute('src');
        lightVideo.load?.();
        lightVideo.style.display = 'none';
      }
      if (lightImg) {
        lightImg.src = el.currentSrc || el.src;
        lightImg.style.display = 'block';
      }
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
  });
});

// Click outside media to close
dialog.addEventListener('click', (e) => {
  const mediaEl = (lightVideo && lightVideo.style.display !== 'none') ? lightVideo : lightImg;
  if (!mediaEl) return dialog.close();
  const rect = mediaEl.getBoundingClientRect();
  const inMedia = (
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom
  );
  if (!inMedia) dialog.close();
});

// Restore on close
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  if (lightVideo) {
    try { lightVideo.pause(); } catch (e) {}
    lightVideo.removeAttribute('src');
    lightVideo.load?.();
    lightVideo.style.display = 'none';
  }
  if (lightImg) {
    lightImg.removeAttribute('src');
    lightImg.style.display = 'none';
  }
});

// === View More: smooth random shuffle, anti repeat min 2 ===
(function () {
  const tile = document.querySelector('#gallery .view-more-tile');
  if (!tile) return;

  const baseImg = tile.querySelector('img');               // gambar utama
  const overlay = tile.querySelector('.view-more-text');   // overlay text

  // Ambil semua foto gallery (kecuali View More)
  const candidates = Array.from(document.querySelectorAll('#gallery img[data-lightbox]'))
    .map(img => img.currentSrc || img.src)
    .filter(Boolean);

  if (candidates.length < 2) return; // kalau cuma 1 foto, skip

  // Preload gambar kandidat
  candidates.forEach(src => { const im = new Image(); im.src = src; });

  // Ghost image untuk crossfade
  const ghost = baseImg.cloneNode(false);
  ghost.className = 'vm-ghost';
  ghost.removeAttribute('alt');
  tile.insertBefore(ghost, overlay);

  const originalSrc = baseImg.currentSrc || baseImg.src;
  let timer = null;
  let recent = [originalSrc]; // simpan max 2 foto terakhir

  function pickRandomSrc() {
    let s;
    const blocked = new Set(recent); // foto yang tidak boleh muncul
    do {
      s = candidates[Math.floor(Math.random() * candidates.length)];
    } while (blocked.has(s) && candidates.length > blocked.size);
    return s;
  }

  function addToHistory(src) {
    recent.push(src);
    if (recent.length > 2) recent.shift(); // simpan max 2 terakhir
  }

  tile.addEventListener('mouseenter', () => {
    if (timer) return;
    timer = setInterval(() => {
      const nextSrc = pickRandomSrc();

      // Crossfade smooth
      ghost.src = nextSrc;
      ghost.style.opacity = '1';
      setTimeout(() => {
        baseImg.src = nextSrc;
        addToHistory(nextSrc); // update history setelah commit
        ghost.style.opacity = '0';
      }, 350);
    }, 600); // delay antar shuffle
  });

  function stopShuffle() {
    clearInterval(timer);
    timer = null;
    recent = [originalSrc];
    ghost.style.opacity = '0';
    baseImg.src = originalSrc;
  }

  tile.addEventListener('mouseleave', stopShuffle);
  tile.addEventListener('click', stopShuffle);

 // Ambil gambar dari gallery.html
  fetch('gallery.html')
    .then(res => res.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const imgs = Array.from(doc.querySelectorAll('img'))
        .map(img => img.currentSrc || img.src)
        .filter(Boolean);

      // Mulai shuffle dengan kandidat dari gallery.html
      startShuffle(imgs);
    })
    .catch(err => console.error('Gagal ambil gambar dari gallery.html:', err));

})();


// Animasi muncul saat scroll untuk .t-item
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.t-item').forEach(item => observer.observe(item));

// === Timeline media wrapper + reveal animation ===
(function () {
  // wrap <img> dan .t-meta ke dalam .t-media
  document.querySelectorAll('.timeline .t-item').forEach(item => {
    const img = item.querySelector('img');
    const meta = item.querySelector('.t-meta');
    if (!img || !meta) return;
    if (meta.parentElement && meta.parentElement.classList.contains('t-media')) return;
    const media = document.createElement('div');
    media.className = 't-media';
    item.insertBefore(media, img);
    media.appendChild(img);
    media.appendChild(meta);
  });

  // animasi fade-in saat scroll
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.timeline .t-item').forEach(el => io.observe(el));
})();

// Page load fade-in
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// Scroll reveal
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

// Tambahkan class reveal ke semua section
document.querySelectorAll('section, header, footer, .t-item, .q, .stat, #gallery img, #gallery video').forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

