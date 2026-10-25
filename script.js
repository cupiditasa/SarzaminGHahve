// Paint the existing photo first, then fade in a pre-looped video.
// The video itself crossfades its final second into the first frame, so the
// native loop can restart without a visible jump or a second decoder.
const heroVideo = document.querySelector('#heroVideo');
const heroMotionToggle = document.querySelector('#heroMotionToggle');
if (heroVideo && heroMotionToggle) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let videoStarted = false;

  const setSource = () => {
    if (!heroVideo.getAttribute('src')) {
      heroVideo.src = heroVideo.dataset.src;
      heroVideo.load();
    }
  };
  const updateMotionButton = () => {
    const playing = videoStarted && !heroVideo.paused && !heroVideo.ended;
    const label = playing ? 'توقف ویدیوی پس‌زمینه' : 'پخش ویدیوی پس‌زمینه';
    heroMotionToggle.classList.toggle('is-playing', playing);
    heroMotionToggle.setAttribute('aria-label', label);
    heroMotionToggle.title = label;
  };

  const playBackground = () => {
    heroVideo.muted = true;
    setSource();
    return heroVideo.play().catch(() => {
      // Autoplay can be blocked; the image and manual play button remain usable.
      updateMotionButton();
    });
  };

  heroVideo.addEventListener('playing', () => {
    videoStarted = true;
    heroVideo.classList.add('is-visible');
    updateMotionButton();
  });
  heroVideo.addEventListener('pause', updateMotionButton);
  heroVideo.addEventListener('ended', updateMotionButton);
  heroVideo.addEventListener('error', () => {
    heroVideo.classList.remove('is-visible');
    heroMotionToggle.hidden = true;
  });

  heroMotionToggle.addEventListener('click', () => {
    if (heroVideo.paused) playBackground();
    else heroVideo.pause();
  });
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) heroVideo.pause();
  });

  const poster = new Image();
  poster.src = heroVideo.poster;
  poster.decode().catch(() => {}).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      heroMotionToggle.hidden = false;
      if (!reducedMotion.matches) playBackground();
    }));
  });
}

const beanRange = document.querySelector('#beanRange');
const roastRange = document.querySelector('#roastRange');
const beanOutput = document.querySelector('#beanOutput');
const roastOutput = document.querySelector('#roastOutput');
const notes = [...document.querySelectorAll('.note')];
const notesSummary = document.querySelector('#notesSummary');
const saveBlend = document.querySelector('#saveBlend');
const toast = document.querySelector('#toast');
const favoriteCount = document.querySelector('#favoriteCount');
const menuButton = document.querySelector('#menuButton');
const mobileMenu = document.querySelector('#mobileMenu');
let savedCount = 0;

function updateBeanRange() {
  const arabica = Number(beanRange.value);
  beanOutput.textContent = `${arabica.toLocaleString('fa-IR')}٪ / ${(100 - arabica).toLocaleString('fa-IR')}٪`;
  beanRange.style.background = `linear-gradient(90deg, var(--copper) 0%, var(--cream) ${arabica}%, rgba(255,255,255,.18) ${arabica}%)`;
}

function updateRoastRange() {
  const labels = ['روشن', 'متوسط', 'تیره'];
  const value = Number(roastRange.value);
  roastOutput.textContent = labels[value];
  roastRange.style.background = `linear-gradient(90deg, var(--copper) 0%, var(--cream) ${value * 50}%, rgba(255,255,255,.18) ${value * 50}%)`;
  document.querySelectorAll('.roast-labels span').forEach((label, index) => label.classList.toggle('selected', index === value));
}

function updateNotes() {
  const selected = notes.filter((note) => note.classList.contains('selected')).map((note) => note.dataset.note);
  notesSummary.textContent = selected.length ? selected.join('، ') : 'انتخاب کنید';
}

beanRange.addEventListener('input', updateBeanRange);
roastRange.addEventListener('input', updateRoastRange);
notes.forEach((note) => note.addEventListener('click', () => { note.classList.toggle('selected'); updateNotes(); }));

saveBlend.addEventListener('click', () => {
  savedCount += 1;
  favoriteCount.textContent = savedCount.toLocaleString('fa-IR');
  favoriteCount.style.display = 'inline';
  saveBlend.querySelector('span').textContent = 'ترکیب ذخیره شد';
  saveBlend.querySelector('svg')?.remove();
  saveBlend.insertAdjacentHTML('beforeend', '<i data-lucide="heart"></i>');
  saveBlend.classList.add('saved');
  lucide.createIcons();
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3200);
});

menuButton.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  menuButton.setAttribute('aria-label', isOpen ? 'بستن منو' : 'باز کردن منو');
  menuButton.querySelector('svg')?.remove();
  menuButton.insertAdjacentHTML('beforeend', `<i data-lucide="${isOpen ? 'x' : 'menu'}"></i>`);
  lucide.createIcons();
});

mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => mobileMenu.classList.remove('open')));
document.querySelectorAll('.add-blend').forEach((button) => button.addEventListener('click', () => { button.innerHTML = '<i data-lucide="check"></i>'; button.classList.add('added'); lucide.createIcons(); }));
document.querySelectorAll('.hero-pagination button').forEach((button) => button.addEventListener('click', () => { document.querySelector('.hero-pagination .current').classList.remove('current'); button.classList.add('current'); }));

updateBeanRange();
updateRoastRange();
updateNotes();
window.lucide?.createIcons();

// Count one visit per browser tab session. The Worker stores only an aggregate total.
const visitCounter = document.querySelector('[data-visit-counter]');
const visitTotal = document.querySelector('[data-visit-total]');
const visitEndpoint = 'https://sarzamin-visit-counter.cupiditasa.workers.dev/api/visits';

async function updateVisitCounter() {
  if (!visitCounter || !visitTotal) return;

  let countedInThisTab = false;
  try {
    countedInThisTab = sessionStorage.getItem('sarzamin-visit-counted') === '1';
  } catch {}

  try {
    const response = await fetch(visitEndpoint, {
      method: countedInThisTab ? 'GET' : 'POST',
      cache: 'no-store'
    });
    if (!response.ok) return;

    const data = await response.json();
    if (!Number.isSafeInteger(data.total) || data.total < 0) return;

    visitTotal.textContent = data.total.toLocaleString('fa-IR');
    visitCounter.hidden = false;
    if (!countedInThisTab) {
      try {
        sessionStorage.setItem('sarzamin-visit-counted', '1');
      } catch {}
    }
  } catch {
    // Keep the counter hidden when the cloud service is unavailable.
  }
}

updateVisitCounter();
