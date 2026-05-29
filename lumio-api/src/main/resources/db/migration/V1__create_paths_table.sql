CREATE TABLE paths (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    vertical    VARCHAR(50)  NOT NULL,
    thumbnail   VARCHAR(500),
    theme       VARCHAR(50),
    metadata    JSONB,
    status      VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
