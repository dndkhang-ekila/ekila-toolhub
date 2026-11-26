'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  buildBulkResultCsv,
  buildSampleBulkCsv,
  parseBulkCsvContent,
} from '@/lib/bulk-csv-parser';
import {
  processBulkCsvRow,
  triggerCsvDownload,
} from '@/lib/bulk-csv-service';
import type {
  BulkCsvInputRow,
  BulkCsvResultRow,
  CsvDuplicateMode,
} from '@/types/bulk-csv';
import { BulkCsvDropzoneCard } from './BulkCsvDropzoneCard';
import { copyTextWithFallback, TrashIcon } from './BulkCsvIcons';
import {
  type BatchSummaryCounts,
  BulkCsvResultTable,
} from './BulkCsvResultTable';

function toInitialResultRows(parsedRows: BulkCsvInputRow[]): BulkCsvResultRow[] {
  return parsedRows.map((row) => ({
    ...row,
    status: row.validationError ? 'error' : 'pending',
    shortUrl: '',
    slug: '',
    message: row.validationError || 'Sẵn sàng rút gọn',
  }));
}

function finalizeAbortedPendingRows(
  rows: BulkCsvResultRow[],
  startIndex: number,
): BulkCsvResultRow[] {
  return rows.map((row, idx) =>
    idx >= startIndex && row.status === 'pending'
      ? { ...row, status: 'error', message: 'Đã dừng xử lý hàng loạt' }
      : row,
  );
}

/**
 * Luồng Nhập tệp CSV để tạo liên kết rút gọn hàng loạt.
 */
