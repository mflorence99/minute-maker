import { input } from '@inquirer/prompts';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

// 👇 which minutes?
const path = await input({ message: 'Enter path to minutes JSON' });

// 👇 read and parse the minutes
console.log(chalk.yellow(`👈 reading ${path}`));
const minutes = JSON.parse(readFileSync(path).toString());

// 👇 reset the default speaker
minutes.transcription
  .filter((tx) => tx.speaker?.startsWith('Speaker '))
  .forEach((tx) => {
    tx.speaker = '';
  });

// 👇 and we're done!
console.log(chalk.green(`👉 writing ${path}`));
writeFileSync(path, JSON.stringify(minutes, null, 2));
