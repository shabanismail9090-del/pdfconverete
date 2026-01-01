export enum AppStatus {
  IDLE = 'IDLE',
  READING_PDF = 'READING_PDF',
  AI_PROCESSING = 'AI_PROCESSING',
  GENERATING_WORD = 'GENERATING_WORD',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface ExtractedContent {
  rawText: string;
  pageCount: number;
}