const fs = require('fs');
const path = require('path');
const { SYSTEM_PROMPT } = require('./systemPrompt');
const { callLLM } = require('./llmHelper');

async function generateTest(prompt, testFilePath = null) {
    console.log(`\n🤖 Generating test for: "${prompt}"...`);

    try {
        const finalTestPath = testFilePath || path.join(__dirname, '../tests/generated.spec.ts');
        const helpersPath = path.join(__dirname, '../tests/helpers');
        let relativeHelpersPath = path.relative(path.dirname(finalTestPath), helpersPath).replace(/\\/g, '/');
        if (!relativeHelpersPath.startsWith('.')) {
            relativeHelpersPath = './' + relativeHelpersPath;
        }

        const adjustedSystemPrompt = SYSTEM_PROMPT.replace(/\.\.\/helpers/g, relativeHelpersPath);

        const userPrompt = `Generate a Playwright test script for: ${prompt}. Use async/await and standard Playwright assertions. Import helpers from '${relativeHelpersPath}'.`;
        let code = await callLLM(adjustedSystemPrompt, userPrompt);
        
        code = code.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();

        const testsDir = path.dirname(finalTestPath);
        if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true });

        fs.writeFileSync(finalTestPath, code);
        console.log(`✅ Test generated successfully at: ${finalTestPath}`);
        return finalTestPath;
    } catch (error) {
        console.error('❌ Error generating test:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    const prompt = process.argv[2] || 'Open google.com';
    const customPath = process.argv[3] ? path.resolve(process.argv[3]) : null;
    generateTest(prompt, customPath);
}

module.exports = generateTest;

