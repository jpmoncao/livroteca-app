/**
 * Integração com Open Library, Brasil API (ISBN nacional) e Google Books API.
 */

const OPEN_LIBRARY_SEARCH = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_WORKS = 'https://openlibrary.org/works';

const BASE_URL = 'https://www.googleapis.com/books/v1';
const BASE_URL_BRASIL_API = 'https://brasilapi.com.br/api/isbn/v1';

const GOOGLE_BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

function appendGoogleBooksKey(params: URLSearchParams): void {
  if (GOOGLE_BOOKS_API_KEY) params.set('key', GOOGLE_BOOKS_API_KEY);
}

async function fetchJsonWithRetry<T>(url: string, attempts = 3): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      const ra = res.headers.get('Retry-After');
      const sec = ra ? parseInt(ra, 10) : NaN;
      const ms = Number.isFinite(sec)
        ? sec * 1000
        : Math.min(1500 * 2 ** i, 10_000);
      await new Promise((r) => setTimeout(r, ms));
      continue;
    }
    if (!res.ok) {
      if (i < attempts - 1 && res.status >= 500) {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
        continue;
      }
      return null;
    }
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }
  return null;
}

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

interface OpenLibrarySearchDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibrarySearchDoc[];
}

interface OpenLibraryWork {
  title?: string;
  description?: string | { value?: string };
  covers?: number[];
  authors?: { author?: { key?: string } }[];
  first_publish_date?: string;
}

interface OpenLibraryEditionsResponse {
  entries?: {
    isbn_13?: string[];
    isbn_10?: string[];
  }[];
}

export function normalizeIsbnDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Chave em `book-reviews/{uid}/…`: somente ISBN-10 ou ISBN-13 normalizado.
 * Retorna `null` se não houver ISBN no livro nem na rota (não usa volume id nem work id).
 */
export function getReviewStorageKey(book: Book | null | undefined, routeId: string): string | null {
  const fromBook = normalizeIsbnDigits(book?.isbn ?? '');
  if (fromBook.length === 10 || fromBook.length === 13) return fromBook;
  const decoded = decodeURIComponent(routeId);
  const fromRoute = normalizeIsbnDigits(decoded);
  if (fromRoute.length === 10 || fromRoute.length === 13) return fromRoute;
  return null;
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

function pickIsbnFromOlDoc(doc: OpenLibrarySearchDoc): string | undefined {
  if (!doc.isbn?.length) return undefined;
  const isbn13 = doc.isbn.find((i) => normalizeIsbnDigits(i).length === 13);
  const isbn10 = doc.isbn.find((i) => normalizeIsbnDigits(i).length === 10);
  return isbn13 ?? isbn10 ?? doc.isbn[0];
}

function extractWorkIdFromOlKey(key?: string): string | undefined {
  if (!key?.startsWith('/works/')) return undefined;
  return key.slice('/works/'.length);
}

function mapOlSearchDocToBook(doc: OpenLibrarySearchDoc): Book | null {
  const workId = extractWorkIdFromOlKey(doc.key);
  const isbnRaw = pickIsbnFromOlDoc(doc);
  const isbnDigits = isbnRaw ? normalizeIsbnDigits(isbnRaw) : '';
  const hasValidIsbn = isbnDigits.length === 10 || isbnDigits.length === 13;
  const id = hasValidIsbn ? isbnDigits : workId;
  if (!id) return null;

  const coverUrl = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    : undefined;

  return {
    id,
    title: doc.title ?? 'Título desconhecido',
    author: doc.author_name?.[0],
    coverUrl,
    isbn: hasValidIsbn ? isbnDigits : undefined,
    firstPublishYear: doc.first_publish_year,
    pageCount: doc.number_of_pages_median,
  };
}

function isOpenLibraryWorkId(value: string): boolean {
  return /^OL\d+W$/i.test(value.trim());
}

/**
 * Busca na [Open Library Search API](https://openlibrary.org/dev/docs/api/search).
 * Prioriza ISBN como `id` quando existir (compatível com `getBookByIsbn`); senão usa o work id (`OL…W`).
 */
export async function searchOpenLibrary(query: string, limit = 10, lang?: string): Promise<Book[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const params = new URLSearchParams({
      q: trimmed,
      limit: Math.min(limit, 100).toString(),
    });
    if (lang === 'pt') params.set('language', 'por');

    const data = await fetchJsonWithRetry<OpenLibrarySearchResponse>(
      `${OPEN_LIBRARY_SEARCH}?${params}`,
    );
    const docs = data?.docs ?? [];
    const books: Book[] = [];
    for (const doc of docs) {
      const book = mapOlSearchDocToBook(doc);
      if (book) books.push(book);
    }
    return books;
  } catch (error) {
    console.error('[OpenLibrary] Erro ao buscar livros:', error);
    return [];
  }
}

