require('dotenv-flow').config();

module.exports = {
  development: {
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./data.sqlite"
  },
  test: {
    dialect: "sqlite",
    storage: ":memory:"
  },
  production: {
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./data.sqlite"
  }
};