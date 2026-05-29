CREATE TABLE modules (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id     UUID         NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail   VARCHAR(500),
    order_index INTEGER      NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_module_path_order UNIQUE (path_id, order_index)
);

CREATE INDEX idx_modules_path_id ON modules(path_id);
