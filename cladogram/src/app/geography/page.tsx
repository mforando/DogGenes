import type { Metadata } from "next";
import GeographyPage from "@/components/GeographyPage";

export const metadata: Metadata = {
  title: "Where Breeds Came From",
  description: "An interactive 3D globe showing where each dog breed originated, colored by family group or original job.",
};

export default function Page() {
  return <GeographyPage />;
}
