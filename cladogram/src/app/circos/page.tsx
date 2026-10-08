import type { Metadata } from "next";
import CircosReplica from "@/components/CircosReplica";

export const metadata: Metadata = {
  title: "The Full Circle Chart",
  description: "Interactive replica of the circos plot of cross-clade haplotype sharing from Parker et al. 2017.",
};

export default function Page() {
  return <CircosReplica />;
}
