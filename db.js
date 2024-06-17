const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL);

sequelize
  // .sync() // for adding new models
  // .sync({alter: true}) // for updating models
  .authenticate() // just for auth to db
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error);
  });

module.exports = sequelize;
