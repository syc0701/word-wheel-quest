package expo.modules.playintegrity

import android.content.pm.PackageManager
import android.os.Build
import android.util.Base64
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.MessageDigest
import java.security.SecureRandom

/**
 * Classic Play Integrity token request.
 * Nonce is URL-safe Base64 (no wrap/pad), ≥16 bytes.
 * JS verifies the token with puzzle-be — never trust it on-device.
 */
class PlayIntegrityModule : Module() {
  companion object {
    private const val NONCE_BYTES = 32

    private fun fingerprint(algorithm: String, cert: ByteArray): String {
      val digest = MessageDigest.getInstance(algorithm).digest(cert)
      return digest.joinToString(":") { byte ->
        String.format("%02X", byte.toInt() and 0xff)
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("PlayIntegrity")

    AsyncFunction("getSigningInfo") { promise: Promise ->
      val context =
        appContext.reactContext
          ?: run {
            promise.reject("E_NO_CONTEXT", "React context unavailable", null)
            return@AsyncFunction
          }

      try {
        val packageName = context.packageName
        val pm = context.packageManager
        val signatures =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val info =
              pm.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES)
            info.signingInfo?.apkContentsSigners ?: emptyArray()
          } else {
            @Suppress("DEPRECATION")
            val info = pm.getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
            @Suppress("DEPRECATION")
            info.signatures ?: emptyArray()
          }

        val cert = signatures.firstOrNull()?.toByteArray()
        promise.resolve(
          mapOf(
            "packageName" to packageName,
            "sha1" to (cert?.let { fingerprint("SHA-1", it) } ?: ""),
            "sha256" to (cert?.let { fingerprint("SHA-256", it) } ?: "")
          )
        )
      } catch (error: Exception) {
        promise.reject(
          "E_SIGNING_INFO",
          error.message ?: "Could not read app signing certificates",
          error
        )
      }
    }

    AsyncFunction("requestToken") { options: Map<String, Any?>?, promise: Promise ->
      val provided = (options?.get("nonce") as? String)?.trim().orEmpty()
      val nonce =
        if (provided.isNotEmpty()) {
          provided
        } else {
          val raw = ByteArray(NONCE_BYTES)
          SecureRandom().nextBytes(raw)
          Base64.encodeToString(
            raw,
            Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
          )
        }

      val context =
        appContext.reactContext
          ?: run {
            promise.reject("E_NO_CONTEXT", "React context unavailable", null)
            return@AsyncFunction
          }

      val integrityManager = IntegrityManagerFactory.create(context)
      integrityManager
        .requestIntegrityToken(
          IntegrityTokenRequest.builder().setNonce(nonce).build()
        )
        .addOnSuccessListener { response ->
          promise.resolve(
            mapOf(
              "token" to response.token(),
              "nonce" to nonce
            )
          )
        }
        .addOnFailureListener { error ->
          promise.reject(
            "E_INTEGRITY_TOKEN",
            error.message ?: "Play Integrity token request failed",
            error
          )
        }
    }
  }
}
