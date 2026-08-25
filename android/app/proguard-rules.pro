# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native / hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.defaults.** { *; }
-keep class com.facebook.react.runtime.** { *; }
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# react-native-reanimated / gesture-handler
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }

# Expo modules (notifications, audio, splash, asset, …)
-keep class expo.modules.** { *; }
-keepclassmembers class * {
  @expo.modules.core.interfaces.ExpoProp *;
  @expo.modules.kotlin.modules.ModuleDefinitionBuilder *;
}
-dontwarn expo.modules.**

# kotlin-reflect / Expo ClassComponentBuilder (cold-start KotlinReflectionInternalError)
-keep class kotlin.Metadata { *; }
-keep class kotlin.reflect.** { *; }
-keepattributes InnerClasses,Signature,RuntimeVisible*Annotations,EnclosingMethod,AnnotationDefault
-dontwarn kotlin.reflect.jvm.internal.**

# RevenueCat
-keep class com.revenuecat.purchases.** { *; }
-dontwarn com.revenuecat.purchases.**

# Play Integrity / Google Play services (optional at runtime)
-keep class com.google.android.play.core.integrity.** { *; }
-dontwarn com.google.android.play.core.**
-dontwarn com.google.android.gms.**

# Google Sign-In / Play Services Auth
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.reactnativegooglesignin.** { *; }

# Google Mobile Ads + RN bridge
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.internal.ads.** { *; }
-keep class io.invertase.googlemobileads.** { *; }
-dontwarn com.google.android.gms.ads.**
-dontwarn io.invertase.googlemobileads.**

# Keep native methods / JNI for New Architecture
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native TurboModule / codegen classes discovered by reflection
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.turbomodule.core.interfaces.TurboModule { *; }
