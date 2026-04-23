const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const OLLAMA_URL = config.ollamaUrl;
const MODEL = config.model;

async function generateTest(prompt, testFilePath = null) {
    console.log(`\n🤖 Generating test for: "${prompt}"...`);

    const systemPrompt = "You are an expert Playwright automation engineer. Always return only valid TypeScript Playwright test code. Do not include explanations. \n\nVerified Selectors for AIV Application:\n- Username: input[name='username']\n- Password: input[name='password']\n- Login Button: button:has-text('Login')\n- Sidebar: .sidebardiv (important: not .sidebar)\n- Hamburger Menu: button.smenu_button\n- User Profile (to logout): span:has-text('Admin')\n- Logout Button: span:has-text('Logout') or li:has-text('Logout')";
    
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a Playwright test script for: ${prompt}. Use async/await and standard Playwright assertions.` }
            ],
            stream: false
        });

        let code = response.data.message.content;
        
        // Clean up code markers if present (e.g. ```typescript or ```)
        code = code.replace(/```typescript\n?|```\n?/g, '').trim();

        const finalTestPath = testFilePath || path.join(__dirname, '../tests/generated.spec.ts');
        
        // Ensure directory exists
        const testsDir = path.dirname(finalTestPath);
        if (!fs.existsSync(testsDir)) {
            fs.mkdirSync(testsDir, { recursive: true });
        }

        fs.writeFileSync(finalTestPath, code);
        console.log(`✅ Test generated successfully at: ${finalTestPath}`);
        return finalTestPath;
    } catch (error) {
        console.error('❌ Error generating test:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

// Allow running from command line
if (require.main === module) {
    const prompt = process.argv[2] || 'Open google.com';
    const customPath = process.argv[3] ? path.resolve(process.argv[3]) : null;
    generateTest(prompt, customPath);
}

module.exports = generateTest;
