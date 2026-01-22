/**
 * GUMP Autonomous Loop (Claude Code Edition)
 *
 * Uses Claude Code CLI (your Pro subscription) instead of API.
 * The Three Minds work continuously on evolving GUMP.
 *
 * Safety features:
 * - Max consecutive failures before pause
 * - Must produce actual file changes to count as progress
 * - Structured output parsing
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============ CONFIGURATION ============

const CONFIG = {
  cycleMinutes: parseInt(process.env.CYCLE_INTERVAL_MINUTES) || 30,

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

  // Append to daily log file
  if (!existsSync(CONFIG.logsDir)) mkdirSync(CONFIG.logsDir, { recursive: true });
  const logFile = join(CONFIG.logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  writeFileSync(logFile, entry + '\n', { flag: 'a' });
}

// ============ FILE OPERATIONS ============

function readContext() {
  const files = ['vision.md', 'state.md', 'dialogue.md'];
  let context = '';

  for (const file of files) {
    const path = join(CONFIG.gumpDir, file);
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      context += `\n=== ${file} ===\n${content}\n`;
    }
  }

  // Truncated index.html
  const indexPath = join(CONFIG.projectDir, 'index.html');
  if (existsSync(indexPath)) {
    const indexContent = readFileSync(indexPath, 'utf-8');
    const truncated = indexContent.length > 4000
      ? indexContent.substring(0, 4000) + `\n... [${indexContent.length} chars total]`
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

    // Write prompt to temp file to avoid shell escaping issues
    const promptFile = join(CONFIG.gumpDir, '.prompt-temp.txt');
    writeFileSync(promptFile, prompt, 'utf-8');

    // Use claude with -p flag for print mode (non-interactive)
    // --dangerously-skip-permissions allows file writes without prompts
    const claude = spawn('claude', [
      '-p', prompt,
      '--dangerously-skip-permissions'
    ], {
      cwd: CONFIG.projectDir,
      timeout: CONFIG.claudeTimeout,
      shell: true
    });

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data); // Stream output live
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
  return `You are the THREE MINDS working on GUMP - a musical instrument that creates music from physical experience.

ENGINEER: Code, real-time systems, Web Audio. Makes it WORK.
MUSICIAN: Music theory, rhythm, emotion. Makes it MUSICAL.
PHYSICIST: Math, physics, structure. Finds the PATTERNS.

CURRENT CONTEXT:
${context}

YOUR TASK THIS CYCLE:
1. Read state.md to see what's next
2. Pick ONE concrete task - the most important next step
3. IMPLEMENT it - make actual code changes to index.html
4. Update .gump/state.md to mark progress
5. Add a brief entry to .gump/dialogue.md about what you did
6. Commit with a clear message
7. Push to GitHub

RULES:
- Make REAL changes. No planning-only cycles.
- Keep changes focused - one feature or fix per cycle.
- Test your logic mentally before writing code.
- If stuck or need human input, say so clearly and stop.

START WORKING NOW. Don't ask questions - make decisions and build.`;
}

// ============ MAIN CYCLE ============

async function runCycle() {
  state.cycleCount++;
  log('INFO', `\n${'='.repeat(50)}`);
  log('INFO', `CYCLE ${state.cycleCount} STARTING`);
  log('INFO', `${'='.repeat(50)}\n`);

  // Check for uncommitted changes from manual work
  if (hasUncommittedChanges()) {
    log('WARN', 'Found uncommitted changes - committing first');
    git('add -A');
    git('commit -m "WIP: uncommitted changes before autonomous cycle"');
  }

  // Pull latest
  git('pull --rebase origin main');

  // Read context
  const context = readContext();

  // Build prompt
  const prompt = buildPrompt(context);

  // Run Claude Code
  try {
    await runClaudeCode(prompt);
    log('INFO', 'Claude Code completed');
  } catch (err) {
    log('ERROR', 'Claude Code failed', { error: err.message });
    state.consecutiveFailures++;
    return false;
  }

  // Check if changes were made
  if (hasUncommittedChanges()) {
    state.consecutiveFailures = 0;
    state.cyclesWithoutProgress = 0;
    log('INFO', 'Changes detected - cycle successful');
    return true;
  } else {
    // Check if Claude committed directly
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
  log('INFO', '🎵 GUMP Autonomous Loop Starting (Claude Code Edition)');
  log('INFO', 'Configuration', {
    cycleMinutes: CONFIG.cycleMinutes,
    projectDir: CONFIG.projectDir
  });

  // Check for --once flag
  const runOnce = process.argv.includes('--once');

  while (true) {
    // Check safety limits
    if (state.consecutiveFailures >= CONFIG.maxConsecutiveFailures) {
      log('ERROR', `Too many consecutive failures (${state.consecutiveFailures}). Pausing.`);
      state.paused = true;
      state.pauseReason = 'Too many consecutive failures';
    }

    if (state.cyclesWithoutProgress >= CONFIG.maxCyclesWithoutProgress) {
      log('WARN', `Too many cycles without progress (${state.cyclesWithoutProgress}). Pausing.`);
      state.paused = true;
      state.pauseReason = 'Stuck - no progress being made';
    }

    if (state.paused) {
      log('INFO', `\n⏸️  PAUSED: ${state.pauseReason}`);
      log('INFO', 'Restart the script to resume.');
      break;
    }

    // Run a cycle
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

    // Wait for next cycle
    log('INFO', `\n⏳ Waiting ${CONFIG.cycleMinutes} minutes until next cycle...`);
    log('INFO', `   Next cycle at: ${new Date(Date.now() + CONFIG.cycleMinutes * 60000).toLocaleTimeString()}`);
    await new Promise(resolve => setTimeout(resolve, CONFIG.cycleMinutes * 60 * 1000));
  }
}

main().catch(err => {
  log('FATAL', 'Unhandled error', { error: err.message, stack: err.stack });
  process.exit(1);
});
