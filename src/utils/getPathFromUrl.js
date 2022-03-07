const getPathFromUrl = (url) => {
  if (!url) {
    return '';
  }
  if (url.match(/^https?/)) {
    return new URL(url).pathname;
  } return url;
};

export default getPathFromUrl;
