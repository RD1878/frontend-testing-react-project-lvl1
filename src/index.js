import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import 'axios-debug-log';
import convertUrl from './utils/convertUrl.js';
import getPathFromUrl from './utils/getPathFromUrl.js';
import formatPath from './utils/formatPath.js';
import getOriginFromUrl from './utils/getOriginFromUrl.js';
import isValidHttpUrl from './utils/isValidHttpUrl.js';

const appName = 'pageLoader';
const log = debug(appName);
log('debugging %o', appName);

const saveFile = async (source, url, filePath) => {
  const res = await axios({
    method: 'GET',
    url: source,
    baseURL: `${getOriginFromUrl(url)}`,
    responseType: 'stream',
  });
  await res.data.pipe(filePath);
};

export default async (url, dirPath) => {
  console.log(dirPath);
  try {
    const response = await axios.get(url);
    log('Request URL:', response.config.url);
    log('Request method:', response.request.method);
    log('Response status:', response.status);
    if (response.status === 200) {
      if (!fs.existsSync(dirPath)) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }

      const htmlFileName = `${convertUrl(url)}.html`;
      const filesDirectoryName = `${convertUrl(url)}_files`;
      const filesPath = path.join(dirPath, filesDirectoryName);

      if (!fs.existsSync(filesPath)) {
        await fs.promises.mkdir(filesPath);
      }

      const htmlPath = path.join(dirPath, htmlFileName);
      const originOfUrl = getOriginFromUrl(url);

      const $ = cheerio.load(response.data);
      $('img').map(function () {
        const source = $(this).attr('src');

        if (isValidHttpUrl(source) && getOriginFromUrl(source) !== originOfUrl) {
          return $(this).attr('src', source);
        }

        const [value, extension] = getPathFromUrl(source).split('.');

        const formattedSrc = `${filesDirectoryName}/${convertUrl(getOriginFromUrl(url))}${formatPath(value)}.${extension}`;
        const filePath = fs.createWriteStream(path.join(dirPath, formattedSrc));
        saveFile(source, url, filePath);
        log('File downloaded to:', filePath.path);

        return $(this).attr('src', formattedSrc);
      });

      $('link').map(function () {
        const source = $(this).attr('href');

        if (!source || (isValidHttpUrl(source) && getOriginFromUrl(source) !== originOfUrl) || (!isValidHttpUrl(source) && source.match(/^\/\//))) {
          return $(this).attr('href', source);
        }

        const [value, extension] = getPathFromUrl(source).split('.');

        const formattedSrc = `${filesDirectoryName}/${convertUrl(getOriginFromUrl(url))}${formatPath(value)}.${extension ?? 'html'}`;
        const filePath = fs.createWriteStream(path.join(dirPath, formattedSrc));
        saveFile(source, url, filePath);
        log('File downloaded to:', filePath.path);

        return $(this).attr('href', formattedSrc);
      });

      $('script').map(function () {
        const source = $(this).attr('src');
        if (!source || (isValidHttpUrl(source) && getOriginFromUrl(source) !== originOfUrl) || (!isValidHttpUrl(source) && source.match(/^\/\//))) {
          return $(this).attr('src', source);
        }

        const [value, extension] = getPathFromUrl(source).split('.');

        const formattedSrc = `${filesDirectoryName}/${convertUrl(getOriginFromUrl(url))}${formatPath(value)}.${extension}`;
        const filePath = fs.createWriteStream(path.join(dirPath, formattedSrc));
        saveFile(source, url, filePath);
        log('File downloaded to:', filePath.path);

        return $(this).attr('src', formattedSrc);
      });

      const resultHtml = $.html();
      await fs.promises.writeFile(htmlPath, resultHtml);
      log('Page saved to:', htmlPath);
      return { filepath: htmlPath };
    }
  } catch (e) {
    const {
      code, response, config, message,
    } = e;
    console.log(e);
    throw new Error(
      `
      ERROR
      Message: ${message};
      Code: ${code};
      URL: ${config?.url};
      Response code: ${response?.status}
      `,
    );
  }
};
