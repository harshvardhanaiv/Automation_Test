const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const OLLAMA_URL = config.ollamaUrl;
const MODEL = config.model;

async function fixTest(errorLogs, currentCode, testFilePath = null) {
    console.log(`\n🩹 Attempting to fix the failing test...`);

    const systemPrompt = "You are an expert Playwright automation engineer. Always return only valid TypeScript Playwright test code. Do not include explanations. \n\nVerified Selectors for AIV Application:\n- Username: input[name='username']\n- Password: input[name='password']\n- Login Button: button:has-text('Login')\n- Sidebar: .sidebardiv (important: not .sidebar)\n- Hamburger Menu: button.smenu_button\n- User Profile (to logout): span:has-text('Admin')\n- Logout Button: span:has-text('Logout') or li:has-text('Logout')";
    
    const userPrompt = `
The following Playwright test failed. 

TEST CODE:
${currentCode}

ERROR LOGS:
${errorLogs}

Please fix the test code. Focus on:
1. Fixing unstable selectors (getByRole, getByText preferred).
2. Fixing timing or wait issues.
3. Ensuring assertions are correct.

Return ONLY the full fixed TypeScript code.
    `;

    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false
        });

        let code = response.data.message.content;
        
        // Clean up code markers
        code = code.replace(/```typescript\n?|```\n?/g, '').trim();

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
