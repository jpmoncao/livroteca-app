/**
 * Integração com Brasil API (ISBN nacional) e Google Books API.
 */

const BASE_URL = 'https://www.googleapis.com/books/v1';
const BASE_URL_BRASIL_API = 'https://brasilapi.com.br/api/isbn/v1';

export interface Book {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  description?: string;
  firstPublishYear?: number;
  pageCount?: number;
}

interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    };
    industryIdentifiers?: {
      type: string;
      identifier: string;
    }[];
  };
}

interface GoogleBooksSearchResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

interface BrasilApiIsbnResponse {
  isbn: string;
  title: string;
  subtitle?: string | null;
  authors?: string[];
  synopsis?: string | null;
  year?: number;
  page_count?: number;
  cover_url?: string | null;
}

export function normalizeIsbnDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Chave em `book-reviews/{uid}/…`: preferir ISBN-13/10 normalizado; senão id da rota (ex.: volume Google). */
export function getReviewStorageKey(book: Book | null | undefined, routeId: string): string {
  const fromBook = normalizeIsbnDigits(book?.isbn ?? '');
  if (fromBook.length === 10 || fromBook.length === 13) return fromBook;
  const fromRoute = normalizeIsbnDigits(routeId);
  if (fromRoute.length === 10 || fromRoute.length === 13) return fromRoute;
  return routeId;
}

/** ISBN-13 com grupo de registro brasileiro (97865 / 97885) ou ISBN-10 nacional (65… / 85…). */
export function shouldUseBrasilApiIsbn(digits: string): boolean {
  if (digits.length === 13 && /^978(65|85)\d{8}$/.test(digits)) return true;
  if (digits.length === 10 && /^(65|85)\d{8}$/.test(digits)) return true;
  return false;
}

function isIsbnOnlyQuery(trimmed: string, digits: string): boolean {
  if (!digits.length) return false;
  return /^[\d\s-]+$/.test(trimmed);
}

function extractIsbn(volume: GoogleBooksVolume): string | undefined {
  const identifiers = volume.volumeInfo.industryIdentifiers;
  if (!identifiers) return undefined;
  const isbn13 = identifiers.find((i) => i.type === 'ISBN_13');
  const isbn10 = identifiers.find((i) => i.type === 'ISBN_10');
  return isbn13?.identifier ?? isbn10?.identifier;
}

function extractCoverUrl(volume: GoogleBooksVolume): string | undefined {
  const links = volume.volumeInfo.imageLinks;
  if (!links) return undefined;
  const url = links.medium ?? links.small ?? links.thumbnail ?? links.smallThumbnail;
  return url?.replace('http://', 'https://');
}

function extractYear(publishedDate?: string): number | undefined {
  if (!publishedDate) return undefined;
  const year = parseInt(publishedDate.slice(0, 4), 10);
  return isNaN(year) ? undefined : year;
}

function mapVolumeToBook(volume: GoogleBooksVolume): Book {
  const info = volume.volumeInfo;
  const isbn = extractIsbn(volume);
  const id = isbn ? normalizeIsbnDigits(isbn) : volume.id;
  return {
    id,
    title: info.title ?? 'Título desconhecido',
    author: info.authors?.[0],
    coverUrl: extractCoverUrl(volume),
    isbn,
    description: info.description,
    firstPublishYear: extractYear(info.publishedDate),
    pageCount: info.pageCount,
  };
}

function mapBrasilApiToBook(data: BrasilApiIsbnResponse): Book {
  const isbn = normalizeIsbnDigits(data.isbn);
  const titleBase = data.title ?? 'Título desconhecido';
  const title =
    data.subtitle && String(data.subtitle).trim()
      ? `${titleBase}: ${String(data.subtitle).trim()}`
      : titleBase;
  const coverRaw = data.cover_url?.replace('http://', 'https://') ?? undefined;
  return {
    id: isbn || data.isbn,
    title,
    author: data.authors?.[0],
    coverUrl: coverRaw || undefined,
    isbn: data.isbn,
    description: data.synopsis ?? undefined,
    firstPublishYear: data.year,
    pageCount: data.page_count,
  };
}

