import { renderPageToCanvas } from './canvasExporter.js';

function canvasToJpegBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('The browser could not encode a notebook page for PDF export.'));
        return;
      }

      try {
        resolve(new Uint8Array(await blob.arrayBuffer()));
      } catch (error) {
        reject(error);
      }
    }, 'image/jpeg', 0.92);
  });
}

export async function exportAllPagesAsPdf(pages, state) {
  if (pages.length === 0) {
    throw new Error('There are no notebook pages to export.');
  }

  const pdfWidth = 595.28;
  const pdfHeight = 841.89;
  const pageImages = await Promise.all(
    pages.map(async (page) => {
      const canvas = renderPageToCanvas(page, pages.length, state, 2);
      return {
        width: canvas.width,
        height: canvas.height,
        bytes: await canvasToJpegBytes(canvas)
      };
    })
  );

  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let byteLength = 0;

  function pushText(text) {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    byteLength += bytes.length;
  }

  function pushBytes(bytes) {
    chunks.push(bytes);
    byteLength += bytes.length;
  }

  function beginObject(objectNumber) {
    offsets[objectNumber] = byteLength;
    pushText(`${objectNumber} 0 obj\n`);
  }

  function endObject() {
    pushText('\nendobj\n');
  }

  pushText('%PDF-1.4\n');

  beginObject(1);
  pushText('<< /Type /Catalog /Pages 2 0 R >>');
  endObject();

  const pageObjectNumbers = pageImages.map((_, index) => 3 + index * 3);
  beginObject(2);
  pushText(
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')}] /Count ${pageImages.length} >>`
  );
  endObject();

  pageImages.forEach((image, index) => {
    const pageObject = 3 + index * 3;
    const contentObject = pageObject + 1;
    const imageObject = pageObject + 2;
    const imageName = `Im${index}`;
    const content = `q ${pdfWidth} 0 0 ${pdfHeight} 0 0 cm /${imageName} Do Q`;

    beginObject(pageObject);
    pushText(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] ` +
        `/Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> ` +
        `/Contents ${contentObject} 0 R >>`
    );
    endObject();

    beginObject(contentObject);
    pushText(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
    endObject();

    beginObject(imageObject);
    pushText(
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
        `/Length ${image.bytes.length} >>\nstream\n`
    );
    pushBytes(image.bytes);
    pushText('\nendstream');
    endObject();
  });

  const xrefOffset = byteLength;
  pushText(`xref\n0 ${offsets.length}\n`);
  pushText('0000000000 65535 f \n');
  for (let index = 1; index < offsets.length; index += 1) {
    pushText(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`);
  }
  pushText(
    `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  const pdfBlob = new Blob(chunks, { type: 'application/pdf' });
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'scribbly-notes-notebook.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
