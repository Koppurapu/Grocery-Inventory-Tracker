const fs = require('fs');
const c = fs.readFileSync('backend/server.cjs', 'utf8');
const lines = c.split('\n');
lines.forEach((line, i) => {
  if (line.includes('params.length') && line.includes('query +=')) {
    console.log(`Line ${i+1}: ${JSON.stringify(line)}`);
  }
});
