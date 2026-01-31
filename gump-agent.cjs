#!/usr/bin/env node
/**
 * GumpOrchestra Agent - Direct Groq API Client with File Editing
 * A lightweight AI agent for GUMP (Grand Unified Music Project)
 *
 * Capabilities:
 * - Music theory expertise
 * - Code generation and editing
 * - File read/write operations
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.error('Error: GROQ_API_KEY environment variable not set');
    console.error('Get your key at: https://console.groq.com/keys');
    process.exit(1);
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are GumpOrchestra, an AI agent specialized in building GUMP (Grand Unified Music Project).

## Mission
Generate music from a user's real-world experience in real-time using predictive modeling and AI.

## Expertise
- **Music Theory**: Deep understanding of all known musical theories, modes, scales, and harmonic systems
- **Rhythm**: Mastery of rhythms across all styles and cultures worldwide (African polyrhythms, Indian tala, Brazilian samba, etc.)
- **Psychoacoustics**: How sound affects human perception and emotion
- **Generative Music**: Real-time algorithmic composition
- **Motion-Music Mapping**: Converting physical movement to musical expression
- **Web Audio API**: Browser-based audio synthesis and processing

## Key Principles
1. Music ALWAYS plays - AI enhances but never gates playback
2. Motion parameters should modulate musical characteristics (density, complexity, energy)
3. Cultural awareness - rhythms and scales from around the world
4. Real-time responsiveness - no perceptible latency
5. Evolution - music should develop into unknown territory over time

## File Operations
You can read and edit files using special commands:
- READ: file_path - Read a file's contents
- WRITE: file_path - Write content to a file (provide content after the command)
- EDIT: file_path - Replace specific text in a file

When editing code:
- Focus on Web Audio API patterns
- Keep solutions elegant and performant
- Preserve the layered architecture (Core → Input → AI → Evolution)
- Test mentally before suggesting changes

## Output Format
Keep responses concise and actionable. When suggesting code changes, be specific about what to change and where.`;

// File operation functions
function readFile(filePath) {
    try {
        const resolved = path.resolve(filePath);
        const content = fs.readFileSync(resolved, 'utf8');
        return { success: true, content, path: resolved };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function writeFile(filePath, content) {
    try {
        const resolved = path.resolve(filePath);
        fs.writeFileSync(resolved, content, 'utf8');
        return { success: true, path: resolved };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function editFile(filePath, oldText, newText) {
    try {
        const resolved = path.resolve(filePath);
        let content = fs.readFileSync(resolved, 'utf8');
        if (!content.includes(oldText)) {
            return { success: false, error: 'Old text not found in file' };
        }
        content = content.replace(oldText, newText);
        fs.writeFileSync(resolved, content, 'utf8');
        return { success: true, path: resolved };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// Parse file commands from AI response
function parseFileCommands(response) {
    const commands = [];

    // READ: pattern
    const readMatches = response.matchAll(/READ:\s*(.+?)(?:\n|$)/gi);
    for (const match of readMatches) {
        commands.push({ type: 'read', path: match[1].trim() });
    }

    // WRITE: pattern (expects content block after)
    const writeMatches = response.matchAll(/WRITE:\s*(.+?)\n```[\w]*\n([\s\S]*?)\n```/gi);
    for (const match of writeMatches) {
        commands.push({ type: 'write', path: match[1].trim(), content: match[2] });
    }

    // EDIT: pattern (expects old/new blocks)
    const editMatches = response.matchAll(/EDIT:\s*(.+?)\nOLD:\n```[\w]*\n([\s\S]*?)\n```\nNEW:\n```[\w]*\n([\s\S]*?)\n```/gi);
    for (const match of editMatches) {
        commands.push({
            type: 'edit',
            path: match[1].trim(),
            oldText: match[2],
            newText: match[3]
        });
    }

    return commands;
}

// Execute file commands
function executeCommands(commands) {
    const results = [];
    for (const cmd of commands) {
        if (cmd.type === 'read') {
            const result = readFile(cmd.path);
            results.push({ ...cmd, ...result });
        } else if (cmd.type === 'write') {
            const result = writeFile(cmd.path, cmd.content);
            results.push({ ...cmd, ...result });
        } else if (cmd.type === 'edit') {
            const result = editFile(cmd.path, cmd.oldText, cmd.newText);
            results.push({ ...cmd, ...result });
        }
    }
    return results;
}

async function chat(message, conversationHistory = [], autoExecute = false) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: message }
    ];

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse and optionally execute file commands
        const commands = parseFileCommands(content);
        let commandResults = null;

        if (commands.length > 0 && autoExecute) {
            commandResults = executeCommands(commands);
        }

        return { content, commands, commandResults };
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

async function interactive() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🎵 GumpOrchestra Agent v2');
    console.log('Music theory & code editing expert');
    console.log('Commands: exit, read <file>, exec (auto-execute file ops)');
    console.log('');

    const history = [];
    let autoExec = false;

    const prompt = () => {
        rl.question('You: ', async (input) => {
            const trimmed = input.trim();

            if (trimmed.toLowerCase() === 'exit') {
                console.log('Goodbye!');
                rl.close();
                return;
            }

            if (trimmed.toLowerCase() === 'exec') {
                autoExec = !autoExec;
                console.log(`Auto-execute file operations: ${autoExec ? 'ON' : 'OFF'}\n`);
                prompt();
                return;
            }

            if (trimmed.toLowerCase().startsWith('read ')) {
                const filePath = trimmed.slice(5).trim();
                const result = readFile(filePath);
                if (result.success) {
                    console.log(`\n--- ${result.path} ---`);
                    console.log(result.content.slice(0, 2000));
                    if (result.content.length > 2000) console.log('... (truncated)');
                    console.log('---\n');
                } else {
                    console.log(`Error: ${result.error}\n`);
                }
                prompt();
                return;
            }

            if (!trimmed) {
                prompt();
                return;
            }

            const result = await chat(trimmed, history, autoExec);

            if (result) {
                history.push({ role: 'user', content: trimmed });
                history.push({ role: 'assistant', content: result.content });

                console.log(`\nGumpOrchestra: ${result.content}\n`);

                if (result.commands.length > 0) {
                    console.log(`[Detected ${result.commands.length} file operation(s)]`);
                    if (result.commandResults) {
                        for (const r of result.commandResults) {
                            console.log(`  ${r.type}: ${r.path} - ${r.success ? 'OK' : r.error}`);
                        }
                    } else {
                        console.log('  (Use "exec" to enable auto-execution)');
                    }
                    console.log('');
                }
            }

            prompt();
        });
    };

    prompt();
}

// Single query mode
async function singleQuery(message) {
    console.log('🎵 GumpOrchestra Agent\n');
    const result = await chat(message, [], true);
    if (result) {
        console.log(result.content);
        if (result.commandResults && result.commandResults.length > 0) {
            console.log('\n[File operations executed]');
            for (const r of result.commandResults) {
                console.log(`  ${r.type}: ${r.path} - ${r.success ? 'OK' : r.error}`);
            }
        }
    }
}

// Main entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        singleQuery(args.join(' '));
    } else {
        interactive();
    }
}

module.exports = { chat, readFile, writeFile, editFile, SYSTEM_PROMPT };
