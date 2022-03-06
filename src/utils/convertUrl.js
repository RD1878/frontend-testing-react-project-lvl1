import formatPath from './formatPath.js';

const convertUrl = (url) => {
  if (url === '') {
    return '';
  }
  const formattedUrl = `${new URL(url).host}${new URL(url).pathname}`.replace(/\/$/, '');
  return formatPath(formattedUrl);
};

export default convertUrl;