export function BulkCsvImportPanel({
  onBatchCompleted,
}: {
  onBatchCompleted?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<BulkCsvResultRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<CsvDuplicateMode>('reuse');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [hasExecuted, setHasExecuted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const summary = useMemo<BatchSummaryCounts>(() => {
    return {
      total: rows.length,
      valid: rows.filter((r) => !r.validationError).length,
      created: rows.filter((r) => r.status === 'created').length,
      reused: rows.filter((r) => r.status === 'reused').length,
      errors: rows.filter((r) => r.status === 'error').length,
      retryableErrors: rows.filter((r) => r.status === 'error' && !r.validationError).length,
    };
  }, [rows]);

  const resultCsvText = useMemo(
    () => (rows.length > 0 ? buildBulkResultCsv(rows) : ''),
    [rows],
  );

  const loadCsvText = (rawText: string, sourceName: string) => {
    const parsed = parseBulkCsvContent(rawText);
    setFileName(sourceName);
    setRows(toInitialResultRows(parsed.rows));
    setWarnings(parsed.warnings);
    setHasExecuted(false);
    setProcessedCount(0);
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setWarnings(['Vui lòng chọn tệp có định dạng .csv.']);
      return;
    }
    loadCsvText(await file.text(), file.name);
  };

  const handleClear = () => {
    if (isProcessing) return;
    setFileName('');
    setRows([]);
    setWarnings([]);
    setHasExecuted(false);
    setProcessedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopy = async (value: string, key: string) => {
    if (!(await copyTextWithFallback(value))) return;
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((curr) => (curr === key ? null : curr)), 1800);
  };

  const handleCopyAllSuccess = async () => {
    const urls = rows
      .filter((r) => (r.status === 'created' || r.status === 'reused') && r.shortUrl)
      .map((r) => r.shortUrl)
      .join('\n');
    if (urls) {
      await handleCopy(urls, 'all-short-links');
    }
  };

  const executeRowsBatch = async (initialWorking: BulkCsvResultRow[], onlyPending: boolean) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsProcessing(true);
    setHasExecuted(true);
    setProcessedCount(0);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let working = initialWorking;
    setRows(working);

    for (let i = 0; i < working.length; i++) {
      if (controller.signal.aborted) {
        working = finalizeAbortedPendingRows(working, i);
        setRows(working);
        break;
      }

      const shouldProcess = onlyPending
        ? working[i].status === 'pending' && !working[i].validationError
        : !working[i].validationError;

      if (shouldProcess) {
        working = working.map((item, idx) =>
          idx === i
            ? { ...item, status: 'processing', message: 'Đang kiểm tra & tạo...' }
            : item,
        );
        setRows(working);

        const completedRow = await processBulkCsvRow(
          working[i],
          duplicateMode,
          origin,
          controller.signal,
        );
        working = working.map((item, idx) => (idx === i ? completedRow : item));
      }

      setProcessedCount(i + 1);
      setRows(working);
    }

    abortControllerRef.current = null;
    setIsProcessing(false);
    onBatchCompleted?.();
  };

  const handleRunBatch = async () => {
    if (rows.length === 0 || isProcessing) return;
    await executeRowsBatch(toInitialResultRows(rows), false);
  };

  const handleRetryFailed = async () => {
    if (rows.length === 0 || isProcessing) return;
    const retryRows: BulkCsvResultRow[] = rows.map((row) =>
      row.status === 'error' && !row.validationError
        ? { ...row, status: 'pending', message: 'Đang chờ thử lại' }
        : row,
    );
    await executeRowsBatch(retryRows, true);
  };

  const handleDownloadResultCsv = () => {
    if (!resultCsvText) return;
    const baseName = fileName ? fileName.replace(/\.csv$/i, '') : 'toolhub-bulk';
    triggerCsvDownload(`${baseName}-ket-qua.csv`, resultCsvText);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <BulkCsvDropzoneCard
          fileInputRef={fileInputRef}
          fileName={fileName}
          rowCount={rows.length}
          warnings={warnings}
          isProcessing={isProcessing}
          onSelectFile={(file) => void handleFileSelected(file)}
          onParseText={loadCsvText}
          onDownloadSample={() =>
            triggerCsvDownload('toolhub-bulk-template.csv', buildSampleBulkCsv())
          }
        />

        {/* Duplicate URL Policy & Batch Actions */}
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                2. Khi URL đã được rút gọn trước đó
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chọn cách xử lý nếu một URL trong tệp CSV trùng với liên kết đã có của bạn.
              </p>
            </div>

            {(
              [
                {
                  mode: 'reuse' as const,
                  title: 'Tái sử dụng liên kết cũ',
                  desc: 'Giữ nguyên link ngắn đã tạo trước đó và đánh dấu trạng thái trùng.',
                },
                {
                  mode: 'forceNew' as const,
                  title: 'Tạo mã rút gọn mới',
                  desc: 'Luôn cấp một đường dẫn ngắn mới hoàn toàn cho dòng bị trùng.',
                },
              ]
            ).map((option) => (
              <label
                key={option.mode}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs transition cursor-pointer ${
                  duplicateMode === option.mode
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="csvDuplicateMode"
                  checked={duplicateMode === option.mode}
                  onChange={() => setDuplicateMode(option.mode)}
                  disabled={isProcessing}
                  className="mt-0.5 accent-indigo-600"
                />
                <span>
                  <strong className="block text-foreground">{option.title}</strong>
                  <span className="text-muted-foreground">{option.desc}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-2.5 pt-2 border-t border-border">
            {isProcessing ? (
              <button
                type="button"
                onClick={() => abortControllerRef.current?.abort()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
              >
                Dừng xử lý ({processedCount}/{summary.total})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleRunBatch()}
                disabled={summary.valid === 0}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition cursor-pointer"
              >
                Tạo hàng loạt ({summary.valid} dòng hợp lệ)
              </button>
            )}

            {rows.length > 0 && !isProcessing && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Xóa bảng dữ liệu</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <BulkCsvResultTable
        rows={rows}
        summary={summary}
        hasExecuted={hasExecuted}
        isProcessing={isProcessing}
        processedCount={processedCount}
        resultCsvText={resultCsvText}
        copiedKey={copiedKey}
        onCopy={(val, key) => void handleCopy(val, key)}
        onCopyAllSuccess={() => void handleCopyAllSuccess()}
        onRetryFailed={() => void handleRetryFailed()}
        onDownloadResultCsv={handleDownloadResultCsv}
      />
    </div>
  );
}
