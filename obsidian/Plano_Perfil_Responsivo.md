**Voltar para o Inicio:** [[Gincana_da_Tribo]]

# Plano de EvoluÃ§Ã£o: Perfil Responsivo Premium ðŸ›¡ï¸

Este plano visa transformar o `UserProfile.tsx` em uma interface "Mobile-First", garantindo que a visualizaÃ§Ã£o de estatÃ­sticas, conquistas e biografia seja fluida e visualmente impressionante em qualquer dispositivo.

## 1. ReestruturaÃ§Ã£o do Header (Identidade)
- **Mobile**: Centralizar Avatar e Nome. Mover o "NÃ­vel" e "Patente" para uma linha de tags logo abaixo do nome para economizar espaÃ§o vertical.
- **Desktop**: Manter layout horizontal (Avatar Ã  esquerda, Infos Ã  direita).
- **AÃ§Ã£o**: Utilizar classes `flex-col items-center` (mobile) vs `flex-row items-end` (desktop).

## 2. Grid de EstatÃ­sticas (XP, VitÃ³rias, FrequÃªncia)
- **Problema**: Atualmente os cards de stats ocupam muito espaÃ§o vertical no celular.
- **SoluÃ§Ã£o**: Implementar um grid de 2 colunas no mobile (`grid-cols-2`) e 4 colunas no desktop (`lg:grid-cols-4`).
- **AÃ§Ã£o**: Refatorar os cards para serem mais compactos, reduzindo paddings e tamanhos de Ã­cones.

## 3. Fluxo de ConteÃºdo (Lower Section)
- **OrdenaÃ§Ã£o Mobile**: 
    1. Galeria de Honra (Carrossel Horizontal jÃ¡ otimizado).
    2. Bio do Guerreiro (Texto).
    3. Links Sociais (WhatsApp/Instagram).
- **OrdenaÃ§Ã£o Desktop**: Grid 2:1 (Galeria Ã  esquerda, Bio/Social Ã  direita).

## 4. Polimento UI/UX
- **Tipografia**: Ajustar tamanhos de fonte dinamicamente (`text-xl` no mobile -> `text-4xl` no desktop).
- **EspaÃ§amento**: Reduzir paddings globais de containers (`p-10` -> `p-5` no mobile).
- **Interatividade**: Garantir que o botÃ£o "Editar Perfil" seja fixo ou facilmente acessÃ­vel no topo.

## 5. Cronograma de ImplementaÃ§Ã£o
1. [ ] RefatoraÃ§Ã£o do Header (Identidade).
2. [ ] Ajuste do Grid de Stats.
3. [ ] ReorganizaÃ§Ã£o das seÃ§Ãµes de Bio e Social.
4. [ ] RevisÃ£o final de paddings e margens.

