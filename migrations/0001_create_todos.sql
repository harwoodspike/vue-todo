CREATE TABLE IF NOT EXISTS todos (
    id      TEXT    PRIMARY KEY,
    content TEXT    NOT NULL,
    isDone  INTEGER NOT NULL DEFAULT 0
);
