require('dotenv').config({ path: '../raspi-server/.env' });

module.exports = {
  input: '../raspi-server/api',
  baseURL: `${process.env.API_ORIGIN ?? ''}${process.env.API_BASE_PATH ?? ''}`,
};
