import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SCREENS } from './constants/theme';
import { AppearanceProvider } from './context/AppearanceContext';
import { AudioProvider, BGM_SCENES, useAudio } from './context/AudioContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import AppBackground from './components/AppBackground';
import { configurePurchases } from './services/purchases';
import HomeScreen from './screens/HomeScreen';
import PlayScreen from './screens/PlayScreen';
import DailyScreen from './screens/DailyScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShopScreen from './screens/ShopScreen';
import WebViewScreen from './screens/WebViewScreen';
import SignInScreen from './screens/SignInScreen';
import DevIntermissionScreen from './screens/DevIntermissionScreen';

function AppShell() {
  const [route, setRoute] = useState({ screen: SCREENS.HOME, params: {} });
  const { isRtl } = useLanguage();
  const { setBgmScene, ready: audioReady } = useAudio();

  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    if (!audioReady) return;
    const { screen } = route;
    if (screen === SCREENS.PLAY || screen === SCREENS.DAILY_PLAY) {
      setBgmScene(BGM_SCENES.PLAY);
      return;
    }
    if (
      screen === SCREENS.HOME
      || screen === SCREENS.DAILY
      || screen === SCREENS.SETTINGS
      || screen === SCREENS.SHOP
      || screen === SCREENS.SIGN_IN
      || screen === SCREENS.WEBVIEW
      || screen === SCREENS.DEV_INTERMISSION
    ) {
      setBgmScene(BGM_SCENES.HOME);
      return;
    }
    setBgmScene(BGM_SCENES.NONE);
  }, [route.screen, audioReady, setBgmScene]);

  const navigate = useCallback((screen, params = {}) => {
    setRoute({ screen, params });
  }, []);

  /** Soft scrim hides outgoing screen UI but keeps the reef background visible. */
  const opaqueScreenStyle = [styles.screen, styles.screenScrim];

  const renderScreen = () => {
    const { screen, params } = route;

    switch (screen) {
      case SCREENS.PLAY:
      case SCREENS.DAILY_PLAY:
        return (
          <Animated.View
            key={`play-${params.mode}-${params.date ?? 'journey'}-${params.t ?? 0}`}
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={opaqueScreenStyle}
          >
            <PlayScreen navigate={navigate} routeParams={params} />
          </Animated.View>
        );
      case SCREENS.DAILY:
        return (
          <Animated.View
            key="daily"
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={opaqueScreenStyle}
          >
            <DailyScreen navigate={navigate} routeParams={params} />
          </Animated.View>
        );
      case SCREENS.SETTINGS:
        return (
          <Animated.View
            key="settings"
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={opaqueScreenStyle}
          >
            <SettingsScreen navigate={navigate} routeParams={params} />
          </Animated.View>
        );
      case SCREENS.SHOP:
        return (
          <Animated.View
            key="shop"
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={opaqueScreenStyle}
          >
            <ShopScreen navigate={navigate} routeParams={params} />
          </Animated.View>
        );
      case SCREENS.SIGN_IN:
        return (
          <Animated.View
            key="sign-in"
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={opaqueScreenStyle}
          >
            <SignInScreen navigate={navigate} routeParams={params} />
          </Animated.View>
        );
      case SCREENS.WEBVIEW:
        return (
          <Animated.View
            key={`webview-${params?.url ?? 'page'}`}
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={opaqueScreenStyle}
          >
            <WebViewScreen
              navigate={navigate}
              routeParams={params}
              backScreen={params?.backScreen ?? SCREENS.SETTINGS}
            />
          </Animated.View>
        );
      case SCREENS.DEV_INTERMISSION:
        if (!__DEV__) break;
        return (
          <Animated.View
            key={`dev-intermission-${params?.previewType ?? 'default'}`}
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={opaqueScreenStyle}
          >
            <DevIntermissionScreen navigate={navigate} routeParams={params} />
          </Animated.View>
        );
      case SCREENS.HOME:
      default:
        return (
          <Animated.View
            key="home"
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.screen}
          >
            <HomeScreen navigate={navigate} />
          </Animated.View>
        );
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.container, { direction: isRtl ? 'rtl' : 'ltr' }]}>
        <AppBackground>
          <View style={styles.screenLayer} pointerEvents="box-none">
            {renderScreen()}
          </View>
        </AppBackground>
      </View>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppearanceProvider>
        <AudioProvider>
          <AppShell />
        </AudioProvider>
      </AppearanceProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
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
});
