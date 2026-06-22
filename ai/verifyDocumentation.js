const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

const OLLAMA_URL = config.ollamaUrl;
const REVIEW_MODEL = 'gemma2:9b'; // Using the exact gemma2:9b tag on the local system

// Load Rules
const rulesPath = path.join(process.cwd(), 'docs/document_rules.md');
if (!fs.existsSync(rulesPath)) {
    console.error(`❌ Rules file not found at: ${rulesPath}`);
    process.exit(1);
}
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

// Target Directory
const docDir = path.join(process.cwd(), 'docs/generated/documents/report');
if (!fs.existsSync(docDir)) {
    console.error(`❌ Generated documents folder not found at: ${docDir}`);
    process.exit(1);
}
const files = fs.readdirSync(docDir).filter(f => f.endsWith('_detailed.md'));

// Call Ollama helper
async function callOllama(systemPrompt, userPrompt, model = REVIEW_MODEL) {
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            options: {
                temperature: 0.1 // Low temperature for high logical precision
            },
            stream: false
        });
        return response.data.message.content.trim();
    } catch (error) {
        console.error(`❌ Ollama API Error using model ${model}:`, error.message);
        throw error;
    }
}

// Programmatic check for markdown images
function runProgrammaticChecks(filePath, content) {
    const violations = [];
    
    // 1. Check for backtick-wrapped images e.g. `![Alt](...)`
    const backtickRegex = /`!\[.*?\]\(.*?\)`/g;
    const backtickMatches = content.match(backtickRegex);
    if (backtickMatches) {
        backtickMatches.forEach(match => {
            violations.push(`Image syntax wrapped in backticks: ${match}`);
        });
    }

    // 2. Extract and check image paths
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
        const relativePath = match[1];
        
        // Check for webp or astro references
        if (relativePath.endsWith('.webp')) {
            violations.push(`Forbidden webp image extension: ${relativePath}`);
        }
        if (relativePath.includes('_astro/')) {
            violations.push(`Forbidden official web asset referenced: ${relativePath}`);
        }

        // Check if the image target physically exists on the disk
        try {
            const resolvedPath = path.resolve(path.dirname(filePath), relativePath);
            if (!fs.existsSync(resolvedPath)) {
                violations.push(`Screenshot file does not exist on disk: ${relativePath}`);
            }
        } catch (err) {
            violations.push(`Failed to resolve image path: ${relativePath}. Error: ${err.message}`);
        }
    }

    return violations;
}

const reviewerSystemPrompt = `You are a professional documentation QA reviewer for AIV.
Your job is to audit AIV user guides against the strict style guidelines and validation rules provided in the "AIV Documentation Style & Validation Rules".

You must output ONLY a valid JSON object matching the following structure (do NOT wrap it in markdown code blocks or add explanatory text, output ONLY the raw JSON string):
{
  "passed": true,
  "violations": []
}
Or if it fails:
{
  "passed": false,
  "violations": [
    "Violation 1 description",
    "Violation 2 description"
  ]
}

Key rules to verify:
1. The guide starts with "# [Feature Title]"
2. It has an Introduction section with objectives and use cases.
3. The Prerequisites section must NOT contain generic statements ("Log in", "Ensure you have an account"). It should only list specific design files/dependencies, or be omitted entirely if none exist.
4. Explanatory, fluid prose. No QA jargon or checkboxes.
5. No links referring to external or generic documentation (e.g. common/docs).
6. No summaries, conclusions, wrap-ups, or "Additional Resources" sections at the end of the document.
7. Introduction layout guides must use the custom navigation/component layout structure, not numbered steps.

Verify that the document conforms perfectly to these style guidelines.`;

