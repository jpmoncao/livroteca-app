import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import {
  DEFAULT_READING_STATUS,
  formatFinishedAt,
  isReadingStatus,
  READING_STATUS_OPTIONS,
  type ReadingStatus,
  type StoredReview,
} from '@/lib/reviews';
import { get, ref, remove, set } from 'firebase/database';
import { auth, database } from '../../../services/connectionFirebase';

const BOOK_COVER_WIDTH = 140;
const BOOK_COVER_HEIGHT = 210;

export default function BookDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [bookLoading, setBookLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [existingReview, setExistingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>(DEFAULT_READING_STATUS);
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recordImageUri, setRecordImageUri] = useState<string | null>(null);
  const [recordImageVersion, setRecordImageVersion] = useState(0);
  const [pickingImage, setPickingImage] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
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
      if (reviewKey) {
        const snapshot = ref(database, `book-reviews/${auth.currentUser?.uid}/${reviewKey}`);
        const bookReview = await get(snapshot);

        if (bookReview.exists()) {
          const data = bookReview.val() as StoredReview;
          setExistingReview(true);
          setRating(typeof data.rating === 'number' ? data.rating : 0);
          setReview(typeof data.review === 'string' ? data.review : '');
          setReadingStatus(
            isReadingStatus(data.readingStatus) ? data.readingStatus : DEFAULT_READING_STATUS,
          );
          setHasSpoiler(data.hasSpoiler === true);
          setFinishedAt(
            typeof data.finishedAt === 'number' && !Number.isNaN(data.finishedAt)
              ? new Date(data.finishedAt)
              : null,
          );
          setRecommend(typeof data.recommend === 'boolean' ? data.recommend : null);
          setRecordImageUri(
            typeof data.recordImageUri === 'string' && data.recordImageUri.length > 0
              ? data.recordImageUri
              : null,
          );
        }
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
  const reviewKey = book && id ? getReviewStorageKey(book, id) : null;
  const formLocked = saving || saveSuccess || deleting || deleteSuccess || reviewKey === null;

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
    deleteButton: {
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      minHeight: 48,
      borderWidth: 1,
      borderColor: 'rgba(185, 28, 28, 0.45)',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    deleteButtonDisabled: {
      opacity: 0.65,
    },
    deleteButtonPressed: {
      opacity: 0.75,
    },
    deleteButtonText: {
      color: '#b91c1c',
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
    isbnNotice: {
      marginBottom: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'rgba(120, 120, 120, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(120, 120, 120, 0.22)',
    },
    isbnNoticeText: {
      opacity: 0.88,
      fontSize: 14,
    },
    recordCard: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: borderColor,
      backgroundColor: 'rgba(120, 120, 120, 0.08)',
    },
    recordCardEmpty: {
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordCardPressed: {
      opacity: 0.85,
    },
    recordImage: {
      width: '100%',
      height: '100%',
    },
    recordPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 24,
    },
    recordPlaceholderText: {
      fontSize: 16,
      textAlign: 'center',
    },
    recordPlaceholderHint: {
      opacity: 0.7,
      fontSize: 13,
      textAlign: 'center',
    },
    recordOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    recordActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    recordActionPressed: {
      opacity: 0.8,
    },
    recordActionText: {
      fontSize: 14,
    },
    recordActionDestructive: {
      color: '#b91c1c',
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    statusChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: borderColor,
    },
    statusChipSelected: {
      backgroundColor: buttonPrimaryColor,
      borderColor: buttonPrimaryColor,
    },
    statusChipPressed: {
      opacity: 0.75,
    },
    statusChipText: {
      fontSize: 14,
    },
    statusChipTextSelected: {
      color: buttonTextColor,
    },
    spoilerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 8,
      padding: 14,
    },
    spoilerTextWrap: {
      flex: 1,
      gap: 4,
    },
    spoilerTitle: {
      marginBottom: 0,
    },
    spoilerHint: {
      fontSize: 13,
      opacity: 0.7,
    },
    recommendRow: {
      flexDirection: 'row',
      gap: 12,
    },
    recommendButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    recommendButtonSelectedYes: {
      backgroundColor: buttonPrimaryColor,
      borderColor: buttonPrimaryColor,
    },
    recommendButtonSelectedNo: {
      backgroundColor: '#6B7280',
      borderColor: '#6B7280',
    },
    recommendButtonPressed: {
      opacity: 0.8,
    },
    recommendButtonText: {
      fontSize: 14,
    },
    recommendButtonTextSelected: {
      color: buttonTextColor,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    dateButtonPressed: {
      opacity: 0.8,
    },
    dateButtonText: {
      fontSize: 15,
    },
    dateClearButton: {
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    datePickerDoneButton: {
      alignSelf: 'flex-end',
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: buttonPrimaryColor,
    },
    datePickerDoneText: {
      color: buttonTextColor,
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

  const ensureReviewsDirectory = (): Directory => {
    const dir = new Directory(Paths.document, 'reviews');
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    return dir;
  };

  const extractExtension = (uri: string, fallback = 'jpg'): string => {
    const cleaned = uri.split('?')[0].split('#')[0];
    const dot = cleaned.lastIndexOf('.');
    if (dot < 0) return fallback;
    const ext = cleaned.slice(dot + 1).toLowerCase();
    if (!ext || ext.length > 5 || /[^a-z0-9]/.test(ext)) return fallback;
    return ext;
  };

  const handlePickRecordImage = async () => {
    if (formLocked || pickingImage) return;
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (!book || !id) return;
    const rk = getReviewStorageKey(book, id);
    if (!rk) {
      setPickError('Só é possível adicionar foto quando o livro tiver ISBN.');
      return;
    }

    setPickError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setPickError('Permissão da câmera negada. Habilite nas configurações para tirar a foto.');
        return;
      }

      setPickingImage(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const dir = ensureReviewsDirectory();
      const ext = extractExtension(asset.uri);

      const previousFile = new File(dir, `${rk}.${ext}`);
      if (previousFile.exists) previousFile.delete();

      const sourceFile = new File(asset.uri);
      sourceFile.copy(previousFile);

      setRecordImageUri(previousFile.uri);
      setRecordImageVersion((v) => v + 1);
    } catch (error) {
      console.error('[BookDetail] Erro ao capturar foto:', error);
      setPickError('Não foi possível salvar a foto. Tente novamente.');
    } finally {
      setPickingImage(false);
    }
  };

  const handleRemoveRecordImage = () => {
    if (formLocked || pickingImage || !recordImageUri) return;
    try {
      const file = new File(recordImageUri);
      if (file.exists) file.delete();
    } catch (error) {
      console.error('[BookDetail] Erro ao remover arquivo da foto:', error);
    }
    setRecordImageUri(null);
    setRecordImageVersion((v) => v + 1);
    setPickError(null);
  };

  const handleSaveReview = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (!id || !book || saving || saveSuccess) return;

    const rk = getReviewStorageKey(book, id);
    if (!rk) {
      setSaveError('Só é possível salvar avaliação quando o livro tiver ISBN.');
      return;
    }

    setSaveError(null);
    setSaving(true);

    const snapshot = ref(database, `book-reviews/${auth.currentUser?.uid}/${rk}`);
    try {
      const payload: StoredReview = {
        rating,
        review,
        readingStatus,
        hasSpoiler,
        recommend,
      };
      if (finishedAt) {
        payload.finishedAt = finishedAt.getTime();
      }
      if (recordImageUri) {
        payload.recordImageUri = recordImageUri;
      }
      await set(snapshot, payload);
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

  const performDeleteReview = async () => {
    if (!id || !book) return;

    const rk = getReviewStorageKey(book, id);
    if (!rk) return;

    setDeleteError(null);
    setSaveError(null);
    setDeleting(true);

    const snapshot = ref(database, `book-reviews/${auth.currentUser?.uid}/${rk}`);
    try {
      if (recordImageUri) {
        try {
          const file = new File(recordImageUri);
          if (file.exists) file.delete();
        } catch (fileError) {
          console.error('[BookDetail] Erro ao remover arquivo da foto:', fileError);
        }
      }
      await remove(snapshot);
      setDeleting(false);
      setDeleteSuccess(true);
      saveNavTimeoutRef.current = setTimeout(() => {
        saveNavTimeoutRef.current = null;
        router.back();
      }, 900);
    } catch (error) {
      console.error('Erro ao remover avaliação:', error);
      setDeleting(false);
      setDeleteError('Não foi possível remover. Verifique a conexão e tente de novo.');
    }
  };

  const handleDeleteReview = () => {
    if (!isLoggedIn || !existingReview || deleting || deleteSuccess || saving || saveSuccess) {
      return;
    }

    Alert.alert(
      'Remover avaliação',
      'Tem certeza que deseja remover sua avaliação deste livro? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            void performDeleteReview();
          },
        },
      ],
      { cancelable: true },
    );
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

            {reviewKey === null ? (
              <View style={styles.isbnNotice}>
                <ThemedText type="default" style={styles.isbnNoticeText}>
                  As resenhas são guardadas por ISBN. Este livro não tem ISBN disponível para vincular a
                  avaliação.
                </ThemedText>
              </View>
            ) : null}

            {/* Registro de leitura */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Registro de leitura
              </ThemedText>
              <Pressable
                onPress={handlePickRecordImage}
                disabled={formLocked || pickingImage}
                accessibilityRole="button"
                accessibilityLabel={
                  recordImageUri ? 'Trocar foto do registro' : 'Tirar foto para o registro'
                }
                style={({ pressed }) => [
                  styles.recordCard,
                  !recordImageUri && styles.recordCardEmpty,
                  pressed && !formLocked && !pickingImage && styles.recordCardPressed,
                ]}>
                {recordImageUri ? (
                  <Image
                    source={{ uri: `${recordImageUri}?v=${recordImageVersion}` }}
                    style={styles.recordImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.recordPlaceholder}>
                    <MaterialIcons
                      name="photo-camera"
                      size={36}
                      color={iconColor}
                    />
                    <ThemedText type="defaultSemiBold" style={styles.recordPlaceholderText}>
                      Adicionar registro de leitura
                    </ThemedText>
                    <ThemedText type="default" style={styles.recordPlaceholderHint}>
                      Tire uma foto para marcar este momento.
                    </ThemedText>
                  </View>
                )}
                {pickingImage ? (
                  <View style={styles.recordOverlay}>
                    <ActivityIndicator size="large" color={buttonTextColor} />
                  </View>
                ) : null}
              </Pressable>

              {recordImageUri ? (
                <View style={styles.recordActions}>
                  <Pressable
                    onPress={handlePickRecordImage}
                    disabled={formLocked || pickingImage}
                    style={({ pressed }) => [
                      styles.recordActionButton,
                      pressed && !formLocked && !pickingImage && styles.recordActionPressed,
                    ]}
                    accessibilityRole="button">
                    <MaterialIcons name="autorenew" size={18} color={iconColor} />
                    <ThemedText type="defaultSemiBold" style={styles.recordActionText}>
                      Trocar foto
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleRemoveRecordImage}
                    disabled={formLocked || pickingImage}
                    style={({ pressed }) => [
                      styles.recordActionButton,
                      pressed && !formLocked && !pickingImage && styles.recordActionPressed,
                    ]}
                    accessibilityRole="button">
                    <MaterialIcons name="delete-outline" size={18} color="#b91c1c" />
                    <ThemedText
                      type="defaultSemiBold"
                      style={[styles.recordActionText, styles.recordActionDestructive]}>
                      Remover
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}

              {pickError ? (
                <View style={styles.errorBanner}>
                  <ThemedText type="default" style={styles.errorBannerText}>
                    {pickError}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            {/* Status de leitura */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Status de leitura
              </ThemedText>
              <View style={styles.statusRow}>
                {READING_STATUS_OPTIONS.map((option) => {
                  const selected = option.value === readingStatus;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setReadingStatus(option.value)}
                      disabled={formLocked}
                      style={({ pressed }) => [
                        styles.statusChip,
                        selected && styles.statusChipSelected,
                        pressed && !formLocked && styles.statusChipPressed,
                      ]}>
                      <ThemedText
                        type="defaultSemiBold"
                        style={[
                          styles.statusChipText,
                          selected && styles.statusChipTextSelected,
                        ]}>
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
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

            {/* Spoiler */}
            <View style={styles.section}>
              <View style={styles.spoilerRow}>
                <View style={styles.spoilerTextWrap}>
                  <ThemedText type="subtitle" style={styles.spoilerTitle}>
                    Contém spoiler
                  </ThemedText>
                  <ThemedText type="default" style={styles.spoilerHint}>
                    Avise quem ainda não leu antes de revelar a história.
                  </ThemedText>
                </View>
                <Switch
                  value={hasSpoiler}
                  onValueChange={setHasSpoiler}
                  disabled={formLocked}
                  trackColor={{ false: borderColor, true: buttonPrimaryColor }}
                  thumbColor={Platform.OS === 'android' ? buttonTextColor : undefined}
                />
              </View>
            </View>

            {/* Recomendação */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Recomenda este livro?
              </ThemedText>
              <View style={styles.recommendRow}>
                <Pressable
                  onPress={() => setRecommend(recommend === true ? null : true)}
                  disabled={formLocked}
                  style={({ pressed }) => [
                    styles.recommendButton,
                    recommend === true && styles.recommendButtonSelectedYes,
                    pressed && !formLocked && styles.recommendButtonPressed,
                  ]}>
                  <MaterialIcons
                    name="thumb-up"
                    size={22}
                    color={recommend === true ? buttonTextColor : iconColor}
                  />
                  <ThemedText
                    type="defaultSemiBold"
                    style={[
                      styles.recommendButtonText,
                      recommend === true && styles.recommendButtonTextSelected,
                    ]}>
                    Recomendo
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setRecommend(recommend === false ? null : false)}
                  disabled={formLocked}
                  style={({ pressed }) => [
                    styles.recommendButton,
                    recommend === false && styles.recommendButtonSelectedNo,
                    pressed && !formLocked && styles.recommendButtonPressed,
                  ]}>
                  <MaterialIcons
                    name="thumb-down"
                    size={22}
                    color={recommend === false ? buttonTextColor : iconColor}
                  />
                  <ThemedText
                    type="defaultSemiBold"
                    style={[
                      styles.recommendButtonText,
                      recommend === false && styles.recommendButtonTextSelected,
                    ]}>
                    Não recomendo
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Data de finalização */}
            {readingStatus === 'read' ? (
              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Data de finalização
                </ThemedText>
                <View style={styles.dateRow}>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    disabled={formLocked}
                    style={({ pressed }) => [
                      styles.dateButton,
                      pressed && !formLocked && styles.dateButtonPressed,
                    ]}>
                    <MaterialIcons name="event" size={20} color={iconColor} />
                    <ThemedText type="default" style={styles.dateButtonText}>
                      {finishedAt ? formatFinishedAt(finishedAt.getTime()) : 'Selecionar data'}
                    </ThemedText>
                  </Pressable>
                  {finishedAt ? (
                    <Pressable
                      onPress={() => setFinishedAt(null)}
                      disabled={formLocked}
                      style={({ pressed }) => [
                        styles.dateClearButton,
                        pressed && !formLocked && styles.dateButtonPressed,
                      ]}
                      accessibilityLabel="Limpar data">
                      <MaterialIcons name="close" size={20} color={iconColor} />
                    </Pressable>
                  ) : null}
                </View>
                {showDatePicker ? (
                  <DateTimePicker
                    value={finishedAt ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      if (Platform.OS !== 'ios') {
                        setShowDatePicker(false);
                      }
                      if (event.type === 'set' && date) {
                        setFinishedAt(date);
                      }
                      if (Platform.OS === 'ios' && event.type === 'dismissed') {
                        setShowDatePicker(false);
                      }
                    }}
                  />
                ) : null}
                {Platform.OS === 'ios' && showDatePicker ? (
                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    style={({ pressed }) => [
                      styles.datePickerDoneButton,
                      pressed && styles.dateButtonPressed,
                    ]}>
                    <ThemedText type="defaultSemiBold" style={styles.datePickerDoneText}>
                      Concluído
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Salvar / feedback */}
            {saveSuccess ? (
              <View style={styles.successBanner} accessibilityRole="text">
                <MaterialIcons name="check-circle" size={28} color="#15803d" />
                <ThemedText type="defaultSemiBold" style={styles.successBannerText}>
                  Avaliação salva com sucesso
                </ThemedText>
              </View>
            ) : deleteSuccess ? (
              <View style={styles.successBanner} accessibilityRole="text">
                <MaterialIcons name="delete" size={28} color="#15803d" />
                <ThemedText type="defaultSemiBold" style={styles.successBannerText}>
                  Avaliação removida
                </ThemedText>
              </View>
            ) : (
              <Pressable
                onPress={handleSaveReview}
                disabled={saving || deleting}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving || deleting, busy: saving }}
                style={({ pressed }) => [
                  styles.saveButton,
                  (saving || deleting) && styles.saveButtonDisabled,
                  pressed && !saving && !deleting && styles.saveButtonPressed,
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

            {existingReview && !saveSuccess && !deleteSuccess ? (
              <Pressable
                onPress={handleDeleteReview}
                disabled={saving || deleting}
                accessibilityRole="button"
                accessibilityLabel="Remover avaliação"
                accessibilityState={{ disabled: saving || deleting, busy: deleting }}
                style={({ pressed }) => [
                  styles.deleteButton,
                  (saving || deleting) && styles.deleteButtonDisabled,
                  pressed && !saving && !deleting && styles.deleteButtonPressed,
                ]}>
                <View style={styles.saveButtonInner}>
                  {deleting ? (
                    <>
                      <ActivityIndicator size="small" color="#b91c1c" />
                      <ThemedText type="defaultSemiBold" style={styles.deleteButtonText}>
                        Removendo...
                      </ThemedText>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="delete-outline" size={20} color="#b91c1c" />
                      <ThemedText type="defaultSemiBold" style={styles.deleteButtonText}>
                        Remover avaliação
                      </ThemedText>
                    </>
                  )}
                </View>
              </Pressable>
            ) : null}

            {saveError ? (
              <View style={styles.errorBanner}>
                <ThemedText type="default" style={styles.errorBannerText}>
                  {saveError}
                </ThemedText>
              </View>
            ) : null}

            {deleteError ? (
              <View style={styles.errorBanner}>
                <ThemedText type="default" style={styles.errorBannerText}>
                  {deleteError}
                </ThemedText>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenLayout>
    </ThemedView>
  );
}
