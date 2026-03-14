import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BOOK_COVER_COLORS } from '@/constants/theme';
import { searchBooks, type Book } from '@/lib/openLibrary';
import { router } from 'expo-router';

const BOOK_COVER_WIDTH = 120;
const BOOK_COVER_HEIGHT = 180;

export default function HomeScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [hotBooks, setHotBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const [featured, popular] = await Promise.all([
          searchBooks('senhor dos anéis hobbit', 5, 'pt'),
          searchBooks('harry potter', 5, 'pt'),
        ]);
        setBooks(featured);
        setHotBooks(popular);
      } catch (error) {
        console.error('Erro ao carregar livros:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  const handleBookPress = (book: Book) => {
    router.push(`/book/${book.id}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="default" style={{ marginTop: 48 }}>Carregando livros...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.booksContainer}>
          <ThemedText type="subtitle">Escolha um livro para começar</ThemedText>
          <FlatList
            data={books}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bookListContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item, index }: { item: Book; index: number }) => (
              <TouchableOpacity style={styles.bookCover} onPress={() => handleBookPress(item)}>
                <Image
                  source={{ uri: item.coverUrl ?? 'https://via.placeholder.com/150' }}
                  style={[
                    styles.bookCoverPlaceholder,
                    { backgroundColor: BOOK_COVER_COLORS[index % BOOK_COVER_COLORS.length] },
                  ]}
                  resizeMode="cover"
                />
                <ThemedText style={styles.bookTitle} type="default" numberOfLines={3}>
                  {item.title}
                </ThemedText>
              </TouchableOpacity>
            )}
            keyExtractor={(item: Book) => item.id.toString()}
          />
        </ThemedView>
        <ThemedView style={styles.booksContainer}>
          <ThemedText type="subtitle">Os mais lidos da semana</ThemedText>
          <FlatList
            data={hotBooks}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bookListContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item, index }: { item: Book; index: number }) => (
              <TouchableOpacity onPress={() => handleBookPress(item)} style={styles.bookCover}>
                <Image
                  source={{ uri: item.coverUrl ?? 'https://via.placeholder.com/150' }}
                  style={[
                    styles.bookCoverPlaceholder,
                    { backgroundColor: BOOK_COVER_COLORS[(books.length + index) % BOOK_COVER_COLORS.length] },
                  ]}
                  resizeMode="cover"
                />
                <ThemedText style={styles.bookTitle} type="default" numberOfLines={3}>
                  {item.title}
                </ThemedText>
              </TouchableOpacity>
            )}
            keyExtractor={(item: Book) => item.id.toString()}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    minHeight: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 48,
    gap: 32,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'flex-start',
    gap: 8,
  },
  stepContainer: {
    marginTop: 16,
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
  },
  booksContainer: {
    width: '100%',
    gap: 12,
  },
  bookListContent: {
    paddingVertical: 16,
    paddingRight: 16,
  },
  separator: {
    width: 16,
  },
  bookCover: {
    width: BOOK_COVER_WIDTH,
    alignItems: 'center',
  },
  bookCoverPlaceholder: {
    width: BOOK_COVER_WIDTH,
    height: BOOK_COVER_HEIGHT,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6B5344',
  },
  bookTitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
});
