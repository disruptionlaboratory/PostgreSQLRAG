const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ArticleEmbedding = sequelize.define(
    "ArticleEmbedding",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      articles_id: {
        type: DataTypes.INTEGER,
      },
      sentence: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      embedding: {
        type: DataTypes.TSVECTOR,
        allowNull: false,
      },
    },
    {
      tableName: "articles_embeddings",
      timestamps: false,
    },
  );

  return ArticleEmbedding;
};
