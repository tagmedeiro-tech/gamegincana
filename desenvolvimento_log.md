# 📓 Log de Desenvolvimento - Gincana da Tribo

Este documento resume as melhorias críticas, correções de bugs e novas funcionalidades implementadas recentemente para estabilizar e expandir o aplicativo.

---

## 🚀 1. Estabilização e Performance (Core)

### 🛠️ Correção do Deadlock de Inicialização
- **Problema:** O aplicativo ficava preso em um loop infinito de carregamento por até 10-15 segundos.
- **Solução:** Removida a chamada redundante de `getSession()` e implementado bypass de Lock no cliente Supabase.

### ⚡ Otimização do Cliente Supabase & Rede
- Implementado padrão **Singleton** para o cliente Supabase.
- **Aumento de Timeout:** Elevado o timeout de rede de **10s para 45s** em `src/lib/supabase.ts`. Isso resolve os erros de "Fetch Timeout" causados pelo *cold start* (acordar do servidor) em instâncias gratuitas do Supabase.

---

## 🛒 2. Módulo de Loja e Gamificação (Novo)

Sistema completo de economia interna implementado.

### 🎁 Gerenciamento de Prêmios (Admin)
- **Editor Moderno:** Criação e edição de itens com nome, custo em pontos, estoque e descrição.
- **Upload de Fotos:** Integração com Supabase Storage (bucket `store_items`) para fotos reais dos prêmios.
- **Scroll Resiliente:** Modal de edição com altura inteligente (`max-h-[90vh]`) e barra de rolagem interna para telas pequenas.

### 🚚 Fila de Entregas
- Painel de controle para administradores validarem e marcarem resgates como "Entregues" ou "Cancelados".
- **Correção de Query:** Resolvido o erro de consulta que tentava buscar a coluna inexistente `avatar_url` na tabela de perfis.

---

## 🎨 3. UI/UX "High-Fidelity"

Refinamentos visuais para uma estética premium e profissional.

### 🧭 Cabeçalho Arena IDE
- **Re-alinhamento Estratégico:** Marca "Arena Ide" movida para o canto direito para equilibrar o layout com o menu hamburguer da esquerda.
- **Hero Status Card:** Card de perfil do usuário com barra de progresso de XP, título de nível RPG e integração de **mini-medalhas de conquistas**.

### ⚙️ Painel de Configurações
- Sistema de abas para Identidade Visual, Gestão de Módulos (Ligar/Desligar abas) e Criação de Links Externos.

---

## 🛠️ 4. Mural e Social (Estabilização)

### 🛠️ Correção Crítica de Schema (PGRST200)
- **Problema:** O Mural não carregava posts devido ao erro `Could not find a relationship between 'feed_posts' and 'group_id'`. Isso ocorria porque a tabela `feed_posts` não possui uma FK formal para `groups`.
- **Solução:** Refatorado `FeedService.getPosts` para utilizar **Client-Side Joins**. Agora o serviço busca os posts primeiro e resolve os perfis em lote.
- **Resiliência:** Adicionado tratamento para a coluna `"groupId"` (quoted case) da tabela `profiles`.

---

## 🏟️ 5. Arena Live & Segurança de Dados (Novo)

Otimização completa do painel de administração em tempo real.

### ⚔️ Arena Live V2
- **Busca Resiliente:** Sistema anti-autofill com IDs randômicos e captura por `onMouseDown`.
- **Auditoria Automática:** Carimbo de tempo automático `[DD/MM HH:mm]` em todos os bônus.
- **Vínculo de Atividades:** Automação de bônus baseada em atividades cadastradas.

### 🛡️ Reparo de Schema e RLS
- **Políticas de Escrita:** Adicionadas permissões de `INSERT/UPDATE` para administradores.
- **Schema Extension:** Criadas as colunas faltantes na tabela `activities`.
- **Motor de Ícones Híbrido:** Suporte para Emojis e ícones Lucide no painel administrativo.

---
*Atualizado em 28 de Abril de 2026.*
