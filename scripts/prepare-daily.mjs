import { readFile } from 'node:fs/promises';
import { localDate } from './date.mjs';

const entries = JSON.parse(await readFile(new URL('../data/experiments.json', import.meta.url), 'utf8'));
const date = process.env.KAGUMI_DATE || localDate();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid run date.');
const exists = entries.some((entry) => entry.date === date);
const result = `date=${date}\nexists=${exists}\n`;
console.log(result.trim());
