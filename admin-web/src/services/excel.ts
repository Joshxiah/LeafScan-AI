/**
 * Excel (.xlsx) export helper for the CAO admin platform.
 *
 * Pages hand over plain rows; this turns them into a styled sheet
 * (bold header row, sensible column widths) and triggers the
 * browser's "Save as" download.
 */

import writeExcelFile from 'write-excel-file/browser';

export type ExcelValue = string | number | null | undefined;

/** A picture floating over a sheet. `row` / `column` are 1-based cell coordinates. */
export interface ExcelImage {
  content: Blob;
  contentType: string;
  width: number;
  height: number;
  row: number;
  column: number;
}

export interface ExcelSheet {
  /** Tab name (Excel limits this to 31 characters). */
  name: string;
  headers: string[];
  rows: ExcelValue[][];
  images?: ExcelImage[];
}

/**
 * Downloads a picture and re-encodes it as a JPEG no wider than
 * `maxWidth` - Excel cannot show WebP, and a full-size phone photo
 * would make the workbook huge. Returns null if it cannot be loaded.
 */
export async function loadImageForExcel(
  url: string,
  maxWidth = 480
): Promise<{ content: Blob; contentType: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());

    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const content = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
    return content ? { content, contentType: 'image/jpeg', width, height } : null;
  } catch {
    return null;
  }
}

/** "2026-10-11" - used in export file names. */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function downloadExcel(fileName: string, sheets: ExcelSheet[]): Promise<void> {
  const book = sheets.map((sheet) => {
    const header = sheet.headers.map((value) => ({
      value,
      fontWeight: 'bold' as const,
      backgroundColor: '#E8F3E8',
    }));

    const data = sheet.rows.map((row) =>
      row.map((value) => {
        if (typeof value === 'number') return { value, type: Number };
        return { value: value === null || value === undefined ? '' : String(value), type: String };
      })
    );

    const columns = sheet.headers.map((headerText, index) => {
      const longest = sheet.rows.reduce(
        (max, row) => Math.max(max, String(row[index] ?? '').length),
        headerText.length
      );
      return { width: Math.min(Math.max(longest + 2, 10), 50) };
    });

    return {
      data: [header, ...data],
      sheet: sheet.name.slice(0, 31),
      columns,
      ...(sheet.images?.length
        ? {
            images: sheet.images.map((image) => ({
              content: image.content,
              contentType: image.contentType,
              width: image.width,
              height: image.height,
              dpi: 96,
              anchor: { row: image.row, column: image.column },
            })),
          }
        : {}),
    };
  });

  await writeExcelFile(book).toFile(fileName);
}
