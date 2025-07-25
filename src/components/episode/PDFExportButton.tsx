
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ProcessedEpisode } from '@/types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface PDFExportButtonProps {
  episode: ProcessedEpisode;
  className?: string;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({ episode, className }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = 30;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SweatSmart Episode Report', margin, yPosition);
      yPosition += 15;

      // Date and time
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${format(episode.datetime, 'EEEE, MMMM d, yyyy')}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Time: ${format(episode.datetime, 'h:mm a')}`, margin, yPosition);
      yPosition += 15;

      // Severity
      pdf.setFont('helvetica', 'bold');
      pdf.text('Severity Level:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${episode.severityLevel}/5`, margin + 40, yPosition);
      yPosition += 15;

      // Body Areas
      if (episode.bodyAreas.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Affected Body Areas:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        episode.bodyAreas.forEach((area) => {
          pdf.text(`• ${area}`, margin + 5, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // Triggers
      if (episode.triggers.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Triggers:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        episode.triggers.forEach((trigger) => {
          pdf.text(`• ${trigger.label} (${trigger.type})`, margin + 5, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // Notes
      if (episode.notes) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Additional Notes:', margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        
        // Split text to fit within margins
        const splitNotes = pdf.splitTextToSize(episode.notes, contentWidth);
        splitNotes.forEach((line: string) => {
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });
      }

      // Footer
      yPosition = pdf.internal.pageSize.getHeight() - 20;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Generated by SweatSmart App', margin, yPosition);

      // Generate filename and download
      const filename = `sweatsmart-episode-${format(episode.datetime, 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);

      toast({
        title: "PDF exported successfully",
        description: `Episode report saved as ${filename}`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </Button>
  );
};

export default PDFExportButton;
