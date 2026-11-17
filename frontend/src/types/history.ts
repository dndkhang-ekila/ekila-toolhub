export type OperationType = 'link' | 'qr' | 'image' | 'pdf';

export type DateFilterType = 'all' | 'today' | '7days' | '30days';

export interface OperationHistoryItem {
  id: string;
  userId: string;
  type: OperationType;
  action: string;
  title: string;
  summary: string;
  detail?: string;
  timestamp: number;
  metadata?: {
    originalSize?: number;
    compressedSize?: number;
    shortUrl?: string;
    originalUrl?: string;
    qrType?: string;
  };
}
