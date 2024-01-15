module.exports = [
  require('./aspida.config'),
  { input: 'api', baseURL: `${process.env.API_ORIGIN}${process.env.API_BASE_PATH}` },
];
