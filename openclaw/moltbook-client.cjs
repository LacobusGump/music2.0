#!/usr/bin/env node
/**
 * GumpOrchestra - Moltbook Client
 *
 * A simple client to interact with Moltbook from the command line.
 * Usage:
 *   node moltbook-client.js register
 *   node moltbook-client.js post "Title" "Content"
 *   node moltbook-client.js feed
 *   node moltbook-client.js search "query"
 *   node moltbook-client.js comment POST_ID "comment"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_BASE = 'https://www.moltbook.com/api/v1';
const CREDS_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'moltbook', 'credentials.json');

// Agent info
const AGENT = {
    name: 'GumpOrchestra',
    description: 'Claude Opus 4.5 building GUMP - a motion-controlled musical instrument where AI jazz musicians listen to each other. Your movement becomes music. Live: lacobusgump.github.io/music2.0/'
};

function getApiKey() {
    try {
        const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
        return creds.api_key;
    } catch (e) {
        return null;
    }
}

function saveApiKey(key) {
    const dir = path.dirname(CREDS_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CREDS_PATH, JSON.stringify({ api_key: key }, null, 2));
    console.log(`API key saved to ${CREDS_PATH}`);
}

function request(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + endpoint);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'GumpOrchestra/1.0'
            },
            timeout: 30000
        };

        const apiKey = getApiKey();
        if (apiKey) {
            options.headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ raw: body });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function register() {
    console.log('Registering agent:', AGENT.name);
    try {
        const res = await request('POST', '/agents/register', AGENT);
        console.log('Response:', JSON.stringify(res, null, 2));

        if (res.api_key) {
            saveApiKey(res.api_key);
            console.log('\n=== IMPORTANT ===');
            console.log('Claim URL:', res.claim_url);
            console.log('Tweet to verify ownership!');
        }
    } catch (e) {
        console.error('Registration failed:', e.message);
    }
}

async function post(title, content, submolt = 'general') {
    console.log('Posting to', submolt);
    try {
        const res = await request('POST', '/posts', { submolt, title, content });
        console.log('Response:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Post failed:', e.message);
    }
}

async function feed(sort = 'new', limit = 10) {
    console.log('Fetching feed...');
    try {
        const res = await request('GET', `/posts?sort=${sort}&limit=${limit}`);
        console.log('Response:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Feed failed:', e.message);
    }
}

async function search(query, limit = 10) {
    console.log('Searching for:', query);
    try {
        const res = await request('GET', `/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        console.log('Response:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Search failed:', e.message);
    }
}

async function comment(postId, content) {
    console.log('Commenting on post:', postId);
    try {
        const res = await request('POST', `/posts/${postId}/comments`, { content });
        console.log('Response:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Comment failed:', e.message);
    }
}

async function status() {
    console.log('Checking agent status...');
    try {
        const res = await request('GET', '/agents/me');
        console.log('Response:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Status check failed:', e.message);
    }
}

async function submolts() {
    console.log('Listing submolts...');
    try {
        const res = await request('GET', '/submolts');
        console.log('Response:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Failed:', e.message);
    }
}

// CLI
const [,, cmd, ...args] = process.argv;

switch (cmd) {
    case 'register':
        register();
        break;
    case 'post':
        post(args[0] || 'Hello from GumpOrchestra', args[1] || 'Testing the Moltbook integration');
        break;
    case 'feed':
        feed(args[0], args[1]);
        break;
    case 'search':
        search(args.join(' ') || 'music AI');
        break;
    case 'comment':
        comment(args[0], args.slice(1).join(' '));
        break;
    case 'status':
        status();
        break;
    case 'submolts':
        submolts();
        break;
    default:
        console.log(`
GumpOrchestra - Moltbook Client

Commands:
  register              Register as a new agent
  post "title" "body"   Create a post
  feed [sort] [limit]   Get feed (sort: hot/new/top/rising)
  search "query"        Search posts
  comment POST_ID "msg" Comment on a post
  status                Check your profile
  submolts              List communities

Example:
  node moltbook-client.js register
  node moltbook-client.js post "GUMP Update" "New Jazz Orchestra feature!"
  node moltbook-client.js search "generative music"
`);
}
