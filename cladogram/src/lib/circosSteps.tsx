import type { ReactNode } from "react";
import type { CircosView } from "@/components/Circos";
import { links, nodes } from "./circos";

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
    title: "Every block is a breed",
    body: (
      <>
        <p>
          The circle is cut into {nodes.length} blocks, one per breed. Each has a short code:{" "}
          <strong>BOX</strong> is the boxer, <strong>GSD</strong> the German shepherd. Hover
          over any block to see its full name.
        </p>
        <p>
          Every breed gets the same size slice, no matter how many dogs were tested. A few
          breeds show up twice because dogs were collected in two countries: the Tibetan
          mastiff, saluki, and cane corso.
        </p>
      </>
    ),
    view: { ribbons: "none" },
  },
  {
    id: "order",
    kicker: "02 · The order",
    title: "Same order as the family tree",
    body: (
      <>
        <p>
          Start at the <strong>wolf</strong>, at three o&rsquo;clock, and go
          counter-clockwise. The breeds come in the same order as the edge of the family
          tree, with the same colors for each family group (clade).
        </p>
        <p>
          So the ring is the family tree, flattened. Blocks next to each other are close
          relatives. Everything drawn <em>inside</em> the ring is new information the tree
          couldn&rsquo;t show.
        </p>
      </>
    ),
    view: { ribbons: "none", cladeRing: true, start: true },
  },
  {
    id: "ribbon",
    kicker: "03 · The ribbons",
    title: "A ribbon means shared DNA",
    body: (
      <>
        <p>
          Every generation, the DNA a puppy inherits gets chopped into smaller chunks
          (<strong>haplotypes</strong>). So if dogs from two breeds share a <em>big</em>{" "}
          chunk, they had a common ancestor not long ago. That usually means someone crossed
          the breeds.
        </p>
        <p>
          The <strong>Eurasier</strong> was made in the 1970s from the chow chow, keeshond,
          and samoyed. Sure enough, its three ribbons go straight to those three breeds.
        </p>
      </>
    ),
    view: { ribbons: { codes: ["EURA"] }, focus: ["EURA", "CHOW", "KEES", "SAMO"] },
    photos: ["CHOW", "KEES", "SAMO"],
  },
  {
    id: "width",
    kicker: "04 · Ribbon width",
    title: "Thicker ribbon, more in common",
    body: (
      <>
        <p>
          Wider ribbons mean more shared DNA. The Eurasier and chow chow share about 179
          million DNA letters (179 Mb), the most of any pair. The Berger Picard and Bouvier
          des Flandres share 78 Mb. The skinny ribbon between the Italian cane corso and
          Saint Bernard, at under 10 Mb, only just made the cut.
        </p>
        <p>
          One catch: in the full picture, a breed with lots of ribbons has to squeeze them
          into one block. Compare ribbons to each other, not to the block size.
        </p>
      </>
    ),
    view: {
      ribbons: { keys: ["CHOW|EURA", "BOUV|BPIC", "ITCC|STBD"] },
      focus: ["CHOW", "EURA", "BOUV", "BPIC", "ITCC", "STBD"],
    },
  },
  {
    id: "threshold",
    kicker: "05 · What gets a ribbon",
    title: "Only the surprises",
    body: (
      <>
        <p>
          Breeds in the same family group share plenty of DNA anyway, so those pairs are
          skipped. A ribbon only appears when two breeds from <em>different</em> families
          share more than 95% of other such pairs. That leaves {links.length} ribbons.
        </p>
        <p>
          What&rsquo;s left is the interesting stuff: breeders crossing in a new trait, or
          dogs moving to a new country and mixing with the locals.
        </p>
      </>
    ),
    view: { ribbons: "all" },
  },
  {
    id: "color",
    kicker: "06 · Ribbon color",
    title: "Follow the color to the hub",
    body: (
      <>
        <p>
          Each ribbon takes the color of its busier end, the breed with more connections. A
          fan of same-colored ribbons spreading across the ring points back to one popular
          breed.
        </p>
        <p>
          The <strong>German shepherd</strong> is a great example. Its ribbons reach the
          Belgian malinois, Doberman, Leonberger, Italian cane corso, and more. The breed was
          created in the late 1800s and has been a popular ingredient in other breeds ever
          since.
        </p>
      </>
    ),
    view: { ribbons: { codes: ["GSD"] }, focus: ["GSD"], cladeRing: true },
    photos: ["GSD", "BMAL", "DOBP", "LEON"],
  },
  {
    id: "pug",
    kicker: "07 · A well-traveled breed",
    title: "The pug gets around",
    body: (
      <>
        <p>
          On the family tree, the pug sits with the Brussels griffon. But its ribbons tell a
          bigger story. They reach Asian lapdogs like the Pekingese, shih tzu, and Lhasa apso,
          plus small breeds all over the ring.
        </p>
        <p>
          The researchers think pugs were shipped out of Asia early and then used to help
          create lots of small European breeds.
        </p>
      </>
    ),
    view: { ribbons: { codes: ["PUG"] }, focus: ["PUG"], cladeRing: true },
    photos: ["PUG", "PEKE", "SHIH", "BRUS"],
  },
  {
    id: "hubs",
    kicker: "08 · Super-connectors",
    title: "Six breeds tie it all together",
    body: (
      <>
        <p>
          About half the breeds have one ribbon or none. Just six connect to more than eight
          breeds outside their family: the <strong>toy Manchester terrier</strong>,{" "}
          <strong>pug</strong>, <strong>chinook</strong>, <strong>Airedale</strong>,{" "}
          <strong>German shepherd</strong>, and <strong>Berger Picard</strong>.
        </p>
        <p>
          That many ribbons usually means one of two things. The breed was recently built
          from lots of others, like the chinook, made from sled dogs and shepherds in the
          1910s. Or it was itself a favorite ingredient for breeders.
        </p>
      </>
    ),
    view: { ribbons: { codes: hubs }, focus: hubs },
    photos: ["AIRT", "PUG", "GSD"],
  },
  {
    id: "populations",
    kicker: "09 · Same breed, different story",
    title: "A tale of two cane corsos",
    body: (
      <>
        <p>
          Compare the two cane corso blocks. Dogs from <strong>Italy (ITCC)</strong> connect
          to the German shepherd and chinook. Dogs from the{" "}
          <strong>United States (CANE)</strong> connect to the <strong>Rottweiler</strong>,
          and the Italian dogs don&rsquo;t.
        </p>
        <p>
          The breed has only been in the US for about 30 years, and the American dogs have
          already picked up some local mixing.
        </p>
      </>
    ),
    view: { ribbons: { codes: ["CANE", "ITCC"] }, focus: ["CANE", "ITCC"] },
    photos: ["CANE", "ROTT"],
  },
  {
    id: "silent",
    kicker: "10 · The quiet ones",
    title: "No ribbons tells a story too",
    body: (
      <>
        <p>
          The {silentCount} highlighted blocks have no ribbons at all. They include most of the
          Mediterranean breeds (salukis, Afghan hounds, Great Pyrenees), most scent hounds
          like the basset and beagle, and the standard, miniature, and toy poodles.
        </p>
        <p>
          No ribbons means no recent mixing with other families. The researchers think the
          Mediterranean and Asian spitz groups, which share the least, may be among the
          oldest dog families of all.
        </p>
      </>
    ),
    view: { ribbons: "all", silent: true },
    photos: ["SALU", "AFGH", "BASS"],
  },
  {
    id: "explore",
    kicker: "11 · Your turn",
    title: "Try it yourself",
    body: (
      <>
        <p>
          Here&rsquo;s the whole thing. Hover over (or tab to) any block to see only its
          ribbons and a list of its connections. Hover over a ribbon to see how much DNA the
          two breeds share.
        </p>
        <p>
          Three questions to ask about any breed: Does it have ribbons? Do they go next door
          or across the ring? Is it the hub, or one of the spokes?
        </p>
      </>
    ),
    view: { ribbons: "all", cladeRing: true, interactive: true },
  },
];
