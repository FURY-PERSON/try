-- Enable pg_trgm extension for trigram-based similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for fast similarity lookups on statement columns
CREATE INDEX "Question_statement_trgm_idx" ON "Question" USING GIN ("statement" gin_trgm_ops);
CREATE INDEX "CollectionItem_statement_trgm_idx" ON "CollectionItem" USING GIN ("statement" gin_trgm_ops);
