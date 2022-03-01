import os from 'os';
import path from 'path';
import fs from 'fs';
import nock from 'nock';
import cheerio from 'cheerio';
import pageLoader from '../src/index.js';

const getFixturePath = (name) => path.join('__tests__', '__fixtures__', name);

const baseUrl = 'https://web.ru.page';
const uri = '/downloaded';
const expectedFilename = 'web-ru-page-downloaded.html';
const responseFileName = 'responsePage.html';
const savedFileName = 'savedPage.html';

let dirPath = '';
let url = '';
let expectedFilePath = '';
let expectedDirPathOfFiles = '';
let expectedFile;
let responseFile;
const expectedFilesSrc = [];
let expectedImageFiles;

beforeAll(async () => {
  url = `${baseUrl}${uri}`;
  expectedFile = await fs.promises.readFile(getFixturePath(savedFileName), 'utf-8');
  const $expectedPage = cheerio.load(expectedFile);
  $expectedPage('img').each((function (i) {
    expectedFilesSrc[i] = $expectedPage(this).attr('src');
  }));
  responseFile = await fs.promises.readFile(getFixturePath(responseFileName), 'utf-8');
});

beforeEach(async () => {
  dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expectedFilePath = path.join(dirPath, expectedFilename);
  expectedDirPathOfFiles = await fs.promises.mkdtemp(`${expectedFilePath.slice(0, -5)}_files`);
  expectedImageFiles = await fs.promises.readdir(expectedDirPathOfFiles);
});

test('checkFileName', async () => {
  nock(baseUrl)
    .get(uri)
    .reply(200);
  await pageLoader(url, dirPath);
  const actualHtmlFiles = await fs.promises.readdir(dirPath);
  const actualHtmlPath = path.join(dirPath, actualHtmlFiles[0]);
  expect(actualHtmlPath).toEqual(expectedFilePath);
});

test('checkDownloadedImages', async () => {
  nock(baseUrl)
    .get(uri)
    .reply(200, responseFile);
  await pageLoader(url, dirPath);
  const actualHtmlFiles = await fs.promises.readdir(dirPath);
  const actualHtmlPath = path.join(dirPath, actualHtmlFiles[0]);
  const actualDirPathOfFiles = `${actualHtmlFiles[0].slice(0, -5)}_files`;
  const actualImageFiles = await fs.promises.readdir(actualDirPathOfFiles);
  const actualHtmlContent = await fs.promises.readFile(actualHtmlPath, { encoding: 'utf-8' });
  const $actualPage = cheerio.load(actualHtmlContent);
  const actualFilesSrc = [];
  $actualPage('img').each((function (i) {
    actualFilesSrc[i] = $actualPage(this).attr('src');
  }));
  expect(actualFilesSrc).toEqual(expectedFilesSrc);
  expect(actualImageFiles).toEqual(expectedImageFiles);
});
