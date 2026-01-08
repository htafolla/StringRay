import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Server __dirname:', __dirname);
console.log('Current path attempt:', join(__dirname, '.opencode', 'REFACTORING_LOG.md'));
console.log('File exists at current path:', existsSync(join(__dirname, '.opencode', 'REFACTORING_LOG.md')));

console.log('Alternative path:', join(__dirname, '..', '.opencode', 'REFACTORING_LOG.md'));
console.log('File exists at alternative path:', existsSync(join(__dirname, '..', '.opencode', 'REFACTORING_LOG.md')));