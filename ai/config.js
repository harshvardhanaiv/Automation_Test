/**
 * Shared configuration for the AI-powered Playwright framework.
 * Update credentials and URLs here — do not hardcode them elsewhere.
 */

const config = {
    // Application
    baseUrl: 'https://aiv.test.oneaiv.com:8086/aiv/',
    credentials: {
        username: 'Admin',
        password: 'Ganesh04',
    },

    // Ollama LLM
    ollamaUrl: 'http://localhost:11434/api/chat',
    model: 'qwen2.5-coder',

    // Paths
    crawlResultPath: require('path').join(__dirname, 'crawl-result.json'),
    generatedTestPath: require('path').join(__dirname, '../tests/generated.spec.ts'),
    exploreTestPath: require('path').join(__dirname, '../tests/explore.spec.ts'),
    screenshotsDir: require('path').join(__dirname, '../screenshots'),

    // Self-healing
    maxRetries: 3,

    // Known stable selectors for AIV application
    selectors: {
        usernameInput: "input[name='username']",
        passwordInput: "input[name='password']",
        loginButton: "button:has-text('Login')",
        sidebar: '.sidebardiv',
        hamburgerMenu: 'button.smenu_button',
        userProfile: "span:has-text('Admin')",
        logoutButton: "span:has-text('Logout')",
        searchBox: "input[placeholder='Search files and folders in All sections']",
    },
};

module.exports = config;
