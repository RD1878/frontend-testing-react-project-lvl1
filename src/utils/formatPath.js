const formatPath = (path) => {
  if (path === '/') {
    return '';
  }
  return path.replace(/\W/g, '-');
};

export default formatPath;
