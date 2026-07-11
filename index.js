import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

global.Buffer = global.Buffer || Buffer;

import App from './src/App';

registerRootComponent(App);
