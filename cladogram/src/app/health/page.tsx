import type { Metadata } from "next";
import HealthPage from "@/components/HealthPage";
import JsonLd, { article, breadcrumbs } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Inherited Diseases in Dog Breeds and Mixed Breeds";
const DESCRIPTION = "Which inherited disease variants run in which breed families, and how common they are in mixed-breed dogs.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/health/", image: "og/health.png" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          article({ headline: TITLE, description: DESCRIPTION, path: "/health/", image: "og/health.png" }),
          breadcrumbs([["Health & heredity", "/health/"]]),
        ]}
      />
      <HealthPage />
    </>
  );
}
