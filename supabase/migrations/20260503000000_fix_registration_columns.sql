-- SQL Migration: Correção de Colunas Ausentes para Cadastro (Fase 20)
-- Execute este comando no SQL Editor do Supabase para corrigir o erro de cadastro

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS "isServing" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "coins" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending';
