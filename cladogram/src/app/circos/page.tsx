import Moved from "@/components/Moved";
import { movedMeta } from "@/lib/seo";

/** Retired URL: its content now lives at /tree/#full-chart. */
export const metadata = movedMeta("/tree/");

export default function Page() {
  return <Moved to="/tree/#full-chart" label="Continue to the family tree & DNA web" />;
}
