// Loads the game's config + core + systems into a Node VM context (no DOM).
// Used by tools/simulate.mjs and tests. Script order mirrors index.html.
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const SCRIPTS = [
  'config/features.js',
  'config/balance.js',
  'config/content.js',
  'config/payment.js',
  'i18n/vi.js',
  'i18n/en.js',
  'js/core/noa.js',
  'js/core/i18n.js',
  'js/core/time.js',
  'js/core/save.js',
  'js/core/audio.js',
  'js/core/validate.js',
  'js/systems/state.js',
  'js/systems/items.js',
  'js/systems/genetics.js',
  'js/systems/board.js',
  'js/systems/farm.js',
  'js/systems/orders.js',
  'js/systems/labs.js',
  'js/systems/rewards.js',
  'js/systems/shop.js',
  'js/systems/payment.js',
  'js/systems/gacha.js',
  'js/systems/mascots.js',
  'js/systems/world.js',
  'js/systems/secrets.js',
  'js/systems/essence.js'
];

export function loadGame(opts = {}) {
  const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON, Intl, Promise };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of SCRIPTS) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  const NOA = ctx.NOA;
  NOA.state = NOA.newState(opts.lang || 'vi');
  NOA.seedNewGame();
  NOA.i18n.setLang(opts.lang || 'vi');
  NOA.secrets.init();
  NOA.essence.init();
  if (opts.seed != null) NOA.rng.seed(opts.seed);
  return NOA;
}