async function fixFile(file, originalContent, violations) {
    console.log(`🔧 Attempting to self-heal and edit ${file} to resolve violations...`);
    const fixSystemPrompt = `You are a professional technical writer and document editor for AIV.
Your job is to rewrite the provided guide to resolve all style, structure, and image violations listed below, while keeping the guide easy to understand for absolute beginners.

Strict Guidelines for the Edit:
1. Fix all listed violations.
2. Ensure no .webp images are used. Only use .png images.
3. Every image must be in standard markdown format: ![Description](../../../../screenshots/documents/reports/<filename.png>) (DO NOT wrap in backticks!).
4. Do not include generic prerequisites or external documentation links.
5. Do not include wrap-ups, conclusions, or "Additional Resources" at the end of the document.
6. Make sure the tone is novice-friendly and understandable.

Output ONLY the corrected Markdown content. Do not wrap the output in markdown code blocks.`;

    const fixUserPrompt = `Original Failed Guide:\n---\n${originalContent}\n---\n\nViolations to Fix:\n${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n\nDocument Rules Reference:\n---\n${rulesContent}\n---\n\nPlease output the completely corrected and novice-friendly markdown document.`;

    try {
        const correctedDoc = await callOllama(fixSystemPrompt, fixUserPrompt, REVIEW_MODEL);
        const filePath = path.join(docDir, file);
        fs.writeFileSync(filePath, correctedDoc, 'utf8');
        console.log(`✅ Saved corrected document for ${file}.`);
        return correctedDoc;
    } catch (e) {
        console.error(`❌ Failed to automatically fix ${file}:`, e.message);
        throw e;
    }
}

async function verifyFile(file) {
    const filePath = path.join(docDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let maxRetries = 2;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
        console.log(`\n🔍 Auditing document: ${file} (Attempt ${attempt + 1})...`);
        
        // 1. Run strict programmatic checks
        const programmaticViolations = runProgrammaticChecks(filePath, content);
        
        // 2. Run LLM style & structure checks
        let passed = true;
        let violations = [...programmaticViolations];
        
        try {
            const userPrompt = `AIV Documentation Rules:\n---\n${rulesContent}\n---\n\nGenerated Guide to Review:\n---\n${content}\n---`;
            const rawLlmResult = await callOllama(reviewerSystemPrompt, userPrompt, REVIEW_MODEL);
            
            // Clean JSON formatting if LLM wrapped it in code blocks
            let cleanJson = rawLlmResult.trim();
            if (cleanJson.includes('```json')) {
                cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
            } else if (cleanJson.includes('```')) {
                cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
            }
            
            const review = JSON.parse(cleanJson);
            if (!review.passed) {
                passed = false;
                violations = [...violations, ...review.violations];
            }
        } catch (err) {
            console.error(`⚠️ Gemma verification call failed for ${file}: ${err.message}. Relying on programmatic checks.`);
        }

        if (violations.length > 0) {
            passed = false;
        }

        if (passed) {
            console.log(`✅ ${file} passed all style and image validation rules.`);
            return { file, passed: true, violations: [] };
        } else {
            console.log(`❌ ${file} failed validation on Attempt ${attempt + 1}:`);
            violations.forEach(v => console.log(`   - ${v}`));
            
            if (attempt < maxRetries) {
                attempt++;
                try {
                    content = await fixFile(file, content, violations);
                } catch (fixErr) {
                    console.error(`Failed to self-heal: ${fixErr.message}`);
                    break;
                }
            } else {
                console.log(`⚠️ Exceeded maximum retries for ${file}. Manual review required.`);
                return { file, passed: false, violations };
            }
        }
    }
}

async function verifyAll() {
    console.log(`🤖 Starting Gemma documentation audit & self-healing pipeline for ${files.length} files...`);
    const results = [];
    for (const file of files) {
        const result = await verifyFile(file);
        results.push(result);
    }
    
    console.log('\n========================================');
    console.log('📊 Verification Summary:');
    console.log('========================================');
    let totalPassed = 0;
    results.forEach(res => {
        if (res.passed) {
            totalPassed++;
            console.log(`✅ ${res.file}: PASSED`);
        } else {
            console.log(`❌ ${res.file}: FAILED (${res.violations.length} violations)`);
        }
    });
    console.log(`\nScore: ${totalPassed} / ${results.length} guides passed.`);
    
    if (totalPassed < results.length) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

verifyAll();
