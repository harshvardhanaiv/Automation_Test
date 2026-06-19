const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const OLLAMA_URL = config.ollamaUrl;
const MODEL = config.model;

async function prepareDoc(sectionPath) {
    if (!sectionPath) {
        console.error('Usage: node ai/documentPrep.js <section/subsection> (e.g. documents/reports)');
        process.exit(1);
    }

    const logDir = path.join(process.cwd(), 'screenshots', sectionPath);
    const logFilePath = path.join(logDir, 'step-log.json');

    if (!fs.existsSync(logFilePath)) {
        console.error(`❌ Step log not found at: ${logFilePath}`);
        console.error(`Please run the playwright test for this section first!`);
        process.exit(1);
    }

    console.log(`📖 Reading step log from: ${logFilePath}`);
    const stepLogs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));

    console.log(`🤖 Generating documentation for ${sectionPath} using Ollama (${MODEL})...`);

    const systemPrompt = `You are an expert technical writer for AIV (Analytics Intelligence Visualization).
Your job is to generate clear, professional, step-by-step user guides and documentation in Markdown format based on logs of actual user interactions (test steps).

Guidelines:
1. Write in a clear, friendly, user-facing tone.
2. Structure the document with proper headings (H1, H2, H3) matching the features.
3. For each step/action, describe what is happening, why, and what is expected.
4. Dynamically embed the screenshots referenced in the logs at the appropriate places using markdown image syntax.
   - Use relative path from the output document (which is located at 'docs/generated/${sectionPath}.md') to the screenshot in 'screenshots/${sectionPath}/filename.png'.
   - The correct relative path syntax is: \`../../../screenshots/${sectionPath}/<filename.png>\` (e.g. \`![description](../../../screenshots/${sectionPath}/reports-daily-15-once-datepicker.png)\`).
5. Include code blocks or formatting for buttons and inputs (e.g. click **Login** button, type \`Admin\` in the **Username** field).
6. Organize sections logically (e.g. Login, Navigation, Scheduling, Output, Email).`;

    const userPrompt = `Generate step-by-step user documentation for AIV section: "${sectionPath}".
Here are the step logs captured during the test run:
\`\`\`json
${JSON.stringify(stepLogs, null, 2)}
\`\`\`

Return ONLY the Markdown content. Do not wrap the entire output in markdown code blocks.`;

    try {
        const response = await axios.post(OLLAMA_URL, {
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false
        });

        const docContent = response.data.message.content.trim();

        const outputFilePath = path.join(process.cwd(), 'docs/generated', `${sectionPath}.md`);
        const outputDir = path.dirname(outputFilePath);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputFilePath, docContent);
        console.log(`\n🎉 Success! Documentation generated at: ${outputFilePath}`);
    } catch (error) {
        console.error('❌ Error generating documentation:', error.message);
        if (error.response) console.error('Data:', error.response.data);
        process.exit(1);
    }
}

if (require.main === module) {
    const sectionPath = process.argv[2];
    prepareDoc(sectionPath);
}

module.exports = prepareDoc;
