import os from 'os';
import path from 'path';
import fs from 'fs';
import nock from 'nock';
import cheerio from 'cheerio';
import pageLoader from '../src/index.js';
import isValidHttpUrl from '../src/utils/isValidHttpUrl.js';
import getOriginFromUrl from '../src/utils/getOriginFromUrl.js';
import getPathFromUrl from '../src/utils/getPathFromUrl.js';

const getFixturePath = (name) => path.join(__dirname, '__fixtures__', name);
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
const setExpectedSourcesData = (file, selector, arraySources, arrayFilenames, baseUrl) => {
  const $ = cheerio.load(file);
  $(selector).each((function formatter(i) {
    const source = $(this).attr(selector === 'link' ? 'href' : 'src');
    const isInValidSource = isValidHttpUrl(source) && getOriginFromUrl(source) !== baseUrl;
    // eslint-disable-next-line no-param-reassign
    arraySources[i] = source;
    // eslint-disable-next-line prefer-destructuring,no-param-reassign
    arrayFilenames[i] = !isInValidSource ? source.split('/')[1] : '';
  }));
};

const setHtmlSources = (file, selector, arraySources) => {
  const $ = cheerio.load(file);
  $(selector).each((function formatter(i) {
    // eslint-disable-next-line no-param-reassign
    arraySources[i] = $(this).attr(selector === 'link' ? 'href' : 'src');
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

  setExpectedSourcesData(expectedFile, 'img', expectedImagesSources, expectedNamesImageFiles, baseUrl);
  setExpectedSourcesData(expectedFile, 'link', expectedLinksSources, expectedNamesLinkFiles, baseUrl);
  setExpectedSourcesData(expectedFile, 'script', expectedScriptsSources, expectedNamesScriptFiles, baseUrl);

  setHtmlSources(responseFile, 'img', responseImagesSources);
  setHtmlSources(responseFile, 'link', responseLinksSources);
  setHtmlSources(responseFile, 'script', responseScriptsSources);
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
  const actualNamesImageFiles = actualNamesFiles.filter((file) => {
    const ext = file.slice(-3);
    return ext === 'png' || ext === 'jpg';
  });
  const actualNamesScriptFiles = actualNamesFiles.filter((file) => file.slice(-2) === 'js');
  const actualNamesLinkFiles = actualNamesFiles.filter(
    (file) => !actualNamesImageFiles.includes(file)
    && !actualNamesScriptFiles.includes(file),
  );

  const actualHtmlContent = await fs.promises.readFile(actualHtmlFilePath, { encoding: 'utf-8' });

  const actualImagesSources = [];
  const actualLinksSources = [];
  const actualScriptSources = [];

  setHtmlSources(actualHtmlContent, 'img', actualImagesSources);
  setHtmlSources(actualHtmlContent, 'link', actualLinksSources);
  setHtmlSources(actualHtmlContent, 'script', actualScriptSources);

  const filtredExpectedNamesImageFiles = expectedNamesImageFiles.filter((item) => item);
  const filtredExpectedNamesLinkFiles = expectedNamesLinkFiles.filter((item) => item);
  const filtredExpectedNamesScriptFiles = expectedNamesScriptFiles.filter((item) => item);
  expect(actualImagesSources).toEqual(expectedImagesSources);
  expect(actualLinksSources).toEqual(expectedLinksSources);
  expect(actualScriptSources).toEqual(expectedScriptsSources);

  expect(actualNamesImageFiles).toEqual(filtredExpectedNamesImageFiles);
  expect(actualNamesLinkFiles).toEqual(filtredExpectedNamesLinkFiles);
  expect(actualNamesScriptFiles).toEqual(filtredExpectedNamesScriptFiles);
});

test('check with request error', async () => {
  const responseCode = 404;
  nock(baseUrl)
    .get(uri)
    .reply(responseCode);
  await expect(pageLoader(url, dirPath)).rejects.toThrow(`
      ERROR
      Message: Request failed with status code ${responseCode};
      Code: undefined;
      URL: ${baseUrl}${uri};
      Response code: ${responseCode}
      `);
});
