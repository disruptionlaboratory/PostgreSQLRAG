const express = require("express");
const { Sequelize, Op } = require("sequelize");

const { post } = require("axios");
const nlp = require("compromise");

const es6Renderer = require("express-es6-template-engine");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const dotenv = require("dotenv");

dotenv.config();

const db = require("./models");
const { calculate } = require("./pricing");

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

app.get("/", async (req, res) => {
  try {
    res.render("layout", {
      locals: {
        title: "",
      },
      partials: {
        partial: "/index",
      },
    });
  } catch (e) {
    console.log(e);
  }
});

app.get("/articles", async (req, res) => {
  try {
    res.render("layout", {
      locals: {
        title: "",
      },
      partials: {
        partial: "/articles",
      },
    });
  } catch (e) {
    console.log(e);
  }
});

app.post("/api/articles/infer", async (req, res) => {
  try {
    const { systemPrompt, prompt, threshold, limit, model } = req.body;
    const response = await post(
      "http://postgresql_rag_embeddings:7272/api/generate-embedding",
      {
        sentence: prompt,
      },
    );
    const embeddings = response.data.embedding[0];
    // We now want to perform similarity search...
    const results = await db.sequelize.query(
      `SELECT id,
          articles_id,
              sentence,
              embedding,
              1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
       FROM articles_embeddings
       WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > ${threshold}
       ORDER BY similarity DESC
         LIMIT ${limit}`,
    );

    const items = results[0];

    // We now want to capture the appropriate articles
    const uniqueArticles = [];

    items.forEach((i) => {
      if (!uniqueArticles.includes(i.articles_id)) {
        uniqueArticles.push(i.articles_id);
      }
    });

    const articles = await db.articles.findAll({
      where: {
        id: {
          [Op.in]: uniqueArticles, // Use Op.in to check if the id is in the array
        },
      },
    });

    let context = "Context: ";

    articles.forEach((article) => {
      context += "\n\n\n" + article.content;
    });

    const promptData =
      systemPrompt + "\n" + context + "\nUser: " + prompt + "\nSystem: ";

    console.log(promptData);

    const llmResponse = await post(
      "http://host.docker.internal:11434/api/generate",
      {
        model: model,
        stream: false,
        prompt: promptData,
      },
    );

    console.log(llmResponse.data);

    const inputTokens = llmResponse.data.prompt_eval_count;
    const outputTokens = llmResponse.data.eval_count;

    const inputTokenCostPerThousand = 0.001;
    const outputTokenCostPerThousand = 0.002;

    const promptsPerDay = 1000;

    res.json({
      data: {
        model: llmResponse.data.model,
        duration: llmResponse.data.eval_duration / 1000000,
        output_tokens: outputTokens,
        input_tokens: inputTokens,
        response: llmResponse.data.response,
        cost: calculate(
          inputTokens,
          outputTokens,
          inputTokenCostPerThousand,
          outputTokenCostPerThousand,
        ),
      },
    });
  } catch (e) {
    console.log(JSON.stringify(e));
    res.json({ message: "Oops", details: JSON.stringify(e) });
  }
});

