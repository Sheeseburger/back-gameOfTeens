const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({path: path.resolve(__dirname, './config.env')});

process.on('uncaughtException', err => {
  console.log('unchaughtException!! Shutting down server...');
  console.log(err.name, err.message);
  // process.exit(1);
});
const DB = process.env.DATABASE;

mongoose.connect(DB).then(() => {
  console.log('DB connected!');
});
const app = require('./app');

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
