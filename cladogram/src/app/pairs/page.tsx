import type { Metadata } from "next";
import PairsPage from "@/components/PairsPage";

export const metadata: Metadata = {
  title: "Breed Pairs",
  description: "Which dog breeds share the most DNA: close cousins, founder breeds, and pairs across families.",
};

export default function Page() {
  return <PairsPage />;
}
