import Moved from "@/components/Moved";
import { movedMeta } from "@/lib/seo";

/** Retired URL: its content now lives at /tree/#breed-pairs. */
export const metadata = movedMeta("/tree/");

export default function Page() {
  return <Moved to="/tree/#breed-pairs" label="Continue to the breed pairs on the family tree & DNA web" />;
}
