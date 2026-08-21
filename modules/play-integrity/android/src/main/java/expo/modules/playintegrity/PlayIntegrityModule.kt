package expo.modules.playintegrity

import android.util.Base64
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.SecureRandom

/**
 * Classic Play Integrity token request.
 * Nonce is URL-safe Base64 (no wrap/pad), ≥16 bytes.
 * JS verifies the token with puzzle-be — never trust it on-device.
 */
class PlayIntegrityModule : Module() {
  companion object {
    private const val NONCE_BYTES = 32
  }

  override fun definition() = ModuleDefinition {
    Name("PlayIntegrity")

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
