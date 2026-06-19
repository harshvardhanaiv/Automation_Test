const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');

const steps = {
    introduction: '308',
    parameter: '314',
    output: '316',
    email: '318',
    hide_grid_reportexport: '320',
    hide_report_options: '322',
    single_sheet_option: '324'
};

const brainDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\9459b146-1618-416e-a563-c4f707461518\\.system_generated\\steps';
const outputDir = path.join(__dirname, '../docs/official-markdown');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const turndownService = new TurndownService();

Object.entries(steps).forEach(([name, stepId]) => {
    const filePath = path.join(brainDir, stepId, 'content.md');
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found for ${name} (Step ${stepId})`);
        return;
    }

    const htmlContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract <article> content or <main> content
    let contentToConvert = htmlContent;
    const articleMatch = htmlContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
        contentToConvert = articleMatch[1];
    } else {
        const mainMatch = htmlContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        if (mainMatch) contentToConvert = mainMatch[1];
    }

    // Clean up starlight theme components if any
    contentToConvert = contentToConvert.replace(/<starlight-theme-select[\s\S]*?<\/starlight-theme-select>/gi, '');
    contentToConvert = contentToConvert.replace(/<button class="menu-btn"[\s\S]*?<\/button>/gi, '');
    
    // Convert to markdown
    const markdown = turndownService.turndown(contentToConvert);
    const outputPath = path.join(outputDir, `${name}.md`);
    fs.writeFileSync(outputPath, markdown.trim());
    console.log(`✅ Extracted official ${name} to: ${outputPath} (${markdown.length} chars)`);
});
