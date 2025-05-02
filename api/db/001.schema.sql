CREATE
EXTENSION vector;

CREATE TABLE knowledge
(
    id          SERIAL PRIMARY KEY,
    description TEXT,
    embedding VECTOR(768)
);

CREATE TABLE articles
(
    id      SERIAL PRIMARY KEY,
    content TEXT
);

CREATE TABLE articles_embeddings
(
    id          SERIAL PRIMARY KEY,
    articles_id INT,
    sentence    TEXT,
    embedding VECTOR(768),
    CONSTRAINT fk_articles_id
        FOREIGN KEY (articles_id)
            REFERENCES articles (id)
);