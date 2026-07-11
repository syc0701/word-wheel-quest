import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { ShoppingBag } from 'lucide-react-native';
import ScreenHeader from '../components/ScreenHeader';
import { useAppearance } from '../context/AppearanceContext';
import { SCREENS } from '../constants/theme';
import { IAP_PACKAGES, REVENUECAT_OFFERING, APP_STORE } from '../constants/store';
import { getDefaultOffering, purchasePackage, readPurchaseTransactionId, restorePurchases } from '../services/purchases';
import CreditApi from '../lib/creditApi';
import { isLoggedIn } from '../lib/auth';

function ProductRow({ name, description, priceLabel, purchasing, onBuy, colors }) {
  return (
    <View
      style={[
        styles.productRow,
        { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
      ]}
    >
      <View style={[styles.productIcon, { backgroundColor: colors.surfaceLight }]}>
        <ShoppingBag color={colors.primaryGlow} size={22} strokeWidth={1.8} />
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.productDescription, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Pressable
        style={[
          styles.buyBtn,
          { backgroundColor: colors.primary },
          purchasing && styles.buyBtnDisabled,
        ]}
        onPress={onBuy}
        disabled={purchasing}
      >
        {purchasing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buyBtnText}>{priceLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function ShopScreen({ navigate, routeParams = {} }) {
  const backScreen = routeParams.backScreen ?? SCREENS.SETTINGS;
  const { colors } = useAppearance();
  const [rcPackages, setRcPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const loadOfferings = useCallback(async () => {
    setLoading(true);
    try {
      const offering = await getDefaultOffering();
      setRcPackages(offering?.availablePackages ?? []);
    } catch (error) {
      Alert.alert('Shop unavailable', error.message ?? 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const findRcPackage = (packageId) => rcPackages.find((pkg) => pkg.identifier === packageId);

  const handleBuy = async (meta) => {
    const rcPackage = findRcPackage(meta.packageId);
    if (!rcPackage) {
      Alert.alert('Unavailable', 'This product is not loaded yet. Try again in a moment.');
      return;
    }

    setPurchasingId(meta.packageId);
    try {
      const purchaseResult = await purchasePackage(rcPackage);
      const authed = await isLoggedIn();
      if (authed) {
        await CreditApi.verifyIapPurchase({
          appCode: APP_STORE.appSiteId,
          productId: rcPackage.product.identifier,
          transactionId: readPurchaseTransactionId(purchaseResult),
          rawPayload: {
            platform: 'apple',
            storeProductId: rcPackage.product.identifier,
            packageKey: meta.packageId,
          },
        });
      }
      Alert.alert('Thank you!', `${meta.name} purchased successfully.`);
    } catch (error) {
      if (error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return;
      Alert.alert('Purchase failed', error.message ?? 'Something went wrong.');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch (error) {
      Alert.alert('Restore failed', error.message ?? 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Shop" onBack={() => navigate(backScreen, routeParams)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.text }]}>{REVENUECAT_OFFERING.displayName}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Offering `{REVENUECAT_OFFERING.identifier}` · Prices from the App Store.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primaryGlow} style={styles.loader} />
        ) : (
          IAP_PACKAGES.map((meta) => {
            const rcPackage = findRcPackage(meta.packageId);
            const priceLabel = rcPackage?.product?.priceString ?? meta.priceUsd;
            return (
              <ProductRow
                key={meta.packageId}
                name={meta.name}
                description={meta.description}
                priceLabel={priceLabel}
                purchasing={purchasingId === meta.packageId}
                onBuy={() => handleBuy(meta)}
                colors={colors}
              />
            );
          })
        )}

        <Pressable style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
          {restoring ? (
            <ActivityIndicator color={colors.textMuted} size="small" />
          ) : (
            <Text style={[styles.restoreText, { color: colors.textMuted }]}>Restore purchases</Text>
          )}
        </Pressable>
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
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  loader: {
    marginTop: 24,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  restoreBtn: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
