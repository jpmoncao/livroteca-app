import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BOOK_COVER_COLORS } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getBookByIsbn, searchBooks, type Book } from '@/lib/openLibrary';

const BOOK_COVER_WIDTH = 100;
const BOOK_COVER_HEIGHT = 150;
const SEARCH_DEBOUNCE_MS = 400;

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scannerLoading, setScannerLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scannedRef = useRef(false);

    const [permission, requestPermission] = useCameraPermissions();
    const textColor = useThemeColor({}, 'text');
    const iconColor = useThemeColor({}, 'icon');
    const borderColor = useThemeColor({}, 'border');
    const buttonPrimaryColor = useThemeColor({}, 'primary');
    const buttonTextColor = useThemeColor({}, 'onPrimary');

    const searchByName = useCallback(async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const books = await searchBooks(trimmed, 20, 'pt');
            setResults(books);
        } catch (err) {
            console.error(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchByName(query);
            debounceRef.current = null;
        }, SEARCH_DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, searchByName]);

    const handleBookPress = (book: Book) => {
        const id = book.workKey ?? book.id;
        router.push(`/book/${id}`);
    };

    const handleOpenScanner = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) return;
        }
        scannedRef.current = false;
        setShowScanner(true);
    };

    const handleBarcodeScanned = async ({ data }: { data: string }) => {

        if (scannedRef.current) return;
        const isbn = data.replace(/\D/g, '');
        if (isbn.length < 10) return;

        scannedRef.current = true;
        setScannerLoading(true);
        try {
            const book = await getBookByIsbn(isbn);
            console.log({ book })
            setShowScanner(false);
            if (book) {
                const id = book.isbn ?? book.id;
                router.push(`/book/${id}`);
            } else {
                scannedRef.current = false;
            }
        } catch (err) {
            console.error(err);
            scannedRef.current = false;
        } finally {
            setScannerLoading(false);
        }
    };

    const getPlaceholderColor = (index: number) =>
        BOOK_COVER_COLORS[index % BOOK_COVER_COLORS.length];



    const styles = StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: 64,
        },
        header: {
            paddingHorizontal: 20,
            paddingBottom: 20,
            gap: 12,
        },
        searchRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
        },
        searchInput: {
            flex: 1,
            fontSize: 16,
            paddingVertical: 0,
        },
        scanButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: buttonPrimaryColor,
            paddingVertical: 14,
            borderRadius: 12,
        },
        scanButtonText: {
            color: buttonTextColor,
            fontWeight: '600',
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            paddingHorizontal: 32,
        },
        hint: {
            textAlign: 'center',
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
        modalContainer: {
            flex: 1,
            backgroundColor: '#000',
        },
        modalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 16,
        },
        modalTitle: {
            color: '#fff',
        },
        closeButton: {
            padding: 4,
        },
        permissionBox: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
            gap: 24,
        },
        permissionText: {
            color: '#fff',
            textAlign: 'center',
        },
        cameraWrapper: {
            flex: 1,
            position: 'relative',
        },
        camera: {
            flex: 1,
        },
        scannerOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
        },
        scannerOverlayText: {
            color: '#fff',
        },
        scanFrame: {
            position: 'absolute',
            top: '35%',
            left: '15%',
            right: '15%',
            height: 120,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.6)',
            borderRadius: 12,
        },
        scanHint: {
            position: 'absolute',
            bottom: 48,
            left: 20,
            right: 20,
            color: '#fff',
            textAlign: 'center',
            opacity: 0.9,
        },
    });

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.searchRow, { borderColor }]}>
                    <MaterialIcons name="search" size={22} color={iconColor} />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Pesquisar por nome do livro..."
                        placeholderTextColor={iconColor}
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>
                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={handleOpenScanner}
                    activeOpacity={0.8}>
                    <MaterialIcons name="qr-code-scanner" size={24} color={buttonTextColor} />
                    <ThemedText style={styles.scanButtonText}>Escanear ISBN</ThemedText>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={iconColor} />
                    <ThemedText type="default" style={styles.hint}>Buscando livros...</ThemedText>
                </View>
            ) : results.length === 0 && query.trim() ? (
                <View style={styles.centered}>
                    <IconSymbol name="book.closed" size={48} color={iconColor} />
                    <ThemedText type="default" style={styles.hint}>
                        Nenhum livro encontrado para &quot;{query}&quot;
                    </ThemedText>
                </View>
            ) : results.length === 0 ? (
                <View style={styles.centered}>
                    <IconSymbol name="magnifyingglass" size={48} color={iconColor} />
                    <ThemedText type="default" style={styles.hint}>
                        Digite o nome do livro ou escaneie o código ISBN
                    </ThemedText>
                </View>
            ) : (
                <FlatList
                    data={results}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.row}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={styles.bookCard}
                            onPress={() => handleBookPress(item)}
                            activeOpacity={0.7}>
                            {item.coverUrl ? (
                                <Image
                                    source={{ uri: item.coverUrl }}
                                    style={[
                                        styles.bookCover,
                                        { backgroundColor: getPlaceholderColor(index) },
                                    ]}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View
                                    style={[
                                        styles.bookCoverPlaceholder,
                                        { backgroundColor: getPlaceholderColor(index) },
                                    ]}>
                                    <IconSymbol
                                        name="book.closed.fill"
                                        size={40}
                                        color={iconColor}
                                    />
                                </View>
                            )}
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
            )}

            <Modal
                visible={showScanner}
                animationType="slide"
                onRequestClose={() => setShowScanner(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <ThemedText type="subtitle" style={styles.modalTitle}>
                            Escanear código ISBN
                        </ThemedText>
                        <Pressable
                            onPress={() => {
                                setShowScanner(false);
                                scannedRef.current = false;
                            }}
                            style={styles.closeButton}
                            hitSlop={12}>
                            <MaterialIcons name="close" size={28} color="#fff" />
                        </Pressable>
                    </View>
                    {!permission?.granted ? (
                        <View style={styles.permissionBox}>
                            <ThemedText type="default" style={styles.permissionText}>
                                Precisamos da permissão da câmera para escanear o código de barras
                                do livro.
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.scanButton}
                                onPress={requestPermission}
                                activeOpacity={0.8}>
                                <ThemedText style={styles.scanButtonText}>Conceder permissão</ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.cameraWrapper}>
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                onBarcodeScanned={handleBarcodeScanned}
                                barcodeScannerSettings={{
                                    barcodeTypes: ['ean13', 'ean8', 'upc_a'],
                                }}
                            />
                            {scannerLoading && (
                                <View style={styles.scannerOverlay}>
                                    <ActivityIndicator size="large" color="#fff" />
                                    <ThemedText style={styles.scannerOverlayText}>
                                        Buscando livro...
                                    </ThemedText>
                                </View>
                            )}
                            <View style={styles.scanFrame} />
                            <ThemedText style={styles.scanHint}>
                                Aponte a câmera para o código de barras do livro
                            </ThemedText>
                        </View>
                    )}
                </View>
            </Modal>
        </ThemedView>
    );
}