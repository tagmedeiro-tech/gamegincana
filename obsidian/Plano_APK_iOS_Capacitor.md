# Plano: App Nativo — Android APK + iPhone (iOS) 📱

**Stack Base:** Vite + React (já existente)  
**Tecnologia de Empacotamento:** Capacitor v6 (da equipe do Ionic)  
**Objetivo:** Um único código web → APK Android + IPA iOS, sem reescrever nada

---

## Por que Capacitor?

| | Capacitor | React Native | Expo |
|---|---|---|---|
| Reescreve o código? | ❌ Não | ✅ Sim (tudo) | ✅ Sim (parcial) |
| Compatível com Vite? | ✅ Nativo | ❌ Não | ❌ Não |
| Acesso à câmera/GPS? | ✅ Plugins nativos | ✅ Sim | ✅ Sim |
| Push Notifications? | ✅ Sim | ✅ Sim | ✅ Sim |
| APK Android? | ✅ Sim | ✅ Sim | ✅ Sim |
| IPA iOS? | ✅ Sim | ✅ Sim | ✅ Sim |
| Curva de aprendizado | 🟢 Baixa | 🔴 Alta | 🟡 Média |

O Capacitor é o **caminho mais direto** — ele pega o `dist/` do seu Vite e envolve numa casca nativa Android/iOS. É exatamente o que projetos como o Ionic e o Quasar usam.

---

## Pré-requisitos (O que instalar)

