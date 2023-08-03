import { input } from '@inquirer/prompts';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';

// 👇 which minutes?
const path = await input({ message: 'Enter path to minutes JSON' });

// 👇 read and parse the minutes
console.log(chalk.yellow(`👈 reading ${path}`));
const minutes = JSON.parse(readFileSync(path).toString());

// 👇 reset the ID of each Transcription
minutes.transcription.forEach((tx, ix) => {
  delete tx.td;
  tx.id = ix + 1;
});

// 👇 reset the next ID
minutes.nextTranscriptionID = minutes.transcription.length + 1;

// 👇 and we're done!
console.log(chalk.green(`👉 writing ${path}`));
writeFileSync(path, JSON.stringify(minutes, null, 2));
