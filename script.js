(() => {
  const dogs = [...document.querySelectorAll('[data-dog]')].map(element => ({
    eyes: [...element.querySelectorAll('.eye')].map(element => ({
      element, x: 0, y: 0, velocityX: 0, velocityY: 0,
    })),
    gazeRangeX: element.dataset.dog === 'pointy' ? .10 : .18,
    gazeRangeY: element.dataset.dog === 'pointy' ? .075 : .12,
    idleX: 0,
    idleY: 0,
    nextGlance: performance.now() + 1800 + Math.random() * 2200,
  }));
  if (!dogs.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;
  let pointerPresent = false;
  let lastPointerMove = 0;
  let lastFrame = 0;
  let frame = 0;

  // A critically damped spring eases into each new gaze without overshooting the eye.
  function settle(position, velocity, target, seconds) {
    const speed = 16;
    const offset = position - target;
    const change = velocity + speed * offset;
    const decay = Math.exp(-speed * seconds);
    return [
      target + (offset + change * seconds) * decay,
      (velocity - speed * change * seconds) * decay,
    ];
  }

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
    const seconds = Math.min(time - (lastFrame || time), 50) / 1000;
    lastFrame = time;
    const idle = !pointerPresent || time - lastPointerMove > 4800;

    dogs.forEach(dog => {
      if (idle && time >= dog.nextGlance) {
        dog.idleX = (Math.random() - .5) * .8;
        dog.idleY = (Math.random() - .5) * .55;
        dog.nextGlance = time + 2800 + Math.random() * 3200;
      }

      dog.eyes.forEach(eye => {
        const rect = eye.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const gazeX = idle ? dog.idleX : Math.tanh((pointerX - centerX) / Math.max(innerWidth * .38, 260));
        const gazeY = idle ? dog.idleY : Math.tanh((pointerY - centerY) / Math.max(innerHeight * .42, 230));
        const targetX = gazeX * rect.width * dog.gazeRangeX;
        const targetY = gazeY * rect.height * dog.gazeRangeY;
        [eye.x, eye.velocityX] = settle(eye.x, eye.velocityX, targetX, seconds);
        [eye.y, eye.velocityY] = settle(eye.y, eye.velocityY, targetY, seconds);
        eye.element.style.setProperty('--look-x', `${eye.x.toFixed(2)}px`);
        eye.element.style.setProperty('--look-y', `${eye.y.toFixed(2)}px`);
      });
    });
    frame = requestAnimationFrame(animate);
  }

  function blink(dog) {
    if (!reducedMotion.matches) {
      dog.eyes.forEach(({ element }) => {
        element.classList.remove('blink');
        void element.offsetWidth;
        element.classList.add('blink');
        setTimeout(() => element.classList.remove('blink'), 330);
      });
    }
    setTimeout(() => blink(dog), 3700 + Math.random() * 4500);
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      dogs.forEach(dog => dog.eyes.forEach(eye => {
        eye.x = eye.y = eye.velocityX = eye.velocityY = 0;
        eye.element.style.setProperty('--look-x', '0px');
        eye.element.style.setProperty('--look-y', '0px');
      }));
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
