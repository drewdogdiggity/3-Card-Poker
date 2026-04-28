import { writeFileSync } from 'node:fs';
const buildTime = new Date().toISOString();
writeFileSync('version.json', JSON.stringify({ buildTime }) + '\n');
console.log('Stamped version.json:', buildTime);
