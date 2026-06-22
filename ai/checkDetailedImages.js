const fs = require('fs');
const path = require('path');

const reportDir = path.join(__dirname, '../docs/generated/documents/report');
const files = fs.readdirSync(reportDir).filter(f => f.endsWith('_detailed.md'));

files.forEach(file => {
    console.log(`\n📄 File: ${file}`);
    const content = fs.readFileSync(path.join(reportDir, file), 'utf8');
    const matches = content.match(/!\[.*?\]\((.*?)\)/g);
    if (matches) {
        matches.forEach(match => {
            console.log(`  - ${match}`);
        });
    } else {
        console.log('  No images referenced.');
    }
});
