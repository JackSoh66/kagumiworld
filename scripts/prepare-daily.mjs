import { appendFile, readFile } from 'node:fs/promises';
import { localDate } from './date.mjs';

const entries = JSON.parse(await readFile(new URL('../data/experiments.json', import.meta.url), 'utf8'));
const date = localDate();
const exists = entries.some((entry) => entry.date === date);
const result = `date=${date}\nexists=${exists}\n`;
console.log(result.trim());
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, result);
if (exists && process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `Today's experiment (${date}, Asia/Kuala_Lumpur) already exists. No duplicate created.\n`);
}
