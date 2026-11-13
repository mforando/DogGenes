import type { Metadata } from "next";
import NamesPage from "@/components/NamesPage";
import JsonLd, { article, breadcrumbs } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Most Popular Dog Names in NYC, by Breed";
const DESCRIPTION = "New York City’s most distinctive dog names by breed, size and job, and how New York’s names compare with Toronto’s.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/names/", image: "og/names.png" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          article({ headline: TITLE, description: DESCRIPTION, path: "/names/", image: "og/names.png", cites: false }),
          breadcrumbs([["How we name our dogs", "/names/"]]),
        ]}
      />
      <NamesPage />
    </>
  );
}
