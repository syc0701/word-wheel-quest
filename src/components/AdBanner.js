import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBannerAdUnitId } from '../constants/ads';
import { useAppearance } from '../context/AppearanceContext';
import { initializeMobileAds } from '../lib/ads';

const SIDE_INSET = 18;
const FRAME_BORDER = 1;

/**
 * Anchored adaptive banner for Home (and similar hub screens).
 * Hidden until loaded so layout does not reserve empty space on failure.
 * Framed to match home tile / card borders without clipping the ad.
 */
export default function AdBanner({ style }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors, isDark, isRandomScene } = useAppearance();
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const unitId = getBannerAdUnitId();
  const adWidth = Math.max(
    1,
    Math.floor(windowWidth - SIDE_INSET * 2 - FRAME_BORDER * 2)
  );

  useEffect(() => {
    let cancelled = false;
    initializeMobileAds().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !unitId) return null;

  const borderColor = isRandomScene
    ? 'rgba(255,255,255,0.55)'
    : colors.surfaceLight;
  const backgroundColor = colors.surface;

  return (
    <View
      style={[
        styles.outer,
        { paddingBottom: Math.max(insets.bottom, 8) },
        style,
      ]}
      pointerEvents={loaded ? 'auto' : 'none'}
    >
      <View
        style={[
          styles.frame,
          {
            borderColor,
            backgroundColor,
            opacity: loaded ? 1 : 0,
          },
          isDark || isRandomScene ? null : styles.frameShadow,
        ]}
      >
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          width={adWidth}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={() => setLoaded(true)}
          onAdFailedToLoad={(error) => {
            setLoaded(false);
            if (__DEV__) {
              console.warn('[Ads] banner failed', error?.message || error);
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    paddingHorizontal: SIDE_INSET,
    alignItems: 'stretch',
  },
  frame: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: FRAME_BORDER,
  },
  frameShadow: {
    shadowColor: '#0f3d32',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
