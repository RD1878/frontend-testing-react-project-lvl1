import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import convertUrl from './utils/convertUrl.js';
import getPathFromUrl from './utils/getPathFromUrl.js';
import formatPath from './utils/formatPath.js';
import getOriginFromUrl from './utils/getOriginFromUrl.js';

export default async (url, dirPath) => {
  try {
    const response = await axios.get(url);
    const formattedDirPath = dirPath === '/app' ? `./${dirPath}` : dirPath;
    if (response.status === 200) {
      if (!fs.existsSync(formattedDirPath)) {
        await fs.promises.mkdir(formattedDirPath);
      }
      const htmlFileName = `${convertUrl(url)}.html`;
      const filesDirectoryName = `${convertUrl(url)}_files`;
      const filesPath = path.join(formattedDirPath, filesDirectoryName);
      if (!fs.existsSync(filesPath)) {
        await fs.promises.mkdir(filesPath);
      }
      const htmlPath = path.join(formattedDirPath, htmlFileName);
      const $ = cheerio.load(response.data);
      $('img').map(function () {
        const imageSrc = $(this).attr('src');
        const splitImageSrc = getPathFromUrl(imageSrc).split('.');
        const lastEl = splitImageSrc.length - 1;
        if (splitImageSrc[lastEl] === 'png' || splitImageSrc[lastEl] === 'img') {
          const formattedSrc = `${filesDirectoryName}/${convertUrl(getOriginFromUrl(url))}${formatPath(splitImageSrc[0])}.${splitImageSrc[1]}`;
          const filePath = fs.createWriteStream(path.join(formattedDirPath, formattedSrc));
          axios({
            method: 'GET',
            url: imageSrc,
            baseURL: `${getOriginFromUrl(url)}`,
            responseType: 'stream',
          }).then((res) => res.data.pipe(filePath));

          return $(this).attr('src', formattedSrc);
        }
        return $(this).attr('src', imageSrc);
      });
      const resultHtml = $.html();
      await fs.promises.writeFile(htmlPath, resultHtml);
      return htmlPath;
    }
    return 'Error';
  } catch (e) {
    console.log(e);
    return 'Error';
  }
};
