import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SCREENS } from './constants/theme';
import { AppearanceProvider } from './context/AppearanceContext';
import { AudioProvider, BGM_SCENES, useAudio } from './context/AudioContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { PlayTimerProvider } from './context/PlayTimerContext';
import AppBackground from './components/AppBackground';
import LaunchSplashOverlay from './components/LaunchSplashOverlay';
import { initializeMobileAds } from './lib/ads';
import { soundManager } from './lib/soundManager';
import { configurePurchases } from './services/purchases';
import PushNotificationService from './services/PushNotificationService';
import HomeScreen from './screens/HomeScreen';
import PlayScreen from './screens/PlayScreen';
import DailyScreen from './screens/DailyScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShopScreen from './screens/ShopScreen';
import WebViewScreen from './screens/WebViewScreen';
import SignInScreen from './screens/SignInScreen';
import DevIntermissionScreen from './screens/DevIntermissionScreen';

/**
 * Android Fabric + Reanimated layout animations (entering/exiting) race with
 * ShadowNode remove and can SIGSEGV in libreanimated / ANR in NodesManager.
 * Keep Android screen shells as plain Views — no layout animations.
 */
const USE_SCREEN_LAYOUT_ANIM = Platform.OS !== 'android';
const ScreenShell = USE_SCREEN_LAYOUT_ANIM ? Animated.View : View;
const SCREEN_ENTER = USE_SCREEN_LAYOUT_ANIM
  ? SlideInRight.duration(350).springify()
  : undefined;
const SCREEN_EXIT = USE_SCREEN_LAYOUT_ANIM ? SlideOutLeft.duration(250) : undefined;
const HOME_ENTER = USE_SCREEN_LAYOUT_ANIM ? FadeIn.duration(400) : undefined;
const HOME_EXIT = USE_SCREEN_LAYOUT_ANIM ? FadeOut.duration(200) : undefined;
const layoutAnimProps = (entering, exiting) =>
  (USE_SCREEN_LAYOUT_ANIM ? { entering, exiting } : {});

