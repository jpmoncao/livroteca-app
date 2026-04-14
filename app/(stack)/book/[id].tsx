import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BOOK_COVER_COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBookById, getReviewStorageKey, type Book } from '@/lib/openLibrary';
import { get, ref, set } from 'firebase/database';
import { auth, database } from '../../../services/connectionFirebase';

const BOOK_COVER_WIDTH = 140;
const BOOK_COVER_HEIGHT = 210;

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [bookLoading, setBookLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const saveNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const ratingColor = useThemeColor({}, 'rating');
  const borderColor = useThemeColor({}, 'border');
  const buttonPrimaryColor = useThemeColor({}, 'primary');
  const buttonTextColor = useThemeColor({}, 'onPrimary');

  useEffect(() => {
    const fetchBookReview = async () => {
      setBookLoading(true);

      if (!id) {
        setBookLoading(false);
        return;
      }

      const fetchedBook = await getBookById(id).catch(() => null);
      setBook(fetchedBook);

      const reviewKey = getReviewStorageKey(fetchedBook, id);
      const snapshot = ref(database, `book-reviews/${auth.currentUser?.uid}/${reviewKey}`);
      const bookReview = await get(snapshot);

      if (bookReview.exists()) {
        setRating(bookReview.val().rating);
        setReview(bookReview.val().review);
      }

      setBookLoading(false);
    };

    fetchBookReview();
  }, [id]);

  useEffect(() => {
    return () => {
      if (saveNavTimeoutRef.current) {
        clearTimeout(saveNavTimeoutRef.current);
      }
    };
  }, []);

  const bookIndex = id ? (id.length % BOOK_COVER_COLORS.length) : 0;
  const formLocked = saving || saveSuccess;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      opacity: 0.8,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    bookInfo: {
      flexDirection: 'row',
      marginBottom: 32,
      gap: 20,
    },
    cover: {
      width: BOOK_COVER_WIDTH,
      height: BOOK_COVER_HEIGHT,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    bookDetails: {
      flex: 1,
      justifyContent: 'center',
      gap: 8,
    },
    title: {
      fontSize: 24,
    },
    author: {
      opacity: 0.8,
    },
    isbn: {
      opacity: 0.7,
      fontSize: 14,
      fontFamily: 'monospace',
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    starsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    starButton: {
      padding: 4,
    },
    ratingHint: {
      opacity: 0.7,
      fontSize: 14,
    },
    reviewInput: {
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 8,
      padding: 16,
      minHeight: 140,
      fontSize: 16,
    },
    saveButton: {
      backgroundColor: buttonPrimaryColor,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      minHeight: 52,
    },
    saveButtonDisabled: {
      opacity: 0.65,
    },
    saveButtonPressed: {
      opacity: 0.8,
    },
    saveButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    saveButtonText: {
      color: buttonTextColor,
    },
    successBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: 'rgba(34, 197, 94, 0.18)',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.45)',
    },
    successBannerText: {
      color: '#15803d',
      fontSize: 16,
    },
    errorBanner: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.35)',
    },
    errorBannerText: {
      color: '#b91c1c',
      fontSize: 14,
    },
  });

  if (bookLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ScreenLayout>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={iconColor} />
            <ThemedText type="default" style={styles.loadingText}>
              Carregando livro...
            </ThemedText>
          </View>
        </ScreenLayout>
      </ThemedView>
    );
  }

  if (!book) {
    return (
      <ThemedView style={styles.container}>
        <ScreenLayout>
          <View style={styles.content}>
            <ThemedText type="subtitle">Livro não encontrado</ThemedText>
          </View>
        </ScreenLayout>
      </ThemedView>
    );
  }

  const handleSaveReview = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (!id || !book || saving || saveSuccess) return;

    setSaveError(null);
    setSaving(true);

    const reviewKey = getReviewStorageKey(book, id);
    const snapshot = ref(database, `book-reviews/${auth.currentUser?.uid}/${reviewKey}`);
    try {
      await set(snapshot, {
        rating,
        review,
      });
      setSaving(false);
      setSaveSuccess(true);
      saveNavTimeoutRef.current = setTimeout(() => {
        saveNavTimeoutRef.current = null;
        router.back();
      }, 900);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      setSaving(false);
      setSaveError('Não foi possível salvar. Verifique a conexão e tente de novo.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenLayout>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Informações do livro */}
            <View style={styles.bookInfo}>
              <Image
                source={{ uri: book.coverUrl ?? 'https://via.placeholder.com/150' }}
                style={[
                  styles.cover,
                  { backgroundColor: BOOK_COVER_COLORS[bookIndex % BOOK_COVER_COLORS.length] },
                ]}
                resizeMode="cover"
              />
              <View style={styles.bookDetails}>
                <ThemedText type="title" style={styles.title}>
                  {book.title}
                </ThemedText>
                {book.author && (
                  <ThemedText type="default" style={styles.author}>
                    {book.author}
                  </ThemedText>
                )}
                {book.isbn && (
                  <ThemedText type="default" style={styles.isbn}>
                    ISBN: {book.isbn}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Avaliação com estrelas */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Sua avaliação
              </ThemedText>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    disabled={formLocked}
                    style={styles.starButton}
                    hitSlop={8}>
                    <MaterialIcons
                      name={star <= rating ? 'star' : 'star-border'}
                      size={40}
                      color={star <= rating ? ratingColor : iconColor}
                    />
                  </Pressable>
                ))}
              </View>
              <ThemedText type="default" style={styles.ratingHint}>
                {rating === 0 ? 'Toque para avaliar' : `${rating} de 5 estrelas`}
              </ThemedText>
            </View>

            {/* Campo de resenha */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Resenha
              </ThemedText>
              <TextInput
                style={[styles.reviewInput, { color: textColor }]}
                placeholder="Escreva sua resenha sobre o livro..."
                placeholderTextColor={iconColor}
                multiline
                numberOfLines={6}
                value={review}
                onChangeText={setReview}
                textAlignVertical="top"
                editable={!formLocked}
              />
            </View>

            {/* Salvar / feedback */}
            {saveSuccess ? (
              <View style={styles.successBanner} accessibilityRole="text">
                <MaterialIcons name="check-circle" size={28} color="#15803d" />
                <ThemedText type="defaultSemiBold" style={styles.successBannerText}>
                  Avaliação salva com sucesso
                </ThemedText>
              </View>
            ) : (
              <Pressable
                onPress={handleSaveReview}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                style={({ pressed }) => [
                  styles.saveButton,
                  saving && styles.saveButtonDisabled,
                  pressed && !saving && styles.saveButtonPressed,
                ]}>
                <View style={styles.saveButtonInner}>
                  {saving ? (
                    <>
                      <ActivityIndicator size="small" color={buttonTextColor} />
                      <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
                        Salvando...
                      </ThemedText>
                    </>
                  ) : (
                    <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
                      Salvar avaliação
                    </ThemedText>
                  )}
                </View>
              </Pressable>
            )}

            {saveError ? (
              <View style={styles.errorBanner}>
                <ThemedText type="default" style={styles.errorBannerText}>
                  {saveError}
                </ThemedText>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenLayout>
    </ThemedView>
  );
}
