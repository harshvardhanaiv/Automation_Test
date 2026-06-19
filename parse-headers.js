const fs = require('fs');
const path = require('path');

const dailyDir = path.join(__dirname, 'tests/daily');
const files = fs.readdirSync(dailyDir).filter(f => f.endsWith('.spec.ts')).sort();

let docContent = `# AIV Completed Automation Test Suites

This document provides a summary of all the AIV application sections and sub-sections whose test automation has been fully completed.

---

## Completed Automation Coverage

| # | Spec File | Section / Feature | Coverage Details |
|---|-----------|-------------------|------------------|
`;

files.forEach(file => {
    const filePath = path.join(dailyDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract the block comment at the top of the file
    const match = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (match) {
        const lines = match[1].split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim()).filter(Boolean);
        
        let title = file;
        let covers = [];
        let section = '';
        
        lines.forEach(line => {
            if (line.toLowerCase().startsWith('daily regression')) {
                section = line.replace(/daily regression\s*—\s*/i, '').trim();
            } else if (line.startsWith('-')) {
                covers.push(line.substring(1).trim());
            } else if (line.toLowerCase().startsWith('covers:')) {
                // Ignore headers
            } else if (line.includes('URL:')) {
                // Ignore URL in table, or we can use it
            } else {
                // General description line if it's not a bullet point
                if (!section && line.includes('spec.ts')) {
                    // Ignore filename lines
                } else if (!section) {
                    section = line;
                }
            }
        });
        
        const coverageStr = covers.length > 0 ? covers.map(c => `• ${c}`).join('<br>') : 'General regression testing';
        const fileNum = file.split('-')[0];
        docContent += `| ${fileNum} | [\`${file}\`](file:///c:/AIV%20Automation/Automation_Test/tests/daily/${file}) | **${section || file}** | ${coverageStr} |\n`;
    } else {
        docContent += `| - | [\`${file}\`](file:///c:/AIV%20Automation/Automation_Test/tests/daily/${file}) | **Unknown** | General test execution |\n`;
    }
});

docContent += `
---

## Summary of Automated Core Areas

1. **Access Control & Session Management**: Login verification, session persistence, invalid credential handling, API token generation/revocation.
2. **Documents & Reports**:
    * **Reports**: Grid, search, filters, right-click actions, and Scheduler configurations (Parameter, Schedule, Output, Email).
    * **Merge Reports**: Combine multiple reports, scheduling.
    * **Dynamic Messages & Annotations**: Creating, editing, and managing messages and annotations on charts/visualizations.
    * **Quick Run**: Execution dialog boxes.
3. **Master Data & Datasets**: Webhook triggers, parameters, datasets creation, and SQLBuddy dataset generator.
4. **Administration & Security**: User creation, editing, user roles, department setup, file types, license keys, and email user configurations.
5. **Dashboard & Visualization**: Theme editor, dashboard buddy (Generative AI integration), custom visualization widgets, chart properties, and advanced widget settings.
`;

const outputPath = path.join(__dirname, 'completed_automations.md');
fs.writeFileSync(outputPath, docContent);
console.log(`Successfully compiled completed automation documentation to: ${outputPath}`);
