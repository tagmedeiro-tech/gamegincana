# Plano de Ação: Ilustrações no Texto Bíblico

Adicionar imagens ao texto bíblico aumenta drasticamente o engajamento, transformando a leitura em uma experiência visual (especialmente para os jovens).

Atualmente, não existe uma "API Mágica" gratuita que entregue ilustrações bíblicas cena a cena pronta para plugar. O projeto mais famoso ([FreeBibleImages](https://www.freebibleimages.org/)) não fornece API e proíbe extração automática.

Por isso, apresento **3 Estratégias Diferentes** para alcançarmos isso na Gincana da Tribo:

---

## Estratégia 1: IA Generativa (Recomendado - Foco RPG/Épico) 🛡️🔥
**A ideia:** Gerar artes exclusivas no estilo *"Concept Art"* (Dark Fantasy, RPG, Cinematic) usando Inteligência Artificial (DALL-E 3 ou Midjourney) para os principais capítulos da Bíblia.
* **Vantagens:** 100% autoral, estética visual impressionante (combina com o design "Cyber-Brutalista" e gamificado do app), cria um fator "WOW".
* **Como implementar:**
  1. Criar um script "robô" que lê o resumo de cada capítulo.
  2. O robô manda um prompt pra API do DALL-E 3 (Ex: *"Ilustração épica de Davi segurando a funda de frente para o gigante Golias, atmosfera escura, cinematic lighting, ultra detalhado"*).
  3. O robô salva as imagens geradas em um bucket do nosso **Supabase Storage** chamadas `genesis_1.jpg`, `genesis_2.jpg`.
  4. O componente `BibleViewer.tsx` simplesmente puxa a imagem baseada no capítulo atual.
* **Custo:** A API do DALL-E 3 tem um pequeno custo por imagem, mas podemos gerar apenas para os livros do plano de leitura principal da Gincana primeiro (ex: Gênesis, Provérbios, João).

## Estratégia 2: Banco de Imagens Públicas (Acervo Clássico) 🎨📖
**A ideia:** Usar pacotes de ilustrações "Creative Commons" ou Domínio Público (ex: pinturas de Gustave Doré ou o pacote *Sweet Publishing*).
* **Vantagens:** Gratuito e biblicamente preciso.
* **Como implementar:**
  1. Fazer o download manual (em lote) do pacote de ilustrações do Sweet Publishing (ou Wikimedia Commons).
  2. Criar uma tabela no Supabase `bible_images` com as colunas `book`, `chapter`, `image_url`.
  3. Fazer o upload manual dessas fotos para o Supabase Storage.
* **Desvantagem:** O estilo de arte pode parecer "infantil" (livro de escola dominical) ou "antigo demais" (pinturas do século 18), fugindo da estética jovem do nosso app.

## Estratégia 3: Imagens Atmosféricas em Tempo Real (Unsplash API) 🏔️🌩️
**A ideia:** Em vez de imagens literalmente contando a história, o app exibe fotos atmosféricas lindíssimas que remetem ao texto (ex: se o capítulo fala de travessia do mar, mostra um oceano revolto; se fala de deserto, mostra dunas).
* **Vantagens:** Integração em tempo real, 100% gratuito e rápido.
* **Como implementar:**
  1. Usar a **Unsplash API** (gratuita).
  2. Extrair 2 ou 3 palavras-chave do título do capítulo.
  3. Fazer um fetch: `https://api.unsplash.com/photos/random?query=desert,mountain&client_id=SUA_CHAVE`.
  4. Exibir como banner (header) no `BibleViewer.tsx`.

---

### Próximos Passos
Se a ideia for ter um app realmente único e premium, a **Estratégia 1 (IA Generativa pré-renderizada)** é a mais forte. Podemos começar pequeno: escolhendo os 3 livros mais lidos e gerando as imagens, colocando-as no Supabase como os "Pôsteres Oficiais" de cada capítulo.

Qual dessas abordagens combina mais com a sua visão?
