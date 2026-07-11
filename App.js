import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SCREENS } from './constants/theme';
import { AppearanceProvider, useAppearance } from './context/AppearanceContext';
import { AudioProvider, BGM_SCENES, useAudio } from './context/AudioContext';
import HomeSmogEffect from './components/HomeSmogEffect';
import { configurePurchases } from './services/purchases';
import HomeScreen from './screens/HomeScreen';
import PlayScreen from './screens/PlayScreen';
import DailyScreen from './screens/DailyScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShopScreen from './screens/ShopScreen';
import WebViewScreen from './screens/WebViewScreen';
import SignInScreen from './screens/SignInScreen';

function AppShell() {
  const [route, setRoute] = useState({ screen: SCREENS.HOME, params: {} });
  const { colors } = useAppearance();
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
    ) {
      setBgmScene(BGM_SCENES.HOME);
      return;
    }
    setBgmScene(BGM_SCENES.NONE);
  }, [route.screen, audioReady, setBgmScene]);

  const navigate = useCallback((screen, params = {}) => {
    setRoute({ screen, params });
  }, []);

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
            style={styles.screen}
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
            style={styles.screen}
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
            style={styles.screen}
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
            style={styles.screen}
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
            style={styles.screen}
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
            style={styles.screen}
          >
            <WebViewScreen
              navigate={navigate}
              routeParams={params}
              backScreen={params?.backScreen ?? SCREENS.SETTINGS}
            />
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.backdrop} pointerEvents="none">
          <HomeSmogEffect />
        </View>
        <View style={styles.screenLayer} pointerEvents="box-none">
          {renderScreen()}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <AppearanceProvider>
      <AudioProvider>
        <AppShell />
      </AudioProvider>
    </AppearanceProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    elevation: 0,
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
});
