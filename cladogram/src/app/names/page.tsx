import type { Metadata } from "next";
import NamesPage from "@/components/NamesPage";

export const metadata: Metadata = {
  title: "How We Name Our Dogs",
  description: "How New York City names its dogs: distinctive names by breed, size, family, job and region, and how New York's names differ from Toronto's.",
};

export default function Page() {
  return <NamesPage />;
}
