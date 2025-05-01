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

app.get("/api/embeddings", async (req, res) => {
  try {
    const sentence = "The green shoots of recovery can be seen";

    const response = await post(
      "http://postgresql_rag_embeddings:7272/api/generate-embedding",
      {
        sentence: sentence,
      },
    );
    // console.log(response.data.embedding);

    // res.json({ message: JSON.stringify(response.data.embedding) });

    // const data = JSON.parse(response.data);
    // console.log(data.embedding);

    // console.log(`length: ${response.data.embedding[0].length}`);

    // const embeddings = "[" + response.data.embedding[0].join(", ") + "]";
    // const embeddings = [ response.data.embedding[0].join(", ") + "]";
    const embeddings = response.data.embedding[0];

    // let embeddings = []

    // console.log(embeddings);

    res.json(embeddings);

    // const k = await db.knowledge.create({
    //   description: sentence,
    //   embedding: embeddings,
    // });

    // res.json(k.toJSON());
  } catch (e) {
    console.log(JSON.stringify(e));
    res.json({ message: "Oops", details: JSON.stringify(e) });
  }
});

app.use(express.static("public", { etag: false, lastModified: false }));

app.listen(process.env.INTERNAL_PORT, () => {
  console.log(`Server listening on port ${process.env.INTERNAL_PORT}`);
});
