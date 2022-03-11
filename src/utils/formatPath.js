const formatPath = (path) => {
  let result = '';
  if (path === '/') {
    return result;
  }
  if (path[path.length - 1] === '/') {
    result = path.slice(0, -1);
    return result.replace(/\W/g, '-');
  }
  return path.replace(/\W/g, '-');
};

export default formatPath;
