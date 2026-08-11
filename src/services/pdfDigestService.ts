import { jsPDF } from 'jspdf';
import { KnowledgeObject } from '../types';

/**
 * Service function that fetches the day's knowledge objects from the backend API
 * or accepts a list of Knowledge Objects and uses jsPDF to compile a downloadable
 * 'Exam Digest' PDF summary document for the current or target date.
 */
export async function downloadExamDigestPDF(
  customItems?: KnowledgeObject[],
  customDateStr?: string
): Promise<void> {
  let items = customItems;
  const dateStr = customDateStr || new Date().toISOString().split('T')[0];

  // Fetch today's knowledge objects from server if not explicitly passed
  if (!items || items.length === 0) {
    try {
      const response = await fetch(`/api/digest/today`);
      const data = await response.json();
      if (data.knowledge_objects && data.knowledge_objects.length > 0) {
        items = data.knowledge_objects;
      }
    } catch (err) {
      console.warn('Could not fetch digest from server API, using local fallback:', err);
    }
  }

  if (!items || items.length === 0) {
    throw new Error('No Knowledge Objects available for generating PDF Digest.');
  }

  // Initialize jsPDF document (Standard A4 Portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let cursorY = 20;

  // Helper for adding page header & branding
  const renderHeader = (isFirstPage = false) => {
    // Header Banner Box
    doc.setFillColor(18, 17, 39); // #121127 Kinetic Dark Accent
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(0, 209, 255); // Cyan Neon #00D1FF
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('KINETIC PULSE', margin, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`DAILY EXAM DIGEST — ${dateStr}`, pageWidth - margin, 12, { align: 'right' });

    doc.setDrawColor(0, 209, 255);
    doc.setLineWidth(0.8);
    doc.line(0, 26, pageWidth, 26);

    cursorY = 34;
  };

  // Helper for page overflow check
  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 15) {
      doc.addPage();
      renderHeader(false);
    }
  };

  renderHeader(true);

  // Document Title & Intro
  doc.setTextColor(20, 20, 20);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Daily Current Affairs & Practice MCQ Digest', margin, cursorY);
  cursorY += 7;

  doc.setTextColor(100, 100, 100);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Compiled automatically on ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} • Total Snippets: ${items.length}`,
    margin,
    cursorY
  );
  cursorY += 8;

  // Horizontal Separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // Render each Knowledge Object
  items.forEach((item, index) => {
    checkPageBreak(45);

    // Article Index & Category Pill
    doc.setFillColor(240, 245, 250);
    doc.setDrawColor(0, 209, 255);
    doc.roundedRect(margin, cursorY - 3, pageWidth - margin * 2, 8, 1, 1, 'FD');

    doc.setTextColor(0, 100, 150);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(
      `TOPIC #${index + 1}: [${(item.category || 'CURRENT AFFAIRS').toUpperCase()}]`,
      margin + 4,
      cursorY + 2.5
    );

    doc.setTextColor(180, 11, 7); // Importance highlight
    doc.text(`EXAM IMPORTANCE: ${item.exam_importance}/100`, pageWidth - margin - 4, cursorY + 2.5, {
      align: 'right',
    });

    cursorY += 10;

    // Headline
    checkPageBreak(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);

    const splitHeadline = doc.splitTextToSize(item.headline, pageWidth - margin * 2);
    doc.text(splitHeadline, margin, cursorY);
    cursorY += splitHeadline.length * 5.5 + 2;

    // Summary Text
    checkPageBreak(15);
    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);

    const splitSummary = doc.splitTextToSize(item.summary, pageWidth - margin * 2);
    doc.text(splitSummary, margin, cursorY);
    cursorY += splitSummary.length * 4.5 + 4;

    // 3-Bullet Quick Take Box
    if (item.quick_take && item.quick_take.length > 0) {
      checkPageBreak(item.quick_take.length * 7 + 10);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      const qtBoxY = cursorY;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('3-BULLET QUICK TAKE:', margin + 4, cursorY + 5);
      cursorY += 9;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      item.quick_take.forEach((bullet) => {
        const splitBullet = doc.splitTextToSize(`•  ${bullet}`, pageWidth - margin * 2 - 8);
        doc.text(splitBullet, margin + 4, cursorY);
        cursorY += splitBullet.length * 4 + 1.5;
      });

      cursorY += 4;
    }

    // Practice MCQs
    if (item.mcqs && item.mcqs.length > 0) {
      checkPageBreak(25);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 120, 160);
      doc.text('PRACTICE EXAMINATION MCQS:', margin, cursorY);
      cursorY += 5;

      item.mcqs.forEach((mcq, qIdx) => {
        checkPageBreak(20);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);

        const splitQ = doc.splitTextToSize(`Q${qIdx + 1}. ${mcq.question}`, pageWidth - margin * 2);
        doc.text(splitQ, margin, cursorY);
        cursorY += splitQ.length * 4 + 1;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        mcq.options.forEach((opt, optIdx) => {
          const isCorrect = optIdx === mcq.correct_index;
          const letter = String.fromCharCode(65 + optIdx);
          const optText = `   (${letter}) ${opt}${isCorrect ? ' [CORRECT ANSWER]' : ''}`;
          if (isCorrect) {
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(16, 185, 129); // Emerald Green
          } else {
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
          }
          doc.text(optText, margin, cursorY);
          cursorY += 4;
        });

        // Explanation
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const splitExp = doc.splitTextToSize(`Explanation: ${mcq.explanation}`, pageWidth - margin * 2 - 4);
        doc.text(splitExp, margin + 4, cursorY);
        cursorY += splitExp.length * 3.5 + 4;
      });
    }

    // Divider Line between items
    cursorY += 2;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 8;
  });

  // Footer / Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages} — Kinetic Pulse Exam Digest`, pageWidth / 2, pageHeight - 6, {
      align: 'center',
    });
  }

  // Save / Trigger Download in Browser
  doc.save(`Kinetic_Exam_Digest_${dateStr}.pdf`);
}