function AppShell() {
  const [route, setRoute] = useState({ screen: SCREENS.HOME, params: {} });
  const { isRtl } = useLanguage();
  const { setBgmScene, ready: audioReady } = useAudio();

  useEffect(() => {
    // Defer native SDK work slightly so first paint / splash can settle on cold start.
    const t = setTimeout(() => {
      try {
        configurePurchases();
      } catch {
        /* ignore */
      }
      initializeMobileAds();
      // Ads can steal Android audio focus on init — nudge BGM back.
      setTimeout(() => {
        try {
          soundManager.resumeBgm();
        } catch {
          /* ignore */
        }
      }, 600);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!audioReady) return;
    const { screen } = route;
    // Play screens use play BGM; everywhere else (incl. Settings) keeps main BGM on.
    if (screen === SCREENS.PLAY || screen === SCREENS.DAILY_PLAY) {
      setBgmScene(BGM_SCENES.PLAY);
      return;
    }
    setBgmScene(BGM_SCENES.HOME);
  }, [route.screen, audioReady, setBgmScene]);

  const navigate = useCallback((screen, params = {}) => {
    setRoute({ screen, params });
  }, []);

  useEffect(() => {
    PushNotificationService.setPushNavigateHandler(navigate);
    void PushNotificationService.syncPushNotificationsIfNeeded();
    return () => {
      PushNotificationService.setPushNavigateHandler(null);
    };
  }, [navigate]);

  useEffect(() => {
    if (
      route.screen === SCREENS.SETTINGS
      || route.params?.signedIn
      || route.params?.authTick
    ) {
      void PushNotificationService.syncPushNotificationsIfNeeded();
    }
  }, [route.screen, route.params?.signedIn, route.params?.authTick]);

  /** Soft scrim hides outgoing screen UI but keeps the reef background visible. */
  const opaqueScreenStyle = [styles.screen, styles.screenScrim];

  const renderScreen = () => {
    const { screen, params } = route;

    switch (screen) {
      case SCREENS.PLAY:
      case SCREENS.DAILY_PLAY:
        return (
          <ScreenShell
            key={`play-${params.mode}-${params.date ?? 'journey'}-${params.isOnboarding ? 'onb' : 'std'}-${params.t ?? 0}`}
            {...layoutAnimProps(SCREEN_ENTER, SCREEN_EXIT)}
            style={opaqueScreenStyle}
          >
            <PlayScreen navigate={navigate} routeParams={params} />
          </ScreenShell>
        );
      case SCREENS.DAILY:
        return (
          <ScreenShell
            key="daily"
            {...layoutAnimProps(SCREEN_ENTER, SCREEN_EXIT)}
            style={opaqueScreenStyle}
          >
            <DailyScreen navigate={navigate} routeParams={params} />
          </ScreenShell>
        );
      case SCREENS.SETTINGS:
        return (
          <ScreenShell
            key="settings"
            {...layoutAnimProps(SCREEN_ENTER, SCREEN_EXIT)}
            style={[opaqueScreenStyle, styles.screenOverflowVisible]}
          >
            <SettingsScreen navigate={navigate} routeParams={params} />
          </ScreenShell>
        );
      case SCREENS.SHOP:
        return (
          <ScreenShell
            key="shop"
            {...layoutAnimProps(SCREEN_ENTER, SCREEN_EXIT)}
            style={opaqueScreenStyle}
          >
            <ShopScreen navigate={navigate} routeParams={params} />
          </ScreenShell>
        );
      case SCREENS.SIGN_IN:
        return (
          <ScreenShell
            key="sign-in"
            {...layoutAnimProps(SCREEN_ENTER, SCREEN_EXIT)}
            style={opaqueScreenStyle}
          >
            <SignInScreen navigate={navigate} routeParams={params} />
          </ScreenShell>
        );
      case SCREENS.WEBVIEW:
        return (
          <ScreenShell
            key={`webview-${params?.url ?? 'page'}`}
            {...layoutAnimProps(SCREEN_ENTER, SCREEN_EXIT)}
            style={opaqueScreenStyle}
          >
            <WebViewScreen
              navigate={navigate}
              routeParams={params}
              backScreen={params?.backScreen ?? SCREENS.SETTINGS}
            />
          </ScreenShell>
        );
      case SCREENS.DEV_INTERMISSION:
        if (!__DEV__) break;
        return (
          <ScreenShell
            key={`dev-intermission-${params?.previewType ?? 'default'}`}
            {...layoutAnimProps(SCREEN_ENTER, SCREEN_EXIT)}
            style={opaqueScreenStyle}
          >
            <DevIntermissionScreen navigate={navigate} routeParams={params} />
          </ScreenShell>
        );
      case SCREENS.HOME:
      default:
        return (
          <ScreenShell
            key="home"
            {...layoutAnimProps(HOME_ENTER, HOME_EXIT)}
            style={styles.screen}
          >
            <HomeScreen navigate={navigate} routeParams={params} />
          </ScreenShell>
        );
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.container, { direction: isRtl ? 'rtl' : 'ltr' }]}>
        <AppBackground
          surface={
            route.screen === SCREENS.PLAY || route.screen === SCREENS.DAILY_PLAY
              ? 'play'
              : 'home'
          }
        >
          <View style={styles.screenLayer} pointerEvents="box-none">
            {renderScreen()}
          </View>
        </AppBackground>
        <LaunchSplashOverlay />
      </View>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#0A2A4A' }}>
      <LanguageProvider>
        <AppearanceProvider>
          <AudioProvider>
            <PlayTimerProvider>
              <AppShell />
            </PlayTimerProvider>
          </AudioProvider>
        </AppearanceProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A2A4A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A2A4A',
  },
  screenLayer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screenScrim: {
    backgroundColor: 'rgba(6, 28, 34, 0.28)',
  },
  // Reanimated slide transitions can leave overflow:hidden and clip Settings’ last card.
  screenOverflowVisible: {
    overflow: 'visible',
  },
});
