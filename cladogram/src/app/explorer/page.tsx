import type { Metadata } from "next";
import BreedExplorer from "@/components/BreedExplorer";
import JsonLd, { article, breadcrumbs } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Dog Breed Explorer: Every Breed in One Photo Wall";
const DESCRIPTION = "Every dog breed photo in one wall: a rainbow photo mosaic spelling DOGS, or arranged by family, job, region or color. Hover or tap any dog for its history.";

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
