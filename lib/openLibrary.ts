/**
 * Serviço de integração com a API Open Library (openlibrary.org)
 * Gratuita, sem necessidade de chave de API.
 * Fornece capas de livros e dados por ISBN.
 */

const BASE_URL = 'https://openlibrary.org';
const COVERS_URL = 'https://covers.openlibrary.org';

export type CoverSize = 'S' | 'M' | 'L';

export interface Book {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  workKey?: string;
  firstPublishYear?: number;
}

interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
  first_publish_year?: number;
}

interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibrarySearchDoc[];
}

interface OpenLibraryIsbnResponse {
  title?: string;
  authors?: { name: string }[];
  covers?: number[];
  isbn_10?: string[];
  isbn_13?: string[];
  key: string;
}

/**
 * Gera URL da capa do livro.
 * Por ID da capa (cover_i) ou por ISBN.
 */
export function getCoverUrl(
  coverId?: number,
  isbn?: string,
  size: CoverSize = 'M'
): string | undefined {
  if (coverId) {
    return `${COVERS_URL}/b/id/${coverId}-${size}.jpg`;
  }
  if (isbn) {
    return `${COVERS_URL}/b/isbn/${isbn}-${size}.jpg`;
  }
  return undefined;
}

/**
 * Busca livros na Open Library por termo de pesquisa.
 * @param lang - Código de idioma (ex: 'pt') para priorizar edições no idioma
 */
export async function searchBooks(query: string, limit = 10, lang?: string): Promise<Book[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    if (lang) params.set('lang', lang);
    const res = await fetch(`${BASE_URL}/search.json?${params}`);
    const data: OpenLibrarySearchResponse = await res.json();

    return (data.docs ?? []).map((doc) => {
      const workKey = doc.key?.replace('/works/', '') ?? '';
      const isbn = doc.isbn?.[0];
      const coverUrl = getCoverUrl(doc.cover_i, isbn, 'M');

      return {
        id: workKey || doc.key || String(Math.random()),
        title: doc.title ?? 'Título desconhecido',
        author: doc.author_name?.[0],
        coverUrl,
        isbn,
        workKey,
        firstPublishYear: doc.first_publish_year,
      };
    });
  } catch (error) {
    console.error('[OpenLibrary] Erro ao buscar livros:', error);
    return [];
  }
}

/**
 * Busca detalhes de um livro por ISBN.
 */
export async function getBookByIsbn(isbn: string): Promise<Book | null> {
  try {
    console.log(`${BASE_URL}/isbn/${isbn}.json`)
    const res = await fetch(`${BASE_URL}/isbn/${isbn}.json`);
    console.log({ res })
    if (!res.ok) return null;

    const data: OpenLibraryIsbnResponse = await res.json();
    const coverId = data.covers?.[0];
    const coverUrl = getCoverUrl(coverId, isbn, 'L');

    return {
      id: data.key?.replace('/books/', '') ?? isbn,
      title: data.title ?? 'Título desconhecido',
      author: data.authors?.[0]?.name,
      coverUrl,
      isbn: data.isbn_13?.[0] ?? data.isbn_10?.[0] ?? isbn,
      workKey: data.key,
    };
  } catch (error) {
    console.error('[OpenLibrary] Erro ao buscar livro por ISBN:', error);
    return null;
  }
}

/**
 * Busca detalhes de um livro por Work Key (ex: OL27448W).
 */
export async function getBookByWorkKey(workKey: string): Promise<Book | null> {
  try {
    const key = workKey.startsWith('/works/') ? workKey : `/works/${workKey}`;
    const res = await fetch(`${BASE_URL}${key}.json`);
    if (!res.ok) return null;

    const data = await res.json();
    const title = data.title ?? 'Título desconhecido';
    const authorKey = data.authors?.[0]?.author?.key;
    let author: string | undefined;

    if (authorKey) {
      try {
        const authorRes = await fetch(`${BASE_URL}${authorKey}.json`);
        const authorData = await authorRes.json();
        author = authorData.name;
      } catch {
        author = undefined;
      }
    }

    // Buscar edições para obter ISBN e capa
    const editionsRes = await fetch(`${BASE_URL}${key}/editions.json?limit=1`);
    let coverUrl: string | undefined;
    let isbn: string | undefined;

    if (editionsRes.ok) {
      const editionsData = await editionsRes.json();
      const edition = editionsData.entries?.[0];
      if (edition) {
        isbn = edition.isbn_13?.[0] ?? edition.isbn_10?.[0];
        const coverId = edition.covers?.[0];
        coverUrl = getCoverUrl(coverId, isbn, 'L');
      }
    }

    if (!coverUrl && data.covers?.[0]) {
      coverUrl = getCoverUrl(data.covers[0], undefined, 'L');
    }

    return {
      id: workKey.replace('/works/', ''),
      title,
      author,
      coverUrl,
      isbn,
      workKey: workKey.replace('/works/', ''),
      firstPublishYear: data.first_publish_date ? parseInt(String(data.first_publish_date).slice(0, 4), 10) : undefined,
    };
  } catch (error) {
    console.error('[OpenLibrary] Erro ao buscar livro por Work Key:', error);
    return null;
  }
}

/**
 * Busca um livro por ID (Work Key ou ISBN).
 */
export async function getBookById(id: string): Promise<Book | null> {
  // ISBN tem 10 ou 13 dígitos
  const isIsbn = /^\d{10}(\d{3})?$/.test(id);
  if (isIsbn) {
    return getBookByIsbn(id);
  }
  return getBookByWorkKey(id);
}
