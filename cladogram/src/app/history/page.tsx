import Moved from "@/components/Moved";
import { movedMeta } from "@/lib/seo";

/** Retired URL: its content now lives at /. */
export const metadata = movedMeta("/");

export default function Page() {
  return <Moved to="/" label="Continue to The Evolution of Dogs" keepHash />;
}
