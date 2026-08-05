import "server-only";

import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { Block, DocPage } from "@/content/blocks";
import { LOGO_ASPECT, LOGO_FILE_RELATIVE } from "@/content/logo";

/* --------------------------------- layout --------------------------------- */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 56; // ~2cm
const BODY_SIZE = 10.5;
const HEADING_SIZE = 12.5;
const LINE = 1.5;
const PARA_GAP = 9;
const BLACK = rgb(0.1, 0.1, 0.12);
const RULE = rgb(0.85, 0.85, 0.88);
const MUTED = rgb(0.45, 0.45, 0.5);

const CONTENT_WIDTH = A4.width - MARGIN * 2;

/* --------------------------------- fonts ---------------------------------- */

// Noto Sans rather than a built-in: the standard PDF fonts are WinAnsi-encoded
// and cannot represent the rupee sign in clause 9.
const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
const LOGO_FILE = path.join(process.cwd(), LOGO_FILE_RELATIVE);

/* --------------------------------- drawing -------------------------------- */

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  /** The logo artwork, embedded once and reused on every sheet that shows it. */
  logo: PDFImage | null;
};

/** Greedily wraps `text` to `width`, measuring in the real font. */
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  // Honour explicit newlines in the source text — several clauses use them.
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.doc.addPage([A4.width, A4.height]);
  ctx.y = A4.height - MARGIN;
}

/** Reserves vertical space, starting a new sheet when the current one is full. */
function reserve(ctx: Ctx, height: number): void {
  if (ctx.y - height < MARGIN + 34) newPage(ctx);
}

function drawLines(
  ctx: Ctx,
  lines: string[],
  font: PDFFont,
  size: number,
  opts: { indent?: number; color?: ReturnType<typeof rgb> } = {},
): void {
  const indent = opts.indent ?? 0;
  const lineHeight = size * LINE;
  for (const line of lines) {
    reserve(ctx, lineHeight);
    ctx.y -= lineHeight;
    if (line) {
      ctx.page.drawText(line, {
        x: MARGIN + indent,
        y: ctx.y,
        size,
        font,
        color: opts.color ?? BLACK,
      });
    }
  }
}

function drawLogo(ctx: Ctx, height: number, align: "left" | "center"): void {
  if (!ctx.logo) return;
  const width = height * LOGO_ASPECT;
  reserve(ctx, height + 8);
  const x = align === "center" ? (A4.width - width) / 2 : MARGIN;
  ctx.y -= height;
  ctx.page.drawImage(ctx.logo, { x, y: ctx.y, width, height });
  ctx.y -= 8;
}

function drawBlock(ctx: Ctx, block: Block): void {
  switch (block.type) {
    case "logo":
      drawLogo(ctx, 40, "left");
      break;

    case "h":
      ctx.y -= PARA_GAP;
      drawLines(ctx, wrap(block.text, ctx.bold, HEADING_SIZE, CONTENT_WIDTH), ctx.bold, HEADING_SIZE);
      ctx.y -= 3;
      break;

    case "p":
      drawLines(ctx, wrap(block.text, ctx.regular, BODY_SIZE, CONTENT_WIDTH), ctx.regular, BODY_SIZE);
      ctx.y -= PARA_GAP;
      break;

    case "ul":
    case "ol":
      for (const [i, item] of block.items.entries()) {
        const marker = block.type === "ol" ? `${i + 1}.` : "•";
        const lines = wrap(item, ctx.regular, BODY_SIZE, CONTENT_WIDTH - 18);
        reserve(ctx, BODY_SIZE * LINE);
        // Draw the marker on the first line, then the wrapped text indented.
        ctx.y -= BODY_SIZE * LINE;
        ctx.page.drawText(marker, { x: MARGIN + 4, y: ctx.y, size: BODY_SIZE, font: ctx.regular, color: BLACK });
        ctx.page.drawText(lines[0] ?? "", {
          x: MARGIN + 18,
          y: ctx.y,
          size: BODY_SIZE,
          font: ctx.regular,
          color: BLACK,
        });
        drawLines(ctx, lines.slice(1), ctx.regular, BODY_SIZE, { indent: 18 });
      }
      ctx.y -= PARA_GAP;
      break;

    case "note":
      drawLines(ctx, wrap(block.text, ctx.regular, BODY_SIZE, CONTENT_WIDTH), ctx.regular, BODY_SIZE);
      ctx.y -= PARA_GAP;
      break;

    case "table": {
      const colWidth = CONTENT_WIDTH / block.head.length;
      const rows = [block.head, ...block.rows];
      for (const [r, row] of rows.entries()) {
        const font = r === 0 ? ctx.bold : ctx.regular;
        const cells = row.map((c) => wrap(c, font, BODY_SIZE - 0.5, colWidth - 10));
        const height = Math.max(...cells.map((c) => c.length)) * (BODY_SIZE - 0.5) * LINE + 4;
        reserve(ctx, height);
        const top = ctx.y;
        cells.forEach((lines, c) => {
          lines.forEach((line, li) => {
            ctx.page.drawText(line, {
              x: MARGIN + c * colWidth + 4,
              y: top - (li + 1) * (BODY_SIZE - 0.5) * LINE,
              size: BODY_SIZE - 0.5,
              font,
              color: BLACK,
            });
          });
        });
        ctx.y = top - height;
        ctx.page.drawLine({
          start: { x: MARGIN, y: ctx.y + 2 },
          end: { x: A4.width - MARGIN, y: ctx.y + 2 },
          thickness: 0.5,
          color: RULE,
        });
      }
      ctx.y -= PARA_GAP;
      break;
    }
  }
}

