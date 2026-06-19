const axios = require('axios');

async function test() {
    try {
        console.log('Sending test request to Ollama...');
        const start = Date.now();
        const response = await axios.post('http://localhost:11434/api/chat', {
            model: 'llama3.1:8b',
            messages: [{ role: 'user', content: 'Say hello in 5 words.' }],
            stream: false
        });
        const duration = (Date.now() - start) / 1000;
        console.log(`Response received in ${duration} seconds:`);
        console.log(response.data.message.content);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
