import type { Metadata } from "next";
import BreedExplorer from "@/components/BreedExplorer";
import JsonLd, { article, breadcrumbs } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Dog Breed Explorer: Every Breed in One Photo Wall";
const DESCRIPTION = "Browse dog breed photos arranged by family, job, region, color or map. Hover or tap any dog for its history and origin.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/explorer/", image: "og/explorer.png" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          article({ headline: TITLE, description: DESCRIPTION, path: "/explorer/", image: "og/explorer.png", cites: false }),
          breadcrumbs([["Breed Explorer", "/explorer/"]]),
        ]}
      />
      <BreedExplorer />
    </>
  );
}
