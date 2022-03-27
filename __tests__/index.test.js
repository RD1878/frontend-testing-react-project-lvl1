import os from 'os';
import path from 'path';
import fs from 'fs';
import nock from 'nock';
import pageLoader from '../src/index.js';

const getFixturePath = (name) => path.join(__dirname, '__fixtures__', name);
const getFlattenHtml = (htmlValue) => htmlValue.replace(/\s*/g, '');

const baseUrl = 'https://ru.hexlet.io';
const responseHtmlFileName = 'responsePage.html';
const savedHtmlFileName = 'savedPage.html';

const resourcesData = {
  html: {
    uri: '/courses',
    fileName: '',
    expectedFileName: 'ru-hexlet-io-courses.html',
    path: '/courses',
  },
  linkCss: {
    uri: '/assets',
    fileName: 'application.css',
    expectedFileName: 'ru-hexlet-io-assets-application.css',
    path: '/assets/application.css',
  },
  linkHtml: {
    uri: '/courses',
    fileName: responseHtmlFileName,
    expectedFileName: 'ru-hexlet-io-courses.html',
    path: '/courses',
  },
  image: {
    uri: '/assets/professions',
    fileName: 'nodejs.png',
    expectedFileName: 'ru-hexlet-io-assets-professions-nodejs.png',
    path: '/assets/professions/nodejs.png',
  },
  script: {
    uri: '/packs/js',
    fileName: 'runtime.js',
    expectedFileName: 'ru-hexlet-io-packs-js-runtime.js',
    path: '/packs/js/runtime.js',
  },
};

let dirPath = '';
let url = '';
let expectedHtmlFilePath = '';
let expectedFile;
let responseFile;
let imageFile;
let linkCssFile;
let linkHtmlFile;
let scriptFile;
let expectedSourcesFilesValues;

beforeAll(async () => {
  url = `${baseUrl}${resourcesData.html.uri}`;
  responseFile = await fs.promises.readFile(getFixturePath(responseHtmlFileName), 'utf-8');
  expectedFile = await fs.promises.readFile(getFixturePath(savedHtmlFileName), 'utf-8').then((res) => getFlattenHtml(res));
  imageFile = await fs.promises.readFile(getFixturePath(resourcesData.image.fileName), 'utf-8');
  linkCssFile = await fs.promises.readFile(getFixturePath(resourcesData.linkCss.fileName), 'utf-8');
  linkHtmlFile = await fs.promises.readFile(getFixturePath(resourcesData.linkHtml.fileName), 'utf-8');
  scriptFile = await fs.promises.readFile(getFixturePath(resourcesData.script.fileName), 'utf-8');
  expectedSourcesFilesValues = [linkCssFile, imageFile, linkHtmlFile, scriptFile];
});

beforeEach(async () => {
  dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expectedHtmlFilePath = path.join(dirPath, resourcesData.html.expectedFileName);
  // console.log(expectedHtmlFilePath);
  const expectedFilesPath = `${expectedHtmlFilePath.slice(0, -5)}_files`;
  await fs.promises.mkdir(expectedFilesPath);
});

test('check files', async () => {
  nock(baseUrl)
    .get(resourcesData.html.uri)
    .reply(200, responseFile)
    .get(resourcesData.image.path)
    .reply(200, imageFile)
    .get(resourcesData.linkCss.path)
    .reply(200, linkCssFile)
    .get(resourcesData.linkHtml.path)
    .reply(200, linkHtmlFile)
    .get(resourcesData.script.path)
    .reply(200, scriptFile);
  await pageLoader(url, dirPath);
  const actualFiles = await fs.promises.readdir(dirPath);
  const actualHtmlFile = actualFiles.find((file) => file.match(/.html$/));
  const actualSourcesDir = actualFiles.find((file) => file.match(/files$/));
  const actualHtmlFilePath = path.join(dirPath, actualHtmlFile);
  const actualSourcesDirPath = path.join(dirPath, actualSourcesDir);
  const actualHtmlFileValue = await fs.promises.readFile(actualHtmlFilePath, 'utf-8');
  const actualFlattenHtmlValue = getFlattenHtml(actualHtmlFileValue);
  const actualSourcesFiles = await fs.promises.readdir(actualSourcesDirPath);
  const actualSourcesFilesValues = await Promise.all(actualSourcesFiles.map((file) => fs.promises.readFile(path.join(actualSourcesDirPath, file), 'utf-8')));
  expect(actualSourcesFilesValues).toEqual(expectedSourcesFilesValues);
  expect(actualHtmlFilePath).toEqual(expectedHtmlFilePath);
  expect(actualFlattenHtmlValue).toEqual(expectedFile);
});

test('check with 404 error', async () => {
  const failString = 'not_found';
  nock(baseUrl)
    .get(`/${failString}`)
    .reply(404);
  const failUrl = new URL(`/${failString}`, baseUrl).toString();
  await expect(pageLoader(failUrl, dirPath)).rejects.toThrow(failString);
});

test('check with 500 error', async () => {
  const failString = 'internal_server_error';
  nock(baseUrl)
    .get(`/${failString}`)
    .reply(500);
  const failUrl = new URL(`/${failString}`, baseUrl).toString();
  await expect(pageLoader(failUrl, dirPath)).rejects.toThrow(failString);
});

test('check with file system error', async () => {
  const failDir = '/fail_Dir';
  nock(baseUrl)
    .get(resourcesData.html.uri)
    .reply(200);
  await expect(pageLoader(url, failDir)).rejects.toThrow('ERROR');
});
