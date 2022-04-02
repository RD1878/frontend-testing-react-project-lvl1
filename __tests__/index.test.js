import os from 'os';
import path from 'path';
import fs from 'fs';
import nock from 'nock';
import pageLoader from '../src/index.js';

const getFixturePath = (name) => path.join(__dirname, '__fixtures__', name);
const getFlattenHtml = (htmlValue) => htmlValue.replace(/\s*/g, '');
const getFileValue = async (dirPath, filename) => {
  const res = await fs.promises.readFile(path.join(dirPath, filename), 'utf-8');
  return res;
};

const baseUrl = 'https://ru.hexlet.io';
const uri = '/courses';
const expectedHtmlFileName = 'ru-hexlet-io-courses.html';
const responseHtmlFileName = 'responsePage.html';
const savedHtmlFileName = 'savedPage.html';
const scope = nock(baseUrl).persist();
const errorNumbers = [404, 500];

const resourcesData = [
  {
    name: 'linkCss',
    uri: '/assets',
    fileName: 'application.css',
    expectedFileName: 'ru-hexlet-io-assets-application.css',
    pathFile: '/assets/application.css',
  },
  {
    name: 'linkHtml',
    uri: '/courses',
    fileName: 'responsePage.html',
    expectedFileName: 'ru-hexlet-io-courses.html',
    pathFile: '/courses',
  },
  {
    name: 'image',
    uri: '/assets/professions',
    fileName: 'nodejs.png',
    expectedFileName: 'ru-hexlet-io-assets-professions-nodejs.png',
    pathFile: '/assets/professions/nodejs.png',
  },
  {
    name: 'script',
    uri: '/packs/js',
    fileName: 'runtime.js',
    expectedFileName: 'ru-hexlet-io-packs-js-runtime.js',
    pathFile: '/packs/js/runtime.js',
  },
];

let dirPath = '';
let url = '';
let expectedHtmlFilePath = '';
let expectedFile;
let responseFile;

beforeAll(async () => {
  url = `${baseUrl}${uri}`;
  responseFile = await getFileValue(path.join(__dirname, '__fixtures__'), responseHtmlFileName);
  expectedFile = await getFileValue(path.join(__dirname, '__fixtures__'), savedHtmlFileName).then((res) => getFlattenHtml(res));
});

beforeEach(async () => {
  dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expectedHtmlFilePath = path.join(dirPath, expectedHtmlFileName);
  const expectedFilesPath = `${expectedHtmlFilePath.slice(0, -5)}_files`;
  await fs.promises.mkdir(expectedFilesPath);
});

describe('positive tests', () => {
  test('check files', async () => {
    scope
      .get(uri)
      .reply(200, responseFile);
    await pageLoader(url, dirPath);
    const actualFiles = await fs.promises.readdir(dirPath);
    const actualHtmlFile = actualFiles.find((file) => file.match(/.html$/));
    const actualHtmlFilePath = path.join(dirPath, actualHtmlFile);
    const actualHtmlValue = getFlattenHtml(await fs.promises.readFile(actualHtmlFilePath, 'utf-8'));
    await expect(actualHtmlFilePath).toEqual(expectedHtmlFilePath);
    await expect(actualHtmlValue).toEqual(expectedFile);
  });

  test.each(resourcesData)('check sources values', async ({ fileName, expectedFileName }) => {
    const index = resourcesData.findIndex((item) => item.fileName === fileName);
    const value = await getFileValue(path.join(__dirname, '__fixtures__'), fileName);
    scope
      .get(uri)
      .reply(200, responseFile)
      .get(resourcesData[index].pathFile)
      .reply(200, value);
    await pageLoader(url, dirPath);
    const actualFiles = await fs.promises.readdir(dirPath);
    const actualSourcesDir = actualFiles.find((file) => file.match(/files$/));
    const actualSourcesDirPath = path.join(dirPath, actualSourcesDir);
    const actualValue = await getFileValue(actualSourcesDirPath, expectedFileName);
    const expectedValue = await getFileValue(path.join(__dirname, '__fixtures__'), fileName);
    await expect(actualValue).toEqual(expectedValue);
  });
});

describe('negative tests', () => {
  test.each(errorNumbers)('check with 404/500 error', async (code) => {
    nock(baseUrl).get(`/${code}`).reply(code);
    const failUrl = new URL(`/${code}`, baseUrl).toString();
    await expect(pageLoader(failUrl, dirPath))
      .rejects.toThrow(new RegExp(code));
  });

  test('check with file system error', async () => {
    const failDir = '/fail_Dir';
    const file = getFixturePath('nodejs.png');
    scope
      .get(uri)
      .reply(200);
    await expect(pageLoader(url, failDir)).rejects.toThrow('ENOENT');
    await expect(pageLoader(url, file)).rejects.toThrow('ENOTDIR');
  });
});
