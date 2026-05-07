import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBookById } from '@/lib/openLibrary';
import {
  DEFAULT_READING_STATUS,
  getReadingStatusLabel,
  isReadingStatus,
  type ReadingStatus,
  type StoredReview,
} from '@/lib/reviews';
import { get, ref } from 'firebase/database';
import { auth, database } from '../../services/connectionFirebase';

const BOOK_COVER_WIDTH = 100;
const BOOK_COVER_HEIGHT = 150;
const PLACEHOLDER_COVER = 'https://via.placeholder.com/150';
const LIST_HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 16;
const NUM_COLUMNS = 2;

interface IBookReview {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  review: string;
  readingStatus: ReadingStatus;
  hasSpoiler: boolean;
  recommend: boolean | null;
  finishedAt?: number;
  recordImageUri?: string;
}

type BaseReview = Pick<
  IBookReview,
  | 'id'
  | 'rating'
  | 'review'
  | 'readingStatus'
  | 'hasSpoiler'
  | 'recommend'
  | 'finishedAt'
  | 'recordImageUri'
>;

async function fetchReviewsFromFirebase(userId: string): Promise<BaseReview[]> {
  const snapshot = ref(database, `book-reviews/${userId}`);
  const response = (await get(snapshot)).val() as Record<string, StoredReview> | null;

  if (!response || typeof response !== 'object') {
    return [];
  }

  return Object.entries(response).map(([id, data]) => ({
    id,
    rating: data?.rating ?? 0,
    review: data?.review ?? '',
    readingStatus: isReadingStatus(data?.readingStatus)
      ? data.readingStatus
      : DEFAULT_READING_STATUS,
    hasSpoiler: data?.hasSpoiler === true,
    recommend: typeof data?.recommend === 'boolean' ? data.recommend : null,
    finishedAt:
      typeof data?.finishedAt === 'number' && !Number.isNaN(data.finishedAt)
        ? data.finishedAt
        : undefined,
    recordImageUri:
      typeof data?.recordImageUri === 'string' && data.recordImageUri.length > 0
        ? data.recordImageUri
        : undefined,
  }));
}

async function enrichReviewsWithGoogleBooks(
  items: BaseReview[]
): Promise<IBookReview[]> {
  return Promise.all(
    items.map(async (item) => {
      const book = await getBookById(item.id).catch(() => null);
      return {
        id: item.id,
        title: book?.title ?? 'Livro',
        author: book?.author ?? '',
        coverUrl: book?.coverUrl ?? PLACEHOLDER_COVER,
        rating: item.rating,
        review: item.review,
        readingStatus: item.readingStatus,
        hasSpoiler: item.hasSpoiler,
        recommend: item.recommend,
        finishedAt: item.finishedAt,
        recordImageUri: item.recordImageUri,
      };
    })
  );
}

export default function LibraryScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const { isLoggedIn } = useAuth();
  const [bookReviews, setBookReviews] = useState<IBookReview[]>([]);
  const [loading, setLoading] = useState(true);

  const cardWidth =
    (windowWidth -
      LIST_HORIZONTAL_PADDING * 2 -
      COLUMN_GAP * (NUM_COLUMNS - 1)) /
    NUM_COLUMNS;

  const buttonPrimaryColor = useThemeColor({}, 'primary');
  const buttonTextColor = useThemeColor({}, 'onPrimary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        router.replace('/login');
        return;
      }

      let cancelled = false;

      async function loadLibrary() {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setBookReviews([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const fromDb = await fetchReviewsFromFirebase(userId);
          const enriched = await enrichReviewsWithGoogleBooks(fromDb);
          if (!cancelled) {
            setBookReviews(enriched);
          }
        } catch (e) {
          console.error('[Library] Erro ao carregar biblioteca:', e);
          if (!cancelled) {
            setBookReviews([]);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      loadLibrary();
      return () => {
        cancelled = true;
      };
    }, [isLoggedIn])
  );

  if (!isLoggedIn) {
    return null;
  }

  const handleBookPress = (bookReview: IBookReview) => {
    router.push(`/book/${encodeURIComponent(bookReview.id)}`);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <ThemedText type="default" style={styles.subtitle}>
          Carregando sua biblioteca...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Biblioteca
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Livros que você já leu
        </ThemedText>
        {bookReviews.length === 0 && (
          <ThemedText type="default" style={styles.subtitle}>
            Nenhum livro lido ainda
          </ThemedText>
        )}
      </ThemedView>

      {bookReviews.length > 0 && (
        <FlatList
          style={styles.list}
          data={bookReviews}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.bookCard, { width: cardWidth }]}
              onPress={() => handleBookPress(item)}
              activeOpacity={0.7}>
              <View style={styles.coverWrapper}>
                {item.recordImageUri ? (
                  <Image
                    source={{ uri: item.recordImageUri }}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                ) : item.coverUrl && item.coverUrl !== PLACEHOLDER_COVER ? (
                  <Image
                    source={{ uri: item.coverUrl }}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.bookCover,
                      styles.placeholderCover,
                      { borderColor: borderColor },
                    ]}>
                    <MaterialIcons name="auto-stories" size={40} color={iconColor} />
                    <ThemedText
                      type="default"
                      style={styles.placeholderText}
                      numberOfLines={2}>
                      Capa indisponível
                    </ThemedText>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: buttonPrimaryColor }]}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={[styles.statusBadgeText, { color: buttonTextColor }]}
                    numberOfLines={1}>
                    {getReadingStatusLabel(item.readingStatus)}
                  </ThemedText>
                </View>
                {item.hasSpoiler ? (
                  <View style={styles.spoilerBadge}>
                    <MaterialIcons name="visibility-off" size={14} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <ThemedText style={styles.bookTitle} type="default" numberOfLines={2}>
                {item.title}
              </ThemedText>
              <ThemedText style={styles.bookAuthor} type="default" numberOfLines={1}>
                {item.author}
              </ThemedText>
              {item.recommend !== null ? (
                <View style={styles.recommendBadge}>
                  <MaterialIcons
                    name={item.recommend ? 'thumb-up' : 'thumb-down'}
                    size={14}
                    color={item.recommend ? buttonPrimaryColor : secondaryColor}
                  />
                  <ThemedText
                    type="default"
                    style={[
                      styles.recommendBadgeText,
                      { color: item.recommend ? buttonPrimaryColor : secondaryColor },
                    ]}>
                    {item.recommend ? 'Recomenda' : 'Não recomenda'}
                  </ThemedText>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 4,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    opacity: 0.8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: LIST_HORIZONTAL_PADDING,
    paddingBottom: 24,
  },
  row: {
    marginBottom: 24,
    gap: COLUMN_GAP,
  },
  bookCard: {
    alignItems: 'center',
  },
  coverWrapper: {
    position: 'relative',
    width: BOOK_COVER_WIDTH,
    height: BOOK_COVER_HEIGHT,
  },
  bookCover: {
    width: BOOK_COVER_WIDTH,
    height: BOOK_COVER_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  placeholderCover: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 120, 120, 0.12)',
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    gap: 8,
  },
  placeholderText: {
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.7,
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    maxWidth: BOOK_COVER_WIDTH - 12,
  },
  statusBadgeText: {
    fontSize: 10,
  },
  spoilerBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  recommendBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 0,
  },
  bookAuthor: {
    marginTop: 0,
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.7,
  },
});
