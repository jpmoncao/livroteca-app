import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BOOK_COVER_COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '../../hooks/use-theme-color';

interface Book {
  id: number;
  title: string;
  author?: string;
}

const readBooks: Book[] = [
  { id: 1, title: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien' },
  { id: 2, title: 'O Hobbit', author: 'J.R.R. Tolkien' },
  { id: 3, title: '1984', author: 'George Orwell' },
  { id: 4, title: 'O Pequeno Príncipe', author: 'Antoine de Saint-Exupéry' },
  { id: 5, title: 'Dom Quixote', author: 'Miguel de Cervantes' },
  { id: 6, title: 'Cem Anos de Solidão', author: 'Gabriel García Márquez' },
  { id: 7, title: 'O Alquimista', author: 'Paulo Coelho' },
  { id: 8, title: 'Harry Potter e a Pedra Filosofal', author: 'J.K. Rowling' },
];

const BOOK_COVER_WIDTH = 100;
const BOOK_COVER_HEIGHT = 150;

export default function LibraryScreen() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  const handleBookPress = (book: Book) => {
    console.log('Book pressed:', book);
  };

  const getPlaceholderColor = (index: number) =>
    BOOK_COVER_COLORS[index % BOOK_COVER_COLORS.length];

  const iconColor = useThemeColor({}, 'icon');


  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol name="book.fill" size={32} color={iconColor} />
        <ThemedText type="title" style={styles.title}>
          Biblioteca
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Livros que você já leu
        </ThemedText>
      </ThemedView>

      <FlatList
        data={readBooks}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.bookCard}
            onPress={() => handleBookPress(item)}
            activeOpacity={0.7}>
            <View
              style={[
                styles.bookCoverPlaceholder,
                { backgroundColor: getPlaceholderColor(index) },
              ]}>
              <IconSymbol name="book.closed.fill" size={40} color={iconColor} />
            </View>
            <ThemedText style={styles.bookTitle} type="default" numberOfLines={2}>
              {item.title}
            </ThemedText>
            {item.author && (
              <ThemedText style={styles.bookAuthor} type="default" numberOfLines={1}>
                {item.author}
              </ThemedText>
            )}
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
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
  bookCoverPlaceholder: {
    width: BOOK_COVER_WIDTH,
    height: BOOK_COVER_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  bookAuthor: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.7,
  },
});
