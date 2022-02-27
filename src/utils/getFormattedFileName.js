const getFormattedFilename = (url) => `${url.replace(/^((http|https):\/\/)/, '').replace(/\W/g, '-')}.html`;

export default getFormattedFilename;
