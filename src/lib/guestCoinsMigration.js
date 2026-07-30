import { clearGuestPuzzleCoins, loadGuestPuzzleCoins } from './guestCoinsStorage';
import { fetchUserInfo, normalizeCloudUserPayload, resolveWordWheelQuestCoins } from './userApi';

/**
 * Reconcile the on-device guest coin balance with the signed-in account.
 *
 * The account is authoritative: once it holds coins, the local balance is dropped.
 * When the account has none, the guest balance is deliberately kept on device —
 * it used to be deleted on the first authenticated request, which threw away every
 * coin earned before signing in. Uploading that leftover balance still needs a
 * server write path; until then it stays put rather than being destroyed.
 *
 * Never clears local coins unless the account balance was actually read, so a
 * failed profile fetch cannot lose the player's coins.
 */
export async function reconcileGuestCoinsWithAccount() {
  const localCoins = await loadGuestPuzzleCoins();
  if (localCoins == null) return { status: 'no-local-balance' };

  let cloudUser = null;
  try {
    cloudUser = normalizeCloudUserPayload(await fetchUserInfo());
  } catch {
    return { status: 'profile-unavailable', localCoins };
  }
  if (!cloudUser) return { status: 'profile-unavailable', localCoins };

  const accountCoins = resolveWordWheelQuestCoins(cloudUser);
  if (accountCoins > 0) {
    await clearGuestPuzzleCoins();
    return { status: 'account-wins', accountCoins, localCoins };
  }

  return { status: 'awaiting-upload', accountCoins, localCoins };
}
