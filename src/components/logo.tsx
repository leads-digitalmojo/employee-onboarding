import { LOGO_ASPECT, LOGO_SRC } from "@/content/logo";
import { COMPANY } from "@/content/company";

/** The Digital Mojo logo, sized from its height so the aspect ratio is kept. */
export default function Logo({ height = 44 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={`${COMPANY.name} logo`}
      width={Math.round(height * LOGO_ASPECT)}
      height={height}
      className="block"
    />
  );
}
