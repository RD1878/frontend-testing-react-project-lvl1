#!/usr/bin/env node
import { program } from 'commander';
import process from 'process';
import pageLoader from '../src/index.js';

program
  .version('1.0.0')
  .description('Page download')
  .option('-o, --output', 'output directory', 'src')
  .arguments('<url> <dirPath>')
  .action((url, dirPath) => {
    console.log(pageLoader(url, dirPath));
  })
  .parse(process.argv);
