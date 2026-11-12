import type { ReactNode } from "react";
import type { CircosView } from "@/components/Circos";
import { links, nodes } from "./circos";
import { B, Clade, Term } from "@/components/Hints";

export type CircosStep = {
  id: string;
  kicker: string;
  title: string;
  body: ReactNode;
  view: CircosView;
  photos?: string[];
};

const silentCount = nodes.filter((n) => n.degree === 0).length;
const hubs = nodes.filter((n) => n.degree > 8).map((n) => n.code);

export const CIRCOS_STEPS: CircosStep[] = [
  {
    id: "blocks",
    kicker: "01 · The ring",
    title: "The tree, bent into a ring",
    body: (
      <>
        <p>
          <strong>Part two.</strong> A family tree shows how breeds branched apart. But breeders also
          crossed breeds back together, leaving long shared stretches of <Term id="dna">DNA</Term>. The study drew those
          connections as a <em>chord diagram</em>: a ring of breeds tied together by ribbons.
        </p>
        <p>
          The ring has {nodes.length} blocks, one per breed, in the same order and colors as the
          tree, starting from the <strong>wolf</strong> just left of the top and running counterclockwise. Every
          block is the same size, however many dogs were tested. Three breeds appear twice because
          they were sampled in two countries: the <B c="TIBM">Tibetan mastiff</B>, the <B c="SALU">saluki</B> and the <B c="CANE">cane corso</B>.
        </p>
      </>
    ),
    view: { ribbons: "none", cladeRing: true, start: true },
  },
  {
    id: "ribbon",
    kicker: "02 · The ribbons",
    title: "A ribbon marks a recent cross",
    body: (
      <>
        <p>
          Each generation, the <Term id="dna">DNA</Term> a puppy inherits is cut into smaller pieces, called <strong><Term id="haplotype">haplotypes</Term></strong>.
          When dogs from two breeds share long pieces, they had a common ancestor recently,
          usually because someone crossed the breeds.
        </p>
        <p>
          Breeds in the same family share plenty of DNA anyway, so the chart shows only pairs from
          <em> different</em> families, and only the top 5 percent of those: {links.length} ribbons. The{" "}
          <B c="EURA">Eurasier</B>, created in the 1970s from the <B c="CHOW">chow chow</B>, <B c="KEES">keeshond</B> and <B c="SAMO">Samoyed</B>, has three, one to each
          parent.
        </p>
      </>
    ),
    view: { ribbons: { codes: ["EURA"] }, focus: ["EURA", "CHOW", "KEES", "SAMO"] },
    photos: ["CHOW", "KEES", "SAMO"],
  },
  {
    id: "width",
    kicker: "03 · Ribbon width",
    title: "Thicker ribbon, more in common",
    body: (
      <>
        <p>
          Wider ribbons mean more shared <Term id="dna">DNA</Term>. The <B c="EURA">Eurasier</B> and <B c="CHOW">chow chow</B> share about 179 million DNA
          letters (179 Mb), the most of any pair; the <B c="BPIC">Berger Picard</B> and <B c="BOUV">Bouvier des Flandres</B> share 78 Mb. The
          thin ribbon between the Italian <B c="CANE">cane corso</B> and the <B c="STBD">Saint Bernard</B>, under 10 Mb, barely qualified.
        </p>
        <p>
          Compare ribbons with one another, not with block size: a breed with many ribbons must fit
          them all into one block.
        </p>
      </>
    ),
    view: {
      ribbons: { keys: ["CHOW|EURA", "BOUV|BPIC", "ITCC|STBD"] },
      focus: ["CHOW", "EURA", "BOUV", "BPIC", "ITCC", "STBD"],
    },
  },
  {
    id: "hubs",
    kicker: "04 · Super-connectors",
    title: "A handful of breeds hold the web together",
    body: (
      <>
        <p>
          About half the breeds have one ribbon or none. Six connect to more than eight breeds
          outside their family: the <strong><B c="MNTY">toy Manchester terrier</B></strong>, <strong><B c="PUG">pug</B></strong>, <strong><B c="COOK">Chinook</B></strong>, <strong><B c="AIRT">Airedale</B></strong>,{" "}
          <strong><B c="GSD">German shepherd</B></strong> and <strong><B c="BPIC">Berger Picard</B></strong>. Each ribbon takes the color of its busier end,
          so a fan of one color points back to a hub.
        </p>
        <p>
          A hub is usually either a recent blend, like the <B c="COOK">Chinook</B>, bred from sled dogs and shepherds in
          the 1910s, or a favorite ingredient. The <B c="GSD">German shepherd</B>, created in the late 1800s, is the
          second kind: its ribbons reach the <B c="BMAL">Belgian Malinois</B>, <B c="DOBP">Doberman</B>, <B c="LEON">Leonberger</B> and Italian <B c="CANE">cane corso</B>, among
          others.
        </p>
      </>
    ),
    view: { ribbons: { codes: hubs }, focus: hubs },
    photos: ["GSD", "BMAL", "AIRT", "PUG"],
  },
  {
    id: "pug",
    kicker: "05 · A well-traveled breed",
    title: "The pug gets around",
    body: (
      <>
        <p>
          On the tree, the <B c="PUG">pug</B> sits beside the <B c="BRUS">Brussels griffon</B>. Its ribbons tell a broader story, reaching
          Asian lapdogs like the <B c="PEKE">Pekingese</B>, <B c="SHIH">shih tzu</B> and <B c="LHSA">Lhasa apso</B>, and small breeds around the ring. The
          researchers think pugs left Asia early and were then used to build many small European
          breeds.
        </p>
      </>
    ),
    view: { ribbons: { codes: ["PUG"] }, focus: ["PUG"], cladeRing: true },
    photos: ["PUG", "PEKE", "SHIH", "BRUS"],
  },
  {
    id: "populations",
    kicker: "06 · Same breed, different story",
    title: "A tale of two cane corsos",
    body: (
      <>
        <p>
          The two <B c="CANE">cane corso</B> blocks diverge. Dogs sampled in <strong>Italy (ITCC)</strong> connect to the <B c="GSD">German shepherd</B>{" "}
          and <B c="COOK">Chinook</B>; dogs sampled in the <strong>United States (CANE)</strong> connect to the <B c="ROTT">Rottweiler</B>, a link
          the Italian dogs lack. The breed has been in the United States for only about 30 years,
          and American dogs have already mixed with local breeds.
        </p>
      </>
    ),
    view: { ribbons: { codes: ["CANE", "ITCC"] }, focus: ["CANE", "ITCC"] },
    photos: ["CANE", "ROTT"],
  },
  {
    id: "silent",
    kicker: "07 · The quiet ones",
    title: "No ribbons tells a story too",
    body: (
      <>
        <p>
          The {silentCount} highlighted blocks have no ribbons at all. They include most <Clade id="Mediterranean">Mediterranean</Clade> breeds
          (<B c="SALU">salukis</B>, <B c="AFGH">Afghan hounds</B>, <B c="GPYR">Great Pyrenees</B>), most <Clade id="ScentHound">scent hounds</Clade>, like the basset and <B c="BEAG">beagle</B>, and all
          three poodles.
        </p>
        <p>
          No ribbons means no recent mixing with other families. The researchers think the
          Mediterranean and <Clade id="AsianSpitz">Asian spitz</Clade> groups, which share the least, may be among the oldest dog
          families.
        </p>
      </>
    ),
    view: { ribbons: "all", silent: true },
    photos: ["SALU", "AFGH", "BASS"],
  },
  {
    id: "explore",
    kicker: "08 · Your turn",
    title: "Try it yourself",
    body: (
      <>
        <p>
          Here&rsquo;s the whole thing. Hover over, tap or tab to any block to see only its ribbons
          and a list of its connections; do the same on a ribbon to see how much <Term id="dna">DNA</Term> the two breeds
          share.
        </p>
      </>
    ),
    view: { ribbons: "all", cladeRing: true, interactive: true },
  },
];