app.post("/api/infer", async (req, res) => {
  try {
    const { systemPrompt, prompt, threshold, limit, model } = req.body;
    const response = await post(
      "http://postgresql_rag_embeddings:7272/api/generate-embedding",
      {
        sentence: prompt,
      },
    );
    const embeddings = response.data.embedding[0];
    // We now want to perform similarity search...
    const results = await db.sequelize.query(
      `SELECT id,
              description,
              embedding,
              1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
       FROM knowledge
       WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > ${threshold}
       ORDER BY similarity DESC
         LIMIT ${limit}`,
    );

    const items = results[0];

    let context = "Context: ";

    items.forEach((item) => {
      context += "\n" + item.description;
    });

    const promptData =
      systemPrompt + "\n" + context + "\nUser: " + prompt + "\nSystem: ";

    console.log(promptData);

    const llmResponse = await post(
      "http://host.docker.internal:11434/api/generate",
      {
        model: model,
        stream: false,
        prompt: promptData,
      },
    );

    console.log(llmResponse.data);

    const inputTokens = llmResponse.data.prompt_eval_count;
    const outputTokens = llmResponse.data.eval_count;

    const inputTokenCostPerThousand = 0.001;
    const outputTokenCostPerThousand = 0.002;

    const promptsPerDay = 1000;

    res.json({
      data: {
        model: llmResponse.data.model,
        duration: llmResponse.data.eval_duration / 1000000,
        output_tokens: outputTokens,
        input_tokens: inputTokens,
        response: llmResponse.data.response,
        cost: calculate(
          inputTokens,
          outputTokens,
          inputTokenCostPerThousand,
          outputTokenCostPerThousand,
        ),
      },
    });
  } catch (e) {
    console.log(JSON.stringify(e));
    res.json({ message: "Oops", details: JSON.stringify(e) });
  }
});

app.post("/api/search", async (req, res) => {
  try {
    const { search, threshold, limit } = req.body;
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
              embedding,
              1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
       FROM knowledge
       WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > ${threshold}
       ORDER BY similarity DESC
         LIMIT ${limit}`,
    );
    res.json(results[0]);
  } catch (e) {
    console.log(JSON.stringify(e));
    res.json({ message: "Oops", details: JSON.stringify(e) });
  }
});

app.post("/api/articles", async (req, res) => {
  try {
    const { content } = req.body;

    console.log(content);

    const article = await db.articles.create({
      content,
    });

    const sentences = nlp(content)
      .sentences()
      .out("array")
      .filter((i) => i.length > 25); // Filtering out "noise" where one or two words is treated as a sentence
    console.log(sentences);

    for (sentence of sentences) {
      const response = await post(
        "http://postgresql_rag_embeddings:7272/api/generate-embedding",
        {
          sentence: sentence,
        },
      );
      const embeddings = response.data.embedding[0];

      const articleEmbedding = await db.articles_embeddings.create(
        {
          articles_id: article.id,
          sentence: sentence,
          embedding: `[${embeddings.join(", ")}]`,
        },
        { raw: true },
      );
    }

    res.json(article);
  } catch (e) {
    console.log(JSON.stringify(e));
    res.json({ message: "Oops", details: JSON.stringify(e) });
  }
});

app.post("/api/articles/search", async (req, res) => {
  try {
    const { search, threshold, limit } = req.body;
    const response = await post(
      "http://postgresql_rag_embeddings:7272/api/generate-embedding",
      {
        sentence: search,
      },
    );
    const embeddings = response.data.embedding[0];

    console.log(embeddings);

    // We now want to perform similarity search...
    const results = await db.sequelize.query(
      `SELECT id, 
                articles_id,
              sentence,
              embedding,
              1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
       FROM articles_embeddings
       WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > ${threshold}
       ORDER BY similarity DESC
         LIMIT ${limit}`,
    );
    res.json(results[0]);
  } catch (e) {
    console.log(JSON.stringify(e));
    res.json({ message: "Oops", details: JSON.stringify(e) });
  }
});

app.post("/api/knowledge/batch", async (req, res) => {
  try {
    const { content } = req.body;

    console.log(content);

    const sentences = nlp(content)
      .sentences()
      .out("array")
      .filter((i) => i.length > 25); // Filtering out "noise" where one or two words is treated as a sentence
    console.log(sentences);

    for (sentence of sentences) {
      const response = await post(
        "http://postgresql_rag_embeddings:7272/api/generate-embedding",
        {
          sentence: sentence,
        },
      );
      const embeddings = response.data.embedding[0];
      const k = await db.knowledge.create(
        {
          description: sentence,
          embedding: `[${embeddings.join(", ")}]`,
        },
        { raw: true },
      );
    }

    res.json({
      content: sentences,
    });
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
