const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Knowledge = sequelize.define(
    "Knowledge",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      embedding: {
        type: DataTypes.TSVECTOR,
        allowNull: false,
      },
    },
    {
      tableName: "knowledge",
      timestamps: false,
    },
  );

  return Knowledge;
};
