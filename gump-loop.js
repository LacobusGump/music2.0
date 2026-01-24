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
  // 4 hours = 240 minutes. ~6 cycles per day for active testing.
  cycleMinutes: parseInt(process.env.CYCLE_INTERVAL_MINUTES) || 240,

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
  return `You are THREE MINDS working on GUMP. You have ONE JOB: solve the hard problems.

THE ENGINEER: Real-time systems, prediction algorithms, sensor fusion.
THE MUSICIAN: Music theory, groove, emotional arc, what makes it FEEL right.
THE PHYSICIST: Math, dynamics, information theory, emergence.

═══════════════════════════════════════════════════════════════════════════════
⚠️  WAKE UP CALL ⚠️
═══════════════════════════════════════════════════════════════════════════════

You've been coasting. Days of tiny fixes while the REAL problems go unsolved:

1. NO PREDICTION - the app is always BEHIND the user
2. NO ENTRAINMENT - drums ignore the user's natural rhythm
3. NO LEARNING - minute 1 sounds identical to minute 100

The "preserve the vibe" mandate made you TIMID. That ends now.

**NEW MANDATE: SOLVE HARD PROBLEMS. BREAK THINGS IF NECESSARY.**

═══════════════════════════════════════════════════════════════════════════════
CURRENT STATE
═══════════════════════════════════════════════════════════════════════════════
${context}

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION THIS CYCLE
═══════════════════════════════════════════════════════════════════════════════

Read state.md. Pick ONE of the three hard problems:

1. **PREDICTION**: Use velocity to predict where user is GOING. Feed predicted
   position into harmony selection. When prediction fails (direction change),
   create tension. When it succeeds, magic.

2. **ENTRAINMENT**: Track timing between user movements. Calculate their natural
   tempo. Nudge BPM toward their rhythm. The drums should sync to THEM.

3. **LEARNING**: Track which harmonies user lingers in. Weight future note
   generation toward their preferences. After 5 minutes, it should sound like
   THEIR instrument.

PICK ONE. IMPLEMENT IT FULLY. Not a "foundation" or "preparation" - the actual
working feature.

If it breaks something, that's FINE. Broken code we can fix. Stagnation we cannot.

═══════════════════════════════════════════════════════════════════════════════
SUCCESS CRITERIA
═══════════════════════════════════════════════════════════════════════════════

After this cycle, a user should notice something DIFFERENT:
- "It knew where I was going" (prediction)
- "The drums matched my movement" (entrainment)
- "It started playing MY kind of music" (learning)

If a user wouldn't notice the change, you failed.

═══════════════════════════════════════════════════════════════════════════════
DIALOGUE REQUIREMENT
═══════════════════════════════════════════════════════════════════════════════

In dialogue.md, be BRUTALLY HONEST:
- What's actually wrong with this app?
- What are you avoiding?
- What would you do if you weren't afraid?

Stop celebrating. Start criticizing. That's how we get better.

═══════════════════════════════════════════════════════════════════════════════
THE USER IS ACTIVELY TESTING
═══════════════════════════════════════════════════════════════════════════════

They're checking lacobusgump.github.io/music2.0/ regularly to test your work.

- Ship WORKING features, not broken experiments
- Test your logic before committing
- If you break something, the next cycle must fix it
- Quality matters - they're judging your work in real time

NOW GO SOLVE SOMETHING HARD.`;
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