/* -------------------------------- the letter ------------------------------- */

export type LetterSignature = {
  page_no: number;
  /** The name the employee typed as their signature. */
  signature_text: string;
  signed_at: string;
  ip_address: string | null;
};

export type LetterPdfInput = {
  pages: DocPage[];
  employeeName: string;
  employeeCode: string;
  letterNumber: string;
  signatures: LetterSignature[];
};

/**
 * Renders the frozen letter to a PDF laid out like the printed document:
 * one PDF sheet per letter page, the logo on the first and last sheets, and
 * each page's digital signature reproduced where it was captured.
 */
export async function buildLetterPdf(input: LetterPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // subset: false — pdf-lib's subsetting drops glyphs here, leaving gaps in the
  // rendered text. Embedding the full face costs ~600KB per weight and is correct.
  const regular = await doc.embedFont(fs.readFileSync(path.join(FONT_DIR, "NotoSans-Regular.ttf")), {
    subset: false,
  });
  const bold = await doc.embedFont(fs.readFileSync(path.join(FONT_DIR, "NotoSans-Bold.ttf")), {
    subset: false,
  });
  // Typed signatures are set in italic so they read as a signature, not body copy.
  const italic = await doc.embedFont(fs.readFileSync(path.join(FONT_DIR, "NotoSans-Italic.ttf")), {
    subset: false,
  });

  doc.setTitle(`Appointment Letter — ${input.employeeName}`);
  doc.setSubject(input.letterNumber);
  doc.setProducer("Digital Mojo Onboarding");

  // Embed the logo once; drawn on whichever sheets carry a logo block.
  const logo = fs.existsSync(LOGO_FILE) ? await doc.embedPng(fs.readFileSync(LOGO_FILE)) : null;

  const byPage = new Map(input.signatures.map((s) => [s.page_no, s]));
  const ctx: Ctx = {
    doc,
    page: doc.addPage([A4.width, A4.height]),
    y: A4.height - MARGIN,
    regular,
    bold,
    italic,
    logo,
  };
  const sheetStarts: number[] = [];

  for (const [index, docPage] of input.pages.entries()) {
    // Each letter page starts a fresh sheet, mirroring the printed document.
    if (index > 0) newPage(ctx);
    sheetStarts.push(doc.getPageCount() - 1);

    if (index === 0) {
      // The title sits beside nothing on the source letter — centred heading.
      const title = "APPOINTMENT LETTER";
      for (const block of docPage.blocks) {
        if (block.type === "logo") {
          drawBlock(ctx, block);
          ctx.y -= 6;
          const w = bold.widthOfTextAtSize(title, HEADING_SIZE + 1);
          ctx.y -= (HEADING_SIZE + 1) * LINE;
          ctx.page.drawText(title, {
            x: (A4.width - w) / 2,
            y: ctx.y,
            size: HEADING_SIZE + 1,
            font: bold,
          });
          ctx.y -= 4;
          continue;
        }
        drawBlock(ctx, block);
      }
    } else {
      for (const block of docPage.blocks) drawBlock(ctx, block);
    }

    // Reproduce the signature captured for this page of the letter.
    const sig = byPage.get(docPage.page);
    if (sig) {
      const SIGNATURE_SIZE = 17;
      reserve(ctx, SIGNATURE_SIZE + 30);
      ctx.y -= SIGNATURE_SIZE + 4;
      // "/s/" is the conventional mark for a typed signature on a document.
      ctx.page.drawText(`/s/ ${sig.signature_text}`, {
        x: MARGIN,
        y: ctx.y,
        size: SIGNATURE_SIZE,
        font: italic,
        color: BLACK,
      });
      ctx.y -= 12;
      ctx.page.drawText(
        `Signed electronically by ${input.employeeName} (${input.employeeCode}) on ${sig.signed_at} UTC` +
          (sig.ip_address ? ` from ${sig.ip_address}` : ""),
        { x: MARGIN, y: ctx.y, size: 7.5, font: regular, color: MUTED },
      );
      ctx.y -= 10;
    }
  }

  // Footer on every sheet: page numbers and the internal reference.
  const sheets = doc.getPages();
  sheets.forEach((page, i) => {
    page.drawText(`${input.letterNumber}`, {
      x: MARGIN,
      y: MARGIN - 22,
      size: 7.5,
      font: regular,
      color: MUTED,
    });
    const label = `Page ${i + 1} of ${sheets.length}`;
    page.drawText(label, {
      x: A4.width - MARGIN - regular.widthOfTextAtSize(label, 7.5),
      y: MARGIN - 22,
      size: 7.5,
      font: regular,
      color: MUTED,
    });
  });

  return doc.save();
}
