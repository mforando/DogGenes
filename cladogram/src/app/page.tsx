import type { Metadata } from "next";
import HistoryStory from "@/components/HistoryStory";
import JsonLd, { article } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Where Dogs Came From: 40,000 Years From Wolf to Breed";
const DESCRIPTION = "Dogs descend from an extinct Ice Age wolf, not today’s gray wolf. Explore 40,000 years of dog history, the oldest dog fossils and how breeds began.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/", image: "og/home.png" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          article({ headline: TITLE, description: DESCRIPTION, path: "/", image: "og/home.png" }),
        ]}
      />
      <HistoryStory />
    </>
  );
}
