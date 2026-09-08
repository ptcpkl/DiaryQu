package com.diaryqu.routines

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RoutineProofPickerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  companion object {
    private const val REQUEST_PICK_IMAGE = 7821
    private const val MAX_IMAGE_BYTES = 6_000_000
    private val ALLOWED_MIME_TYPES = setOf("image/jpeg", "image/png", "image/webp")
  }

  private var pendingPromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String = "RoutineProofPicker"

  @ReactMethod
  fun pickImage(promise: Promise) {
    if (pendingPromise != null) {
      promise.reject("ROUTINE_PICKER_BUSY", "Pemilih foto sedang digunakan.")
      return
    }

    val activity = currentActivity
    if (activity == null) {
      promise.reject("ROUTINE_PICKER_NO_ACTIVITY", "Activity Android tidak tersedia.")
      return
    }

    val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      Intent(MediaStore.ACTION_PICK_IMAGES).apply {
        type = "image/*"
      }
    } else {
      Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "image/*"
      }
    }

    pendingPromise = promise
    try {
      activity.startActivityForResult(intent, REQUEST_PICK_IMAGE)
    } catch (error: Exception) {
      pendingPromise = null
      promise.reject("ROUTINE_PICKER_START_FAILED", error)
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST_PICK_IMAGE) return

    val promise = pendingPromise ?: return
    pendingPromise = null

    if (resultCode != Activity.RESULT_OK) {
      promise.reject("ROUTINE_PICKER_CANCELLED", "Pemilihan foto dibatalkan.")
      return
    }

    val uri = data?.data
    if (uri == null) {
      promise.reject("ROUTINE_PICKER_EMPTY", "Foto tidak ditemukan.")
      return
    }

    try {
      val resolver = reactContext.contentResolver
      val mimeType = resolver.getType(uri) ?: ""
      if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
        promise.reject("ROUTINE_PICKER_UNSUPPORTED", "Gunakan gambar JPG, PNG, atau WEBP.")
        return
      }

      val bytes = resolver.openInputStream(uri)?.use { stream ->
        val buffer = ByteArray(8 * 1024)
        val output = java.io.ByteArrayOutputStream()
        var total = 0
        while (true) {
          val read = stream.read(buffer)
          if (read <= 0) break
          total += read
          if (total > MAX_IMAGE_BYTES) {
            throw IllegalArgumentException("ROUTINE_PROOF_TOO_LARGE")
          }
          output.write(buffer, 0, read)
        }
        output.toByteArray()
      } ?: throw IllegalStateException("ROUTINE_PICKER_READ_FAILED")

      val result = Arguments.createMap().apply {
        putString("mimeType", mimeType)
        putInt("sizeBytes", bytes.size)
        putString("base64", Base64.encodeToString(bytes, Base64.NO_WRAP))
      }
      promise.resolve(result)
    } catch (error: IllegalArgumentException) {
      promise.reject("ROUTINE_PROOF_TOO_LARGE", "Ukuran foto maksimal 6 MB.", error)
    } catch (error: Exception) {
      promise.reject("ROUTINE_PICKER_READ_FAILED", error)
    }
  }

  override fun onNewIntent(intent: Intent) = Unit
}
