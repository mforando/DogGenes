import type { Metadata } from "next";
import CircosStory from "@/components/CircosStory";

export const metadata: Metadata = {
  title: "The DNA Web, Explained",
  description: "A scrollytelling guide to Figure 4 of Parker et al. 2017: haplotype sharing between dog breeds.",
};

export default function Page() {
  return <CircosStory />;
}
