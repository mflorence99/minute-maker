import { parseStream } from 'music-metadata';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
import got from 'got';

const paths = [];

async function main(): Promise<void> {
  for (const path of paths) {
    console.log(chalk.yellow(`👈 reading ${path}`));
    const minutes = JSON.parse(readFileSync(path).toString());

    const stream = await got.stream.get(minutes.audio.url);

    const metadata = await parseStream(
      stream,
      { mimeType: 'audio/mp3' },
      { duration: true }
    );

    minutes.audio.duration = metadata.format.duration;

    console.log(chalk.green(`👉 writing ${path}`));
    writeFileSync(path, JSON.stringify(minutes, null, 2));
  }
}

main();
