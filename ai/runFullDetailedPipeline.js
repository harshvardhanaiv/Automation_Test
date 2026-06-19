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
        screenshotPrefixes: ['reports-daily-01', 'reports-daily-02', 'reports-daily-03', 'reports-daily-04', 'reports-daily-05', 'reports-daily-06', 'reports-daily-07', 'reports-daily-08', 'reports-daily-09']
    },
    {
        name: 'parameter',
        title: 'Parameter Tab',
        screenshotPrefixes: ['reports-daily-10', 'reports-daily-11', 'reports-daily-12']
    },
    {
        name: 'output',
        title: 'Output Tab',
        screenshotPrefixes: ['reports-daily-17', 'reports-daily-18', 'reports-daily-19', 'reports-daily-22', 'reports-daily-23', 'reports-daily-24', 'reports-daily-25']
    },
    {
        name: 'email',
        title: 'Email Tab',
        screenshotPrefixes: ['reports-daily-20', 'reports-daily-21']
    },
    {
        name: 'hide_grid_reportexport',
        title: 'Hide Grid in Report Export',
        screenshotPrefixes: ['reports-daily-17', 'reports-daily-18', 'reports-daily-19']
    },
    {
        name: 'hide_report_options',
        title: 'Hide Report Options',
        screenshotPrefixes: ['reports-daily-08', 'reports-daily-09']
    },
    {
        name: 'single_sheet_option',
        title: 'Single Sheet Option',
        screenshotPrefixes: ['reports-daily-17', 'reports-daily-18', 'reports-daily-19']
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
    }

    // 2. Filter step logs for screenshots relevant to this section
    const relevantSteps = stepLogs.filter(step => {
        return section.screenshotPrefixes.some(prefix => step.screenshot.startsWith(prefix));
    });

    // 3. Call Ollama to Generate Detailed Step Document
    const docSystemPrompt = `You are a professional technical writer and training specialist for AIV (Analytics Intelligence Visualization).
Your job is to generate an exceptionally clear, detailed, and highly structured step-by-step user guide in Markdown format for the AIV Reports section: "${section.title}".
Your target audience consists of absolute beginners and novice users who need explicit, easy-to-follow instructions.

Guidelines:
1. Prerequisites: Include a "Prerequisites" section at the start ONLY if there are specific design files (like BIRT report files, e.g., Order details.rptdesign) that the user needs to upload or prepare before executing the steps. Do NOT include generic prerequisites such as "Ensure you have a valid account", "Log into the system", or "Familiarize yourself with the layout". If there are no specific file/data prerequisites, omit the Prerequisites section entirely.
2. Step-by-Step Structure: Divide the guide into clear processes. Break down every action sequence into explicit, numbered steps.
3. Step Details: For each numbered step, provide:
   - A bold, action-oriented step title (e.g. "**Step X: Select the Output Format**").
   - **Action**: Explain exactly what the user needs to do in plain English. Reference specific UI elements like inputs, dropdowns, check-boxes, and buttons in bold (e.g., "click the **Run** button", "fill in the **Enter Static Name** field with a report name").
   - **Details**: Explain why this option is being set and what the expected result is.
   - **Visual Reference**: Immediately follow with the corresponding screenshot using this exact markdown image syntax:
     \`![Description of Action](../../../../screenshots/documents/reports/<filename.png>)\`
     (Make sure to use the correct filename from the live logs provided, and start the path with \`../../../../screenshots/documents/reports/\`).
4. Avoid any QA jargon, dry checklists, or generic headings like "What is happening?", "Why?", "What is expected?". Write in fluid, natural, explanatory prose.
5. Use markdown tables, lists, and note callouts (using blockquotes \`> [!NOTE]\` or \`> [!TIP]\`) to organize information clearly.
6. NO Generic Documentation Links: Do NOT include any links referring the user to other or general documentation (e.g., do NOT add links like "[AIV Documentation](../../../common/docs)" or generic external URLs).
7. NO Wrapping Up or Conclusions: Do NOT add a wrapping up statement, conclusion, next steps, summary, or an "Additional Resources" section at the end. End the document immediately after the final step.

Output ONLY the Markdown content. Do not wrap the entire output in markdown code blocks.`;

    const docUserPrompt = `Official Documentation Reference:
---
${officialContent}
---

Live Application Step Logs & Screenshots Database:
---
${JSON.stringify(relevantSteps, null, 2)}
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