async function getBookByIsbnFromBrasilApi(digits: string): Promise<Book | null> {
  try {
    const res = await fetch(`${BASE_URL_BRASIL_API}/${encodeURIComponent(digits)}`);
    if (!res.ok) return null;
    const data: BrasilApiIsbnResponse = await res.json();
    if (!data?.isbn || !data?.title) return null;
    return mapBrasilApiToBook(data);
  } catch (error) {
    console.error('[BrasilAPI ISBN] Erro ao buscar livro:', error);
    return null;
  }
}

/**
 * Busca livros: se o termo for ISBN brasileiro (97865/97885 ou ISBN-10 65/85), consulta a Brasil API;
 * caso contrário, Google Books. Se a Brasil API não retornar, faz fallback para Google (ISBN ou texto).
 */
export async function searchBooks(query: string, limit = 10, lang?: string): Promise<Book[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const digits = normalizeIsbnDigits(trimmed);
  if (isIsbnOnlyQuery(trimmed, digits) && shouldUseBrasilApiIsbn(digits)) {
    const br = await getBookByIsbnFromBrasilApi(digits);
    if (br) return [br];
    const fallback = await getBookByIsbnFromGoogle(digits);
    return fallback ? [fallback] : [];
  }

  try {
    const params = new URLSearchParams({
      q: trimmed,
      maxResults: Math.min(limit, 40).toString(),
      printType: 'books',
    });
    if (lang) params.set('langRestrict', lang);

    const res = await fetch(`${BASE_URL}/volumes?${params}`);
    const data: GoogleBooksSearchResponse = await res.json();

    return (data.items ?? []).map(mapVolumeToBook);
  } catch (error) {
    console.error('[GoogleBooks] Erro ao buscar livros:', error);
    return [];
  }
}

/**
 * Busca detalhes de um livro pelo ID do volume no Google Books.
 */
export async function getBookByVolumeId(volumeId: string): Promise<Book | null> {
  try {
    const res = await fetch(`${BASE_URL}/volumes/${volumeId}`);
    if (!res.ok) return null;

    const data: GoogleBooksVolume = await res.json();
    return mapVolumeToBook(data);
  } catch (error) {
    console.error('[GoogleBooks] Erro ao buscar livro por volume ID:', error);
    return null;
  }
}

async function getBookByIsbnFromGoogle(isbn: string): Promise<Book | null> {
  try {
    const params = new URLSearchParams({
      q: `isbn:${isbn}`,
      printType: 'books',
    });

    const res = await fetch(`${BASE_URL}/volumes?${params}`);
    if (!res.ok) return null;

    const data: GoogleBooksSearchResponse = await res.json();
    const volume = data.items?.[0];
    if (!volume) return null;

    return mapVolumeToBook(volume);
  } catch (error) {
    console.error('[GoogleBooks] Erro ao buscar livro por ISBN:', error);
    return null;
  }
}

/**
 * Busca detalhes de um livro por ISBN (Brasil API para prefixo nacional; senão Google Books).
 */
export async function getBookByIsbn(isbn: string): Promise<Book | null> {
  const digits = normalizeIsbnDigits(isbn);
  if (shouldUseBrasilApiIsbn(digits)) {
    const br = await getBookByIsbnFromBrasilApi(digits);
    if (br) return br;
  }
  return getBookByIsbnFromGoogle(digits || isbn);
}

/**
 * Busca um livro por ID (ISBN normalizado ou volume ID do Google Books).
 */
export async function getBookById(id: string): Promise<Book | null> {
  const digits = normalizeIsbnDigits(id);
  if (digits.length === 10 || digits.length === 13) {
    return getBookByIsbn(digits);
  }
  return getBookByVolumeId(id);
}

/**
 * Busca os livros mais populares na Google Books API.
 */
export async function getPopularBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${BASE_URL}/volumes?q=popular&printType=books&langRestrict=pt`);
    if (!res.ok) return [];

    const data: GoogleBooksSearchResponse = await res.json();
    if (!data.items) return [];

    return data.items.map(mapVolumeToBook);
  } catch (error) {
    console.error('[GoogleBooks] Erro ao buscar livros mais populares:', error);
    return [];
  }
}
