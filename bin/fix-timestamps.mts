import { input } from '@inquirer/prompts';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

// 👇 which minutes?
const path = await input({ message: 'Enter path to minutes JSON' });

// 👇 read and parse the minutes
console.log(chalk.yellow(`👈 reading ${path}`));
const minutes = JSON.parse(readFileSync(path).toString());

// 👇 what chunk of time is missing?
const duration = minutes.audio.duration;
const missing = duration - minutes.transcription.at(-1).start;

// 👇 reset the timestamp of each Transcription
minutes.transcription.forEach((tx) => {
  tx.start += missing * (tx.start / duration);
});

// 👇 and we're done!
console.log(chalk.green(`👉 writing ${path}`));
writeFileSync(path, JSON.stringify(minutes, null, 2));
