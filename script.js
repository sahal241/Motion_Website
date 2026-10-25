(() => {
  const dogs = [...document.querySelectorAll('[data-dog]')].map(element => ({
    element,
    x: 0,
    y: 0,
  }));
  if (!dogs.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(-1, Math.min(1, value));
  const ease = (elapsed, duration) => 1 - Math.exp(-elapsed / duration);
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;
  let pointerPresent = false;
  let lastPointerMove = 0;
  let idleX = 0;
  let idleY = 0;
  let idleTargetX = 0;
  let idleTargetY = 0;
  let nextIdleChange = 0;
  let lastFrame = 0;
  let frame = 0;

  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerPresent = true;
    lastPointerMove = performance.now();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointerPresent = false; });

  function animate(time) {
    if (reducedMotion.matches) {
      frame = 0;
      return;
    }
    const elapsed = Math.min(time - (lastFrame || time), 50);
    lastFrame = time;
    const idle = !pointerPresent || time - lastPointerMove > 4500;

    if (idle && time >= nextIdleChange) {
      idleTargetX = (Math.random() - .5) * .8;
      idleTargetY = (Math.random() - .5) * .6;
      nextIdleChange = time + 3200 + Math.random() * 2400;
    }
    idleX += (idleTargetX - idleX) * ease(elapsed, 900);
    idleY += (idleTargetY - idleY) * ease(elapsed, 900);

    dogs.forEach(dog => {
      const rect = dog.element.getBoundingClientRect();
      const focusX = rect.left + rect.width * .51;
      const focusY = rect.top + rect.height * .45;
      const wantedX = idle ? idleX : clamp((pointerX - focusX) / Math.max(innerWidth * .42, 270));
      const wantedY = idle ? idleY : clamp((pointerY - focusY) / Math.max(innerHeight * .45, 240));
      dog.x += (wantedX - dog.x) * ease(elapsed, 145);
      dog.y += (wantedY - dog.y) * ease(elapsed, 145);
      const scale = rect.width / 1312;
      dog.element.style.setProperty('--look-x', `${(dog.x * 18 * scale).toFixed(2)}px`);
      dog.element.style.setProperty('--look-y', `${(dog.y * 12 * scale).toFixed(2)}px`);
    });
    frame = requestAnimationFrame(animate);
  }

  function blink(dog) {
    if (!reducedMotion.matches) {
      const eyes = [...dog.element.querySelectorAll('.eye')];
      eyes.forEach(eye => {
        eye.classList.remove('blink');
        void eye.offsetWidth;
        eye.classList.add('blink');
        setTimeout(() => eye.classList.remove('blink'), 330);
      });
    }
    setTimeout(() => blink(dog), 4000 + Math.random() * 4600);
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      dogs.forEach(dog => {
        dog.x = dog.y = 0;
        dog.element.style.setProperty('--look-x', '0px');
        dog.element.style.setProperty('--look-y', '0px');
      });
    } else if (!frame) {
      lastFrame = 0;
      frame = requestAnimationFrame(animate);
    }
  });

  if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
  dogs.forEach((dog, index) => setTimeout(() => blink(dog), 2600 + index * 1700));
})();

(() => {
  const form = document.getElementById('booking-form');
  if (!form) return;
  const checkin = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');
  const dateError = document.getElementById('date-error');
  const result = document.getElementById('booking-result');
  const rooms = {
    cloud: { name: 'The Cloud Suite', rate: 2499, photo: 'assets/room-cloud.webp' },
    garden: { name: 'The Garden Suite', rate: 3299, photo: 'assets/room-garden.webp' },
    nook: { name: 'The Snuggle Nook', rate: 1999, photo: 'assets/room-nook.webp' },
  };
  const money = amount => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
  const dateValue = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  const addDays = (value, days) => {
    const [year, month, day] = value.split('-').map(Number);
    return dateValue(new Date(year, month - 1, day + days));
  };
  const nightsBetween = (start, end) => {
    if (!start || !end) return 0;
    const utc = value => Date.UTC(...value.split('-').map((number, index) => index === 1 ? Number(number) - 1 : Number(number)));
    return Math.max(0, Math.round((utc(end) - utc(start)) / 86400000));
  };
  const prettyDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const selectedRoom = () => rooms[form.elements.room.value] || rooms.cloud;
  const today = dateValue(new Date());
  checkin.min = today;
  checkout.min = addDays(today, 1);

  function renderSummary() {
    const room = selectedRoom();
    const nights = nightsBetween(checkin.value, checkout.value);
    document.getElementById('summary-room').textContent = room.name;
    document.getElementById('summary-rate').textContent = money(room.rate);
    document.getElementById('summary-nights').textContent = nights || '—';
    document.getElementById('summary-dates').textContent = nights ? `${prettyDate(checkin.value)} – ${prettyDate(checkout.value)}` : 'Add your dates';
    document.getElementById('summary-total').textContent = nights ? money(room.rate * nights) : 'Add dates';
    const photo = document.getElementById('summary-photo');
    photo.src = room.photo;
    photo.alt = room.name;
    return nights;
  }

  function validateDates() {
    if (checkin.value) checkout.min = addDays(checkin.value, 1);
    const wrongOrder = Boolean(checkin.value && checkout.value && checkout.value <= checkin.value);
    checkout.setCustomValidity(wrongOrder ? 'Choose a check-out date after check-in.' : '');
    dateError.hidden = !wrongOrder;
    return !wrongOrder;
  }

  checkin.addEventListener('change', () => {
    if (checkout.value && checkout.value <= checkin.value) checkout.value = '';
    validateDates();
    renderSummary();
  });
  checkout.addEventListener('change', () => { validateDates(); renderSummary(); });
  form.addEventListener('change', () => { result.hidden = true; renderSummary(); });
  form.addEventListener('input', () => { result.hidden = true; });

  document.querySelectorAll('.room-jump').forEach(button => button.addEventListener('click', () => {
    const radio = form.querySelector(`input[name="room"][value="${button.dataset.room}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('book').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }));

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validateDates()) { checkout.reportValidity(); return; }
    const nights = renderSummary();
    if (!nights) { checkout.reportValidity(); return; }
    const room = selectedRoom();
    const dogName = form.elements.dogName.value.trim();
    result.textContent = `${dogName}'s preview is ready: ${nights} ${nights === 1 ? 'night' : 'nights'} in ${room.name}, ${prettyDate(checkin.value)}–${prettyDate(checkout.value)}, estimated at ${money(nights * room.rate)}. This is a demo; no reservation or payment was made.`;
    result.hidden = false;
    result.focus();
  });

  const mobileNav = document.querySelector('.mobile-nav');
  mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { mobileNav.open = false; }));
  renderSummary();
})();
