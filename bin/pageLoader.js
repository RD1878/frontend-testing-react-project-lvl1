#!/usr/bin/env node
import { program } from 'commander';
import process from 'process';
import pageLoader from '../src/index.js';

program
  .version('1.0.0')
  .description('Page download')
  .option('-o, --output', 'output directory', '/app')
  .argument('<url>')
  .argument('[dirPath]', '', '/app')
  .action(async (url, dirPath) => {
    console.log(await pageLoader(url, dirPath));
  })
  .parse(process.argv);
