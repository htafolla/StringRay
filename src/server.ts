import express from 'express';
import { exec } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// API endpoints
app.get('/api/status', (req, res) => {
  // Return framework status
  res.json({
    framework: 'StringRay',
    version: '1.0.0',
    status: 'active',
    agents: 8,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/agents', (req, res) => {
  // Return agent configurations
  res.json({
    agents: [
      'enforcer',
      'architect',
      'orchestrator',
      'bug-triage-specialist',
      'code-reviewer',
      'security-auditor',
      'refactorer',
      'test-architect'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🛡️ StringRay Dashboard running at http://localhost:${PORT}`);
  console.log(`⚡ Open your browser to view the interface`);

  // Auto-open browser
  const start = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${start} http://localhost:${PORT}`);
});</content>
<parameter name="filePath">/Users/blaze/dev/strray/src/server.ts