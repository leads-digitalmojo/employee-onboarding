/** A tiny block format so policy documents stay data, not JSX. */
export type Block =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "note"; text: string }
  | { type: "logo" }
  | { type: "table"; head: string[]; rows: string[][] };

export type DocPage = {
  /** 1-based page number; each page is signed separately. */
  page: number;
  title: string;
  blocks: Block[];
};
