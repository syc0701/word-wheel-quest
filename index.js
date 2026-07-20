import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

global.Buffer = global.Buffer || Buffer;

SplashScreen.preventAutoHideAsync().catch(() => {});

import App from './src/App';

registerRootComponent(App);
