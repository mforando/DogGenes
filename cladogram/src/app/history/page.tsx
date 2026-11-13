import Moved from "@/components/Moved";
import { movedMeta } from "@/lib/seo";

/** Retired URL: its content now lives at /. */
export const metadata = movedMeta("/");

export default function Page() {
  return <Moved to="/" label="Continue to the history of dogs" keepHash />;
}
