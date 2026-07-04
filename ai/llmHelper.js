const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');

async function callLLM(systemPrompt, userPrompt) {
    const configJsonPath = path.join(__dirname, 'config.json');
    let provider = 'ollama';
    let url = config.ollamaUrl;
    let model = config.model;
    let apiKey = '';

    if (fs.existsSync(configJsonPath)) {
        try {
            const configJson = JSON.parse(fs.readFileSync(configJsonPath, 'utf-8'));
            if (configJson.provider === 'deepseek') {
                provider = 'deepseek';
                url = configJson.deepseekUrl || 'https://api.deepseek.com/chat/completions';
                model = configJson.deepseekModel || 'deepseek-chat';
                apiKey = process.env.DEEPSEEK_API_KEY || configJson.deepseekApiKey || '';
            } else if (configJson.provider === 'ollama') {
                provider = 'ollama';
                url = configJson.ollamaUrl || config.ollamaUrl;
                model = configJson.model || config.model;
            }
        } catch (e) {
            console.error('Error reading config.json, using defaults:', e.message);
        }
    }

    console.log(`🤖 Using LLM Provider: ${provider} (${model}) at ${url}`);

    const headers = { 'Content-Type': 'application/json' };
    if (provider === 'deepseek' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    let payload;
    if (provider === 'deepseek') {
        payload = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false,
            temperature: 0.1
        };
    } else {
        payload = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false
        };
    }

    const response = await axios.post(url, payload, { headers, timeout: 60000 });

    let content = '';
    if (provider === 'deepseek') {
        if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
            content = response.data.choices[0].message.content;
        } else {
            throw new Error(`Unexpected DeepSeek API response structure: ${JSON.stringify(response.data)}`);
        }
    } else {
        if (response.data && response.data.message) {
            content = response.data.message.content;
        } else {
            throw new Error(`Unexpected Ollama API response structure: ${JSON.stringify(response.data)}`);
        }
    }

    return content;
}

module.exports = { callLLM };
