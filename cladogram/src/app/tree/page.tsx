import type { Metadata } from "next";
import Story from "@/components/Story";
import JsonLd, { article, breadcrumbs } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Dog Breed Family Tree: How 161 Breeds Are Related";
const DESCRIPTION = "An interactive DNA family tree of 161 dog breeds from a landmark 2017 study, plus a map of which breeds were crossed to make others.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/tree/", image: "og/tree.png" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          article({ headline: TITLE, description: DESCRIPTION, path: "/tree/", image: "og/tree.png" }),
          breadcrumbs([["Family tree & DNA web", "/tree/"]]),
        ]}
      />
      <Story />
    </>
  );
}
