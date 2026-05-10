-- SQL Migration: Expansão do Perfil Ministerial e Dados Pessoais
-- Execute este comando no SQL Editor do Supabase

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
ADD COLUMN IF NOT EXISTS "birthDate" DATE,
ADD COLUMN IF NOT EXISTS "isBaptized" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "wantsToServe" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "serviceArea" TEXT,
ADD COLUMN IF NOT EXISTS "praiseInstrument" TEXT,
ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

-- Nota: Certifique-se de criar o bucket 'avatars' no menu Storage 
-- e deixá-lo como 'Public' para que as fotos de perfil funcionem.
