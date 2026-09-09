// Paint the existing photo first, then use two video layers to crossfade each loop.
// This hides the hard jump from the last frame back to frame zero.
const heroVideos = [document.querySelector('#heroVideoA'), document.querySelector('#heroVideoB')].filter(Boolean);
const heroMotionToggle = document.querySelector('#heroMotionToggle');
if (heroVideos.length && heroMotionToggle) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const crossfadeSeconds = 1.15;
  let activeIndex = 0;
  let transitioning = false;
  let videoStarted = false;

  const activeVideo = () => heroVideos[activeIndex];
  const setSource = (video) => {
    if (!video.getAttribute('src')) {
      video.src = video.dataset.src;
      video.load();
    }
  };
  const updateMotionButton = () => {
    const playing = videoStarted && !activeVideo().paused && !activeVideo().ended;
    const label = playing ? 'توقف ویدیوی پس‌زمینه' : 'پخش ویدیوی پس‌زمینه';
    heroMotionToggle.classList.toggle('is-playing', playing);
    heroMotionToggle.setAttribute('aria-label', label);
    heroMotionToggle.title = label;
  };

  const playBackground = (video = activeVideo()) => {
    video.muted = true;
    setSource(video);
    return video.play().catch(() => {
      // Autoplay can be blocked; the image and manual play button remain usable.
      updateMotionButton();
    });
  };

  const crossfadeToNext = () => {
    if (transitioning) return;
    const current = activeVideo();
    const nextIndex = activeIndex === 0 ? 1 : 0;
    const next = heroVideos[nextIndex];
    if (!current.duration || !Number.isFinite(current.duration)) return;
    transitioning = true;
    setSource(next);
    let startedNext = false;
    const startNext = () => {
      if (startedNext) return;
      startedNext = true;
      try { next.currentTime = 0; } catch { /* metadata may still be settling */ }
      next.play().then(() => {
        next.classList.add('is-visible');
        window.setTimeout(() => {
          current.pause();
          try { current.currentTime = 0; } catch { /* ignore reset errors */ }
          current.classList.remove('is-visible');
          activeIndex = nextIndex;
          transitioning = false;
          updateMotionButton();
        }, crossfadeSeconds * 1000);
      }).catch(() => {
        transitioning = false;
        updateMotionButton();
      });
    };
    if (next.readyState >= 1) startNext();
    else next.addEventListener('loadedmetadata', startNext, { once: true });
  };

  heroVideos.forEach((video, index) => {
    video.addEventListener('playing', () => {
      if (index === activeIndex) {
        videoStarted = true;
        video.classList.add('is-visible');
        // Warm the second decoder while the first loop is playing so the
        // crossfade never waits for a cold network request at the loop edge.
        const next = heroVideos[index === 0 ? 1 : 0];
        if (next && !next.getAttribute('src')) setSource(next);
      }
      updateMotionButton();
    });
    video.addEventListener('timeupdate', () => {
      if (index !== activeIndex || transitioning || !video.duration) return;
      if (video.duration - video.currentTime <= crossfadeSeconds + 0.08) crossfadeToNext();
    });
    video.addEventListener('pause', updateMotionButton);
    video.addEventListener('ended', () => {
      // Fallback for browsers that do not fire timeupdate near the final frame.
      if (index === activeIndex && !transitioning) crossfadeToNext();
    });
    video.addEventListener('error', () => {
      video.classList.remove('is-visible');
      if (index === activeIndex) heroMotionToggle.hidden = true;
    });
  });

  heroMotionToggle.addEventListener('click', () => {
    if (activeVideo().paused) playBackground();
    else heroVideos.forEach((video) => video.pause());
  });
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) heroVideos.forEach((video) => video.pause());
  });

  const poster = new Image();
  poster.src = heroVideos[0].poster;
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
lucide.createIcons();
