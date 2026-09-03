import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { ShoppingBag } from 'lucide-react-native';
import { GiTwoCoins } from '../components/GiTwoCoins';
import ScreenHeader from '../components/ScreenHeader';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import { SCREENS } from '../constants/theme';
import { IAP_PACKAGES, APP_STORE } from '../constants/store';
import {
  getDefaultOffering,
  getRevenueCatIdentity,
  isPurchasesConfigured,
  isStoreUnavailable,
  purchasePackage,
  readPurchaseTransactionId,
  rememberRevenueCatIdentityFromPurchase,
} from '../services/purchases';
import CreditApi from '../lib/creditApi';
import { isLoggedIn } from '../lib/auth';
import { savePendingIap } from '../lib/pendingIap';

const GOLD = '#facc15';

const PACKAGE_ICONS = {
  starterChest: require('../assets/icons/starter-chest.png'),
  classicSwords: require('../assets/icons/classic-swords.png'),
  masterScroll: require('../assets/icons/master-scroll.png'),
};

function ProductIcon({ icon, colors }) {
  if (icon === 'goldCoins') {
    return <GiTwoCoins size={28} color={GOLD} />;
  }
  const source = PACKAGE_ICONS[icon];
  if (source) {
    return <Image source={source} style={styles.packageIconImage} resizeMode="contain" />;
  }
  return <ShoppingBag color={colors.primaryGlow} size={22} strokeWidth={1.8} />;
}

function ProductRow({
  name,
  description,
  priceLabel,
  purchasing,
  purchasable,
  selected,
  onSelect,
  colors,
  icon,
}) {
  const disabled = !purchasable || purchasing;

  return (
    <Pressable
      style={[
        styles.productRow,
        { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
        selected && purchasable && { borderColor: colors.primary, borderWidth: 2 },
        !purchasable && styles.productRowDisabled,
      ]}
      onPress={purchasable ? onSelect : undefined}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !purchasable, busy: purchasing }}
    >
      <View
        style={[
          styles.productIcon,
          { backgroundColor: colors.surfaceLight },
        ]}
      >
        <ProductIcon icon={icon} colors={colors} />
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.productDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <View
        style={[
          styles.buyBtn,
          { backgroundColor: purchasable ? colors.primary : colors.surfaceLight },
          purchasing && styles.buyBtnDisabled,
        ]}
      >
        {purchasing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text
            style={[
              styles.buyBtnText,
              !purchasable && { color: colors.textMuted },
            ]}
          >
            {priceLabel}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function ShopScreen({ navigate, routeParams = {} }) {
  const backScreen = routeParams.backScreen ?? SCREENS.SETTINGS;
  const { colors, isRandomScene } = useAppearance();
  const t = useT();
  const [rcPackages, setRcPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const sceneText = isRandomScene
    ? {
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      }
    : null;
  const sceneChip = isRandomScene
    ? {
        color: '#0b3d36',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        overflow: 'hidden',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }
    : null;

  const shopReady = isPurchasesConfigured();

  const loadOfferings = useCallback(async () => {
    if (!isPurchasesConfigured()) {
      setRcPackages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const offering = await getDefaultOffering();
      setRcPackages(offering?.availablePackages ?? []);
    } catch {
      setRcPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const findRcPackage = (packageId) => rcPackages.find((pkg) => pkg.identifier === packageId);

  const handleBuy = async (meta) => {
    if (!meta.purchasable) return;

    const rcPackage = findRcPackage(meta.packageId);
    if (!rcPackage) {
      Alert.alert(t('shop.alert.productUnavailable.title'), t('shop.alert.productUnavailable.body'));
      return;
    }

    setSelectedId(meta.packageId);
    setPurchasingId(meta.packageId);
    try {
      const purchaseResult = await purchasePackage(rcPackage);
      const authed = await isLoggedIn();
      const transactionId = readPurchaseTransactionId(purchaseResult);
      const productId = rcPackage.product.identifier;
      const fromPurchase = rememberRevenueCatIdentityFromPurchase(purchaseResult);
      const rcIdentity = fromPurchase.revenueCatAppUserId
        ? fromPurchase
        : await getRevenueCatIdentity();
      if (authed) {
        await CreditApi.verifyIapPurchase({
          appCode: APP_STORE.appSiteId,
          productId,
          transactionId,
          rawPayload: {
            platform: Platform.OS === 'ios' ? 'apple' : 'google',
            storeProductId: productId,
            packageKey: meta.packageId,
            ...rcIdentity,
          },
        });
        const displayName = meta.nameKey ? t(meta.nameKey) : meta.name;
        Alert.alert(t('shop.alert.success.title'), t('shop.alert.success.body', { name: displayName }));
      } else {
        await savePendingIap({
          productId,
          transactionId,
          packageKey: meta.packageId,
          ...rcIdentity,
        });
        Alert.alert(
          t('shop.alert.signInRequired.title'),
          t('shop.alert.signInRequired.body'),
          [
            {
              text: t('shop.alert.signInRequired.action'),
              onPress: () =>
                navigate(SCREENS.SIGN_IN, {
                  backScreen: SCREENS.SHOP,
                  returnBackScreen: backScreen,
                  requireSignIn: true,
                }),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      if (error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return;
      Alert.alert(t('shop.alert.purchaseFailed.title'), error.message ?? t('shop.alert.purchaseFailed.body'));
    } finally {
      setPurchasingId(null);
      setSelectedId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('shop.title')} onBack={() => navigate(backScreen, routeParams)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headline, { color: colors.text }, sceneText]}>
          {t('shop.headline')}
        </Text>
        <Text style={[styles.subheader, { color: colors.textMuted }, sceneChip]}>
          {t('shop.subheader')}
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primaryGlow} style={styles.loader} />
        ) : !shopReady ? (
          <Text style={[styles.unavailable, { color: colors.textMuted }, sceneChip]}>
            {t(
              isStoreUnavailable()
                ? 'shop.alert.deviceUnavailable.body'
                : 'shop.alert.unavailable.body'
            )}
          </Text>
        ) : (
          IAP_PACKAGES.map((meta) => {
            const rcPackage = findRcPackage(meta.packageId);
            const priceLabel = rcPackage?.product?.priceString ?? meta.priceUsd;
            return (
              <ProductRow
                key={meta.packageId}
                name={meta.nameKey ? t(meta.nameKey) : meta.name}
                description={meta.descriptionKey ? t(meta.descriptionKey) : meta.description}
                priceLabel={priceLabel}
                purchasing={purchasingId === meta.packageId}
                purchasable={Boolean(meta.purchasable)}
                selected={selectedId === meta.packageId}
                onSelect={() => handleBuy(meta)}
                colors={colors}
                icon={meta.icon}
              />
            );
          })
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subheader: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  loader: {
    marginTop: 24,
  },
  unavailable: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
  },
  productRowDisabled: {
    opacity: 0.55,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  packageIconImage: {
    width: 32,
    height: 32,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
  },
  productDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  buyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  buyBtnDisabled: {
    opacity: 0.7,
  },
  buyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
