-- SQL Migration: Correção de Colunas Ausentes para Edição de Perfil
-- Execute este comando no SQL Editor do Supabase para adicionar as colunas faltantes

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS favorite_verse TEXT;
