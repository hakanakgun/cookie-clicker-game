// gamestate.js
import { 
  updateUICounters, 
  createClickAnimation, 
  showNotification, 
  showAchievement, 
  pokeCookie, 
  startPointerAnimation 
} from './ui.js';

import { 
  saveGame, 
  loadGame, 
  updateLeaderboard, 
  broadcastEvent, 
  saveAchievement 
} from './firebaseIntegration.js';

export let gameState = {
  cookies: 0,
  cookiesPerClick: 1,
  cookiesPerSecond: 0,
  autoClickSpeed: 0,
  upgrades: {},
  buildings: {},
  achievements: [],
  totalClicks: 0,
  totalCookies: 0, 
  autoClickAccumulator: 0,
  buildingMultiplier: 1,
  playerName: "",
  playerId: ""
};

export const UPGRADES = [
  { id: 'cursor1', name: 'Cursor Level 1', description: '+1 cookie per click', cost: 50,  effect: { cookiesPerClick: 1 }, requires: null },
  { id: 'cursor2', name: 'Cursor Level 2', description: '+2 cookies per click', cost: 200, effect: { cookiesPerClick: 2 }, requires: 'cursor1' },
  { id: 'cursor3', name: 'Cursor Level 3', description: '+3 cookies per click', cost: 500, effect: { cookiesPerClick: 3 }, requires: 'cursor2' },
  { id: 'autoclick1', name: 'Auto Clicker 1', description: 'Clicks automatically once every 10 seconds', cost: 100, effect: { autoClick: 0.1 }, requires: null },
  { id: 'autoclick2', name: 'Auto Clicker 2', description: 'Clicks automatically once every 5 seconds', cost: 300, effect: { autoClick: 0.2 }, requires: 'autoclick1' },
  { id: 'buildingBoost1', name: 'Building Boost 1', description: 'All buildings produce 50% more cookies', cost: 1000, effect: { buildingMultiplier: 1.5 }, requires: null },
  { id: 'buildingBoost2', name: 'Building Boost 2', description: 'All buildings produce 100% more cookies', cost: 5000, effect: { buildingMultiplier: 2 }, requires: 'buildingBoost1' }
];

export const BUILDINGS = [
  { id: 'grandma', name: 'Grandma',  description: 'A nice grandma to bake cookies.', baseCost: 100,   cookiesPerSecond: 0.5 },
  { id: 'farm',    name: 'Farm',     description: 'Grows cookie plants.',             baseCost: 500,   cookiesPerSecond: 2   },
  { id: 'mine',    name: 'Mine',     description: 'Mines cookie dough.',              baseCost: 2000,  cookiesPerSecond: 10  },
  { id: 'factory', name: 'Factory',  description: 'Produces mass amounts of cookies.',baseCost: 10000, cookiesPerSecond: 50  },
  { id: 'bank',    name: 'Bank',     description: 'Generates cookies from interest.', baseCost: 50000, cookiesPerSecond: 250 }
];

// Calculate how much it costs to buy the next building of a given type
export function calculateBuildingCost(buildingId) {
  const building = BUILDINGS.find(b => b.id === buildingId);
  if (!building) return 0; // Fallback if not found
  const count = gameState.buildings[buildingId]?.count || 0;
  return Math.floor(building.baseCost * Math.pow(1.15, count));
}

export const ACHIEVEMENTS = [
  { id: 'firstClick', name: 'First Click', description: 'Click the cookie for the first time.', condition: state => state.totalClicks > 0 },
  { id: 'tenCookies', name: 'Cookie Beginner', description: 'Bake 10 cookies in total.', condition: state => state.totalCookies >= 10 },
  { id: 'hundredCookies', name: 'Cookie Apprentice', description: 'Bake 100 cookies in total.', condition: state => state.totalCookies >= 100 },
  { id: 'thousandCookies', name: 'Cookie Master', description: 'Bake 1,000 cookies in total.', condition: state => state.totalCookies >= 1000 },
  { id: 'millionCookies', name: 'Cookie Millionaire', description: 'Bake 1,000,000 cookies in total.', condition: state => state.totalCookies >= 1000000 },
  { id: 'firstGrandma', name: 'Grandma\'s Helper', description: 'Hire your first grandma.', condition: state => state.buildings.grandma && state.buildings.grandma.count > 0 },
  { id: 'tenGrandmas', name: 'Grandma\'s Army', description: 'Hire 10 grandmas.', condition: state => state.buildings.grandma && state.buildings.grandma.count >= 10 },
  { id: 'firstFarm', name: 'Farmer', description: 'Build your first farm.', condition: state => state.buildings.farm && state.buildings.farm.count > 0 }
];

