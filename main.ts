// SUNPETAL's hand-in program (Node 22, standard library only). It lives beside
// game/ and screenshots/ and resolves them from its own URL, because the grader
// starts `node /bot/main.ts` from some other directory. It copies both folders to
// the output directory (/output, or $MAKEFUN_OUTPUT_DIR when testing) and then
// writes dossier.json with the vendored make.fun library, using the scorer's own
// caps so a passing local run means a passing hand-in.
import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

if (!existsSync(join(gameDir, 'index.html'))) {
  console.error(`main.ts: no game/index.html beside ${here}`);
  process.exit(1);
}

// A clean output tree keeps a stale file from an earlier run out of the dossier.
rmSync(join(outDir, 'game'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
rmSync(join(outDir, 'dossier.json'), { force: true });
mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });

if (existsSync(shotsDir) && statSync(shotsDir).isDirectory()) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const kib = (dossier.length / 1024).toFixed(1);
console.log(`SUNPETAL handed in: ${outDir} (dossier.json ${kib} KiB)`);
