const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { FIX_SYSTEM_PROMPT } = require('./systemPrompt');

const OLLAMA_URL = config.ollamaUrl;
const MODEL = config.model;

async function fixTest(errorLogs, currentCode, testFilePath = null) {
    console.log(`\n🩹 Attempting to fix the failing test...`);

    const userPrompt = `The following Playwright test failed.

TEST CODE:
${currentCode}

ERROR LOGS:
${errorLogs}

Fix the test. Return ONLY the complete corrected TypeScript file.`;

    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: FIX_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            stream: false
        });

        let code = response.data.message.content;
        code = code.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();

        const finalTestPath = testFilePath || path.join(__dirname, '../tests/generated.spec.ts');
        fs.writeFileSync(finalTestPath, code);

        console.log(`✅ Test fixed and saved at: ${finalTestPath}`);
        return finalTestPath;
    } catch (error) {
        console.error('❌ Error fixing test:', error.message);
        throw error;
    }
}

module.exports = fixTest;
