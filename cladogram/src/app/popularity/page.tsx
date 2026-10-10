import type { Metadata } from "next";
import PopularityPage from "@/components/PopularityPage";

export const metadata: Metadata = {
  title: "Most Popular Breeds",
  description: "America's most popular dog breeds by year: AKC rankings 2013–2025 and every #1 breed since 1936.",
};

export default function Page() {
  return <PopularityPage />;
}
