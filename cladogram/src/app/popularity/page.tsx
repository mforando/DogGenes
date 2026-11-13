import type { Metadata } from "next";
import PopularityPage from "@/components/PopularityPage";
import JsonLd, { article, breadcrumbs } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Most Popular Dog Breeds by Year, 2013–2025 (AKC)";
const DESCRIPTION = "AKC popularity rankings by year since 2013, and every No. 1 breed since 1936. See which breeds rose and fell.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/popularity/", image: "og/popularity.png" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          article({ headline: TITLE, description: DESCRIPTION, path: "/popularity/", image: "og/popularity.png", cites: false }),
          breadcrumbs([["Most popular breeds", "/popularity/"]]),
        ]}
      />
      <PopularityPage />
    </>
  );
}
