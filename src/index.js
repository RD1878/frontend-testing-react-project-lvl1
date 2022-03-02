import fs from 'fs';
import path from 'path';
import axios from 'axios';
import convertUrl from './utils/convertUrl.js';

export default async (url, dirPath) => {
  try {
    const response = await axios.get(url);
    const formattedDirPath = `.${dirPath}`;
    if (response.status === 200) {
      if (!fs.existsSync(formattedDirPath)) {
        await fs.promises.mkdir(formattedDirPath);
      }
      const fileName = `${convertUrl(url)}.html`;
      const resultPath = path.join(formattedDirPath, fileName);
      await fs.promises.writeFile(resultPath, response.data);
      return resultPath;
    }
    return 'Error';
  } catch (e) {
    console.log(e);
    return 'Error';
  }
};
