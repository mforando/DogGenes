import type { Metadata } from "next";
import NamesPage from "@/components/NamesPage";

export const metadata: Metadata = {
  title: "NYC Dog Names",
  description: "Can a dog's name predict its breed? Distinctive names by size, family, job and region from NYC dog licenses.",
};

export default function Page() {
  return <NamesPage />;
}
