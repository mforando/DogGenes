import type { Metadata } from "next";
import BreedExplorer from "@/components/BreedExplorer";

export const metadata: Metadata = {
  title: "Breed Explorer",
  description: "Every photo in the Dog CEO collection on one wall, arranged by family, job, region, color, or on a map.",
};

export default function Page() {
  return <BreedExplorer />;
}
