// firebaseIntegration.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js';
import { getDatabase, ref, set, onValue, get } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js';
import { gameState } from './gamestate.js';
import { showNotification } from './ui.js';

const firebaseConfig = {

};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
let lastSaveTime = 0;
const SAVE_INTERVAL = 10000;

export async function saveGame() {
  const now = Date.now();
  if (now - lastSaveTime < SAVE_INTERVAL) return;
  lastSaveTime = now;
  const saveData = { ...gameState, lastSaved: now };
  try {
    await set(ref(database, `players/${gameState.playerId}`), saveData);
    console.log("Game saved successfully");
  } catch (error) {
    console.error("Error saving game:", error);
  }
}

export async function loadGame() {
  try {
    const snapshot = await get(ref(database, `players/${gameState.playerId}`));
    if (snapshot.exists()) {
      const savedData = snapshot.val();
      Object.assign(gameState, savedData);
      import('./ui.js').then(mod => mod.updateUICounters());
      showNotification("Game loaded successfully!");
    } else {
      console.log("No saved game found, starting new game");
    }
  } catch (error) {
    console.error("Error loading game:", error);
    showNotification("Failed to load game. Starting new game.");
  }
}

export function saveAchievement(achievementId) {
  const achievementData = {
    playerId: gameState.playerId,
    playerName: gameState.playerName,
    achievementId: achievementId,
    timestamp: Date.now()
  };
  const newAchievementRef = ref(database, `achievements/${gameState.playerId}_${achievementId}`);
  set(newAchievementRef, achievementData).catch(error => console.error("Error saving achievement:", error));
}

import { push } from 'https://www.gstatic.com/firebasejs/10.3.1/firebase-database.js';

export function broadcastEvent(eventId) {
  const eventData = {
    playerId: gameState.playerId,
    playerName: gameState.playerName,
    eventId: eventId,
    timestamp: Date.now()
  };
  const eventsRef = ref(database, 'events');
  const newEventRef = push(eventsRef); // Generates a unique key
  set(newEventRef, eventData).catch(error => console.error("Error broadcasting event:", error));
}


export function initFirebaseListeners() {
  onValue(ref(database, 'achievements'), snapshot => {
    if (snapshot.exists()) {
      const achievements = snapshot.val();
      const recent = Object.values(achievements)
        .filter(a => a.playerId !== gameState.playerId && a.timestamp > Date.now() - 60000)
        .sort((a, b) => b.timestamp - a.timestamp);
      recent.forEach(a => {
        import('./gamestate.js').then(mod => {
          const ach = mod.ACHIEVEMENTS.find(x => x.id === a.achievementId);
          if (ach) showNotification(`${a.playerName} just unlocked: ${ach.name}!`);
        });
      });
    }
  });

  let lastNotificationTimestamps = {};
  onValue(ref(database, 'events'), snapshot => {
    if (snapshot.exists()) {
      const events = snapshot.val();
      const now = Date.now();
      Object.values(events)
        .filter(e => e.playerId !== gameState.playerId && now - e.timestamp < 10000)
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach(e => {
          if (!lastNotificationTimestamps[e.eventId] || now - lastNotificationTimestamps[e.eventId] > 5000) {
            import('./gamestate.js').then(mod => {
              const eventInfo = mod.EVENTS.find(x => x.id === e.eventId);
              if (eventInfo) {
                showNotification(`${e.playerName} just triggered: ${eventInfo.name}!`);
                lastNotificationTimestamps[e.eventId] = now;
              }
            });
          }
        });
    }
  });
}

export function updateLeaderboard() {
  get(ref(database, 'players')).then(snapshot => {
    if (snapshot.exists()) {
      const players = Object.values(snapshot.val()).sort((a, b) => b.cookies - a.cookies);
      const top = players.slice(0, 10);
      const container = document.getElementById('leaderboard-container');
      container.innerHTML = '';
      top.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'leaderboard-item';
        if (player.playerId === gameState.playerId) div.style.backgroundColor = '#ffe8c8';
        div.innerHTML = `
          <span class="leaderboard-rank">#${index + 1}</span>
          <span class="leaderboard-name">${player.playerName}</span>
          <span class="leaderboard-cookies">${Math.floor(player.cookies)}</span>
        `;
        container.appendChild(div);
      });
    }
  }).catch(error => console.error("Error updating leaderboard:", error));
}