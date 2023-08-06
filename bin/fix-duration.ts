import { parseStream } from 'music-metadata';
import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';

import chalk from 'chalk';
import got from 'got';

const paths = [
  '/home/mflo/Downloads/pb-20230801.json',
  '/home/mflo/Downloads/zba-20230628.json',
  '/home/mflo/Downloads/pb-20230801.bak.json',
  '/home/mflo/Downloads/short.json',
  '/home/mflo/Downloads/cyn.json',
  '/home/mflo/Downloads/zba-20230628.bak.json',
  '/home/mflo/Downloads/washington-app-319514-3740581feaee.json',
  '/home/mflo/mflorence99/minute-maker/testcases/pb-20230801.json',
  '/home/mflo/mflorence99/minute-maker/testcases/zba-20230628.json'
];

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
