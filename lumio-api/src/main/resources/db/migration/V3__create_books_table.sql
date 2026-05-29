CREATE TABLE books (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id             UUID         NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title                 VARCHAR(255) NOT NULL,
    description           TEXT,
    cover_image_key       VARCHAR(500),
    order_index           INTEGER      NOT NULL,
    required              BOOLEAN      NOT NULL DEFAULT false,
    prerequisite_book_ids UUID[]                 DEFAULT '{}',
    yaml_key              VARCHAR(500),
    duration_minutes      INTEGER,
    level                 VARCHAR(50),
    language              VARCHAR(10),
    author                VARCHAR(255),
    status                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_book_module_order UNIQUE (module_id, order_index)
);

CREATE INDEX idx_books_module_id ON books(module_id);
