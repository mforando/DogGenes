import type { Metadata } from "next";
import HistoryStory from "@/components/HistoryStory";

export const metadata: Metadata = {
  title: "The History of Dogs",
  description: "40,000 years of dog history, from Ice Age wolves to modern breeds, on a scroll-driven timeline.",
};

export default function Page() {
  return <HistoryStory />;
}
