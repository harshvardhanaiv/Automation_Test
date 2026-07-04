const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const generateTest = require('./generateTest');
const fixTest = require('./fixTest');

const MAX_RETRIES = 3;
const TEST_PATH = path.join(__dirname, '../tests/generated.spec.ts');

function runCommandLive(command, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, { cwd, shell: true });
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', chunk => {
            const str = chunk.toString();
            stdout += str;
            process.stdout.write(str);
        });

        child.stderr.on('data', chunk => {
            const str = chunk.toString();
            stderr += str;
            process.stderr.write(str);
        });

        child.on('close', code => {
            if (code === 0) {
                resolve(stdout);
            } else {
                const error = new Error(`Command failed with code ${code}`);
                error.stdout = stdout;
                error.stderr = stderr;
                reject(error);
            }
        });
    });
}

async function runLoop(prompt, testFilePath = null) {
    const finalTestPath = testFilePath || path.join(__dirname, '../tests/generated.spec.ts');
    console.log(`\n📂 Current Directory: ${process.cwd()}`);
    
    // 1. Initial Generation
    await generateTest(prompt, finalTestPath);

    let currentTry = 0;
    let passed = false;

    while (currentTry < MAX_RETRIES && !passed) {
        currentTry++;
        console.log(`\n🚀 Final Execution #${currentTry} for ${path.basename(finalTestPath)}...`);

        try {
            // Run Playwright test
            // Using relative path and quoting for Windows compatibility
            const relativePath = path.relative(process.cwd(), finalTestPath).replace(/\\/g, '/');
            const command = `npx playwright test "${relativePath}" --project=chromium --reporter=list`;
            console.log(`\n🛠️  Executing: ${command}`);

            const output = await runCommandLive(command, process.cwd());

            console.log(output);
            console.log(`\n🎉 Success! Test passed on try #${currentTry}.`);
            passed = true;
        } catch (error) {
            console.error(`\n🔴 Test Failed on try #${currentTry}.`);
            
            const stdout = error.stdout ? error.stdout.toString() : '';
            const stderr = error.stderr ? error.stderr.toString() : '';
            const fullLogs = `${stdout}\n${stderr}`;

            console.log('--- ERROR LOGS ---');
            console.log(fullLogs);
            console.log('------------------');

            if (currentTry < MAX_RETRIES) {
                const currentCode = fs.readFileSync(finalTestPath, 'utf-8');
                await fixTest(fullLogs, currentCode, finalTestPath);
            } else {
                console.error(`\n❌ Max retries reached. System could not self-heal.`);
            }
        }
    }

    return passed;
}

// CLI Entry Point
if (require.main === module) {
    const promptInput = process.argv[2];
    const customPath = process.argv[3] ? path.resolve(process.argv[3]) : null;

    if (!promptInput) {
        console.error('Usage: node ai/runner.js "User prompt description" [optional/test/path.spec.ts]');
        process.exit(1);
    }

    runLoop(promptInput, customPath).then(passed => {
        if (!passed) process.exit(1);
    }).catch(err => {
        console.error('Fatal Error:', err);
        process.exit(1);
    });
}

module.exports = runLoop;
