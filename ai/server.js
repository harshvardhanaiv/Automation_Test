const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');
const DAILY_DIR = path.join(__dirname, '../tests/daily');
const WORKSPACE_DIR = path.join(__dirname, '..');

// In-memory task store
const tasks = {};

// Helper to generate unique IDs
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Serve static file helper
function serveStaticFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Internal Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

// Helper to parse JSON body
function parseJsonBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            callback(null, data);
        } catch (e) {
            callback(e, null);
        }
    });
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // ── Static Files serving ──────────────────────────────────────────────────
    if (pathname === '/' || pathname === '/index.html') {
        serveStaticFile(path.join(PUBLIC_DIR, 'index.html'), res);
        return;
    }

    // Serve public folder files
    if (pathname.startsWith('/public/')) {
        const relativePath = pathname.substring(8);
        serveStaticFile(path.join(PUBLIC_DIR, relativePath), res);
        return;
    }

    // Serve screenshots
    if (pathname.startsWith('/screenshots/')) {
        const relativePath = pathname.substring(13); // remove '/screenshots/'
        const safePath = path.normalize(path.join(SCREENSHOTS_DIR, relativePath));
        if (safePath.startsWith(SCREENSHOTS_DIR)) {
            serveStaticFile(safePath, res);
        } else {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
        }
        return;
    }

    // ── API: Config ───────────────────────────────────────────────────────────
    if (pathname === '/api/config' && req.method === 'GET') {
        fs.readFile(CONFIG_FILE, 'utf-8', (err, data) => {
            if (err) {
                // If not exists, return default empty config structure
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ provider: 'deepseek' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
        return;
    }

    if (pathname === '/api/config' && req.method === 'POST') {
        parseJsonBody(req, (err, data) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
                return;
            }

            fs.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8', err => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to write config file' }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Configuration saved successfully' }));
                }
            });
        });
        return;
    }

    // ── API: List Tests ───────────────────────────────────────────────────────
    if (pathname === '/api/tests' && req.method === 'GET') {
        const tests = [];

        // 1. Scan tests/daily
        if (fs.existsSync(DAILY_DIR)) {
            const files = fs.readdirSync(DAILY_DIR).filter(f => f.endsWith('.spec.ts'));
            files.forEach(file => {
                tests.push({
                    name: file,
                    path: `tests/daily/${file}`,
                    suite: 'daily',
                });
            });
        }

        // 2. Scan other spec files in tests/
        const rootTestsDir = path.join(__dirname, '../tests');
        if (fs.existsSync(rootTestsDir)) {
            const files = fs.readdirSync(rootTestsDir).filter(f => f.endsWith('.spec.ts'));
            files.forEach(file => {
                tests.push({
                    name: file,
                    path: `tests/${file}`,
                    suite: 'core',
                });
            });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(tests));
        return;
    }

    // ── API: Run Test ─────────────────────────────────────────────────────────
    if (pathname === '/api/run-test' && req.method === 'POST') {
        parseJsonBody(req, (err, data) => {
            if (err || !data.file) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid body, "file" parameter is required' }));
                return;
            }

            const taskId = generateId();
            const mode = data.mode || 'heal'; // 'heal' or 'normal'
            const filename = data.file;

            let cmd = '';
            let args = [];

            if (mode === 'heal') {
                // If it is a specific healed script or general
                if (filename.includes('users-roles')) {
                    cmd = 'node';
                    args = ['ai/users-roles-runner.js'];
                } else if (filename.includes('api-token')) {
                    cmd = 'node';
                    args = ['ai/api-token-runner.js'];
                } else if (filename.includes('merge-reports')) {
                    cmd = 'node';
                    args = ['ai/merge-reports-runner.js'];
                } else if (filename.includes('reports.spec.ts')) {
                    cmd = 'node';
                    args = ['ai/reports-runner.js'];
                } else if (filename.startsWith('tests/daily/') || filename.startsWith('daily/')) {
                    // It is a daily test, we can use daily-runner.js --file
                    const basename = path.basename(filename).replace('.spec.ts', '');
                    cmd = 'node';
                    args = ['ai/daily-runner.js', '--file', basename];
                } else {
                    // General test
                    cmd = 'node';
                    args = ['ai/runner.js', `Run and heal test ${filename}`, filename];
                }
            } else {
                // Normal playwright run
                cmd = 'npx';
                args = ['playwright', 'test', filename, '--project=chromium', '--reporter=list'];
            }

            console.log(`Starting process: ${cmd} ${args.join(' ')}`);

            const child = spawn(cmd, args, {
                cwd: WORKSPACE_DIR,
                shell: true,
                env: { ...process.env, FORCE_COLOR: '1' } // Force color output
            });

            tasks[taskId] = {
                process: child,
                status: 'running',
                command: `${cmd} ${args.join(' ')}`,
                logs: `🚀 Started process: ${cmd} ${args.join(' ')}\n\n`,
                startedAt: new Date().toISOString()
            };

            child.stdout.on('data', chunk => {
                tasks[taskId].logs += chunk.toString();
            });

            child.stderr.on('data', chunk => {
                tasks[taskId].logs += chunk.toString();
            });

            child.on('close', code => {
                tasks[taskId].status = code === 0 ? 'success' : 'failed';
                tasks[taskId].endedAt = new Date().toISOString();
                tasks[taskId].exitCode = code;
                tasks[taskId].logs += `\n\n🏁 Process finished with code ${code}.\n`;
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ taskId }));
        });
        return;
    }

    // ── API: Generate Test ────────────────────────────────────────────────────
    if (pathname === '/api/generate' && req.method === 'POST') {
        parseJsonBody(req, (err, data) => {
            if (err || !data.prompt) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid body, "prompt" is required' }));
                return;
            }

            const taskId = generateId();
            const prompt = data.prompt;
            const targetPath = data.path || 'tests/generated.spec.ts';

            const cmd = 'node';
            const args = ['ai/runner.js', prompt, targetPath];

            console.log(`Starting generation: ${cmd} ${args.join(' ')}`);

            const child = spawn(cmd, args, {
                cwd: WORKSPACE_DIR,
                shell: false,
                env: { ...process.env, FORCE_COLOR: '1' }
            });

            tasks[taskId] = {
                process: child,
                status: 'running',
                command: `${cmd} ${args.join(' ')}`,
                logs: `🤖 Initiated AI generation & self-healing loop for prompt:\n"${prompt}"\n\n`,
                startedAt: new Date().toISOString()
            };

            child.stdout.on('data', chunk => {
                tasks[taskId].logs += chunk.toString();
            });

            child.stderr.on('data', chunk => {
                tasks[taskId].logs += chunk.toString();
            });

            child.on('close', code => {
                tasks[taskId].status = code === 0 ? 'success' : 'failed';
                tasks[taskId].endedAt = new Date().toISOString();
                tasks[taskId].exitCode = code;
                tasks[taskId].logs += `\n\n🏁 AI execution finished with code ${code}.\n`;
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ taskId }));
        });
        return;
    }

    // ── API: Check Task status/logs ───────────────────────────────────────────
    if (pathname === '/api/task' && req.method === 'GET') {
        const taskId = url.searchParams.get('id');
        if (!taskId || !tasks[taskId]) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Task not found' }));
            return;
        }

        const taskCopy = { ...tasks[taskId] };
        delete taskCopy.process;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(taskCopy));
        return;
    }

    // ── API: Stop Task ────────────────────────────────────────────────────────
    if (pathname === '/api/stop-task' && req.method === 'POST') {
        parseJsonBody(req, (err, data) => {
            if (err || !data.taskId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid body, "taskId" is required' }));
                return;
            }

            const task = tasks[data.taskId];
            if (!task) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Task not found' }));
                return;
            }

            if (task.status === 'running' && task.process) {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', task.process.pid, '/f', '/t']);
                } else {
                    task.process.kill();
                }
                task.status = 'cancelled';
                task.endedAt = new Date().toISOString();
                task.logs += `\n\n⛔ Test execution stopped by user.\n`;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Task stopped successfully' }));
        });
        return;
    }

    // Helper to recursively list files in directory
    function getFilesRecursive(dir, rootDir = dir) {
        let results = [];
        if (!fs.existsSync(dir)) return results;
        
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat && stat.isDirectory()) {
                results = results.concat(getFilesRecursive(filePath, rootDir));
            } else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(file)) {
                const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
                results.push({
                    name: file,
                    relativePath: relPath,
                    url: `/screenshots/${relPath}`,
                    mtime: stat.mtime
                });
            }
        });
        return results;
    }

    // ── API: List Screenshots ─────────────────────────────────────────────────
    if (pathname === '/api/screenshots' && req.method === 'GET') {
        if (!fs.existsSync(SCREENSHOTS_DIR)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
            return;
        }

        try {
            const images = getFilesRecursive(SCREENSHOTS_DIR)
                .sort((a, b) => b.mtime - a.mtime); // Newest first

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(images));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to read screenshots recursively: ' + err.message }));
        }
        return;
    }

    // ── Fallback: 404 ─────────────────────────────────────────────────────────
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
});

// Start Server
server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Playwright AI Dashboard running at http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});
