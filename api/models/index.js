const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config("./../.env");

const sequelize = new Sequelize(
  // @ts-ignore
  process.env.DATABASE_DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    port: process.env.DATABASE_PORT,
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_DIALECT,
    define: {
      timestamps: false,
    },
  },
);

const db = {
  sequelize: sequelize,
  knowledge: require("./knowledges")(sequelize),
};

Object.keys(db).forEach((modelName) => {
  if (modelName !== "sequelize") {
    // @ts-ignore
    if (db[modelName].associate) {
      // @ts-ignore
      db[modelName].associate(db);
    }
  }
});

module.exports = db;
