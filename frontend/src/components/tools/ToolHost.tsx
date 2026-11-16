'use client';

import React from 'react';
import { ToolDefinition } from '@/lib/tools-registry';
import { QrGeneratorTool } from './QrGeneratorTool';
import { UrlShortenerTool } from './UrlShortenerTool';
import { QrScannerTool } from './QrScannerTool';
import { ImageCompressorTool } from './ImageCompressorTool';
import { PdfCompressorTool } from './PdfCompressorTool';
import { DocScannerTool } from './DocScannerTool';
import { UrlPolicyForm } from '@/features/url-policy/components/url-policy-form';

interface ToolHostProps {
  tool: ToolDefinition;
}

export function ToolHost({ tool }: ToolHostProps) {
  switch (tool.slug) {
    case 'qr-generator':
      return <QrGeneratorTool />;
    case 'url-shortener':
      return <UrlShortenerTool />;
    case 'qr-scanner':
      return <QrScannerTool />;
    case 'image-compressor':
      return <ImageCompressorTool />;
    case 'pdf-compressor':
      return <PdfCompressorTool />;
    case 'doc-scanner':
      return <DocScannerTool />;
    case 'url-check':
      return <UrlPolicyForm />;
    default:
      return (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            Tiện ích đang trong quá trình chuẩn bị phát hành.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vui lòng quay lại sau hoặc thử các tiện ích khác trên hệ thống.
          </p>
        </div>
      );
  }
}
