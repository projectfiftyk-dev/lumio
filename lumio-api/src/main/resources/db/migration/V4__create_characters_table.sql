CREATE TABLE characters (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id     UUID         NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
    slug        VARCHAR(100) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    personality TEXT,
    avatar_path VARCHAR(500),
    voice_id    VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_character_path_slug UNIQUE (path_id, slug)
);

CREATE INDEX idx_characters_path_id ON characters(path_id);
