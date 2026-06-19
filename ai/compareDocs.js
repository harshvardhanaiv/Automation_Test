const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const TurndownService = require('turndown');

const OLLAMA_URL = config.ollamaUrl;
const MODEL = config.model;

async function compareDocs(sectionPath, officialUrl) {
    if (!sectionPath || !officialUrl) {
        console.error('Usage: node ai/compareDocs.js <section/subsection> <official_url>');
        process.exit(1);
    }

    const generatedDocPath = path.join(process.cwd(), 'docs/generated', `${sectionPath}.md`);
    if (!fs.existsSync(generatedDocPath)) {
        console.error(`❌ Generated step documentation not found at: ${generatedDocPath}`);
        console.error(`Please run node ai/documentPrep.js ${sectionPath} first!`);
        process.exit(1);
    }

    console.log(`📖 Reading generated documentation from: ${generatedDocPath}`);
    const generatedDocContent = fs.readFileSync(generatedDocPath, 'utf8');

    console.log(`🌐 Fetching official documentation from: ${officialUrl}...`);
    let officialMarkdown = '';
    try {
        const response = await axios.get(officialUrl);
        const htmlContent = response.data;

        // Convert HTML to Markdown
        const turndownService = new TurndownService();
        officialMarkdown = turndownService.turndown(htmlContent);
        console.log(`✅ Converted official documentation HTML to Markdown (${officialMarkdown.length} characters)`);
    } catch (error) {
        console.error(`❌ Failed to fetch or parse official documentation:`, error.message);
        process.exit(1);
    }

    // Call 1: Gap Analysis
    console.log(`🤖 Running Gap Analysis comparison using Ollama (${MODEL})...`);
    const gapSystemPrompt = `You are a senior documentation analyst and technical writer.
Your task is to compare the official documentation (Markdown) of AIV against the "Generated Step Documentation" which accurately represents the live, actual user interaction flow and verified UI.

Analyze the documents and generate a detailed "Doc Gap Analysis" report.
The report must include:
1. Missing Steps/Buttons: Features or elements verified in the actual app but completely missing from the official docs.
2. Outdated Actions: Steps in the official documentation that no longer match the live UI flow.
3. Inaccuracies: Incorrect labels, wrong menu nesting, or incorrectly described UI fields.
4. Summary: An overall action plan of what needs to be added/modified in the official docs.

Output must be in clean Markdown format.`;

    const gapUserPrompt = `Official Documentation (from URL):
---
${officialMarkdown}
---

Generated Step Documentation (Live Application Flow):
---
${generatedDocContent}
---

Generate the Doc Gap Analysis report in Markdown.`;

    let gapAnalysis = '';
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: gapSystemPrompt },
                { role: 'user', content: gapUserPrompt }
            ],
            stream: false
        });
        gapAnalysis = response.data.message.content.trim();

        const gapFilePath = path.join(process.cwd(), 'docs/analysis', `${sectionPath}-doc-gap.md`);
        const gapDir = path.dirname(gapFilePath);
        if (!fs.existsSync(gapDir)) fs.mkdirSync(gapDir, { recursive: true });
        fs.writeFileSync(gapFilePath, gapAnalysis);
        console.log(`\n🎉 Success! Doc Gap Analysis report saved at: ${gapFilePath}`);
    } catch (error) {
        console.error('❌ Error during Gap Analysis:', error.message);
    }

    // Call 2: UI/UX Suggestions
    console.log(`🤖 Running UI/UX usability analysis using Ollama (${MODEL})...`);
    const uxSystemPrompt = `You are an expert UI/UX designer and product usability specialist.
Your task is to analyze the generated step documentation of the live AIV application (which reflects how user actions are performed step-by-step) and identify friction points, usability issues, and area for design improvements.

Generate a detailed "UI/UX & Usability Feedback" report.
Focus on:
1. Discoverability: Are buttons, settings, or actions hidden in deep, unintuitive menus or context options?
2. Click Depth: Does it require too many clicks or navigating multiple tabs to perform simple flows (e.g. setting scheduler output or parameter inputs)?
3. Visual Layout: Form layouts, placement of options, modal clutter, or datepickers ease of use.
4. Usability Enhancements: Concrete recommendations to simplify the flow and improve user experience.

Output must be in clean Markdown format.`;

    const uxUserPrompt = `Here is the live application flow documentation:
---
${generatedDocContent}
---

Please analyze it and provide UI/UX usability improvement suggestions in Markdown.`;

    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: uxSystemPrompt },
                { role: 'user', content: uxUserPrompt }
            ],
            stream: false
        });
        const uxSuggestions = response.data.message.content.trim();

        const uxFilePath = path.join(process.cwd(), 'docs/suggestions', `${sectionPath}-ui-ux-feedback.md`);
        const uxDir = path.dirname(uxFilePath);
        if (!fs.existsSync(uxDir)) fs.mkdirSync(uxDir, { recursive: true });
        fs.writeFileSync(uxFilePath, uxSuggestions);
        console.log(`\n🎉 Success! UI/UX Suggestions saved at: ${uxFilePath}`);
    } catch (error) {
        console.error('❌ Error during UI/UX Analysis:', error.message);
    }
}

if (require.main === module) {
    const sectionPath = process.argv[2];
    const officialUrl = process.argv[3];
    compareDocs(sectionPath, officialUrl);
}

module.exports = compareDocs;
