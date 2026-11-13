import Moved from "@/components/Moved";
import { movedMeta } from "@/lib/seo";

/** Retired URL: its content now lives at /tree/#geography. */
export const metadata = movedMeta("/tree/");

export default function Page() {
  return <Moved to="/tree/#geography" label="Continue to the breed origins globe" />;
}
