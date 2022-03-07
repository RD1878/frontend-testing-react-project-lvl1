const getOriginFromUrl = (url) => {
  if (!url) {
    return '';
  }
  return new URL(url).origin;
};

export default getOriginFromUrl;
