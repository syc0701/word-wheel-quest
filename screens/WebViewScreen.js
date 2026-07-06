import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS } from '../constants/theme';

export default function WebViewScreen({ navigate, routeParams, backScreen }) {
  const { url, title } = routeParams ?? {};

  return (
    <View style={styles.container}>
      <ScreenHeader title={title ?? 'Page'} onBack={() => navigate(backScreen)} />
      {url ? (
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={COLORS.primaryGlow} size="large" />
            </View>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
