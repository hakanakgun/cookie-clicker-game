// main.js
import { initGame, login } from './gamestate.js';
import { setupUI } from './ui.js';
import { initFirebaseListeners } from './firebaseIntegration.js';

document.getElementById('login-button').addEventListener('click', login);
document.getElementById('save-button').addEventListener('click', () => {
  import('./firebaseIntegration.js').then(module => module.saveGame());
});

setupUI();
initFirebaseListeners();
window.addEventListener('load', initGame);