const express = require("express");

const { post } = require("axios");

const es6Renderer = require("express-es6-template-engine");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const dotenv = require("dotenv");

dotenv.config();

const db = require("./models");

const app = express();

app.engine("html", es6Renderer);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const corsOptions = {
  origin: ["http://localhost:8383"],
};
app.use(cors(corsOptions));

app.use(cookieParser());

app.get("/api/ping", (req, res) => {
  res.status(200);
  res.json({
    message: "Pong!",
  });
});

app.post("/api/search", async (req, res) => {
  try {
    const { search } = req.body;
    const response = await post(
      "http://postgresql_rag_embeddings:7272/api/generate-embedding",
      {
        sentence: search,
      },
    );
    const embeddings = response.data.embedding[0];
    // We now want to perform similarity search...
    const results = await db.sequelize.query(
      `SELECT id,
              description,
              1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
       FROM knowledge
       WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > 0.5
       ORDER BY similarity DESC
         LIMIT 3`,
    );
    res.json(results[0]);
  } catch (e) {
    console.log(JSON.stringify(e));
    res.json({ message: "Oops", details: JSON.stringify(e) });
  }
});

app.post("/api/knowledge", async (req, res) => {
  try {
    const { description } = req.body;
    const response = await post(
      "http://postgresql_rag_embeddings:7272/api/generate-embedding",
      {
        sentence: description,
      },
    );
    const embeddings = response.data.embedding[0];
    const k = await db.knowledge.create(
      {
        description,
        embedding: `[${embeddings.join(", ")}]`,
      },
      { raw: true },
    );
    res.json(k.toJSON());
  } catch (e) {
    console.log(JSON.stringify(e));
    res.json({ message: "Oops", details: JSON.stringify(e) });
  }
});

app.use(express.static("public", { etag: false, lastModified: false }));

app.listen(process.env.INTERNAL_PORT, () => {
  console.log(`Server listening on port ${process.env.INTERNAL_PORT}`);
});
