import type { Metadata } from "next";
import PurposePage from "@/components/PurposePage";

export const metadata: Metadata = {
  title: "Built for Purpose",
  description: "Dog breeds grouped by their original job, and what their DNA says about how each job was bred.",
};

export default function Page() {
  return <PurposePage />;
}
