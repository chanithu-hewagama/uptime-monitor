// monitor.js
const fs = require('fs');
const axios = require('axios');

async function runChecks() {
  const configFile = fs.readFileSync('./config.json', 'utf8');
  const config = JSON.parse(configFile);
  const results = [];

  for (const check of config.checks) {
    let isUp = false;
    let responseTime = 0;
    const startTime = Date.now();

    const targetUrl = new URL(check.url);
    if (check.port) {
      targetUrl.port = check.port;
    }

    try {
      const response = await axios({
        method: check.method || 'GET',
        url: targetUrl.toString(),
        headers: check.headers || {},
        timeout: 10000,
        validateStatus: () => true
      });

      responseTime = Date.now() - startTime;
      
      if (check.expectedStatusCodes && check.expectedStatusCodes.includes(response.status)) {
        isUp = true;
      }
    } catch (error) {
      responseTime = Date.now() - startTime;
      isUp = false;
    }

    results.push({
      name: check.name,
      url: targetUrl.toString(),
      port: check.port || null,
      up: isUp,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    });

    console.log(`Checked ${check.name} - Status: ${isUp ? 'UP' : 'DOWN'} (${responseTime}ms)`);
  }

  const historyPath = './history.json';
  let history = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (e) {
      history = [];
    }
  }
  
  history.unshift({
    timestamp: new Date().toISOString(),
    results: results
  });

  if (history.length > 100) history.pop();

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

runChecks();