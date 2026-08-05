/**
 * The Digital Mojo logo — the actual artwork, not a reproduction.
 *
 * The same file is used by the on-screen letter (`src/components/logo.tsx`,
 * served from /public) and by the PDF (`src/lib/pdf.ts`, read from disk and
 * embedded), so the two can never drift apart.
 *
 * To update the logo, replace `public/logo.png` — a transparent PNG — and set
 * `LOGO_ASPECT` to its width ÷ height. Nothing else needs to change.
 */

/** Public URL for the browser. */
export const LOGO_SRC = "/logo.png";

/** Location on disk, relative to the project root, for the PDF renderer. */
export const LOGO_FILE_RELATIVE = "public/logo.png";

/** Intrinsic width ÷ height (619 × 403). Used to size the mark from its height. */
export const LOGO_ASPECT = 619 / 403;
