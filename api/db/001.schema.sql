CREATE EXTENSION vector;

CREATE TABLE knowledge (
    id SERIAL PRIMARY KEY,
    description TEXT,
    embedding VECTOR(768)
);