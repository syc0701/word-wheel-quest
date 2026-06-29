import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SCREENS, COLORS } from './constants/theme';
import HomeScreen from './screens/HomeScreen';
import WordWheel from './components/WordWheel';
import BlockGrid from './components/BlockGrid';

/**
 * Navigation router — screen switching is driven by local `currentScreen` state.
 * The `navigate` callback is passed to every screen so children can switch views
 * without a navigation library.
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.HOME);

  const navigate = useCallback((screen) => {
    setCurrentScreen(screen);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.WORD_WHEEL:
        return (
          <Animated.View
            key="word-wheel"
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={styles.screen}
          >
            <WordWheel navigate={navigate} />
          </Animated.View>
        );
      case SCREENS.BLOCK_JAM:
        return (
          <Animated.View
            key="block-jam"
            entering={SlideInRight.duration(350).springify()}
            exiting={SlideOutLeft.duration(250)}
            style={styles.screen}
          >
            <BlockGrid navigate={navigate} />
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
