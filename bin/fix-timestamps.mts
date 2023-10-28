import { input } from '@inquirer/prompts';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

// 👇 which minutes?
const path = await input({ message: 'Enter path to minutes JSON' });

// 👇 read and parse the minutes
console.log(chalk.yellow(`👈 reading ${path}`));
const minutes = JSON.parse(readFileSync(path).toString());

// 👇 correct for the wrong offset
const offset = 9 * 60;

// 👇 reset the timestamp of each Transcription
minutes.transcription.forEach((tx) => {
  if (tx.type === 'TX' && tx.id >= 230) {
    tx.start += offset;
    tx.end += offset;
  }
});

// 👇 and we're done!
console.log(chalk.green(`👉 writing ${path}`));
writeFileSync(path, JSON.stringify(minutes, null, 2));
