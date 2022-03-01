const convertUrl = (url) => `${url.replace(/^((http|https):\/\/)/, '').replace(/\W/g, '-')}`;

export default convertUrl;
