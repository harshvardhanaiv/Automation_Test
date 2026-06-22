const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

const OLLAMA_URL = config.ollamaUrl;
const MODEL = config.model;

const SECTIONS = [
    {
        name: 'introduction',
        title: 'Introduction',
        screenshotPrefixes: ['reports-daily-01', 'reports-daily-02', 'reports-daily-03', 'reports-daily-04', 'reports-daily-05', 'reports-daily-06', 'reports-daily-07', 'reports-daily-08', 'reports-daily-09'],
        additionalScreenshots: [
            {
                testCase: "Accessing the Reports section from the sidebar navigation menu",
                screenshot: "reports-navigation-menu.png",
                screenshotPath: "screenshots/documents/reports/reports-navigation-menu.png"
            }
        ]
    },
    {
        name: 'parameter',
        title: 'Parameter Tab',
        screenshotPrefixes: ['reports-daily-10', 'reports-daily-11', 'reports-daily-12'],
        additionalScreenshots: [
            {
                testCase: "Accessing the Reports section from the sidebar navigation menu",
                screenshot: "reports-navigation-menu.png",
                screenshotPath: "screenshots/documents/reports/reports-navigation-menu.png"
            },
            {
                testCase: "Scheduler Parameter Tab showing input fields",
                screenshot: "reports-parameter-tab.png",
                screenshotPath: "screenshots/documents/reports/reports-parameter-tab.png"
            }
        ]
    },
    {
        name: 'rightnow',
        title: 'Schedule Reports by Time - Right Now',
        screenshotPrefixes: ['reports-daily-10', 'reports-daily-11', 'reports-daily-12', 'reports-daily-13', 'reports-daily-14', 'reports-daily-23', 'reports-daily-25'],
        additionalScreenshots: [
            {
                testCase: "Accessing the Reports section from the sidebar navigation menu",
                screenshot: "reports-navigation-menu.png",
                screenshotPath: "screenshots/documents/reports/reports-navigation-menu.png"
            },
            {
                testCase: "Executed report output displayed in a new browser tab",
                screenshot: "reports-rightnow-executed-newtab.png",
                screenshotPath: "screenshots/documents/reports/reports-rightnow-executed-newtab.png"
            }
        ]
    }
];

// Helper to ask Ollama
async function callOllama(systemPrompt, userPrompt) {
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false
        });
        return response.data.message.content.trim();
    } catch (error) {
        console.error('❌ Ollama API Error:', error.message);
        throw error;
    }
}