### Para Android (APK):
- [x] Node.js (já temos)
- [ ] **Android Studio** — [developer.android.com/studio](https://developer.android.com/studio)
- [ ] **Java JDK 17+** — Vem junto com o Android Studio
- [ ] **SDK Android 14 (API 34)** — Instalar dentro do Android Studio

### Para iOS (IPA — Requer Mac obrigatoriamente):
- [ ] **Xcode 15+** — Disponível na Mac App Store (gratuito)
- [ ] **Conta Apple Developer** — US$ 99/ano (para publicar na App Store)
  - Para testes no dispositivo pessoal: **gratuito** (sem publicar)
- [ ] **CocoaPods** — `sudo gem install cocoapods`

> **Nota importante:** O build do iOS **só pode ser feito em um Mac**. Se não tiver Mac, existem serviços como o [Codemagic](https://codemagic.io/) (tem plano gratuito) que fazem o build iOS na nuvem a partir do seu código GitHub.

---

## Roteiro de Implementação

### 🔵 Fase 1 — Instalar e Configurar o Capacitor (1-2 horas)

```bash
# 1. Instalar Capacitor no projeto existente
npm install @capacitor/core @capacitor/cli

# 2. Inicializar (define o nome do app e o Bundle ID)
npx cap init "Gincana da Tribo" "com.gincana.tribo" --web-dir=dist

# 3. Instalar plataformas
npm install @capacitor/android @capacitor/ios

# 4. Adicionar as plataformas ao projeto
npx cap add android
npx cap add ios
```

Isso cria as pastas `/android` e `/ios` na raiz do projeto.

---

### 🔵 Fase 2 — Adaptar o Vite para Mobile (30 minutos)

O `vite.config.ts` precisa de um pequeno ajuste para produção mobile:

```typescript
// vite.config.ts — adicionar base: './' para paths relativos
export default defineConfig({
  base: './',  // ← CRÍTICO para Capacitor
  // ... resto da config
})
```

Também precisamos atualizar o `capacitor.config.ts`:
```typescript
// capacitor.config.ts (criado automaticamente)
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gincana.tribo',
  appName: 'Gincana da Tribo',
  webDir: 'dist',
  server: {
    // Em desenvolvimento, aponta pro servidor local (hot reload no celular!)
    // url: 'http://SEU_IP_LOCAL:5500',
    // cleartext: true,
  },
  android: {
    allowMixedContent: true, // Necessário para iframes (VoxelArena)
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};
export default config;
```

---

### 🔵 Fase 3 — Plugins Nativos Essenciais (2-3 horas)

Esses plugins substituem as funcionalidades que já usamos no web e melhoram a experiência nativa:

```bash
# Câmera (QR Code Scanner nativo — MUITO mais rápido que html5-qrcode!)
npm install @capacitor/camera

# Notificações Push Nativas (substitui o sistema atual)
npm install @capacitor/push-notifications

# Haptics (vibração ao ganhar XP — efeito premium)
npm install @capacitor/haptics

# Status Bar (deixa a barra de status transparente no topo)
npm install @capacitor/status-bar

# Splash Screen
npm install @capacitor/splash-screen

# App (detectar quando o app vai para segundo plano)
npm install @capacitor/app
```

#### Integração do Scanner QR Nativo (substituindo o html5-qrcode):
```typescript
// QRScanner.tsx — versão nativa via Capacitor
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

// Escanear QR nativo (usa a câmera nativa, muito mais rápido e confiável)
const scanQR = async () => {
  await BarcodeScanner.checkPermission({ force: true });
  const result = await BarcodeScanner.startScan();
  if (result.hasContent) {
    handleQRPayload(result.content);
  }
};
```

---

### 🔵 Fase 4 — Build e Geração do APK (1 hora)

```bash
# 1. Build da aplicação web
npm run build

# 2. Sincronizar o build com o projeto Android/iOS
npx cap sync

# 3. Abrir no Android Studio
npx cap open android
```

Dentro do Android Studio:
1. Menu → **Build** → **Generate Signed Bundle/APK**
2. Escolher **APK**
3. Criar uma **Keystore** (arquivo de assinatura — guardar com segurança!)
4. Aguardar o build → arquivo `.apk` gerado em `android/app/release/`

Para **debug rápido** (instalar direto no celular conectado por USB):
```bash
npx cap run android  # instala diretamente no celular conectado
```

---

### 🔵 Fase 5 — Build iOS (Requer Mac) (2 horas)

```bash
# Abrir projeto no Xcode
npx cap open ios
```

Dentro do Xcode:
1. Selecionar o dispositivo de destino (iPhone físico ou Simulador)
2. **Product** → **Build** (para teste)
3. **Product** → **Archive** → **Distribute App** (para App Store ou Ad Hoc)

#### Opção sem Mac — Codemagic (na nuvem):
1. Subir o código no GitHub (privado)
2. Conectar o repositório no [codemagic.io](https://codemagic.io/)
3. O Codemagic compila o iOS na nuvem e entrega o `.ipa`
4. Plano gratuito: **500 minutos/mês** (suficiente para vários builds)

---

### 🔵 Fase 6 — Identidade Visual Nativa (2-3 horas)

#### Ícone do App (obrigatório):
- Criar um ícone `1024x1024px` em PNG (sem transparência)
- Usar o [capacitor-assets](https://github.com/ionic-team/capacitor-assets) para gerar todos os tamanhos automaticamente:

```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000'
```

#### Splash Screen:
- Criar uma imagem `2732x2732px` com o logo centralizado
- O Capacitor gera automaticamente para todos os tamanhos de tela

---

### 🔵 Fase 7 — Notificações Push Nativas 🔔

Atualmente as notificações usam o sistema web (limitado). Com Capacitor, teremos notificações push nativas reais, mesmo com o app fechado.

```typescript
// notifications.ts — integração nativa
import { PushNotifications } from '@capacitor/push-notifications';

export const initPushNotifications = async () => {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }

  PushNotifications.addListener('registration', (token) => {
    // Salvar token no Supabase para enviar notificações depois
    supabase.from('profiles').update({ push_token: token.value }).eq('id', userId);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Tocar som e vibrar via Haptics
    Haptics.vibrate();
    playSuccess();
  });
};
```

---

## Distribuição

### Android — 3 formas:
1. **APK Direto** — Enviar o arquivo `.apk` por WhatsApp/Drive para os jovens instalarem (mais rápido, sem Google Play)
2. **Google Play Internal Testing** — Upload privado para um grupo de testadores (gratuito, precisa de conta Google Play de US$ 25 única vez)
3. **Google Play Store** — Publicação pública (conta Google Play de US$ 25)

### iOS — 2 formas:
1. **TestFlight** — Apple's sistema de beta testing (gratuito, até 10.000 testadores, requer conta Apple Developer US$ 99/ano)
2. **App Store** — Publicação pública (requer conta Apple Developer US$ 99/ano)

---

## Cronograma Realista

| Fase | O que fazer | Tempo estimado |
|---|---|---|
| Fase 1 | Instalar Capacitor | 1-2 horas |
| Fase 2 | Ajustar Vite config | 30 min |
| Fase 3 | Plugins nativos (câmera, push) | 3-4 horas |
| Fase 4 | Gerar APK Android | 1-2 horas |
| Fase 5 | Gerar IPA iOS (Mac/Codemagic) | 2-3 horas |
| Fase 6 | Ícones e splash screen | 1 hora |
| Fase 7 | Notificações push nativas | 2-3 horas |
| **Total** | | **~15 horas** |

---

## Ganhos Extras com o APK Nativo

- 🔥 **QR Code Scanner nativo** — 10x mais rápido e confiável que a versão web (html5-qrcode)
- 📳 **Vibração ao ganhar XP** — Feedback tátil real via Haptics
- 🔔 **Push Notifications reais** — Mesmo com app fechado, os jovens recebem alertas de missões e desafios
- 📷 **Câmera nativa** — Para upload de fotos no Mural e no Perfil, sem pedir permissão toda vez
- 🌐 **Acesso offline** — Service Worker + cache local para conteúdo básico sem internet
- 🚀 **Performance melhor** — O WebView nativo do Android/iOS tem acesso direto ao hardware GPU

---

## Notas Importantes

> **O HyperVox (jogo voxel) agora rodará como um mundo aberto infinito no APK**, aproveitando recursos de aceleração de hardware nativos e offloading de memória. Controles avançados via capacitor (Haptics) estão integrados à ponte React-Voxel, permitindo uma imersão muito superior ao WebView normal (veja `Plano_Mundo_Aberto_Cristao.md`).

> **Bundle ID** `com.gincana.tribo` deve ser único na Play Store e App Store. Verificar disponibilidade antes do cadastro.

> **Keystore Android** é o arquivo que assina o APK. **Nunca perder esse arquivo** — sem ele, não é possível atualizar o app na Play Store.