async function getIsbnFromOpenLibraryEditions(workId: string): Promise<string | undefined> {
  const data = await fetchJsonWithRetry<OpenLibraryEditionsResponse>(
    `${OPEN_LIBRARY_WORKS}/${encodeURIComponent(workId)}/editions.json?limit=8`,
  );
  for (const e of data?.entries ?? []) {
    const raw = e.isbn_13?.[0] ?? e.isbn_10?.[0];
    if (!raw) continue;
    const digits = normalizeIsbnDigits(raw);
    if (digits.length === 10 || digits.length === 13) return digits;
  }
  return undefined;
}

async function getBookByOpenLibraryWork(workId: string): Promise<Book | null> {
  try {
    const url = `${OPEN_LIBRARY_WORKS}/${encodeURIComponent(workId)}.json`;
    const data = await fetchJsonWithRetry<OpenLibraryWork>(url);
    if (!data?.title) return null;

    let description: string | undefined;
    const d = data.description;
    if (typeof d === 'string') description = d;
    else if (d && typeof d === 'object' && 'value' in d && d.value) description = d.value;

    let author: string | undefined;
    const authorKey = data.authors?.[0]?.author?.key;
    if (authorKey) {
      const authorData = await fetchJsonWithRetry<{ name?: string }>(
        `https://openlibrary.org${authorKey}.json`,
      );
      author = authorData?.name;
    }

    const coverId = data.covers?.[0];
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : undefined;

    let firstPublishYear: number | undefined;
    if (data.first_publish_date) {
      const y = parseInt(data.first_publish_date.slice(0, 4), 10);
      if (!isNaN(y)) firstPublishYear = y;
    }

    const isbnFromEditions = await getIsbnFromOpenLibraryEditions(workId);

    return {
      id: workId,
      title: data.title,
      author,
      coverUrl,
      description,
      firstPublishYear,
      isbn: isbnFromEditions,
    };
  } catch (error) {
    console.error('[OpenLibrary] Erro ao buscar obra:', error);
    return null;
  }
}

async function fetchGoogleBooks(
  q: string,
  limit: number,
  lang?: string,
): Promise<Book[]> {
  const params = new URLSearchParams({
    q,
    maxResults: Math.min(limit, 40).toString(),
    printType: 'books',
    orderBy: 'relevance',
  });
  if (lang) params.set('langRestrict', lang);
  appendGoogleBooksKey(params);

  const data = await fetchJsonWithRetry<GoogleBooksSearchResponse>(
    `${BASE_URL}/volumes?${params}`,
  );
  if (!data?.items) return [];
  return data.items.map(mapVolumeToBook);
}

function dedupeBooks(books: Book[]): Book[] {
  const seen = new Set<string>();
  const result: Book[] = [];
  for (const b of books) {
    const key = b.isbn ? normalizeIsbnDigits(b.isbn) : b.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(b);
  }
  return result;
}

