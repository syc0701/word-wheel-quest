import AsyncStorage from '@react-native-async-storage/async-storage';
import { addGuestPuzzleCoins } from './guestCoinsStorage';

const GRANTED_KEY = 'ww.pack_bonus_tx';

/**
 * Guest pack bonus. Signed-in purchases are granted on the account during verify,
 * so this only writes the on-device balance. The same transaction is granted once.
 */
export async function grantLocalPackBonus(transactionId, coins) {
  const gift = Math.max(0, Math.floor(Number(coins) || 0));
  const txId = transactionId == null ? '' : String(transactionId).trim();
  if (!gift || !txId) return false;
  let ids = [];
  try {
    const raw = await AsyncStorage.getItem(GRANTED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) ids = parsed.map(String);
  } catch {
    ids = [];
  }
  if (ids.includes(txId)) return false;
  await addGuestPuzzleCoins(gift);
  ids.push(txId);
  try {
    await AsyncStorage.setItem(GRANTED_KEY, JSON.stringify(ids.slice(-40)));
  } catch {
    /* the coins are already saved; a retry may grant once more */
  }
  return true;
}
