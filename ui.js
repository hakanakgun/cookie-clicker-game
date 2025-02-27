// ui.js
import { gameState, UPGRADES, BUILDINGS, calculateBuildingCost } from './gamestate.js';

// Sets up any initial UI state or listeners (if needed).
export function setupUI() {
  // (Optional) Place any setup logic for UI elements here.
}

// Updates visible counters and button states after each action or interval.
export function updateUICounters() {
  const cookieCounter = document.getElementById('pastry-counter');
  const cpsCounter = document.getElementById('cps-counter');

  // Update the on-screen cookie count and cookies-per-second
  cookieCounter.textContent = `${formatNumber(Math.floor(gameState.cookies))} cookies`;
  cpsCounter.textContent = `${formatNumber(gameState.cookiesPerSecond)} per second`;

  // Update button states (enable/disable)
  updateButtons();
}

// Enable or disable purchase buttons based on the player's current cookies
function updateButtons() {
  // For each upgrade
  UPGRADES.forEach(upgrade => {
    const button = document.getElementById(`upgrade-${upgrade.id}`);
    if (button) {
      button.disabled = 
        gameState.cookies < upgrade.cost || 
        (gameState.upgrades[upgrade.id] && gameState.upgrades[upgrade.id].purchased);
    }
  });

  // For each building
  BUILDINGS.forEach(building => {
    const button = document.getElementById(`building-${building.id}`);
    if (button) {
      const cost = calculateBuildingCost(building.id);
      button.disabled = gameState.cookies < cost;
    }
  });
}

// Shows a brief notification in the top-right corner of the screen
export function showNotification(message) {
  const container = document.getElementById('notification-container');
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.textContent = message;
  container.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// Animates a floating text (“+<value>”) on cookie click
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

  setTimeout(() => anim.remove(), 1000);
}

// Displays an achievement pop-up
export function showAchievement(name, description) {
  const achievementElem = document.getElementById('achievement');
  achievementElem.innerHTML = `<strong>Achievement Unlocked: ${name}</strong><br>${description}`;
  achievementElem.style.opacity = '1';
  setTimeout(() => { achievementElem.style.opacity = '0'; }, 5000);
}

// Temporary pointer “poke” animation
let currentPokeOffset = 0;
export function pokeCookie() {
  currentPokeOffset = 20;
  setTimeout(() => { currentPokeOffset = 0; }, 200);
}

// Orbit animation for auto-clicker pointer
let pointerAngle = 0;
let isPointerAnimating = false;
const rotationSpeed = 0.01;

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

// Formats large numbers (e.g., 1,234 => "1K")
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toFixed(0);
  }
}