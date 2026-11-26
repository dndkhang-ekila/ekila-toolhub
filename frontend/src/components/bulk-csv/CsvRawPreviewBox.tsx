'use client';

import React from 'react';

interface CsvRawPreviewBoxProps {
  title: string;
  content: string;
  visible: boolean;
}

/**
 * Hiển thị xem trước nội dung CSV chuẩn UTF-8 BOM dùng chung cho luồng Nhập và Xuất.
 */
export function CsvRawPreviewBox({
  title,
  content,
  visible,
}: CsvRawPreviewBoxProps) {
  if (!visible || !content) return null;

  return (
    <div className="space-y-1.5 pt-2">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <pre className="p-3 rounded-xl bg-muted/60 border border-border text-xs font-mono text-foreground overflow-x-auto max-h-56">
        {content}
      </pre>
    </div>
  );
}
