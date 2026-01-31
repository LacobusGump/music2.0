#!/usr/bin/env node
/**
 * GumpOrchestra Agent - Direct Groq API Client
 * A lightweight AI agent for GUMP (Grand Unified Music Project)
 *
 * Uses Kimi via Groq for music theory expertise
 */

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
- **Music Theory**: Deep understanding of all known musical theories and sub-theories
- **Rhythm**: Mastery of rhythms across all styles and cultures worldwide
- **Psychoacoustics**: How sound affects human perception and emotion
- **Generative Music**: Real-time algorithmic composition
- **Motion-Music Mapping**: Converting physical movement to musical expression
- **Web Audio API**: Browser-based audio synthesis and processing

## Key Principles
1. Music ALWAYS plays - AI enhances but never gates playback
2. Motion parameters should modulate musical characteristics (density, complexity, energy)
3. Cultural awareness - rhythms and scales from around the world
4. Real-time responsiveness - no perceptible latency

## Output Format
When suggesting code, focus on Web Audio API patterns. Keep responses concise and actionable.`;

async function chat(message, conversationHistory = []) {
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
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

async function main() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🎵 GumpOrchestra Agent');
    console.log('Music theory & generative audio expert');
    console.log('Type your questions or "exit" to quit\n');

    const history = [];

    const prompt = () => {
        rl.question('You: ', async (input) => {
            const trimmed = input.trim();

            if (trimmed.toLowerCase() === 'exit') {
                console.log('Goodbye!');
                rl.close();
                return;
            }

            if (!trimmed) {
                prompt();
                return;
            }

            const response = await chat(trimmed, history);

            if (response) {
                history.push({ role: 'user', content: trimmed });
                history.push({ role: 'assistant', content: response });
                console.log(`\nGumpOrchestra: ${response}\n`);
            }

            prompt();
        });
    };

    prompt();
}

// Handle command line argument for single query
async function singleQuery(message) {
    console.log('🎵 GumpOrchestra Agent\n');
    const response = await chat(message);
    if (response) {
        console.log(response);
    }
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        // Single query mode: node gump-agent.cjs "your question"
        singleQuery(args.join(' '));
    } else {
        main();
    }
}

module.exports = { chat, SYSTEM_PROMPT };
