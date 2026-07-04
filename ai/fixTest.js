const fs = require('fs');
const path = require('path');
const { FIX_SYSTEM_PROMPT } = require('./systemPrompt');
const { callLLM } = require('./llmHelper');

async function fixTest(errorLogs, currentCode, testFilePath = null) {
    console.log(`\n🩹 Attempting to fix the failing test...`);

    const finalTestPath = testFilePath || path.join(__dirname, '../tests/generated.spec.ts');
    const helpersPath = path.join(__dirname, '../tests/helpers');
    let relativeHelpersPath = path.relative(path.dirname(finalTestPath), helpersPath).replace(/\\/g, '/');
    if (!relativeHelpersPath.startsWith('.')) {
        relativeHelpersPath = './' + relativeHelpersPath;
    }

    const adjustedSystemPrompt = FIX_SYSTEM_PROMPT.replace(/\.\.\/helpers/g, relativeHelpersPath);

    const userPrompt = `The following Playwright test failed.

TEST CODE:
${currentCode}

ERROR LOGS:
${errorLogs}

Fix the test. Return ONLY the complete corrected TypeScript file. Import helpers from '${relativeHelpersPath}'.`;

    try {
        let code = await callLLM(adjustedSystemPrompt, userPrompt);
        code = code.replace(/^```(?:typescript|ts)?\n?/m, '').replace(/\n?```\s*$/m, '').trim();

        fs.writeFileSync(finalTestPath, code);

        console.log(`✅ Test fixed and saved at: ${finalTestPath}`);
        return finalTestPath;
    } catch (error) {
        console.error('❌ Error fixing test:', error.message);
        throw error;
    }
}

module.exports = fixTest;

