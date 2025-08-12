const stage = document.getElementById('stage');
const petEmojis = ['🐶','🐱','🐰','🦊','🐻','🐼','🦁','🐯','🦄','🐸'];

function rand(min, max) { return Math.random() * (max - min) + min; }

let pets = [];

function savePets() {
  const saveData = pets.map(pet => ({
    x: pet.x,
    y: pet.y,
    vx: pet.vx,
    vy: pet.vy,
    mood: pet.mood,
    hunger: pet.hunger,
    size: pet.size,
    emoji: pet.el.innerText
  }));
  localStorage.setItem('desktop-pets-save', JSON.stringify(saveData));
}

function loadPets() {
  const saveData = JSON.parse(localStorage.getItem('desktop-pets-save') || '[]');
  if (saveData.length) {
    for (const data of saveData) {
      createPet(data.x, data.y, data.emoji, data.vx, data.vy, data.mood, data.hunger, data.size);
    }
  } else {
    for (let i = 0; i < 4; i++) createPet();
  }
}

function createPet(x, y, emoji, vx, vy, mood, hunger, size) {
  const el = document.createElement('div');
  el.className = 'pet';
  el.innerText = emoji || petEmojis[Math.floor(Math.random() * petEmojis.length)];
  el.style.left = (x || rand(20, window.innerWidth - 80)) + 'px';
  el.style.top = (y || rand(20, window.innerHeight - 120)) + 'px';

  const pet = {
    el,
    x: parseFloat(el.style.left),
    y: parseFloat(el.style.top),
    vx: vx ?? rand(-0.6, 0.6),
    vy: vy ?? rand(-0.2, 0.2),
    mood: mood ?? 0,
    hunger: hunger ?? 0,
    size: size ?? 1,
    lastInteract: Date.now(),
  };

  let holdTimer = null;

  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    holdTimer = setTimeout(() => {
      pet.hunger = Math.max(0, pet.hunger - 3);
      pet.size = Math.min(2.5, pet.size + 0.15);
      el.classList.add('large');
      el.style.transform = `scale(${pet.size})`;
      pet.mood = 120;
      savePets();
    }, 1200);

    pet.mood = 80;
    pet.lastInteract = Date.now();
    savePets();
  });

  window.addEventListener('mouseup', () => {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  });

  el.addEventListener('dragstart', e => e.preventDefault());

  stage.appendChild(el);
  pets.push(pet);
  savePets();
}

function update(dt) {
  for (const pet of pets) {
    pet.hunger += dt * 0.001;
    pet.x += pet.vx * dt;
    pet.y += pet.vy * dt;

    if (Math.random() < 0.008) {
      pet.vx += rand(-0.5, 0.5);
      pet.vy += rand(-0.2, 0.2);
    }

    pet.vx = Math.max(-1.8, Math.min(1.8, pet.vx));
    pet.vy = Math.max(-1.2, Math.min(1.2, pet.vy));

    const margin = 24;
    if (pet.x < margin) { pet.x = margin; pet.vx = Math.abs(pet.vx); }
    if (pet.x > window.innerWidth - margin) { pet.x = window.innerWidth - margin; pet.vx = -Math.abs(pet.vx); }
    if (pet.y < margin) { pet.y = margin; pet.vy = Math.abs(pet.vy); }
    if (pet.y > window.innerHeight - margin) { pet.y = window.innerHeight - margin; pet.vy = -Math.abs(pet.vy); }

    pet.mood = Math.max(0, pet.mood - dt * 0.06);

    pet.el.style.left = pet.x + 'px';
    pet.el.style.top = pet.y + 'px';

    if (pet.mood > 0) {
      pet.el.style.transform = `scale(${1 + Math.min(0.6, pet.mood / 200)}) rotate(${Math.sin(Date.now() / 160) * 6}deg)`;
    } else {
      pet.el.style.transform = 'rotate(0deg)';
    }

    if (pet.hunger > 20) {
      pet.el.classList.add('small');
    } else {
      pet.el.classList.remove('small');
    }

    if (pet.mood > 80 && Math.random() < 0.002) pet.el.innerText = '💖';
    else if (Math.random() < 0.001) pet.el.innerText = petEmojis[Math.floor(Math.random() * petEmojis.length)];

    // simple collision avoidance
    for (const other of pets) {
      if (other === pet) continue;
      const dx = other.x - pet.x;
      const dy = other.y - pet.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 2500 && d2 > 0) {
        pet.vx -= dx * 0.00005;
        pet.vy -= dy * 0.00005;
      }
    }
  }
}

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = now - last;
  last = now;
  update(dt);
  requestAnimationFrame(loop);
}
loop();

// Alt toggles click-through
let isClickThrough = false;
window.addEventListener('keydown', (e) => {
  if (e.key === 'Alt') {
    isClickThrough = !isClickThrough;
    require('electron').remote.getCurrentWindow().setIgnoreMouseEvents(isClickThrough, { forward: true });
  }
});

// Add pet on double-click
stage.addEventListener('dblclick', (e) => {
  createPet(e.clientX, e.clientY);
});
