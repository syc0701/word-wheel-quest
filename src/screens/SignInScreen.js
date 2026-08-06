import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff, Settings } from 'lucide-react-native';
import { APP_URLS } from '../constants/store';
import { SCREENS } from '../constants/theme';
import { useAppearance } from '../context/AppearanceContext';
import { useT } from '../context/LanguageContext';
import {
  loginWithPassword,
  signInErrorMessage,
  signInWithApple,
} from '../services/cognitoAuth';

export default function SignInScreen({ navigate, routeParams = {} }) {
  const { colors, isRandomScene } = useAppearance();
  const t = useT();
  const backScreen = SCREENS.SETTINGS;

  const emailRef = useRef('');
  const passwordRef = useRef('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [error, setError] = useState('');

  // Image theme: dark chrome colors wash out on scene photos — use light over-photo type.
  const onScene = isRandomScene;
  const titleColor = onScene ? '#ffffff' : colors.text;
  const mutedColor = onScene ? 'rgba(255, 255, 255, 0.9)' : colors.textMuted;
  const linkColor = onScene ? '#5eead4' : colors.primaryGlow;
  const iconColor = onScene ? '#ffffff' : colors.textMuted;
  const sceneShadow = onScene
    ? {
        textShadowColor: 'rgba(0, 0, 0, 0.55)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 5,
      }
    : null;

  const finishSignIn = () => {
    navigate(backScreen, {
      ...routeParams,
      backScreen: routeParams.backScreen ?? SCREENS.PLAY,
      signedIn: true,
      authTick: Date.now(),
    });
  };

  const handleEmailSignIn = async () => {
    setError('');
    const trimmedEmail = (email || emailRef.current).trim();
    const pwd = password || passwordRef.current;
    if (!trimmedEmail || !pwd) {
      setError(signInErrorMessage('invalid-input'));
      return;
    }
    setBusy(true);
    try {
      const result = await loginWithPassword(trimmedEmail, pwd);
      if (result.success) {
        finishSignIn();
        return;
      }
      setError(result.message || signInErrorMessage(result.errorKey));
    } catch (e) {
      setError(e?.message || signInErrorMessage('generic'));
    } finally {
      setBusy(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setAppleBusy(true);
    try {
      const result = await signInWithApple();
      if (result.cancelled) return;
      if (result.success) {
        finishSignIn();
      }
    } catch (e) {
      setError(e?.message || signInErrorMessage('generic'));
    } finally {
      setAppleBusy(false);
    }
  };

  const openLegal = (url, title) => {
    navigate(SCREENS.WEBVIEW, {
      url,
      title,
      backScreen: SCREENS.SIGN_IN,
      returnParams: routeParams,
    });
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.settingsBtn, onScene && styles.settingsBtnScene]}
        onPress={() => navigate(backScreen, routeParams)}
        hitSlop={8}
      >
        <Settings color={iconColor} size={22} />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: titleColor }, sceneShadow]}>
            {t('signIn.title')}
          </Text>

          <Text style={[styles.legal, { color: mutedColor }, sceneShadow]}>
            {t('signIn.legal.prefix')}
            <Text
              style={[styles.legalLink, { color: linkColor }]}
              onPress={() => openLegal(APP_URLS.terms, t('signIn.legal.termsTitle'))}
            >
              {t('signIn.legal.termsLink')}
            </Text>
            {t('signIn.legal.and')}
            <Text
              style={[styles.legalLink, { color: linkColor }]}
              onPress={() => openLegal(APP_URLS.privacy, t('signIn.legal.privacyTitle'))}
            >
              {t('signIn.legal.privacyLink')}
            </Text>
            {t('signIn.legal.period')}
          </Text>

          {error ? (
            <Text style={[styles.error, sceneShadow]}>{error}</Text>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder={t('signIn.placeholder.email')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={(value) => {
              emailRef.current = value;
              setEmail(value);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            editable={!busy && !appleBusy}
          />

          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder={t('signIn.placeholder.password')}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(value) => {
                passwordRef.current = value;
                setPassword(value);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="password"
              editable={!busy && !appleBusy}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              {showPassword ? (
                <EyeOff color={colors.textMuted} size={20} />
              ) : (
                <Eye color={colors.textMuted} size={20} />
              )}
            </Pressable>
          </View>

          <Pressable
            style={[styles.primaryBtn, (busy || appleBusy) && styles.btnDisabled]}
            onPress={handleEmailSignIn}
            disabled={busy || appleBusy}
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('signIn.button.email')}</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, onScene && styles.dividerLineScene]} />
            <Text style={[styles.dividerText, { color: mutedColor }, sceneShadow]}>
              {t('signIn.divider')}
            </Text>
            <View style={[styles.dividerLine, onScene && styles.dividerLineScene]} />
          </View>

          {Platform.OS === 'ios' ? (
            <Pressable
              style={[styles.appleBtn, (busy || appleBusy) && styles.btnDisabled]}
              onPress={handleAppleSignIn}
              disabled={busy || appleBusy}
            >
              {appleBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.appleBtnText}>{t('signIn.button.apple')}</Text>
              )}
            </Pressable>
          ) : (
            <Text style={[styles.appleHint, { color: mutedColor }, sceneShadow]}>
              {t('signIn.apple.hint')}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  settingsBtn: {
    position: 'absolute',
    top: 52,
    right: 16,
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  settingsBtnScene: {
    backgroundColor: 'rgba(6, 32, 38, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 96,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 16,
  },
  legal: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
  legalLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  error: {
    color: '#fecaca',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  passwordWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceLight,
  },
  dividerLineScene: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dividerText: {
    fontSize: 13,
  },
  appleBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  appleHint: {
    fontSize: 13,
    textAlign: 'center',
  },
});
}