// Concurrency-limiting helper
async function runWithConcurrency(tasks, limit) {
    const results = [];
    const executing = [];
    for (const task of tasks) {
        const p = Promise.resolve().then(() => task());
        results.push(p);
        if (limit <= tasks.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(results);
}

async function processSection(section, stepLogs) {
    console.log(`🚀 Starting generation for Section: ${section.title} (${section.name})`);

    // 1. Load official markdown
    const officialPath = path.join(process.cwd(), 'docs/official-markdown', `${section.name}.md`);
    let officialContent = 'No official documentation found.';
    if (fs.existsSync(officialPath)) {
        officialContent = fs.readFileSync(officialPath, 'utf8');
        // Strip markdown image references to prevent LLM from hallucinating/copying webp paths
        officialContent = officialContent.replace(/!\[.*?\]\(.*?\)/g, '');
    }

    // 2. Filter step logs for screenshots relevant to this section
    const relevantSteps = stepLogs.filter(step => {
        return section.screenshotPrefixes.some(prefix => step.screenshot.startsWith(prefix));
    });

    // Merge with section-specific custom screenshots
    const combinedSteps = [
        ...(section.additionalScreenshots || []),
        ...relevantSteps
    ];

    const isIntroduction = section.name === 'introduction';

    // 3. Call Ollama to Generate Detailed Step Document
    const docSystemPrompt = `You are a professional technical writer and training specialist for AIV (Analytics Intelligence Visualization).
Your job is to generate an exceptionally clear, detailed, and highly structured user guide in Markdown format for the AIV Reports section: "${section.title}".
Your target audience consists of absolute beginners and novice users who need explicit, easy-to-follow instructions.

Guidelines:
1. Document Structure:
   - Start with a clear header title: "# [Feature Title]"
   - **Introduction**: Provide a short, user-friendly, descriptive introduction explaining what this feature/section does and its purpose, based on the provided "Official Documentation Reference".
   - **Objectives & Use Cases**: Detail the specific objectives and a practical, real-world use case for this feature, using information from the "Official Documentation Reference".
   - **Prerequisites**: Include a "Prerequisites" section ONLY if there are specific design files (like BIRT report files, e.g., Order details.rptdesign) that the user needs to upload or prepare before executing the steps. Do NOT include generic prerequisites such as "Ensure you have a valid account", "Log into the system", or "Familiarize yourself with the layout". If there are no specific file/data prerequisites, omit the Prerequisites section entirely.
   
   ${isIntroduction ? `
   - **Interface Layout & Navigation Guide**: Instead of numbered configuration steps, provide a structured interface component layout guide that walks the user through:
     1. **Accessing the Reports Section**: Explain how to navigate to Reports via the sidebar menu (Reference screenshot: "reports-navigation-menu.png").
     2. **The Reports Listing Grid**: Describe the main file browser interface where reports are listed (Reference screenshot: "reports-daily-01-page.png").
     3. **Quick Filter Stats Toolbar**: Describe the status filter bar at the top of the grid displaying stats counters (Reference screenshot: "reports-daily-02-stats.png").
     4. **Right-Click Action Menu**: Describe how right-clicking on a report row opens the actions context menu (Reference screenshot: "reports-daily-08-context-menu.png").
     For each of these 4 components, write detailed descriptive paragraphs explaining their purpose and function, followed by its corresponding screenshot reference.
   ` : `
   - **Step-by-Step Guide**: Break down every action sequence into explicit, numbered steps. For each numbered step, provide:
     - A bold, action-oriented step title (e.g. "**Step X: Select the Output Format**").
     - **Action**: Explain exactly what the user needs to do in plain English. Reference specific UI elements like inputs, dropdowns, check-boxes, and buttons in bold (e.g., "click the **Run** button", "fill in the **Enter Static Name** field with a report name").
     - **Details**: Explain why this option is being set and what the expected result is.
     - **Visual Reference**: Immediately follow with the corresponding screenshot using this exact markdown image syntax:
       \`![Description of Action](../../../../screenshots/documents/reports/<filename.png>)\`
   `}

2. Visual References / Screenshots:
   - You MUST ONLY reference filename strings that are explicitly present in the provided "Live Application Step Logs & Screenshots Database" below. Do NOT hallucinate or make up filenames (such as "newtab.bc2b84d9_ZPwQcr.webp" or other webp file paths) if they are not listed in the database.
   - Every screenshot reference must use this exact format: \`![Description of Action](../../../../screenshots/documents/reports/<filename.png>)\`

3. Avoid any QA jargon, dry checklists, or generic headings like "What is happening?", "Why?", "What is expected?". Write in fluid, natural, explanatory prose.
4. Use markdown tables, lists, and note callouts (using blockquotes \`> [!NOTE]\` or \`> [!TIP]\`) to organize information clearly.
5. NO Generic Documentation Links: Do NOT include any links referring the user to other or general documentation (e.g., do NOT add links like "[AIV Documentation](../../../common/docs)" or generic external URLs).
6. NO Wrapping Up or Conclusions: Do NOT add a wrapping up statement, conclusion, next steps, summary, or an "Additional Resources" section at the end. End the document immediately after the final step.

Output ONLY the Markdown content. Do not wrap the entire output in markdown code blocks.`;

    const docUserPrompt = `Official Documentation Reference:
---
${officialContent}
---

Live Application Step Logs & Screenshots Database:
---
${JSON.stringify(combinedSteps, null, 2)}
---

Please generate the detailed novice-friendly user guide.`;

    try {
        const generatedDoc = await callOllama(docSystemPrompt, docUserPrompt);
        const genFilePath = path.join(process.cwd(), 'docs/generated/documents/report', `${section.name}_detailed.md`);
        const genDir = path.dirname(genFilePath);
        if (!fs.existsSync(genDir)) fs.mkdirSync(genDir, { recursive: true });
        fs.writeFileSync(genFilePath, generatedDoc);
        console.log(`🎉 Success! Detailed User Guide saved: ${genFilePath}`);
    } catch (e) {
        console.error(`❌ Failed to generate detailed user guide for ${section.name}:`, e.message);
    }
}

async function runPipeline() {
    const stepLogPath = path.join(process.cwd(), 'screenshots/documents/reports/step-log.json');
    if (!fs.existsSync(stepLogPath)) {
        console.error(`❌ Step log not found at: ${stepLogPath}`);
        process.exit(1);
    }
    const stepLogs = JSON.parse(fs.readFileSync(stepLogPath, 'utf8'));

    console.log(`🤖 Starting Parallel Detailed Documentation Generation Pipeline (concurrency limit: 2)...`);

    const tasks = SECTIONS.map(section => () => processSection(section, stepLogs));

    await runWithConcurrency(tasks, 2);

    console.log(`\n🎉 All detailed documents generated successfully!`);
}

runPipeline();
