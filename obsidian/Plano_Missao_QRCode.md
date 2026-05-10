**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Plano de Implementação: Caça ao Tesouro (Missões por QR Code)

## 🎯 Objetivo Principal: Frequência no Culto (Check-in de Domingo)
Criar um novo tipo de atividade interativa que tira o atrito da validação de pontos, focado inicialmente no **Culto de Domingo**. Em vez do líder ter que aprovar manualmente cada jovem que foi ao culto, o líder apenas abre o QR Code no seu celular e o jovem escaneia. Pontos na hora, sem dor de cabeça.

### 🔄 Como é Hoje (O Problema)
1. **Fluxo do Jovem:** O jovem clica na atividade "Ir ao Culto", tira uma foto (ou escreve um texto) e envia.
2. **Status:** Fica como `pending`.
3. **Trabalho do Líder:** O líder precisa abrir o Painel Admin, ir na fila de "Aprovações Pendentes", olhar foto por foto e clicar em `Aprovar`.
4. **Desvantagens:** É burocrático, gera atraso nos pontos e muito trabalho manual pro líder.

### ⚡ Como vai ficar (Com o QR Code)
1. **O Líder:** No final do culto, o líder abre o app dele e clica em "Exibir QR Code do Culto".
2. **Os Jovens:** Apontam o celular e escaneiam.
3. **Resultado:** Status passa pra `approved` automaticamente, ganham o XP na hora (chuva de confetes) e ninguém precisa avaliar nada manualmente!

---

## 🛠️ 1. Modificações no Banco de Dados (Supabase)

Precisamos expandir a tabela atual que armazena as atividades/missões para suportar esse novo tipo.

- **Novo Tipo de Atividade:** Adicionar `qr_code` aos tipos suportados (ex: `presencial`, `online`, `qr_code`).
- **Novo Campo `secret_payload` (Texto):** Um código único gerado automaticamente quando o Admin cria a missão (ex: `tribo-hunt-9f8a2`). É esse código que ficará embutido no QR Code físico.
- **Validação de Segurança (Prevenção de Fraude):** Garantir na tabela de participações (`participations`) que um usuário só pode escanear e ganhar pontos daquele QR Code específico **uma única vez** (usando a constraint de UNIQUE para `user_id` + `activity_id` que já deve existir).

---

## 🧑‍💼 2. Painel Admin (O Editor de Atividades)

O líder precisa conseguir gerar esse QR Code de forma fácil para imprimir:

1. **Criação da Missão:** No formulário de "Nova Atividade", ao selecionar "Missão QR Code", o campo de "Comprovação (foto/texto)" é desativado.
2. **Geração do Código:** O sistema gera automaticamente um hash curto (`uuid` ou string aleatória).
3. **Botão "Imprimir QR Code":** Após salvar a missão, um botão aparece. Podemos usar a biblioteca `qrcode.react` para desenhar o QR Code na tela. O Admin pode clicar para baixar a imagem ou imprimir diretamente com um design bonito da Gincana da Tribo (talvez com a logo no meio).

---

## 📱 3. Aplicativo do Usuário (Frontend)

O participante precisa de uma forma de usar a câmera para capturar o código:

1. **Scanner Embutido:** Adicionar um botão flutuante ou um ícone no header: 📷 **Escanear**.
2. **Biblioteca de Leitura:** Instalar e usar o `html5-qrcode` (leve e excelente para PWA/Mobile web). Ele abre a câmera do celular direto no navegador.
3. **Fluxo de Captura:**
   - Jovem aponta a câmera.
   - O leitor identifica o texto do QR Code.
   - O app faz um `POST` (ou chamada RPC) para o Supabase passando o `secret_payload`.
   - **Feedback de UAU:** Se o código for válido, dispara a chuva de confetes (`canvas-confetti`) e toca o som de vitória (AudioEngine), exibindo um alerta: *"Você encontrou o tesouro! +50 XP"*.

---

## 🛡️ 4. Regras Anti-Trapaça (Opcional, mas recomendado)
Jovens são espertos. Alguém pode tirar foto do QR Code e mandar no grupo do WhatsApp da tribo. Como evitar isso?
- **Tempo de Vida (Expiração):** O Admin pode definir que o QR Code só é válido durante as 2 horas do culto.
- **Limite de Escaneamentos:** Uma mecânica incrível seria: *"Os 10 primeiros que escanearem ganham"*. Podemos adicionar um campo `max_redemptions` na atividade. Depois de 10 usos, o QR Code "seca" e perde o poder. Isso gera um senso de urgência absurdo!

---

## 🚀 Próximos Passos (Roadmap de Código)
- [x] Atualizar schema Supabase (Tabela de atividades).
- [x] Contornar NPM: Usar versão Web/CDN Vanilla JS para geração no Admin (`qrcode.min.js`).
- [x] Contornar NPM: Usar versão CDN injetada para leitura no cliente (`html5-qrcode`).
- [x] Atualizar o formulário de criação de atividades no painel (AdminActivities).
- [x] Criar o modal de Scanner com permissão de câmera (`QRScanner.tsx`).
- [x] Ligar a leitura do QR com o envio da participação (Atividades + Calendário).
