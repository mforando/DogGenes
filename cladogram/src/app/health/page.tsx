import type { Metadata } from "next";
import HealthPage from "@/components/HealthPage";

export const metadata: Metadata = {
  title: "Health & Heredity",
  description: "How dog family trees and shared DNA help trace inherited diseases across breeds, with open data sources.",
};

export default function Page() {
  return <HealthPage />;
}
