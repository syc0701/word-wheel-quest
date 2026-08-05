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
  const [error, setError] = useState('');

  const sceneText = isRandomScene
    ? {
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      }
    : null;
  const sceneMuted = isRandomScene
    ? {
        color: 'rgba(255, 255, 255, 0.92)',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      }
    : null;
  const sceneLink = isRandomScene
    ? {
        color: '#fde68a',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
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
        style={[
          styles.settingsBtn,
          isRandomScene && styles.settingsBtnOnScene,
        ]}
        onPress={() => navigate(backScreen, routeParams)}
        hitSlop={8}
      >
        <Settings color={isRandomScene ? '#0b3d36' : colors.textMuted} size={22} />
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
          <Text style={[styles.title, sceneText]}>{t('signIn.title')}</Text>

          <Text style={[styles.legal, sceneMuted]}>
            {t('signIn.legal.prefix')}
            <Text
              style={[styles.legalLink, sceneLink]}
              onPress={() => openLegal(APP_URLS.terms, t('signIn.legal.termsTitle'))}
            >
              {t('signIn.legal.termsLink')}
            </Text>
            {t('signIn.legal.and')}
            <Text
              style={[styles.legalLink, sceneLink]}
              onPress={() => openLegal(APP_URLS.privacy, t('signIn.legal.privacyTitle'))}
            >
              {t('signIn.legal.privacyLink')}
            </Text>
            {t('signIn.legal.period')}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={[styles.input, isRandomScene && styles.inputOnScene]}
            placeholder={t('signIn.placeholder.email')}
            placeholderTextColor={isRandomScene ? '#64748b' : colors.textMuted}
            value={email}
            onChangeText={(value) => {
              emailRef.current = value;
              setEmail(value);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            keyboardType="email-address"
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            editable={!busy}
          />

          <View style={styles.passwordWrap}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                isRandomScene && styles.inputOnScene,
              ]}
              placeholder={t('signIn.placeholder.password')}
              placeholderTextColor={isRandomScene ? '#64748b' : colors.textMuted}
              value={password}
              onChangeText={(value) => {
                passwordRef.current = value;
                setPassword(value);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              editable={!busy}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              {showPassword ? (
                <EyeOff color={isRandomScene ? '#475569' : colors.textMuted} size={20} />
              ) : (
                <Eye color={isRandomScene ? '#475569' : colors.textMuted} size={20} />
              )}
            </Pressable>
          </View>

          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={handleEmailSignIn}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('signIn.button.email')}</Text>
            )}
          </Pressable>
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
  settingsBtnOnScene: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 96,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 16,
  },
  legal: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
  legalLink: {
    color: colors.primaryGlow,
    fontWeight: '600',
  },
  error: {
    color: '#f87171',
    fontSize: 14,
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
  inputOnScene: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    color: '#0f172a',
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
});
}