/**
 * Busca livros: se o termo for ISBN brasileiro (97865/97885 ou ISBN-10 65/85), consulta a Brasil API;
 * caso contrário, Google Books. Para busca por nome, prioriza `intitle:` e tenta com filtro de idioma;
 * se retornar pouco/nada, refaz sem `langRestrict` para não esconder resultados relevantes.
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
    const titleQuery = `intitle:${trimmed}`;

    const [byTitleLang, byTitle] = await Promise.all([
      lang ? fetchGoogleBooks(titleQuery, limit, lang) : Promise.resolve<Book[]>([]),
      fetchGoogleBooks(titleQuery, limit),
    ]);

    let combined = dedupeBooks([...byTitleLang, ...byTitle]);

    if (combined.length < 3) {
      const free = await fetchGoogleBooks(trimmed, limit);
      combined = dedupeBooks([...combined, ...free]);
    }

    return combined.slice(0, limit);
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
    const params = new URLSearchParams();
    appendGoogleBooksKey(params);
    const q = params.toString();
    const url = q ? `${BASE_URL}/volumes/${encodeURIComponent(volumeId)}?${q}` : `${BASE_URL}/volumes/${encodeURIComponent(volumeId)}`;

    const data = await fetchJsonWithRetry<GoogleBooksVolume>(url);
    if (!data) return null;

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
    appendGoogleBooksKey(params);

    const data = await fetchJsonWithRetry<GoogleBooksSearchResponse>(
      `${BASE_URL}/volumes?${params}`,
    );
    const volume = data?.items?.[0];
    if (!volume) return null;

    return mapVolumeToBook(volume);
  } catch (error) {
    console.error('[GoogleBooks] Erro ao buscar livro por ISBN:', error);
    return null;
  }
}

async function getBookByIsbnFromOpenLibrary(isbn: string): Promise<Book | null> {
  if (!isbn) return null;
  try {
    const params = new URLSearchParams({
      isbn,
      limit: '1',
    });
    const data = await fetchJsonWithRetry<OpenLibrarySearchResponse>(
      `${OPEN_LIBRARY_SEARCH}?${params}`,
    );
    const doc = data?.docs?.[0];
    if (!doc) return null;
    const mapped = mapOlSearchDocToBook(doc);
    if (!mapped) return null;
    return { ...mapped, id: isbn, isbn };
  } catch (error) {
    console.error('[OpenLibrary] Erro ao buscar livro por ISBN:', error);
    return null;
  }
}

/**
 * Busca detalhes de um livro por ISBN (Brasil API para prefixo nacional; senão Google Books;
 * por fim, Open Library como fallback para livros que não retornam no Google).
 */
export async function getBookByIsbn(isbn: string): Promise<Book | null> {
  const digits = normalizeIsbnDigits(isbn);
  if (shouldUseBrasilApiIsbn(digits)) {
    const br = await getBookByIsbnFromBrasilApi(digits);
    if (br) return br;
  }
  const fromGoogle = await getBookByIsbnFromGoogle(digits || isbn);
  if (fromGoogle) return fromGoogle;
  return getBookByIsbnFromOpenLibrary(digits || isbn);
}

/**
 * Busca um livro por ID (ISBN normalizado, work id Open Library `OL…W`, ou volume ID do Google Books).
 */
export async function getBookById(id: string): Promise<Book | null> {
  const decoded = decodeURIComponent(id);
  const digits = normalizeIsbnDigits(decoded);
  if (digits.length === 10 || digits.length === 13) {
    return getBookByIsbn(digits);
  }
  if (isOpenLibraryWorkId(decoded)) {
    return getBookByOpenLibraryWork(decoded);
  }
  return getBookByVolumeId(decoded);
}

/**
 * Busca os livros mais populares na Google Books API.
 */
export async function getPopularBooks(): Promise<Book[]> {
  try {
    const params = new URLSearchParams({
      q: 'popular',
      printType: 'books',
      langRestrict: 'pt',
    });
    appendGoogleBooksKey(params);

    const data = await fetchJsonWithRetry<GoogleBooksSearchResponse>(
      `${BASE_URL}/volumes?${params}`,
    );
    if (!data?.items) return [];

    return data.items.map(mapVolumeToBook);
  } catch (error) {
    console.error('[GoogleBooks] Erro ao buscar livros mais populares:', error);
    return [];
  }
}
