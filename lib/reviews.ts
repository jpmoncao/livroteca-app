/**
 * Tipos e helpers compartilhados das resenhas armazenadas em
 * `book-reviews/{uid}/{isbn}` no Firebase Realtime Database.
 */

export type ReadingStatus = 'wantToRead' | 'reading' | 'read' | 'abandoned';

export interface StoredReview {
  rating?: number;
  review?: string;
  readingStatus?: ReadingStatus;
  hasSpoiler?: boolean;
  finishedAt?: number;
  recommend?: boolean | null;
  recordImageUri?: string;
}

export const READING_STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'wantToRead', label: 'Quero Ler' },
  { value: 'reading', label: 'Lendo' },
  { value: 'read', label: 'Lido' },
  { value: 'abandoned', label: 'Abandonado' },
];

export const DEFAULT_READING_STATUS: ReadingStatus = 'wantToRead';

export function getReadingStatusLabel(status: ReadingStatus | undefined): string {
  const found = READING_STATUS_OPTIONS.find((option) => option.value === status);
  return found?.label ?? '';
}

export function isReadingStatus(value: unknown): value is ReadingStatus {
  return (
    value === 'wantToRead' ||
    value === 'reading' ||
    value === 'read' ||
    value === 'abandoned'
  );
}

export function formatFinishedAt(timestampMs: number | undefined | null): string {
  if (!timestampMs || Number.isNaN(timestampMs)) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(timestampMs));
  } catch {
    return new Date(timestampMs).toLocaleDateString('pt-BR');
  }
}
