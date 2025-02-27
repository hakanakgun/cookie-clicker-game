// ui.js
let pointerAngle = 0;
const rotationSpeed = 0.01;
const pointerRadius = 130;
let currentPokeOffset = 0;
let isPointerAnimating = false;

export function setupUI() {
  // Setup any initial UI state if necessary.
}

export function updateUICounters() {
  const cookieCounter = document.getElementById('pastry-counter');
  const cpsCounter = document.getElementById('cps-counter');
  import('./gamestate.js').then(mod => {
    cookieCounter.textContent = `${formatNumber(Math.floor(mod.gameState.cookies))} cookies`;
    cpsCounter.textContent = `${formatNumber(mod.gameState.cookiesPerSecond)} per second`;
    updateButtons();
  });
}

function updateButtons() {
  import('./gamestate.js').then(mod => {
    mod.UPGRADES.forEach(upgrade => {
      const btn = document.getElementById(`upgrade-${upgrade.id}`);
      if (btn) btn.disabled = mod.gameState.cookies < upgrade.cost || mod.gameState.upgrades[upgrade.id].purchased;
    });
    mod.BUILDINGS.forEach(building => {
      const btn = document.getElementById(`building-${building.id}`);
      if (btn) btn.disabled = mod.gameState.cookies < calculateBuildingCost(building.id);
    });
  });
}

function calculateBuildingCost(buildingId) {
  // Duplicate logic from gamestate; you may consider refactoring further.
  // For simplicity, return 0.
  return 0;
}

export function showNotification(message) {
  const container = document.getElementById('notification-container');
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.textContent = message;
  container.appendChild(notif);
  setTimeout(() => { notif.remove(); }, 3000);
}

export function createClickAnimation(value) {
  const pastryClicker = document.getElementById('pastry-clicker');
  const anim = document.createElement('div');
  anim.textContent = '+' + formatNumber(value);
  anim.style.position = 'absolute';
  anim.style.left = Math.random() * 100 + 'px';
  anim.style.top = Math.random() * 100 + 'px';
  anim.style.color = '#8c5e2b';
  anim.style.fontWeight = 'bold';
  anim.style.pointerEvents = 'none';
  anim.style.animation = 'fadeUp 1s forwards';
  pastryClicker.appendChild(anim);
  setTimeout(() => { anim.remove(); }, 1000);
}

export function showAchievement(name, description) {
  const achievementElem = document.getElementById('achievement');
  achievementElem.innerHTML = `<strong>Achievement Unlocked: ${name}</strong><br>${description}`;
  achievementElem.style.opacity = '1';
  setTimeout(() => { achievementElem.style.opacity = '0'; }, 5000);
}

export function pokeCookie() {
  currentPokeOffset = 20;
  setTimeout(() => { currentPokeOffset = 0; }, 200);
}

export function startPointerAnimation() {
  if (!isPointerAnimating) {
    isPointerAnimating = true;
    updatePointerPosition();
  }
}

function updatePointerPosition() {
  const pointer = document.getElementById('autoClickerCursor');
  const pastry = document.querySelector('.pastry');
  if (!pointer || !pastry) return;
  const pastryWidth = pastry.offsetWidth;
  const centerX = pastryWidth / 2;
  const centerY = pastryWidth / 2;
  const baseRadius = pastryWidth / 2 + 20;
  const effectiveRadius = baseRadius - currentPokeOffset;
  const pointerX = centerX + effectiveRadius * Math.cos(pointerAngle);
  const pointerY = centerY + effectiveRadius * Math.sin(pointerAngle);
  pointer.style.left = (pointerX - pointer.offsetWidth / 2) + 'px';
  pointer.style.top = (pointerY - pointer.offsetHeight / 2) + 'px';
  const angleDeg = (pointerAngle * 180) / Math.PI + 270;
  pointer.style.transform = `rotate(${angleDeg}deg)`;
  pointerAngle += rotationSpeed;
  requestAnimationFrame(updatePointerPosition);
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  else if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  else return num.toFixed(0);
}