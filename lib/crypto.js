import CryptoJS from 'crypto-js';

const SECRET_KEY = 'ZMs1X4mbSopARLxp';

export function decryptText(encryptedText) {
  try {
    const encryptedBytes = CryptoJS.enc.Base64.parse(encryptedText);
    const decryptedBytes = CryptoJS.AES.decrypt(
      { ciphertext: encryptedBytes },
      CryptoJS.enc.Utf8.parse(SECRET_KEY),
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    return decryptedBytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}

export function encryptText(plainText) {
  try {
    const encryptedBytes = CryptoJS.AES.encrypt(plainText, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encryptedBytes.ciphertext.toString(CryptoJS.enc.Base64);
  } catch {
    return null;
  }
}

export function parseApiJson(json) {
  if (json && json.encrypted) {
    const decrypted = decryptText(json.encrypted);
    if (decrypted) {
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    }
  }
  return json;
}
