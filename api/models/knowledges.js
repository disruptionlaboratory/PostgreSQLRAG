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
        // type: DataTypes.BLOB, // Use BLOB with a size (768 bytes here, adjust as needed)
        type: DataTypes.JSON,
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
