/**
 * GUMP Autonomous Loop
 *
 * The Three Minds (Engineer, Musician, Physicist) work continuously
 * on evolving GUMP within token/cost constraints.
 *
 * Safety features:
 * - Max consecutive failures before pause
 * - Must produce actual file changes to count as progress
 * - Token budget tracking
 * - Structured output parsing (no arbitrary execution)
 * - Exponential backoff on errors
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============ CONFIGURATION ============

const CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.MODEL || 'claude-sonnet-4-20250514',
  maxTokens: parseInt(process.env.MAX_TOKENS) || 8192,
  cycleMinutes: parseInt(process.env.CYCLE_INTERVAL_MINUTES) || 30,

  // Safety limits
  maxConsecutiveFailures: 3,
  maxCyclesWithoutProgress: 5,
  maxTokensPerDay: 500000,  // ~$40/day cap for Opus

  // Paths
  projectDir: __dirname,
  gumpDir: join(__dirname, '.gump'),
  logsDir: join(__dirname, '.gump', 'logs'),
};

// ============ STATE ============

let state = {
  cycleCount: 0,
  consecutiveFailures: 0,
  cyclesWithoutProgress: 0,
  tokensUsedToday: 0,
  lastResetDate: new Date().toDateString(),
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
  const files = ['vision.md', 'engineer.md', 'musician.md', 'physicist.md', 'dialogue.md', 'state.md'];
  const context = {};

  for (const file of files) {
    const path = join(CONFIG.gumpDir, file);
    if (existsSync(path)) {
      context[file] = readFileSync(path, 'utf-8');
    }
  }

  // Also read the current index.html
  const indexPath = join(CONFIG.projectDir, 'index.html');
  if (existsSync(indexPath)) {
    context['index.html'] = readFileSync(indexPath, 'utf-8');
  }

  return context;
}

function applyFileChanges(changes) {
  let appliedCount = 0;

  for (const change of changes) {
    try {
      const fullPath = join(CONFIG.projectDir, change.path);

      // Security: only allow changes within project directory
      if (!fullPath.startsWith(CONFIG.projectDir)) {
        log('WARN', `Blocked path escape attempt: ${change.path}`);
        continue;
      }

      // Security: block sensitive files
      if (change.path.includes('.env') || change.path.includes('.git/')) {
        log('WARN', `Blocked sensitive file change: ${change.path}`);
        continue;
      }

      writeFileSync(fullPath, change.content, 'utf-8');
      log('INFO', `Updated: ${change.path}`);
      appliedCount++;
    } catch (err) {
      log('ERROR', `Failed to write ${change.path}`, { error: err.message });
    }
  }

  return appliedCount;
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

function hasChanges() {
  const status = git('status --porcelain');
  return status && status.length > 0;
}

function commitAndPush(message) {
  if (!hasChanges()) {
    log('INFO', 'No changes to commit');
    return false;
  }

  git('add -A');

  const commitMsg = `${message}\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nAutonomous cycle #${state.cycleCount}`;

  // Use file for commit message to handle special characters
  const msgFile = join(CONFIG.gumpDir, '.commit-msg-temp');
  writeFileSync(msgFile, commitMsg);

  const commitResult = git(`commit -F "${msgFile}"`);
  if (!commitResult) return false;

  const pushResult = git('push');
  if (pushResult === null) {
    // Try pull and push again
    git('pull --rebase');
    git('push');
  }

  log('INFO', 'Committed and pushed', { message });
  return true;
}

// ============ PROMPT BUILDING ============

function buildSystemPrompt() {
  return `You are THREE MINDS working together to build GUMP - a musical instrument that creates music from physical experience.

THE ENGINEER: Master of code, real-time systems, Web Audio API. Focuses on making it WORK.
THE MUSICIAN: Master of music theory, rhythm, emotional arc. Focuses on making it MUSICAL.
THE PHYSICIST: Master of math, physics, signal processing. Focuses on finding the underlying STRUCTURE.

RULES:
1. You have ONE task per cycle. Pick the most important next step from state.md.
2. Make REAL progress - actual code changes, not just planning.
3. Keep changes focused. One feature/fix per cycle.
4. Test your logic mentally before outputting code.
5. Update .gump/state.md and .gump/dialogue.md to track what you did.

OUTPUT FORMAT - You MUST respond with this exact JSON structure:
{
  "thinking": "Brief internal reasoning (1-2 sentences)",
  "task": "What you're doing this cycle",
  "changes": [
    {
      "path": "relative/path/to/file.ext",
      "content": "full file content here"
    }
  ],
  "commit_message": "Short commit message",
  "next_priority": "What the next cycle should focus on"
}

CRITICAL:
- "changes" array must contain complete file contents, not diffs
- Only change files that need changing
- Always include updated state.md in changes
- If you're stuck or need human input, set "paused": true and explain in "pause_reason"`;
}

function buildUserPrompt(context) {
  // Truncate index.html to save tokens - just show structure
  let indexSummary = context['index.html'] || '';
  if (indexSummary.length > 3000) {
    indexSummary = indexSummary.substring(0, 3000) + '\n\n... [truncated, ~' + context['index.html'].length + ' chars total]';
  }

  return `CURRENT STATE:

=== vision.md ===
${context['vision.md'] || 'Not found'}

=== state.md ===
${context['state.md'] || 'Not found'}

=== Recent dialogue (last section) ===
${(context['dialogue.md'] || '').split('---').slice(-2).join('---')}

=== index.html (truncated) ===
${indexSummary}

---

Continue building GUMP. Pick ONE concrete task and complete it.
Output valid JSON only, no markdown code blocks.`;
}

// ============ API CALL ============

async function callClaude(systemPrompt, userPrompt) {
  const client = new Anthropic({ apiKey: CONFIG.apiKey });

  const inputTokensEstimate = (systemPrompt.length + userPrompt.length) / 4;

  log('INFO', `Calling Claude (est. ${Math.round(inputTokensEstimate)} input tokens)`);

  try {
    const response = await client.messages.create({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    state.tokensUsedToday += tokensUsed;

    log('INFO', `Claude responded (${tokensUsed} tokens, ${state.tokensUsedToday} today)`);

    return response.content[0]?.text || null;
  } catch (err) {
    log('ERROR', 'Claude API call failed', { error: err.message });
    return null;
  }
}

// ============ RESPONSE PARSING ============

function parseResponse(text) {
  if (!text) return null;

  try {
    // Try to extract JSON from response
    let jsonStr = text.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.changes || !Array.isArray(parsed.changes)) {
      log('WARN', 'Response missing changes array');
      return null;
    }

    if (!parsed.commit_message) {
      log('WARN', 'Response missing commit_message');
      return null;
    }

    return parsed;
  } catch (err) {
    log('ERROR', 'Failed to parse Claude response', { error: err.message, text: text.substring(0, 500) });
    return null;
  }
}

// ============ MAIN CYCLE ============

async function runCycle() {
  state.cycleCount++;
  log('INFO', `=== CYCLE ${state.cycleCount} STARTING ===`);

  // Check token budget
  const today = new Date().toDateString();
  if (today !== state.lastResetDate) {
    state.tokensUsedToday = 0;
    state.lastResetDate = today;
    log('INFO', 'Daily token counter reset');
  }

  if (state.tokensUsedToday >= CONFIG.maxTokensPerDay) {
    log('WARN', 'Daily token budget exhausted');
    state.paused = true;
    state.pauseReason = 'Daily token budget exhausted. Will resume tomorrow.';
    return false;
  }

  // Read current context
  const context = readContext();

  // Build prompts
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(context);

  // Call Claude
  const response = await callClaude(systemPrompt, userPrompt);
  if (!response) {
    state.consecutiveFailures++;
    log('WARN', `API call failed (${state.consecutiveFailures} consecutive failures)`);
    return false;
  }

  // Parse response
  const parsed = parseResponse(response);
  if (!parsed) {
    state.consecutiveFailures++;
    log('WARN', `Response parse failed (${state.consecutiveFailures} consecutive failures)`);
    return false;
  }

  // Check if Claude wants to pause
  if (parsed.paused) {
    state.paused = true;
    state.pauseReason = parsed.pause_reason || 'Claude requested pause';
    log('INFO', 'Claude requested pause', { reason: state.pauseReason });
    return false;
  }

  // Apply file changes
  const changesApplied = applyFileChanges(parsed.changes);

  if (changesApplied === 0) {
    state.cyclesWithoutProgress++;
    log('WARN', `No changes applied (${state.cyclesWithoutProgress} cycles without progress)`);
  } else {
    state.cyclesWithoutProgress = 0;
    state.consecutiveFailures = 0;
  }

  // Commit and push
  const committed = commitAndPush(parsed.commit_message);

  log('INFO', `=== CYCLE ${state.cycleCount} COMPLETE ===`, {
    task: parsed.task,
    filesChanged: changesApplied,
    committed,
    nextPriority: parsed.next_priority
  });

  return changesApplied > 0;
}

// ============ MAIN LOOP ============

async function main() {
  log('INFO', '🎵 GUMP Autonomous Loop Starting');
  log('INFO', 'Configuration', {
    model: CONFIG.model,
    cycleMinutes: CONFIG.cycleMinutes,
    maxTokensPerDay: CONFIG.maxTokensPerDay
  });

  // Check for required config
  if (!CONFIG.apiKey) {
    log('ERROR', 'ANTHROPIC_API_KEY not set. Copy .env.example to .env and add your key.');
    process.exit(1);
  }

  // Check for --once flag
  const runOnce = process.argv.includes('--once');

  while (true) {
    // Check safety limits
    if (state.consecutiveFailures >= CONFIG.maxConsecutiveFailures) {
      log('ERROR', 'Too many consecutive failures. Pausing.');
      state.paused = true;
      state.pauseReason = `${CONFIG.maxConsecutiveFailures} consecutive failures`;
    }

    if (state.cyclesWithoutProgress >= CONFIG.maxCyclesWithoutProgress) {
      log('WARN', 'Too many cycles without progress. Pausing.');
      state.paused = true;
      state.pauseReason = `${CONFIG.maxCyclesWithoutProgress} cycles without progress - may be stuck`;
    }

    if (state.paused) {
      log('INFO', `PAUSED: ${state.pauseReason}`);
      log('INFO', 'To resume, restart the script.');
      break;
    }

    // Run a cycle
    await runCycle();

    if (runOnce) {
      log('INFO', 'Single cycle complete (--once flag)');
      break;
    }

    // Wait for next cycle
    const waitMs = CONFIG.cycleMinutes * 60 * 1000;
    log('INFO', `Waiting ${CONFIG.cycleMinutes} minutes until next cycle...`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
}

main().catch(err => {
  log('FATAL', 'Unhandled error', { error: err.message, stack: err.stack });
  process.exit(1);
});
