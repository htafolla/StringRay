import express from 'express';
import { exec } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// API endpoints
app.get('/api/status', (req: any, res: any) => {
  // Return framework status
  res.json({
    framework: 'StringRay',
    version: '1.0.0',
    status: 'active',
    agents: 8,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/agents', (req: any, res: any) => {
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

// Add route for root path
app.get('/', (req: any, res: any) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {

  // Auto-open browser
  const start = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${start} http://localhost:${PORT}`);
});