const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\9459b146-1618-416e-a563-c4f707461518';
const destDir = 'C:\\AIV Automation\\Automation_Test\\screenshots\\documents\\reports';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(brainDir);

const mappings = {
    'reports_navigation_menu': 'reports-navigation-menu.png',
    'reports_context_menu': 'reports-context-menu-hide-options.png',
    'reports_hide_options_dialog': 'reports-hide-options-dialog.png',
    'reports_parameter_tab': 'reports-parameter-tab.png',
    'reports_output_options': 'reports-output-options.png',
    'reports_email_tab': 'reports-email-tab-enabled.png'
};

Object.entries(mappings).forEach(([prefix, targetName]) => {
    // Find the latest file starting with this prefix
    const matchingFiles = files.filter(f => f.startsWith(prefix) && f.endsWith('.png'));
    if (matchingFiles.length > 0) {
        // Sort to get the latest one
        matchingFiles.sort();
        const latestFile = matchingFiles[matchingFiles.length - 1];
        const srcPath = path.join(brainDir, latestFile);
        const destPath = path.join(destDir, targetName);
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied ${latestFile} -> ${targetName}`);
    } else {
        console.warn(`⚠️ Warning: No matching file found for prefix ${prefix}`);
    }
});
