**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# ðŸŒ Tutorial Oficial: Como Criar o Mapa do Metaverso da Gincana

Agora que o motor estÃ¡ rodando perfeitamente e conectado ao seu painel, vocÃª (ou os lÃ­deres da gincana) podem criar mundos, estÃ¡dios, arenas e bases personalizadas.

O HyperVox possui um **World Editor** (Construtor de Mundos) integrado.

---

## ðŸ› ï¸ Passo 1: Acessar o Editor de Mundos
Como o servidor estÃ¡ rodando na sua mÃ¡quina, abra uma nova aba no seu navegador e acesse a ferramenta de desenvolvedor:
ðŸ‘‰ **[Abrir World Editor](http://localhost:4000/tools/worldTool/index.html)**

## ðŸŽ® Passo 2: Controles do Modo Editor
Ao abrir, vocÃª estarÃ¡ em um "modo Deus" (sem gravidade se pressionar N).
* **N**: Ativar/Desativar modo fantasma (Noclip/Voo).
* **EspaÃ§o**: Voar para cima.
* **Shift**: Voar para baixo.
* **Roda do Mouse** (ou teclas `-` e `+`): Troca o bloco na sua mÃ£o.
* **Q**: Conta-gotas (Copia o bloco para o qual vocÃª estÃ¡ olhando).
* **BotÃ£o Esquerdo**: ConstrÃ³i.
* **BotÃ£o Direito**: DestrÃ³i.

---

## ðŸ—ï¸ Passo 3: Blocos EstratÃ©gicos para a Gincana

Para criar a dinÃ¢mica de pontos, recomendo usar blocos especÃ­ficos para Ã¡reas especÃ­ficas. 

Abaixo, a lista de blocos de mapa que possuem propriedades especiais (veja pelo Ã­cone do bloco rolando o mouse):
1. **Respawn Box (Bloco Checkpoint/Verde)**: Se o jogador encostar nesse bloco, ali se torna o ponto de nascimento dele se ele cair. Ideal colocar na base de cada Tribo.
2. **Death Zone (Blocos Pretos/Vermelhos de Dano)**: Tira vida instantÃ¢nea. Use para criar fossos ou "poÃ§os de lava" nos parkours de agilidade.
3. **Health Box**: Recupera a vida de quem ficar em cima. Ideal para o "Olimpo" ou Ã¡rea neutra.
4. **Command Zone (Zonas Transparentes)**: SÃ£o blocos que disparam scripts. Ideal para o fim de uma corrida de parkour!

---

## ðŸ’¾ Passo 4: Salvar seu Mundo e Colocar no Servidor

1. ApÃ³s construir a base das Tribos (ex: castelo de gelo, arena de fogo), aperte **TAB** ou **ESC** para abrir o Menu.
2. Clique em **"Save World"** (Salvar Mundo). Ele baixarÃ¡ um arquivo chamado `world.json` para o seu computador.
3. Para testar esse mapa, basta clicar em **"Load World"** no menu principal e escolher esse arquivo.

> ðŸ’¡ **No Futuro (ProduÃ§Ã£o)**: NÃ³s vamos pegar esse arquivo `world.json` e colocar na pasta raiz do seu servidor online, forÃ§ando todos os jogadores da Gincana a nascerem exatamente nessa Arena que vocÃª desenhou.

---

## ðŸ† Desafio de Design para a Tribo
Sugiro que a Arena central seja um **PlatÃ´ Vazio** cercado por muralhas. 
O objetivo principal da Gincana In-Game Ã© que as tribos passem horas minerando e construindo castelos lÃ¡ dentro, pois *cada bloco colocado gera XP real para a Tribo* no Dashboard principal (via o GameBridge que jÃ¡ configuramos).

