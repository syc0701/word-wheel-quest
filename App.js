import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SCREENS, COLORS } from './constants/theme';
import { configurePurchases } from './services/purchases';
import HomeScreen from './screens/HomeScreen';
import PlayScreen from './screens/PlayScreen';
import DailyScreen from './screens/DailyScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShopScreen from './screens/ShopScreen';
import WebViewScreen from './screens/WebViewScreen';
import SignInScreen from './screens/SignInScreen';

export default function App() {
  const [route, setRoute] = useState({ screen: SCREENS.HOME, params: {} });

  useEffect(() => {
    configurePurchases();
  }, []);

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
            key={`play-${params.mode}-${params.date ?? 'journey'}`}
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
      <StatusBar style="light" />
      <View style={styles.container}>{renderScreen()}</View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
  },
});
