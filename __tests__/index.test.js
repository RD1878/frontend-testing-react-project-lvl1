import os from 'os';
import path from 'path';
import fs from 'fs';
import nock from 'nock';
import cheerio from 'cheerio';
import pageLoader from '../src/index.js';
import isValidHttpUrl from '../src/utils/isValidHttpUrl.js';
import getOriginFromUrl from '../src/utils/getOriginFromUrl.js';
import getPathFromUrl from '../src/utils/getPathFromUrl.js';

const getFixturePath = (name) => path.join('__tests__', '__fixtures__', name);
const getScopes = (sources, baseUrl) => {
  sources.forEach((src) => {
    if (!isValidHttpUrl(src)) {
      nock(baseUrl)
        .get(src)
        .reply(200);
    }
    if (isValidHttpUrl(src) && getOriginFromUrl(src) === baseUrl) {
      nock(baseUrl)
        .get(getPathFromUrl(src))
        .reply(200);
    }
  });
};
const setExpectedSourcesData = (file, selector, attr, arraySources, arrayFilenames, baseUrl) => {
  const $ = cheerio.load(file);
  $(selector).each((function (i) {
    const source = $(this).attr(attr);
    if (!isValidHttpUrl(source)
      || (isValidHttpUrl(source) && getOriginFromUrl(source) === baseUrl)) {
      // eslint-disable-next-line no-param-reassign
      arraySources[i] = source;
      // eslint-disable-next-line prefer-destructuring,no-param-reassign
      arrayFilenames[i] = source.split('/')[1];
    }
  }));
};

const setResponseSourcesData = (file, selector, arraySources, attr) => {
  const $ = cheerio.load(file);
  $(selector).each((function (i) {
    // eslint-disable-next-line no-param-reassign
    arraySources[i] = $(this).attr(attr);
  }));
};

const setActualSourcesData = (file, selector, attr, arraySources) => {
  const $ = cheerio.load(file);
  $(selector).each((function (i) {
    const source = $(this).attr(attr);
    if (!isValidHttpUrl(source)) {
      // eslint-disable-next-line no-param-reassign
      arraySources[i] = source;
    }
  }));
};

const baseUrl = 'https://ru.hexlet.io';
const uri = '/courses';
const expectedFilename = 'ru-hexlet-io-courses.html';
const responseFileName = 'responsePage.html';
const savedFileName = 'savedPage.html';

let dirPath = '';
let url = '';
let expectedHtmlFilePath = '';
let expectedFile;
const expectedImagesSources = [];
const expectedLinksSources = [];
const expectedScriptsSources = [];

const expectedNamesImageFiles = [];
const expectedNamesLinkFiles = [];
const expectedNamesScriptFiles = [];

let responseFile;
const responseImagesSources = [];
const responseLinksSources = [];
const responseScriptsSources = [];

beforeAll(async () => {
  url = `${baseUrl}${uri}`;
  responseFile = await fs.promises.readFile(getFixturePath(responseFileName), 'utf-8');
  expectedFile = await fs.promises.readFile(getFixturePath(savedFileName), 'utf-8');

  setExpectedSourcesData(expectedFile, 'img', 'src', expectedImagesSources, expectedNamesImageFiles, baseUrl);
  setExpectedSourcesData(expectedFile, 'link', 'href', expectedLinksSources, expectedNamesLinkFiles, baseUrl);
  setExpectedSourcesData(expectedFile, 'script', 'src', expectedScriptsSources, expectedNamesScriptFiles, baseUrl);

  setResponseSourcesData(responseFile, 'img', responseImagesSources, 'src');
  setResponseSourcesData(responseFile, 'link', responseLinksSources, 'href');
  setResponseSourcesData(responseFile, 'script', responseScriptsSources, 'src');
});

beforeEach(async () => {
  dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expectedHtmlFilePath = path.join(dirPath, expectedFilename);
  const expectedFilesPath = `${expectedHtmlFilePath.slice(0, -5)}_files`;
  await fs.promises.mkdir(expectedFilesPath);
});

test('checkFileName', async () => {
  nock(baseUrl)
    .get(uri)
    .reply(200);
  await pageLoader(url, dirPath);
  const actualFiles = await fs.promises.readdir(dirPath);
  const actualHtmlFile = actualFiles.find((file) => file.match(/.html$/));
  const actualHtmlFilePath = path.join(dirPath, actualHtmlFile);
  expect(actualHtmlFilePath).toEqual(expectedHtmlFilePath);
});

test('checkDownloadedFiles', async () => {
  nock(baseUrl)
    .get(uri)
    .reply(200, responseFile);

  getScopes(responseImagesSources, baseUrl);
  getScopes(responseLinksSources, baseUrl);
  getScopes(responseScriptsSources, baseUrl);

  await pageLoader(url, dirPath);

  const actualFiles = await fs.promises.readdir(dirPath);
  const actualHtmlFile = actualFiles.find((file) => file.match(/.html$/));
  const actualHtmlFilePath = path.join(dirPath, actualHtmlFile);
  const actualDirPathOfFiles = `${actualHtmlFilePath.slice(0, -5)}_files`;
  const actualNamesFiles = await fs.promises.readdir(actualDirPathOfFiles);
  const actualNamesImageFiles = actualNamesFiles.filter((file) => file.slice(-3) === 'png' || 'jpg');
  const actualNamesLinkFiles = actualNamesFiles.filter((file) => file.slice(-3) === 'css');
  const actualNamesScriptFiles = actualNamesFiles.filter((file) => file.slice(-2) === 'js');
  const actualHtmlContent = await fs.promises.readFile(actualHtmlFilePath, { encoding: 'utf-8' });

  const actualImagesSources = [];
  const actualLinksSources = [];
  const actualScriptSources = [];

  setActualSourcesData(actualHtmlContent, 'img', 'src', actualImagesSources);
  setActualSourcesData(actualHtmlContent, 'link', 'href', actualLinksSources);
  setActualSourcesData(actualHtmlContent, 'script', 'src', actualScriptSources);

  expect(actualImagesSources).toEqual(expectedImagesSources);
  expect(actualLinksSources).toEqual(expectedLinksSources);
  expect(actualScriptSources).toEqual(expectedScriptsSources);

  expect(actualNamesImageFiles).toEqual(expectedNamesImageFiles);
  expect(actualNamesLinkFiles).toEqual(expectedNamesLinkFiles);
  expect(actualNamesScriptFiles).toEqual(expectedNamesScriptFiles);
});
