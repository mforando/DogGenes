import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/shared";
import { abs } from "@/lib/site";
import AboutScroller, { type AboutDog } from "@/components/AboutScroller";

const TITLE = "About Me & My Dogs";
const DESCRIPTION = "Who made DogGenes, and the dogs who inspired it: Briar, Maggie, Bentley, Nellie and William.";
const LINKEDIN = "https://www.linkedin.com/in/mforando/";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: abs("/about/") },
};

/**
 * The photos, in public/about/: each dog cut out of its background (resized, camera and location
 * data removed), drawn at the same height with an outline and a soft glow (traced by
 * scripts/build-about-outlines.py). See AboutScroller for how they're shown.
 */
/** In the order they joined the family. */
const DOGS: AboutDog[] = [
  {
    name: "Briar",
    breeds: ["ESET"],
    photo: { file: "briar-nobg.webp", alt: "Briar, a white dog with black speckles, trotting toward the camera, tail up", caption: "On patrol in the backyard." },
  },
  {
    name: "Maggie",
    breeds: ["BRIT", "ESET"],
    photo: { file: "maggie-nobg.webp", alt: "Maggie, a red and white dog lying down and looking back over one shoulder", caption: "A look back over the shoulder." },
  },
  {
    name: "Bentley",
    breeds: [["REDB", "RHOD"], "ESET"],
    photo: { file: "bentley-nobg.webp", alt: "Bentley, a tan and white hound, sitting and looking up at the camera", caption: "Waiting, very patiently, for a treat." },
  },
  {
    name: "Nellie",
    breeds: ["CHIH", "BEAG", "DACH"],
    photo: { file: "nellie-nobg.webp", alt: "Nellie, a small black and tan dog, standing with tongue out mid-lick", caption: "Caught mid-lick." },
  },
  {
    name: "William",
    breeds: [
      "ESET",
      // The Kokoni isn't AKC-recognized or in the study: drawn with the Chihuahua's dog.
      { name: "Kokoni", lookalike: "CHIH" },
    ],
    photo: {
      file: "william-top.webp",
      under: "ratpack-bg.webp",
      alt: "William, a black and white dog in a blue harness, sitting in front of his pack of dogs on a wooden deck",
      caption: "Front and center in the pack.",
    },
  },
];

export default function Page() {
  return (
    <>
      <SiteNav />
      <main className="purpose about-page">
        <header className="pairs-head">
          <p className="eyebrow">About</p>
          <h1>About Me &amp; My Dogs</h1>
          <p className="pairs-lede">
            I&rsquo;m Mason Forando, and I made DogGenes: a walk through the 2017 study that mapped how dog breeds are
            related, plus where breeds came from, what they were bred for, their health and their names. These are the
            dogs who make the subject personal.
          </p>
          <p className="about-links">
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
              Connect on LinkedIn
            </a>
            <span aria-hidden> · </span>
            <Link href="/tree/">See the dog family tree →</Link>
          </p>
        </header>

        <h2 className="about-h">My dogs</h2>
        <AboutScroller dogs={DOGS} />
      </main>
    </>
  );
}

