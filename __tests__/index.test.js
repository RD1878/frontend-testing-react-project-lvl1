import os from 'os';
import path from 'path';
import fs from 'fs';
import nock from 'nock';
import pageLoader from '../src/index.js';

const baseUrl = 'https://web.ru.page';
const uri = '/downloaded';
const expectedFilename = 'web-ru-page-downloaded.html';

let dirPath = '';
let url = '';

beforeAll(() => {
  url = `${baseUrl}${uri}`;
});

beforeEach(async () => {
  dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('checkFileName', async () => {
  nock(baseUrl)
    .get(uri)
    .reply(200);
  await pageLoader(url, dirPath);
  const files = await fs.promises.readdir(dirPath);
  const actualPath = path.join(dirPath, files[0]);
  const expectedFilePath = path.join(dirPath, expectedFilename);
  expect(actualPath).toEqual(expectedFilePath);
});
