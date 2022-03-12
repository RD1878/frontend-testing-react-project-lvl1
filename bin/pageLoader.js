#!/usr/bin/env node
import { program } from 'commander';
import process from 'process';
import pageLoader from '../src/index.js';

program
  .version('1.0.0')
  .description('Page download')
  .option('-o, --output [dirPath]', 'output directory', './')
  .argument('<url>')
  .action(async (url, dirPath) => {
    try {
      const result = await pageLoader(url, dirPath.output);
      console.log(result);
    } catch ({ message }) {
      console.error(message);
      process.exit(1);
    }
  })
  .parse(process.argv);
