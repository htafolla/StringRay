import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('__dirname:', __dirname);
console.log('Resolved path (old):', join(__dirname, '..', '.opencode', 'REFACTORING_LOG.md'));
console.log('File exists (old):', existsSync(join(__dirname, '..', '.opencode', 'REFACTORING_LOG.md')));
console.log('Resolved path (new):', join(__dirname, '.opencode', 'REFACTORING_LOG.md'));
console.log('File exists (new):', existsSync(join(__dirname, '.opencode', 'REFACTORING_LOG.md')));