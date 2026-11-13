import type { Metadata } from "next";
import PurposePage from "@/components/PurposePage";
import JsonLd, { article, breadcrumbs } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Dog Breeds by Job: Herding, Hunting, Guarding and More";
const DESCRIPTION = "What each breed was bred to do, and why dogs with the same job often aren’t related. See breeds by job, family and origin on a world map.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/purpose/", image: "og/purpose.png" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          article({ headline: TITLE, description: DESCRIPTION, path: "/purpose/", image: "og/purpose.png" }),
          breadcrumbs([["Bred for purpose", "/purpose/"]]),
        ]}
      />
      <PurposePage />
    </>
  );
}
