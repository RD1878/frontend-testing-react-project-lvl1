import os from 'os';
import path from 'path';
import fs from 'fs';
import pageLoader from '../src/index.js';

const url = 'https://web.ru.page/downloaded';
const filename = 'web-ru-page-downloaded.html';

let dirPath;

beforeEach(async () => {
  dirPath = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('checkFileName', async () => {
  await pageLoader(url, dirPath);
  const files = await fs.promises.readdir(dirPath, {
    withFileTypes: true,
  });
  const actualPath = path.join(dirPath, files[0]);
  const expectedFilePath = path.join(dirPath, filename);
  expect(actualPath).toEqual(expectedFilePath);
});
