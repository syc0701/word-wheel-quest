import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ScreenHeader from '../components/ScreenHeader';
import { useAppearance } from '../context/AppearanceContext';
import { normalizeLegalWebViewUrl } from '../lib/legalUrl';

export default function WebViewScreen({ navigate, routeParams, backScreen }) {
  const { colors } = useAppearance();
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
          style={[styles.webview, { backgroundColor: colors.background }]}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primaryGlow} size="large" />
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
  },
  webview: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
