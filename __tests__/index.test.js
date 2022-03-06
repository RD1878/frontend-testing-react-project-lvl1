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
let expectedFile;
let responseFile;
const expectedFilesSrc = [];
const responseFilesSrc = [];
const expectedImageFiles = [];

beforeAll(async () => {
  url = `${baseUrl}${uri}`;
  responseFile = await fs.promises.readFile(getFixturePath(responseFileName), 'utf-8');
  expectedFile = await fs.promises.readFile(getFixturePath(savedFileName), 'utf-8');

  const $expectedPage = cheerio.load(expectedFile);
  $expectedPage('img').each((function (i) {
    expectedFilesSrc[i] = $expectedPage(this).attr('src');
    // eslint-disable-next-line prefer-destructuring
    expectedImageFiles[i] = $expectedPage(this).attr('src').split('/')[1];
  }));

  const $responsePage = cheerio.load(responseFile);
  $responsePage('img').each((function (i) {
    responseFilesSrc[i] = $responsePage(this).attr('src');
  }));
});

beforeEach(async () => {
  dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expectedFilePath = path.join(dirPath, expectedFilename);
  const expectedFilesPath = `${expectedFilePath.slice(0, -5)}_files`;
  await fs.promises.mkdir(expectedFilesPath);
});

test('checkFileName', async () => {
  nock(baseUrl)
    .get(uri)
    .reply(200);
  await pageLoader(url, dirPath);
  const actualFiles = await fs.promises.readdir(dirPath);
  const actualHtmlFile = actualFiles.find((file) => file.match(/.html$/));
  const actualHtmlPath = path.join(dirPath, actualHtmlFile);
  expect(actualHtmlPath).toEqual(expectedFilePath);
});

test('checkDownloadedImages', async () => {
  nock(baseUrl)
    .get(uri)
    .reply(200, responseFile);
  responseFilesSrc.forEach((src) => {
    nock(baseUrl)
      .get(src)
      .reply(200);
  });
  await pageLoader(url, dirPath);
  const actualFiles = await fs.promises.readdir(dirPath);
  const actualHtmlFile = actualFiles.find((file) => file.match(/.html$/));
  const actualHtmlPath = path.join(dirPath, actualHtmlFile);
  const actualDirPathOfFiles = `${actualHtmlPath.slice(0, -5)}_files`;
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
