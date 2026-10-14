import type { Metadata } from "next";
import Story from "@/components/Story";

export const metadata: Metadata = {
  title: "Reading the Dog Family Tree",
  description: "A scrollytelling guide to the 161-breed dog cladogram and DNA-sharing web from Parker et al., Cell Reports 2017.",
};

export default function Page() {
  return <Story />;
}
