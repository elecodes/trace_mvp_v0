'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { AssetPdfDocument } from '@/components/pdf/asset-pdf-document';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';

interface PdfDownloadButtonProps {
  asset: any;
}

export function PdfDownloadButton({ asset }: PdfDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button variant="outline" size="sm" disabled>
        <FileText className="h-4 w-4 mr-2" /> Preparando PDF...
      </Button>
    );
  }

  const renderContent = ({ loading }: { loading: boolean }) => (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      className="border-slate-300 hover:bg-slate-100 text-slate-800 font-medium"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-500" /> Generando PDF...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2 text-emerald-600" /> Exportar Ficha PDF
        </>
      )}
    </Button>
  );

  return (
    <PDFDownloadLink
      document={<AssetPdfDocument asset={asset} />}
      fileName={`asset-trace-${asset.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
    >
      {renderContent as any}
    </PDFDownloadLink>
  );
}