export const EVENTS = [
  { id: 'cookieRain', name: 'Cookie Rain', description: 'Cookies are raining! Double cookies per click for 30 seconds!', duration: 30000, effect: { cookiesPerClickMultiplier: 2 } },
  { id: 'frenzyCookies', name: 'Cookie Frenzy', description: 'All buildings produce 3x cookies for 20 seconds!', duration: 20000, effect: { buildingMultiplier: 3 } },
  { id: 'clickFrenzy', name: 'Click Frenzy', description: 'Each click produces 7x cookies for 15 seconds!', duration: 15000, effect: { cookiesPerClickMultiplier: 7 } }
];

let autoClickerInterval = null;

export function initGame() {
  const pastryClicker = document.getElementById('pastry-clicker');
  pastryClicker.addEventListener('click', clickCookie);
  setInterval(updateCookiesPerSecond, 1000);
  // Removed redundant setInterval(saveGame, 60000)
  setInterval(checkAchievements, 5000);
  setInterval(triggerRandomEvent, 120000);
  setInterval(() => updateLeaderboard(), 10000);
  initializeUpgrades();
  initializeBuildings();
  loadGame();
}


export function login() {
  const nameInput = document.getElementById('player-name-input');
  const name = nameInput.value.trim();
  if (!name) {
    showNotification("Please enter a name to start playing!");
    return;
  }
  gameState.playerName = name;
  gameState.playerId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  document.getElementById('player-name').textContent = name;
  loadGame().then(() => {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    saveGame();
    showNotification(`Welcome, ${name}! Start clicking to earn cookies!`);
  }).catch(() => {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    saveGame();
    showNotification(`Welcome, ${name}! Start clicking to earn cookies!`);
  });
}

export function clickCookie() {
  let clickValue = gameState.cookiesPerClick;
  if (window.activeEvents) {
    window.activeEvents.forEach(e => {
      if (e.effect.cookiesPerClickMultiplier) clickValue *= e.effect.cookiesPerClickMultiplier;
    });
  }
  gameState.cookies += clickValue;
  gameState.totalCookies += clickValue; // Track cumulative cookies
  gameState.totalClicks++;
  updateUICounters();
  createClickAnimation(clickValue);
  checkAchievements();
}

