import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { getBookById } from '@/lib/openLibrary';
import { get, ref } from 'firebase/database';
import { BOOK_COVER_COLORS } from '../../constants/theme';
import { auth, database } from '../../services/connectionFirebase';

const BOOK_COVER_WIDTH = 100;
const BOOK_COVER_HEIGHT = 150;
const PLACEHOLDER_COVER = 'https://via.placeholder.com/150';

interface IBookReview {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating: number;
  review: string;
}

interface StoredReview {
  rating?: number;
  review?: string;
  title?: string;
  author?: string;
  coverUrl?: string;
}

async function fetchReviewsFromFirebase(userId: string): Promise<Pick<IBookReview, 'id' | 'rating' | 'review'>[]> {
  const snapshot = ref(database, `book-reviews/${userId}`);
  const response = (await get(snapshot)).val() as Record<string, StoredReview> | null;

  if (!response || typeof response !== 'object') {
    return [];
  }

  return Object.entries(response).map(([id, data]) => ({
    id,
    rating: data?.rating ?? 0,
    review: data?.review ?? '',
  }));
}

async function enrichReviewsWithGoogleBooks(
  items: Pick<IBookReview, 'id' | 'rating' | 'review'>[]
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
      };
    })
  );
}

export default function LibraryScreen() {
  const { isLoggedIn } = useAuth();
  const [bookReviews, setBookReviews] = useState<IBookReview[]>([]);
  const [loading, setLoading] = useState(true);

  const getRandomCoverColor = () => {
    const randomIndex = Math.floor(Math.random() * BOOK_COVER_COLORS.length);
    return BOOK_COVER_COLORS[randomIndex];
  };

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
      </ThemedView>

      {bookReviews.length === 0 ? (
        <ThemedText type="default" style={styles.subtitle}>
          Nenhum livro lido ainda
        </ThemedText>
      ) : (
        <FlatList
          data={bookReviews}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookCard}
              onPress={() => handleBookPress(item)}
              activeOpacity={0.7}>
              <Image
                source={{ uri: item.coverUrl || PLACEHOLDER_COVER }}
                style={[styles.bookCover, { backgroundColor: getRandomCoverColor() }]}
                resizeMode="cover"
              />
              <ThemedText style={styles.bookTitle} type="default" numberOfLines={2}>
                {item.title}
              </ThemedText>
              <ThemedText style={styles.bookAuthor} type="default" numberOfLines={1}>
                {item.author}
              </ThemedText>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  bookCard: {
    flex: 1,
    maxWidth: '48%',
    alignItems: 'center',
  },
  bookCover: {
    width: BOOK_COVER_WIDTH,
    height: BOOK_COVER_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
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
