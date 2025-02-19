import dotenv from "dotenv";
dotenv.config();

const config = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "test_db",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
    logging: false
  },
  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "test_db_test",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
    logging: false
  },
  production: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "test_db_prod",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
    logging: false
  }
};


export default config