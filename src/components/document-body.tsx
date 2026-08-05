import type { Block } from "@/content/blocks";
import Logo from "./logo";

export default function DocumentBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="doc-body space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "logo":
            return (
              <div key={i} className="py-1">
                <Logo height={44} />
              </div>
            );
          case "h":
            return (
              <h3 key={i} className="section-title pt-2">
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="whitespace-pre-line">
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            );
          case "note":
            return (
              <p
                key={i}
                className="banner-yellow"
              >
                {block.text}
              </p>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="data-table min-w-[480px]">
                  <thead>
                    <tr>
                      {block.head.map((h, j) => (
                        <th key={j}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
