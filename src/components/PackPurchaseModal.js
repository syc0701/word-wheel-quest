import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { useAppearance } from '../context/AppearanceContext';
import { useAudio } from '../context/AudioContext';
import { useT } from '../context/LanguageContext';
import { APP_STORE } from '../constants/store';
import { PACK_THEMES, packByCode, packMarkColor } from '../constants/packs';
import { STARTER_PACK_PACKAGE_ID } from '../constants/guestAccess';
import CreditApi from '../lib/creditApi';
import { markStarterPackPurchased } from '../lib/guestStarterPack';
import { grantPackEntitlement } from '../lib/packEntitlements';
import {
  getDefaultOffering,
  getRevenueCatIdentity,
  isPurchasesConfigured,
  purchasePackage,
  readPurchaseTransactionId,
  rememberRevenueCatIdentityFromPurchase,
} from '../services/purchases';

export default function PackPurchaseModal({ visible, pack, icon, onClose, onPurchased }) {
  const { colors, isDark } = useAppearance();
  const t = useT();
  const { playSfx } = useAudio();
  const [priceLabel, setPriceLabel] = useState('');
  const [rcPackage, setRcPackage] = useState(null);
  const [buying, setBuying] = useState(false);
  const iconScale = useRef(new Animated.Value(1)).current;
  const buttonGlow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!visible) return undefined;
    const iconLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0.35,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    iconLoop.start();
    glowLoop.start();
    return () => {
      iconLoop.stop();
      glowLoop.stop();
    };
  }, [buttonGlow, iconScale, visible]);

  useEffect(() => {
    if (!visible || !pack) return undefined;
    let cancelled = false;
    setPriceLabel(pack.priceUsd || '');
    setRcPackage(null);
    (async () => {
      if (!isPurchasesConfigured()) return;
      try {
        const offering = await getDefaultOffering();
        const found = offering?.availablePackages?.find((pkg) => pkg.identifier === pack.packageId);
        if (cancelled || !found) return;
        setRcPackage(found);
        if (found.product?.priceString) setPriceLabel(found.product.priceString);
      } catch {
        /* keep the listed price */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, pack]);

  const handleBuy = async () => {
    if (!pack || buying) return;
    if (!rcPackage) {
      Alert.alert(t('shop.alert.productUnavailable.title'), t('shop.alert.productUnavailable.body'));
      return;
    }
    setBuying(true);
    try {
      const purchaseResult = await purchasePackage(rcPackage);
      const transactionId = readPurchaseTransactionId(purchaseResult);
      const productId = rcPackage.product.identifier;
      const fromPurchase = rememberRevenueCatIdentityFromPurchase(purchaseResult);
      const rcIdentity = fromPurchase.revenueCatAppUserId
        ? fromPurchase
        : await getRevenueCatIdentity();
      await CreditApi.verifyIapPurchase({
        appCode: APP_STORE.appSiteId,
        productId,
        transactionId,
        rawPayload: {
          platform: 'google',
          storeProductId: productId,
          packageKey: pack.packageId,
          ...rcIdentity,
        },
      });
      await grantPackEntitlement(productId);
      if (pack.grants?.classic && pack.grants?.daily) {
        await markStarterPackPurchased({ grantGuestCredits: false });
      }
      const displayName = pack.nameKey ? t(pack.nameKey) : pack.name;
      onPurchased?.(pack);
      onClose?.();
      if (pack.packageId === STARTER_PACK_PACKAGE_ID) {
        Alert.alert(t('shop.alert.starterUnlocked.title'), t('shop.alert.starterUnlocked.body'));
      } else {
        Alert.alert(t('shop.alert.success.title'), t('shop.alert.success.body', { name: displayName }));
      }
      playSfx('purchaseWin');
    } catch (error) {
      if (error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return;
      Alert.alert(t('shop.alert.purchaseFailed.title'), error?.message ?? t('shop.alert.purchaseFailed.body'));
    } finally {
      setBuying(false);
    }
  };

  const catalog = packByCode(pack?.code);
  const name = pack?.nameKey ? t(pack.nameKey) : pack?.name;
  const promoTitle = catalog?.promoTitleKey ? t(catalog.promoTitleKey) : '';
  const promoBody = catalog?.promoBodyKey ? t(catalog.promoBodyKey) : '';
  const theme = PACK_THEMES[pack?.code] || PACK_THEMES.classic;
  const mark = packMarkColor(pack?.code, isDark) || theme.icon;

  return (
    <Modal visible={visible && !!pack} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={buying ? undefined : onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: mark }]}
          onPress={(e) => e.stopPropagation?.()}
        >
          {icon ? (
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <Image source={icon} style={[styles.icon, { tintColor: mark }]} resizeMode="contain" />
            </Animated.View>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
          {promoTitle ? (
            <Text style={[styles.promoTitle, { color: mark }]}>{promoTitle}</Text>
          ) : null}
          {promoBody ? (
            <Text style={[styles.body, { color: colors.textMuted }]}>{promoBody}</Text>
          ) : null}
          <View style={styles.ctaWrap}>
            <Animated.View
              pointerEvents="none"
              style={[styles.ctaGlow, { backgroundColor: theme.glow, opacity: buttonGlow }]}
            />
            <Pressable
              style={[styles.cta, buying && styles.ctaDisabled]}
              onPress={handleBuy}
              disabled={buying}
            >
              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {buying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>{priceLabel}</Text>
              )}
            </Pressable>
          </View>
          <Pressable style={styles.secondary} onPress={onClose} disabled={buying} hitSlop={8}>
            <Text style={[styles.secondaryText, { color: colors.textMuted }]}>
              {t('guest.starter.notNow')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 24, 28, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  promoTitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  ctaWrap: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  ctaGlow: {
    position: 'absolute',
    left: -4,
    right: -4,
    top: -4,
    bottom: -4,
    borderRadius: 18,
  },
  cta: {
    minHeight: 48,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondary: {
    marginTop: 12,
    paddingVertical: 8,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
