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

async function runPipeline() {
    const stepLogPath = path.join(process.cwd(), 'screenshots/documents/reports/step-log.json');
    if (!fs.existsSync(stepLogPath)) {
        console.error(`❌ Step log not found at: ${stepLogPath}`);
        process.exit(1);
    }
    const stepLogs = JSON.parse(fs.readFileSync(stepLogPath, 'utf8'));

    for (const section of SECTIONS) {
        console.log(`\n==================================================`);
        console.log(`🚀 Processing Section: ${section.title} (${section.name})`);
        console.log(`==================================================`);

        // 1. Load official markdown
        const officialPath = path.join(process.cwd(), 'docs/official-markdown', `${section.name}.md`);
        let officialContent = 'No official documentation found.';
        if (fs.existsSync(officialPath)) {
            officialContent = fs.readFileSync(officialPath, 'utf8');
            console.log(`📖 Loaded official markdown: ${officialPath} (${officialContent.length} chars)`);
        } else {
            console.warn(`⚠️ Warning: Official markdown not found at: ${officialPath}`);
        }

        // 2. Filter step logs for screenshots relevant to this section
        const relevantSteps = stepLogs.filter(step => {
            return section.screenshotPrefixes.some(prefix => step.screenshot.startsWith(prefix));
        });
        console.log(`📊 Filtered ${relevantSteps.length} relevant steps from execution log.`);

        // 3. Call 1: Generate Premium Step Document
        console.log(`🤖 Call 1: Generating Premium User Documentation...`);
        const docSystemPrompt = `You are a professional, elite technical writer and UI designer for AIV (Analytics Intelligence Visualization).
Your job is to generate a comprehensive, premium, publication-grade user guide in Markdown format for the AIV Reports section: "${section.title}".

You will be given:
1. Official AIV Documentation for this section.
2. Step logs and screenshots of our actual live application flow.

Your goal is to write a detailed, user-friendly, professional user guide that merges the official explanations with our live screenshots and steps.

Guidelines:
1. Structure the document with a main H1 title, clean sub-headings, lists, bold text, and tables where appropriate.
2. Avoid dry, repetitive, QA-style lists (do not use headers like "What is happening?", "Why?", "What is expected?"). Instead, write fluid, natural, explanatory paragraphs and step-by-step instructions.
3. Dynamically embed the screenshots referenced in the logs at the appropriate places. Use the relative path: \`../../../../screenshots/documents/reports/${section.name === 'introduction' ? '' : ''}\`
   - IMPORTANT: The path to images must be relative to the output folder 'docs/generated/documents/report/'.
   - The correct relative path syntax is: \`../../../../screenshots/documents/reports/<filename.png>\` (e.g. \`![description](../../../../screenshots/documents/reports/reports-daily-15-once-datepicker.png)\`).
4. Explain form fields, dropdowns, and settings clearly. Add tip or note callout blocks for important caveats (e.g. using Blockquote or > [!NOTE]).
5. Only include screenshots and live steps that are relevant to this section.

Output ONLY the Markdown content. Do not wrap the entire output in markdown code blocks.`;

        const docUserPrompt = `Official Documentation:
---
${officialContent}
---

Live Flow Step Logs:
---
${JSON.stringify(relevantSteps, null, 2)}
---

Please generate the premium user documentation.`;

        let generatedDoc = '';
        try {
            generatedDoc = await callOllama(docSystemPrompt, docUserPrompt);
            const genFilePath = path.join(process.cwd(), 'docs/generated/documents/report', `${section.name}.md`);
            const genDir = path.dirname(genFilePath);
            if (!fs.existsSync(genDir)) fs.mkdirSync(genDir, { recursive: true });
            fs.writeFileSync(genFilePath, generatedDoc);
            console.log(`🎉 Generated User Guide saved: ${genFilePath}`);
        } catch (e) {
            console.error(`❌ Failed to generate user guide for ${section.name}`);
            continue;
        }

        // 4. Call 2: Generate Gap Analysis
        console.log(`🤖 Call 2: Performing Documentation Gap Analysis...`);
        const gapSystemPrompt = `You are a senior documentation analyst and technical writer.
Your task is to compare the official documentation of AIV Reports against the "Generated Live Documentation" (which accurately represents the live user flow and verified UI).
Analyze the two documents and generate a detailed "Doc Gap Analysis" report.

The report must include:
1. Missing Information: Features, options, or UI elements verified in the actual app but missing or described poorly in the official docs.
2. Outdated Content: Descriptions or steps in the official docs that no longer match the live UI flow.
3. Inaccuracies: Incorrect labels, wrong menu nesting, or incorrectly described fields.
4. Recommendations: An overall action plan of what needs to be added, removed, or modified in the official documentation.

Ensure the report is highly detailed, specific, and formatted in clean Markdown.
Output ONLY the Markdown content. Do not wrap the entire output in markdown code blocks.`;

        const gapUserPrompt = `Official Documentation:
---
${officialContent}
---

Generated Live Documentation:
---
${generatedDoc}
---

Please generate the Doc Gap Analysis report.`;

        try {
            const gapAnalysis = await callOllama(gapSystemPrompt, gapUserPrompt);
            const gapFilePath = path.join(process.cwd(), 'docs/analysis/documents/report', `${section.name}-doc-gap.md`);
            const gapDir = path.dirname(gapFilePath);
            if (!fs.existsSync(gapDir)) fs.mkdirSync(gapDir, { recursive: true });
            fs.writeFileSync(gapFilePath, gapAnalysis);
            console.log(`🎉 Doc Gap Analysis saved: ${gapFilePath}`);
        } catch (e) {
            console.error(`❌ Failed to generate Gap Analysis for ${section.name}`);
        }

        // 5. Call 3: Generate UI/UX Usability Feedback
        console.log(`🤖 Call 3: Generating UI/UX usability suggestions...`);
        const uxSystemPrompt = `You are an expert UI/UX designer and usability specialist.
Analyze the live application flow documentation of the AIV Reports "${section.title}" feature.
Identify friction points, usability issues, layout issues, and areas for design improvements.

Generate a detailed "UI/UX & Usability Feedback" report.
Focus on:
1. Discoverability: Are buttons, settings, or actions hidden in deep, unintuitive menus or context options?
2. Click Depth: Does it require too many clicks or navigating multiple tabs to perform simple flows?
3. Visual Layout & Consistency: Form layouts, placement of options, modal clutter, or datepicker usability.
4. Recommendations: Concrete design suggestions (with HSL tailored color schemes, sleek modern design patterns) to simplify the flow and improve user experience.

Ensure the report is formatted in clean Markdown.
Output ONLY the Markdown content. Do not wrap the entire output in markdown code blocks.`;

        const uxUserPrompt = `Here is the live application flow documentation:
---
${generatedDoc}
---

Please analyze it and provide UI/UX usability improvement suggestions in Markdown.`;

        try {
            const uxSuggestions = await callOllama(uxSystemPrompt, uxUserPrompt);
            const uxFilePath = path.join(process.cwd(), 'docs/suggestions/documents/report', `${section.name}-ui-ux-feedback.md`);
            const uxDir = path.dirname(uxFilePath);
            if (!fs.existsSync(uxDir)) fs.mkdirSync(uxDir, { recursive: true });
            fs.writeFileSync(uxFilePath, uxSuggestions);
            console.log(`🎉 UI/UX Feedback saved: ${uxFilePath}`);
        } catch (e) {
            console.error(`❌ Failed to generate UI/UX suggestions for ${section.name}`);
        }
    }

    console.log(`\n🎉 All sections processed successfully!`);
}

runPipeline();
