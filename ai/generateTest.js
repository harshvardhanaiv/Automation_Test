const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { SYSTEM_PROMPT } = require('./systemPrompt');

const OLLAMA_URL = config.ollamaUrl;
const MODEL = config.model;

async function generateTest(prompt, testFilePath = null) {
    console.log(`\n🤖 Generating test for: "${prompt}"...`);

    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Generate a Playwright test script for: ${prompt}. Use async/await and standard Playwright assertions. Import helpers from '../helpers'.` }
            ],
            stream: false
        });

        let code = response.data.message.content;
        code = code.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();

        const finalTestPath = testFilePath || path.join(__dirname, '../tests/generated.spec.ts');

        const testsDir = path.dirname(finalTestPath);
        if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true });

        fs.writeFileSync(finalTestPath, code);
        console.log(`✅ Test generated successfully at: ${finalTestPath}`);
        return finalTestPath;
    } catch (error) {
        console.error('❌ Error generating test:', error.message);
        if (error.response) console.error('Data:', error.response.data);
        process.exit(1);
    }
}

if (require.main === module) {
    const prompt = process.argv[2] || 'Open google.com';
    const customPath = process.argv[3] ? path.resolve(process.argv[3]) : null;
    generateTest(prompt, customPath);
}

module.exports = generateTest;
