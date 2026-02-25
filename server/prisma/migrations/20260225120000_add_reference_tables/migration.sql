-- CreateTable
CREATE TABLE "nickname_adjectives" (
    "id" TEXT NOT NULL,
    "textRu" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nickname_adjectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nickname_animals" (
    "id" TEXT NOT NULL,
    "textRu" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nickname_animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avatar_emojis" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_emojis_pkey" PRIMARY KEY ("id")
);
