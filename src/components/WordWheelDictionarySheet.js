import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import {
  fetchWordDefinition,
  formatDefinition,
  sortMeanings,
  titleCasePartOfSpeech,
} from '../lib/dictionary';
import { WW } from '../constants/theme';
import { useT } from '../context/LanguageContext';

function HiddenWordCircles({ length }) {
  if (!length || length < 1) return null;
  return (
    <View style={styles.circlesRow}>
      {Array.from({ length }, (_, index) => (
        <View key={index} style={styles.circle} />
      ))}
    </View>
  );
}

export default function WordWheelDictionarySheet({
  visible,
  onClose,
  word,
  wordRevealed = true,
  language = 'english',
}) {
  const t = useT();
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const trimmed = (word || '').trim();

    if (!visible || !trimmed) {
      setWordData(null);
      setError('');
      return undefined;
    }

    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchWordDefinition(trimmed, language);
        if (!cancelled) setWordData(result);
      } catch {
        if (!cancelled) {
          setError(t('dictionary.error.load'));
          setWordData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, word, language]);

  const handleClose = () => {
    setWordData(null);
    setError('');
    onClose?.();
  };

  const trimmedWord = (word || '').trim();
  const displayWord = trimmedWord
    ? trimmedWord.charAt(0).toUpperCase() + trimmedWord.slice(1).toLowerCase()
    : '';
  const meanings = sortMeanings(wordData?.meanings);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerWord}>
              {trimmedWord &&
                (wordRevealed ? (
                  <Text style={styles.wordTitle}>{displayWord}</Text>
                ) : (
                  <HiddenWordCircles length={trimmedWord.length} />
                ))}
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={8}>
              <X color={WW.textOnSurface} size={22} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#059669" size="small" />
                <Text style={styles.loadingText}>{t('dictionary.loading')}</Text>
              </View>
            )}

            {!loading && error && <Text style={styles.error}>{error}</Text>}

            {!loading && !error && meanings.length === 0 && (
              <Text style={styles.empty}>{t('dictionary.empty')}</Text>
            )}

            {!loading &&
              !error &&
              meanings.map((meaning, meaningIndex) => (
                <View key={`${meaning.partOfSpeech}-${meaningIndex}`} style={styles.meaningBlock}>
                  <Text style={styles.posTitle}>
                    {titleCasePartOfSpeech(meaning.partOfSpeech)}
                  </Text>
                  {(meaning.definitions || []).map((def, defIndex) => (
                    <View key={defIndex} style={styles.defBlock}>
                      <Text style={styles.definition}>{formatDefinition(def.definition)}</Text>
                      {def.example ? (
                        <Text style={styles.example}>&ldquo;{def.example}&rdquo;</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}

            <Text style={styles.attribution}>
              {t('dictionary.attribution')}
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: WW.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 61, 54, 0.18)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
    marginBottom: 8,
  },
  headerWord: {
    flex: 1,
  },
  wordTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'capitalize',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  body: {
    paddingHorizontal: 16,
    maxHeight: 420,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: 'rgba(15, 61, 54, 0.7)',
    fontSize: 14,
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    paddingVertical: 8,
  },
  empty: {
    color: 'rgba(15, 61, 54, 0.7)',
    fontSize: 14,
    paddingVertical: 8,
  },
  meaningBlock: {
    marginBottom: 16,
  },
  posTitle: {
    fontWeight: '800',
    color: '#047857',
    fontSize: 14,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  defBlock: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  definition: {
    fontSize: 14,
    lineHeight: 22,
    color: WW.textOnSurface,
  },
  example: {
    marginTop: 4,
    paddingLeft: 8,
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(15, 61, 54, 0.65)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(5, 150, 105, 0.35)',
  },
  attribution: {
    fontSize: 11,
    color: 'rgba(15, 61, 54, 0.55)',
    marginTop: 8,
    marginBottom: 12,
  },
});
