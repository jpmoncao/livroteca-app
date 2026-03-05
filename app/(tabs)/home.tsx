import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BOOK_COVER_COLORS } from '@/constants/theme';

interface Book {
  id: number;
  title: string;
  coverUrl?: string | undefined;
}

const books: Book[] = [
  { id: 1, title: 'O Senhor dos Anéis', coverUrl: 'https://via.placeholder.com/150' },
  { id: 2, title: 'O Hobbit', coverUrl: 'https://via.placeholder.com/150' },
  { id: 3, title: 'A Guerra dos Tronos', coverUrl: 'https://via.placeholder.com/150' },
  { id: 4, title: 'A Torre Negra', coverUrl: 'https://via.placeholder.com/150' },
  { id: 5, title: 'A Rainha Vermelha', coverUrl: 'https://via.placeholder.com/150' },
];
const savedBooks: Book[] = [
  { id: 6, title: 'O Peregrino', coverUrl: 'https://via.placeholder.com/150' },
  { id: 7, title: 'Cartas de um diabo ao seu aprendiz', coverUrl: 'https://via.placeholder.com/150' },
  { id: 8, title: 'O Príncipe', coverUrl: 'https://via.placeholder.com/150' },
  { id: 9, title: 'O Conde de Monte Cristo', coverUrl: 'https://via.placeholder.com/150' },
];

const BOOK_COVER_WIDTH = 120;
const BOOK_COVER_HEIGHT = 180;

export default function HomeScreen() {
  const handleBookPress = (book: Book) => {
    console.log('Book pressed:', book);
    // router.push(`/book/${book.id}`);
  };

  return (
    <ThemedView style={styles.container}>
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
                source={{ uri: item.coverUrl }}
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
        <ThemedText type="subtitle">Seus livros salvos</ThemedText>
        <FlatList
          data={savedBooks}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bookListContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }: { item: Book; index: number }) => (
            <TouchableOpacity onPress={() => handleBookPress(item)} style={styles.bookCover}>
              <Image
                source={{ uri: item.coverUrl }}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 32,
    padding: 16,
    paddingTop: 32,
    width: '100%',
    height: '100%',
    overflowY: 'auto',
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
