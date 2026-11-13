import Moved from "@/components/Moved";
import { movedMeta } from "@/lib/seo";

/** Retired URL: its content now lives at /tree/#c-blocks. */
export const metadata = movedMeta("/tree/");

export default function Page() {
  return <Moved to="/tree/#c-blocks" label="Continue to the family tree & DNA web" />;
}