export function initializeUpgrades() {
  const upgradesContainer = document.getElementById('upgrades-container');
  upgradesContainer.innerHTML = '';
  UPGRADES.forEach(upgrade => {
    if (!gameState.upgrades[upgrade.id]) {
      gameState.upgrades[upgrade.id] = { purchased: false };
    }
    let requirementMet = true;
    if (upgrade.requires) {
      requirementMet = gameState.upgrades[upgrade.requires] && gameState.upgrades[upgrade.requires].purchased;
    }
    if (requirementMet && !gameState.upgrades[upgrade.id].purchased) {
      const div = document.createElement('div');
      div.className = 'upgrade-item';
      div.id = `upgrade-container-${upgrade.id}`;
      div.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${upgrade.name}</div>
          <div class="upgrade-desc">${upgrade.description}</div>
          <div class="upgrade-cost">${formatNumber(upgrade.cost)} cookies</div>
        </div>
        <button class="upgrade-button" id="upgrade-${upgrade.id}">Buy</button>
      `;
      upgradesContainer.appendChild(div);
      document.getElementById(`upgrade-${upgrade.id}`).addEventListener('click', () => purchaseUpgrade(upgrade.id));
    }
  });
  updateUICounters();
}

export function initializeBuildings() {
  const buildingsContainer = document.getElementById('buildings-container');
  buildingsContainer.innerHTML = '';
  BUILDINGS.forEach(building => {
    if (!gameState.buildings[building.id]) {
      gameState.buildings[building.id] = { count: 0 };
    }
    const count = gameState.buildings[building.id].count;
    const cost = calculateBuildingCost(building.id);
    const div = document.createElement('div');
    div.className = 'building-item';
    div.innerHTML = `
      <div class="building-info">
        <div class="building-name">${building.name} (${count})</div>
        <div class="building-desc">${building.description}</div>
        <div class="building-production">Each produces ${formatNumber(calculateBuildingProduction(building.id))} cookies/sec</div>
        <div class="building-cost">${formatNumber(cost)} cookies</div>
      </div>
      <button class="building-button" id="building-${building.id}" ${gameState.cookies < cost ? 'disabled' : ''}>Buy</button>
    `;
    buildingsContainer.appendChild(div);
    document.getElementById(`building-${building.id}`).addEventListener('click', () => purchaseBuilding(building.id));
  });
}

export function purchaseUpgrade(upgradeId) {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (gameState.cookies >= upgrade.cost && !gameState.upgrades[upgradeId].purchased) {
    gameState.cookies -= upgrade.cost;
    if (upgrade.effect.cookiesPerClick) {
      gameState.cookiesPerClick += upgrade.effect.cookiesPerClick;
    }
    if (upgrade.effect.autoClick) {
      gameState.autoClickSpeed = (gameState.autoClickSpeed || 0) + upgrade.effect.autoClick;
      if (!autoClickerInterval) {
        autoClickerInterval = setInterval(() => {
          const autoClicks = gameState.autoClickSpeed * 0.2;
          gameState.cookies += autoClicks * gameState.cookiesPerClick;
          updateUICounters();
          gameState.autoClickAccumulator += autoClicks;
          if (gameState.autoClickAccumulator >= 1) {
            const bounces = Math.floor(gameState.autoClickAccumulator);
            for (let i = 0; i < bounces; i++) {
              pokeCookie();
              createClickAnimation(gameState.cookiesPerClick);
            }
            gameState.autoClickAccumulator -= bounces;
          }
        }, 200);
      }
      document.getElementById('autoClickerCursor').style.display = 'block';
      startPointerAnimation();
    }
    if (upgrade.effect.buildingMultiplier) {
      gameState.buildingMultiplier = (gameState.buildingMultiplier || 1) * upgrade.effect.buildingMultiplier;
    }
    gameState.upgrades[upgradeId].purchased = true;
    updateUICounters();
    initializeUpgrades();
    initializeBuildings();
    showNotification(`Upgrade purchased: ${upgrade.name}`);
    saveGame();
  }
}

export function purchaseBuilding(buildingId) {
  const building = BUILDINGS.find(b => b.id === buildingId);
  const cost = calculateBuildingCost(buildingId);
  if (gameState.cookies >= cost) {
    gameState.cookies -= cost;
    gameState.buildings[buildingId].count++;
    calculateCookiesPerSecond();
    updateUICounters();
    initializeBuildings();
    animateBuildingUpdate(buildingId);
    checkAchievements();
    saveGame();
  }
}

function animateBuildingUpdate(buildingId) {
  if (buildingId === 'grandma') {
    const grandmaElem = document.createElement('div');
    grandmaElem.className = 'grandma-animation';
    grandmaElem.style.left = '50%';
    grandmaElem.style.top = '50%';
    grandmaElem.style.transform = 'translate(-50%, -50%)';
    document.getElementById('pastry-clicker').appendChild(grandmaElem);
    setTimeout(() => { grandmaElem.remove(); }, 1500);
  } else if (buildingId === 'farm') {
    const pastryElem = document.querySelector('.pastry');
    pastryElem.classList.add('farm-active');
    setTimeout(() => { pastryElem.classList.remove('farm-active'); }, 1500);
  }
}

function calculateBuildingProduction(buildingId) {
  const building = BUILDINGS.find(b => b.id === buildingId);
  let multiplier = gameState.buildingMultiplier || 1;
  if (window.activeEvents) {
    window.activeEvents.forEach(e => {
      if (e.effect.buildingMultiplier) multiplier *= e.effect.buildingMultiplier;
    });
  }
  return building.cookiesPerSecond * multiplier;
}

export function calculateCookiesPerSecond() {
  let cps = 0;
  for (const id in gameState.buildings) {
    const count = gameState.buildings[id].count;
    cps += calculateBuildingProduction(id) * count;
  }
  gameState.cookiesPerSecond = cps;
  return cps;
}

function updateCookiesPerSecond() {
  gameState.cookies += gameState.cookiesPerSecond;
  gameState.totalCookies += gameState.cookiesPerSecond; // Update cumulative cookies here too
  updateUICounters();
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  else if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  else return num.toFixed(0);
}

function checkAchievements() {
  let newAchieved = false;
  ACHIEVEMENTS.forEach(ach => {
    if (gameState.achievements.includes(ach.id)) return;
    if (ach.condition(gameState)) {
      gameState.achievements.push(ach.id);
      showAchievement(ach.name, ach.description);
      import('./firebaseIntegration.js').then(mod => mod.saveAchievement(ach.id));
      newAchieved = true;
    }
  });
  if (newAchieved) saveGame();
}

function triggerRandomEvent() {
  if (Math.random() < 0.2) {
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const eventContainer = document.getElementById('event-container');
    const eventElem = document.createElement('div');
    eventElem.className = 'event-notification';
    eventElem.innerHTML = `<strong>${event.name}</strong><br>${event.description}`;
    eventContainer.appendChild(eventElem);
    const activeEvent = { ...event, endTime: Date.now() + event.duration };
    window.activeEvents = window.activeEvents || [];
    window.activeEvents.push(activeEvent);
    setTimeout(() => {
      window.activeEvents = window.activeEvents.filter(e => e.id !== event.id);
      if (eventContainer.contains(eventElem)) eventContainer.removeChild(eventElem);
      calculateCookiesPerSecond();
      updateUICounters();
      showNotification(`${event.name} has ended.`);
    }, event.duration);
    calculateCookiesPerSecond();
    updateUICounters();
    broadcastEvent(event.id);
  }
}

window.addEventListener('beforeunload', () => {
  if (autoClickerInterval) {
    clearInterval(autoClickerInterval);
    autoClickerInterval = null;
  }
});