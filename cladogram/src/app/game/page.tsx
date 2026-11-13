import type { Metadata } from "next";
import GamePage from "@/components/GamePage";
import JsonLd, { article, breadcrumbs } from "@/components/JsonLd";
import { pageMeta } from "@/lib/seo";

const TITLE = "Dog Breed Quiz: Can You Beat the AI?";
const DESCRIPTION = "Name the breed from a photo in 20 rounds, then see whether you beat an image-recognition AI. Easy, medium and hard levels.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/game/", image: "og/game.png" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          article({ headline: TITLE, description: DESCRIPTION, path: "/game/", image: "og/game.png", cites: false }),
          breadcrumbs([["Dog Breed Game", "/game/"]]),
        ]}
      />
      <GamePage />
    </>
  );
}
