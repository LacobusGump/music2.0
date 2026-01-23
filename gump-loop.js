/**
 * GUMP Autonomous Loop (Claude Code Edition)
 *
 * Uses Claude Code CLI (your Pro subscription).
 * Two cycles per day. Careful breakthroughs. Preserve the vibe.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============ CONFIGURATION ============

const CONFIG = {
  // 12 hours = 720 minutes. Two cycles per day.
  cycleMinutes: parseInt(process.env.CYCLE_INTERVAL_MINUTES) || 720,

  // Safety limits
  maxConsecutiveFailures: 3,
  maxCyclesWithoutProgress: 5,

  // Paths
  projectDir: __dirname,
  gumpDir: join(__dirname, '.gump'),
  logsDir: join(__dirname, '.gump', 'logs'),

  // Claude Code timeout (10 minutes max per cycle)
  claudeTimeout: 600000,
};

// ============ STATE ============

let state = {
  cycleCount: 0,
  consecutiveFailures: 0,
  cyclesWithoutProgress: 0,
  paused: false,
  pauseReason: null,
};

// ============ LOGGING ============

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
  console.log(entry);

  if (!existsSync(CONFIG.logsDir)) mkdirSync(CONFIG.logsDir, { recursive: true });
  const logFile = join(CONFIG.logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  writeFileSync(logFile, entry + '\n', { flag: 'a' });
}

// ============ FILE OPERATIONS ============

function readContext() {
  const files = ['vision.md', 'COMPETITION.md', 'state.md', 'dialogue.md'];
  let context = '';

  for (const file of files) {
    const path = join(CONFIG.gumpDir, file);
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      context += `\n=== ${file} ===\n${content}\n`;
    }
  }

  // Truncated index.html - show more for better context
  const indexPath = join(CONFIG.projectDir, 'index.html');
  if (existsSync(indexPath)) {
    const indexContent = readFileSync(indexPath, 'utf-8');
    const truncated = indexContent.length > 8000
      ? indexContent.substring(0, 8000) + `\n... [${indexContent.length} chars total]`
      : indexContent;
    context += `\n=== index.html (current code) ===\n${truncated}\n`;
  }

  return context;
}

// ============ GIT OPERATIONS ============

function git(command) {
  try {
    return execSync(`git ${command}`, {
      cwd: CONFIG.projectDir,
      encoding: 'utf-8',
      timeout: 30000
    }).trim();
  } catch (err) {
    log('ERROR', `Git command failed: ${command}`, { error: err.message });
    return null;
  }
}

function hasUncommittedChanges() {
  const status = git('status --porcelain');
  return status && status.length > 0;
}

function getLatestCommitMessage() {
  return git('log -1 --pretty=%B') || '';
}

// ============ CLAUDE CODE EXECUTION ============

function runClaudeCode(prompt) {
  return new Promise((resolve, reject) => {
    log('INFO', 'Starting Claude Code...');

    const promptFile = join(CONFIG.gumpDir, '.prompt-temp.txt');
    writeFileSync(promptFile, prompt, 'utf-8');

    const claude = spawn('claude', [
      '--dangerously-skip-permissions',
      '-p',
      '-'
    ], {
      cwd: CONFIG.projectDir,
      timeout: CONFIG.claudeTimeout,
      shell: true
    });

    let stdout = '';
    let stderr = '';

    claude.stdin.write(prompt);
    claude.stdin.end();

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    claude.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Claude exited with code ${code}: ${stderr}`));
      }
    });

    claude.on('error', (err) => {
      reject(err);
    });
  });
}

// ============ BUILD PROMPT ============

function buildPrompt(context) {
  return `You are THREE MINDS working on GUMP - a musical instrument that creates music from physical experience.

═══════════════════════════════════════════════════════════════════════════════
THE ENGINEER
═══════════════════════════════════════════════════════════════════════════════
Expert in: Real-time systems, Web Audio API, sensor fusion, latency optimization.
Your job: Make it WORK. Fast. Smooth. No jank.

═══════════════════════════════════════════════════════════════════════════════
THE MUSICIAN
═══════════════════════════════════════════════════════════════════════════════
Expert in: Music theory, rhythm, psychoacoustics, groove, emotional arc.
Your job: Make it MUSICAL. Not random. Not mechanical. Alive.

═══════════════════════════════════════════════════════════════════════════════
THE PHYSICIST
═══════════════════════════════════════════════════════════════════════════════
Expert in: Dynamical systems, wave mechanics, information theory, emergence.
Your job: Find the STRUCTURE. The math that makes music inevitable.

═══════════════════════════════════════════════════════════════════════════════
⚠️  CRITICAL WARNING - READ THIS ⚠️
═══════════════════════════════════════════════════════════════════════════════

PREVIOUS CYCLES BROKE THE APP. We had to revert.

The mistake: Too ambitious. Rewrote too much. Lost the vibe.

THE GOLDEN RULE: **PRESERVE THE VIBE.**

The current app FEELS GOOD. The groove works. The blooming notes work.
Your job is to ENHANCE it, not REPLACE it.

BEFORE YOU SHIP ANYTHING:
1. Add SMALL changes
2. Make sure existing features STILL WORK
3. Don't rewrite working code
4. If in doubt, do LESS not more

═══════════════════════════════════════════════════════════════════════════════
CURRENT STATE
═══════════════════════════════════════════════════════════════════════════════
${context}

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION THIS CYCLE
═══════════════════════════════════════════════════════════════════════════════

1. Read state.md carefully - it tells you EXACTLY what to do

2. Do ONE SMALL THING that adds value without breaking anything

3. Update .gump/state.md with what you did

4. Add a brief note to .gump/dialogue.md

5. Commit and push

REMEMBER:
- Small additions > big rewrites
- Working code > ambitious broken code
- The vibe is sacred
- When in doubt, do less

Go.`;
}

// ============ MAIN CYCLE ============

async function runCycle() {
  state.cycleCount++;
  log('INFO', `\n${'='.repeat(50)}`);
  log('INFO', `CYCLE ${state.cycleCount} STARTING`);
  log('INFO', `${'='.repeat(50)}\n`);

  if (hasUncommittedChanges()) {
    log('WARN', 'Found uncommitted changes - committing first');
    git('add -A');
    git('commit -m "WIP: uncommitted changes before autonomous cycle"');
  }

  git('pull --rebase origin main');

  const context = readContext();
  const prompt = buildPrompt(context);

  try {
    await runClaudeCode(prompt);
    log('INFO', 'Claude Code completed');
  } catch (err) {
    log('ERROR', 'Claude Code failed', { error: err.message });
    state.consecutiveFailures++;
    return false;
  }

  if (hasUncommittedChanges()) {
    state.consecutiveFailures = 0;
    state.cyclesWithoutProgress = 0;
    log('INFO', 'Changes detected - cycle successful');
    return true;
  } else {
    const latestCommit = getLatestCommitMessage();
    if (latestCommit.includes('Co-Authored-By: Claude')) {
      state.consecutiveFailures = 0;
      state.cyclesWithoutProgress = 0;
      log('INFO', 'Claude committed changes directly - cycle successful');
      return true;
    }

    state.cyclesWithoutProgress++;
    log('WARN', `No changes made (${state.cyclesWithoutProgress} cycles without progress)`);
    return false;
  }
}

// ============ MAIN LOOP ============

async function main() {
  log('INFO', '🎵 GUMP Autonomous Loop Starting');
  log('INFO', 'Configuration', {
    cycleMinutes: CONFIG.cycleMinutes,
    projectDir: CONFIG.projectDir
  });

  const runOnce = process.argv.includes('--once');

  while (true) {
    if (state.consecutiveFailures >= CONFIG.maxConsecutiveFailures) {
      log('ERROR', `Too many consecutive failures. Pausing.`);
      state.paused = true;
      state.pauseReason = 'Too many consecutive failures';
    }

    if (state.cyclesWithoutProgress >= CONFIG.maxCyclesWithoutProgress) {
      log('WARN', `Too many cycles without progress. Pausing.`);
      state.paused = true;
      state.pauseReason = 'Stuck - no progress being made';
    }

    if (state.paused) {
      log('INFO', `\n⏸️  PAUSED: ${state.pauseReason}`);
      break;
    }

    try {
      await runCycle();
    } catch (err) {
      log('ERROR', 'Cycle error', { error: err.message });
      state.consecutiveFailures++;
    }

    if (runOnce) {
      log('INFO', '\n✅ Single cycle complete (--once flag)');
      break;
    }

    const hours = Math.floor(CONFIG.cycleMinutes / 60);
    log('INFO', `\n⏳ Waiting ${hours} hours until next cycle...`);
    log('INFO', `   Next: ${new Date(Date.now() + CONFIG.cycleMinutes * 60000).toLocaleString()}`);
    await new Promise(resolve => setTimeout(resolve, CONFIG.cycleMinutes * 60 * 1000));
  }
}

main().catch(err => {
  log('FATAL', 'Unhandled error', { error: err.message, stack: err.stack });
  process.exit(1);
});
