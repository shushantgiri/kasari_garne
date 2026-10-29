/**
 * A tiny PDF writer: one JPEG photo per A4 page, centred with a small margin. Enough for scanned
 * documents, and small, because the JPEG bytes go in as they are (no re-encoding, no library).
 */

export interface PdfImage {
  /** JPEG file bytes. */
  jpeg: Uint8Array;
  width: number;
  height: number;
}

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 18;

export function imagesToPdf(images: PdfImage[]): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (p: string | Uint8Array) => {
    const b = typeof p === "string" ? enc.encode(p) : p;
    parts.push(b);
    length += b.length;
  };
  // Object numbers: 1 catalog, 2 pages, then per image: page, content, image.
  const obj = (n: number, body: () => void) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    body();
    push("\nendobj\n");
  };

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const pageIds = images.map((_, i) => 3 + i * 3);
  obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${images.length} >>`));

  images.forEach((img, i) => {
    const pageId = pageIds[i];
    const landscape = img.width > img.height;
    const [pw, ph] = landscape ? [A4[1], A4[0]] : A4;
    const scale = Math.min((pw - MARGIN * 2) / img.width, (ph - MARGIN * 2) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (pw - w) / 2;
    const y = (ph - h) / 2;
    const content = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
    obj(pageId, () =>
      push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 ${pageId + 2} 0 R >> >> /Contents ${pageId + 1} 0 R >>`),
    );
    obj(pageId + 1, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    obj(pageId + 2, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpeg.length} >>\nstream\n`);
      push(img.jpeg);
      push("\nendstream");
    });
  });

  const count = 3 + images.length * 3;
  const xref = length;
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let n = 1; n < count; n++) table += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  push(table);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
