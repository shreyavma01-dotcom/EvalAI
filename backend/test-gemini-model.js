const fs = require('fs');
const path = require('path');
const axios = require('axios');

const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const key = (env.split(/\r?\n/).find((l) => l.startsWith('GEMINI_API_KEY=')) || '').split('=').slice(1).join('');

(async () => {
  for (const model of ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash']) {
    try {
      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        { contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: ok' }] }] },
        { params: { key }, timeout: 30000 }
      );
      console.log(model, '=> HTTP', r.status, 'OK');
    } catch (e) {
      const s = e.response?.status;
      const msg = JSON.stringify(e.response?.data?.error?.message || e.message);
      console.log(model, '=> HTTP', s, 'FAIL', msg);
    }
  }
})();
