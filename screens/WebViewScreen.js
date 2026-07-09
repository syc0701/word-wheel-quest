import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS } from '../constants/theme';
import { normalizeLegalWebViewUrl } from '../lib/legalUrl';

export default function WebViewScreen({ navigate, routeParams, backScreen }) {
  const { url, title } = routeParams ?? {};
  const webUrl = url ? normalizeLegalWebViewUrl(url) : null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={title ?? 'Page'}
        onBack={() => navigate(backScreen, routeParams?.returnParams)}
      />
      {webUrl ? (
        <WebView
          source={{ uri: webUrl }}
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
