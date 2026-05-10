/**
 * nativeCapabilities.ts
 *
 * Módulo central para todas as funcionalidades nativas via Capacitor.
 * Detecta automaticamente se está rodando em ambiente web (browser) ou
 * nativo (APK/IPA) e adapta o comportamento.
 */

import { Capacitor } from '@capacitor/core';

// ─── Detecção de plataforma ───────────────────────────────────────────────────
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

// ─── Haptics (Vibração de Feedback) ──────────────────────────────────────────
let Haptics: any = null;

const initHaptics = async () => {
  if (!isNative) return;
  const mod = await import('@capacitor/haptics');
  Haptics = mod.Haptics;
};

initHaptics();

export const hapticSuccess = async () => {
  if (!Haptics) return;
  try {
    const { ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Silently fail on web
  }
};

export const hapticLight = async () => {
  if (!Haptics) return;
  try {
    const { ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Silently fail on web
  }
};

export const hapticVictory = async () => {
  if (!Haptics) return;
  try {
    await Haptics.vibrate({ duration: 300 });
  } catch {
    // Silently fail on web
  }
};

// ─── Status Bar ──────────────────────────────────────────────────────────────
export const hideStatusBar = async () => {
  if (!isNative) return;
  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.hide();
  } catch {}
};

export const showStatusBar = async () => {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
    await StatusBar.show();
  } catch {}
};

// ─── Splash Screen ───────────────────────────────────────────────────────────
export const hideSplash = async () => {
  if (!isNative) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 500 });
  } catch {}
};

// ─── Camera (foto de perfil via câmera nativa) ───────────────────────────────
export const takeProfilePhoto = async (): Promise<string | null> => {
  if (!isNative) return null; // Fallback: usar input[type=file] normal no web
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Pergunta: câmera ou galeria
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
};

// ─── Push Notifications ──────────────────────────────────────────────────────
export const initPushNotifications = async (userId: string, supabase: any) => {
  if (!isNative) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') {
      console.warn('[Push] Permissão negada pelo usuário.');
      return;
    }

    await PushNotifications.register();

    // Salvar token no Supabase ao receber
    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] Token registrado:', token.value);
      await supabase
        .from('profiles')
        .update({ push_token: token.value })
        .eq('id', userId);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Erro de registro:', err);
    });

    // Notificação recebida com o app ABERTO
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Recebida:', notification);
      hapticLight();
    });

    // Usuário tocou na notificação
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const url = action.notification.data?.url;
      if (url && typeof window !== 'undefined') {
        window.location.hash = url;
      }
    });
  } catch (err) {
    console.error('[Push] Falha ao inicializar:', err);
  }
};

// ─── Geolocation (Localização em tempo real) ────────────────────────────────
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const getCurrentLocation = async (): Promise<LocationData | null> => {
  if (!isNative) {
    // Fallback Web: Geolocalização padrão do browser
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    };
  } catch (err) {
    console.error('[Geo] Erro ao obter localização:', err);
    return null;
  }
};

// ─── Biometria (Face ID / Digital / PIN) ────────────────────────────────────
export const authenticateBiometric = async (reason: string = 'Confirme sua identidade'): Promise<boolean> => {
  if (!isNative) return true; // No-op no web (sempre permite)

  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
    
    // Verifica se a biometria está disponível no dispositivo
    const check = await NativeBiometric.isAvailable();
    if (!check.isAvailable) return true; // Se não tem biometria, não bloqueia o usuário

    await NativeBiometric.verifyIdentity({
      reason,
      title: 'Autenticação Gincana',
      subtitle: 'Use sua biometria para continuar',
      description: reason,
      negativeButtonText: 'Cancelar',
    });
    
    return true;
  } catch (err) {
    console.error('[Biometric] Falha na autenticação:', err);
    return false;
  }
};

// ─── App Lifecycle (detectar foco/fundo) ─────────────────────────────────────
export const onAppResume = (callback: () => void) => {
  if (!isNative) return () => {};
  let cleanup = () => {};
  import('@capacitor/app').then(({ App }) => {
    const handle = App.addListener('resume', callback);
    cleanup = () => handle.then(h => h.remove());
  });
  return () => cleanup();
};

export const onAppPause = (callback: () => void) => {
  if (!isNative) return () => {};
  let cleanup = () => {};
  import('@capacitor/app').then(({ App }) => {
    const handle = App.addListener('pause', callback);
    cleanup = () => handle.then(h => h.remove());
  });
  return () => cleanup();
};
