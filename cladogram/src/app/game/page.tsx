import type { Metadata } from "next";
import GamePage from "@/components/GamePage";

export const metadata: Metadata = {
  title: "Dog Breed Game",
  description: "Name the breed from a photo, then see whether you beat an image-recognition AI. Easy, medium and hard rounds of 20 dogs.",
};

export default function Page() {
  return <GamePage />;
}
