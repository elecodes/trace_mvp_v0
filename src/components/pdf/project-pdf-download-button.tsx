'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ProjectPdfDocument } from '@/components/pdf/project-pdf-document';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';

interface ProjectPdfDownloadButtonProps {
  project: any;
}

export function ProjectPdfDownloadButton({ project }: ProjectPdfDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button variant="outline" size="sm" disabled>
        <FileText className="h-4 w-4 mr-2" /> Preparando PDF del Proyecto...
      </Button>
    );
  }

  const renderContent = ({ loading, error }: { loading: boolean; error: any }) => {
    if (error) {
      return (
        <Button variant="destructive" size="sm" className="font-medium">
          No se pudo generar el PDF. Inténtalo de nuevo.
        </Button>
      );
    }
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        className="border-slate-300 hover:bg-slate-100 text-slate-800 font-medium cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-500" /> Generando PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2 text-emerald-600" /> Exportar Proyecto PDF
          </>
        )}
      </Button>
    );
  };

  return (
    <PDFDownloadLink
      document={<ProjectPdfDocument project={project} />}
      fileName={`project-trace-${project.name.toLowerCase().replace(/\s+/g, '-')}.pdf`}
    >
      {renderContent as any}
    </PDFDownloadLink>
  );
}
