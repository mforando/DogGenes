import type { ReactNode } from "react";
import { data } from "./tree";
import type { TimelineView } from "@/components/Timeline";
import type { CircosView } from "@/components/Circos";
import { CIRCOS_STEPS } from "./circosSteps";
import { MODERN_BREEDS } from "./history";
import SelectionExplainer from "@/components/SelectionExplainer";
import MissingLinkFigure from "@/components/MissingLinkFigure";
import AncientBreeds from "@/components/AncientBreeds";
import DigSites from "@/components/DigSites";
import { B, Clade, Term } from "@/components/Hints";

/** Declarative description of what the cladogram should show for a scroll step. */
export type View = {
  /** Show the hypothetical common ancestor of wolves and dogs (the "missing links" step). */
  ancestor?: boolean;
  /** "ink" draws a monochrome tree; "clade" colors breeds by their clade. */
  color: "ink" | "clade";
  /** Breeds (codes) to emphasise; everything else recedes. */
  codes?: string[];
  /** Clades to emphasise. */
  clades?: string[];
  /** Emphasise the jackal + wolf outgroup. */
  outgroup?: boolean;
  /** Emphasise breeds whose dogs are split across more than one wedge. */
  split?: boolean;
  /** Trace pairs of breeds back to their most recent common ancestor. */
  paths?: [string, string][];
  /** Rotate (reverse the children of) the common ancestor of each code group. */
  flip?: string[][];
  /** Show bootstrap-support markers on internal nodes. */
  support?: boolean;
  /** Show the clade ring + names. */
  cladeRing?: boolean;
  /** Haplotype-sharing bundles: for specific breeds, or every cross-clade pair. */
  links?: { codes: string[] } | "cross";
  /** Zoom to these breeds' sector of the ring. */
  zoom?: { codes: string[]; k: number };
  /** Free exploration: click to select. */
  explore?: boolean;
};

export type Step = {
  id: string;
  kicker: string;
  title: string;
  body: ReactNode;
  view: View;
  /** Breeds to show as photos alongside the text (Dog CEO API). */
  photos?: string[];
  /** Show the continent globe in this step's card (picking a continent highlights its breeds). */
  continentGlobe?: boolean;
  /** Prologue steps show the deep-history timeline instead of the cladogram. */
  timeline?: TimelineView;
  /** "DNA web" steps show the chord (circos) diagram instead of the cladogram. */
  circos?: CircosView;
  /** Hold back the view's `flip` this many ms after the step opens, so the rotation plays out. */
  flipDelay?: number;
};

const dogs = data.stats.dogs.toLocaleString("en-US");

const T_ALL = ["farming", "breeds", "split", "lgm", "eastasia", "europe", "siberia", "goyet", "altai", "erralla", "bonn", "skull", "lineages"];

/** The history of dogs tab (facts from Wikipedia's "Domestication of the dog"). */
const DATED = MODERN_BREEDS.length;
const STUDY_BREEDS = 161;

export const HISTORY_STEPS: Step[] = [
  {
    id: "modern",
    kicker: "The last 200 years",
    title: "Most breeds are younger than you think",
    body: (
      <>
        <p>
          Most of today&rsquo;s breeds were invented in Victorian Britain. The first dog show was
          held in Newcastle in 1859; the Kennel Club followed in 1873 and the American Kennel Club
          in 1884. Breeders wrote standards, recorded pedigrees and closed each breed to outsiders.
        </p>
        <p>
          The timeline shows the study&rsquo;s breeds with a known founding date, from the <B c="JACK">Jack Russell terrier</B>{" "}
          (1819) to the <B c="AHRT">American hairless terrier</B> (1972).
        </p>
        <div className="hx-stats">
          <div>
            <span className="hx-num">{DATED}</span>
            <span>breeds with a known founding date</span>
          </div>
          <div>
            <span className="hx-num muted">{STUDY_BREEDS - DATED}</span>
            <span>
              have <strong>no recorded start</strong>; they grew out of older local dogs
            </span>
          </div>
        </div>
      </>
    ),
    view: { color: "ink" },
    timeline: { show: [], mode: "modern" },
  },
  {
    id: "first",
    kicker: "Before there were breeds",
    title: "Dogs came first",
    body: (
      <>
        <p>
          Pull back to the dawn of farming, about 11,400 years ago, and two centuries of breeds
          shrink to a sliver on the right. Dogs were the <strong>first animal people domesticated</strong>.
          They lived with humans before there were cattle, sheep or fields of wheat.
        </p>
        <p>
          A few breeds are much older than the Victorian era: types of dog that hunted, herded and
          kept people company for centuries before anyone wrote a standard. Those with an
          approximate age appear on the timeline; five have no agreed date.
        </p>
        <AncientBreeds />
      </>
    ),
    view: { color: "ink" },
    timeline: { show: ["farming", "breeds"], mode: "farming" },
  },
  {
    id: "wolves",
    kicker: "Origins",
    title: "Not from today’s wolves",
    body: (
      <>
        <p>
          Go back into the last Ice Age, and the story takes a turn: dogs did not descend from the{" "}
          <B c="WOLF">gray wolves</B> alive today. Their ancestor was an <strong>Ice Age wolf population that has
          since died out</strong>. The two lineages split between 40,000 and 27,000 years ago.
        </p>
        <p>
          About 25,000 years ago, at the coldest point of the Ice Age, wolf numbers crashed.
          Survivors spread out from Beringia, the land bridge between Siberia and Alaska, and
          replaced wolves elsewhere. Today&rsquo;s <B c="WOLF">gray wolf</B> is the dog&rsquo;s cousin, not its
          grandparent.
        </p>
        <p>
          Where domestication happened is still disputed. Studies have pointed to <strong>East
          Asia</strong>, <strong>Siberia</strong> and <strong>Europe</strong>. A 2022 analysis of 72 ancient wolf genomes found
          that all dogs carry ancestry from an eastern wolf population, and that dogs in West
          Asia, Africa and southern Europe carry extra ancestry from Middle Eastern wolves.
        </p>
      </>
    ),
    view: { color: "ink" },
    timeline: {
      show: ["farming", "breeds", "split", "lgm", "eastasia", "europe", "siberia"],
      focus: ["split", "lgm", "eastasia", "europe", "siberia"],
    },
  },
  {
    id: "fossils",
    kicker: "The evidence",
    title: "The oldest dogs we’ve dug up",
    body: (
      <>
        <p>
          The oldest bones that scientists agree came from a dog were found at <strong>Erralla,
          Spain</strong>, and are about 17,500 years old. At <strong>Bonn-Oberkassel</strong> in Germany, a puppy was
          buried with two people about 14,200 years ago, the oldest known grave shared by people
          and a dog. The puppy had survived distemper, which suggests someone nursed it.
        </p>
        <DigSites />
        <p>
          Older dog-like skulls from Goyet, Belgium (36,000 years) and Siberia&rsquo;s Altai
          Mountains (33,300 years) remain disputed; <Term id="dna">DNA</Term> suggests the Goyet animal belonged to an
          extinct wolf population. Skulls with an unmistakably dog-like shape appear about 11,000
          years ago.
        </p>
      </>
    ),
    view: { color: "ink" },
    timeline: {
      show: ["farming", "breeds", "split", "lgm", "eastasia", "europe", "siberia", "goyet", "altai", "erralla", "bonn", "skull"],
      focus: ["goyet", "altai", "erralla", "bonn", "skull"],
    },
  },
  {
    id: "how",
    kicker: "The how",
    title: "How a wolf becomes a dog",
    body: (
      <>
        <p>
          Scientists have several explanations, and more than one may be right. Bolder, calmer
          wolves may have scavenged around human camps. Wolves and people may have teamed up while
          following the same reindeer herds. Or, in hard winters, people may have shared surplus
          lean meat with wolves.
        </p>
        <p>
          The <Term id="dna">DNA</Term> shows what changed most: <strong>behavior</strong>. Domestication reshaped genes involved in
          brain development, the adrenaline stress response and the digestion of fat and starch.
          Variants near the genes behind Williams-Beuren syndrome, a human condition marked by
          unusual friendliness, are linked to dogs&rsquo; sociability. When dogs and their owners
          gaze at each other, oxytocin rises in both.
        </p>
      </>
    ),
    view: { color: "ink" },
    timeline: { show: T_ALL.filter((t) => t !== "lineages") },
  },
  {
    id: "lineages",
    kicker: "Ready for the breeds",
    title: "Five family lines by the end of the Ice Age",
    body: (
      <>
        <p>
          By the end of the Ice Age, 11,700 years ago, dogs had divided into at least <strong>five
          lineages</strong>. They are known from ancient remains in the Levant (the eastern <Clade id="Mediterranean">Mediterranean</Clade>),
          northwest Russia, Siberia&rsquo;s Lake Baikal region and the early Americas, and from the
          New Guinea singing dog, which survives today. Dogs most likely reached the Americas with
          the first people.
        </p>
        <p>
          Modern breeds were carved from that regional stock, mostly in the last two centuries,
          and by a different process. For most of their history, dogs changed the way wild
          animals do. Breeds were made by <strong>people choosing which dogs had puppies</strong>, selecting for a
          few traits and then closing the studbooks. That leaves a distinct mark in their <Term id="dna">DNA</Term>. The
          simulation below shows the difference.
        </p>
        <SelectionExplainer />
      </>
    ),
    view: { color: "ink" },
    timeline: { show: T_ALL, focus: ["lineages", "breeds"] },
  },
];

/** Part 1: reading the family tree. */
const BREED_STEPS: Step[] = [
  {
    id: "ring",
    photos: ["BSJI"],
    kicker: "The big picture",
    title: "Read it from the center out",
    body: (
      <>
        <p>
          Each sliver on the rim is a group of dogs whose <Term id="dna">DNA</Term> was tested, {dogs} in all. Lines
          connect them by genetic similarity: the more alike two dogs&rsquo; DNA, the closer they
          sit. The chart is a <strong><Term id="cladogram">cladogram</Term></strong>, a family tree that shows the order in which groups
          split apart, but not when. Line lengths carry no meaning.
        </p>
        <p>
          The center is the oldest split, anchored by the <B c="GDJK">golden jackal</B>, a wild relative. Next
          come <B c="WOLF">gray wolves</B>, dogs&rsquo; closest living relatives, then the <B c="BSJI">basenji</B>, an ancient
          African breed. The farther a branch sits from the center, the more recent the split.
        </p>
      </>
    ),
    view: { color: "ink", outgroup: true, codes: ["BSJI"] },
  },
  {
    id: "wedge",
    photos: ["BOX"],
    kicker: "The edge",
    title: "Each wedge is a breed",
    body: (
      <>
        <p>
          The 10 <B c="BOX">boxers</B> in the study have <Term id="dna">DNA</Term> so similar that they always cluster, so they are
          drawn as one wedge; each dot is a dog. Nearly every breed behaves the same way: 146 of
          161 form their own tidy wedge. Breeds, in other words, are genetic islands.
        </p>
      </>
    ),
    view: { color: "ink", codes: ["BOX"], zoom: { codes: ["BOX"], k: 3 } },
  },
  {
    id: "forks",
    photos: ["GOLD", "FCR", "LAB", "NEWF"],
    kicker: "Who’s related to whom",
    title: "Follow the lines to where they meet",
    body: (
      <>
        <p>
          To see how closely two breeds are related, trace each one inward until their lines meet.
          That junction is their most recent shared ancestor; the sooner the lines meet, the
          closer the relationship.
        </p>
        <p>
          The <B c="GOLD">golden retriever</B>&rsquo;s nearest relative here is the <B c="FCR">flat-coated retriever</B>, followed by the{" "}
          <B c="LAB">Labrador</B> and, further back, the <B c="NEWF">Newfoundland</B>.
        </p>
      </>
    ),
    view: {
      color: "ink",
      codes: ["GOLD", "FCR", "LAB", "NEWF"],
      paths: [["GOLD", "FCR"], ["GOLD", "LAB"], ["GOLD", "NEWF"]],
      zoom: { codes: ["GOLD", "FCR", "LAB", "NEWF"], k: 2.8 },
    },
  },
  {
    id: "neighbors",
    photos: ["DACH", "AFGH"],
    kicker: "Watch out",
    title: "Neighbors aren’t necessarily family",
    body: (
      <>
        <p>
          The <B c="DACH">dachshund</B> and the <B c="AFGH">Afghan hound</B> sit side by side on the rim, and both are called hounds. But
          their lines don&rsquo;t meet until deep in the tree.
        </p>
        <p>
          Think of the tree as a hanging mobile: any branch can spin on its hook without changing
          who is related to whom. Spin this one and the two breeds land on opposite sides of the
          circle, with exactly the same path to their common ancestor. The order around the rim is
          a drawing choice. Only the branching counts.
        </p>
      </>
    ),
    view: {
      color: "ink",
      codes: ["DACH", "AFGH"],
      paths: [["DACH", "AFGH"]],
      flip: [["DACH", "AFGH"]],
    },
    flipDelay: 1600,
  },
  {
    id: "support",
    kicker: "How sure are they?",
    title: "Little markers rate the confidence",
    body: (
      <>
        <p>
          The researchers rebuilt the tree 100 times from resampled data, a test called <strong><Term id="bootstrap">bootstrapping</Term></strong>.
          Each marker shows how often a fork came out the same way:
        </p>
        <ul className="legend-list" aria-label="Bootstrap marker legend">
          <li><span className="mk mk-gold" aria-hidden /> 90–100 times out of 100: rock solid</li>
          <li><span className="mk mk-star" aria-hidden /> 70–89 times: fairly sure</li>
          <li><span className="mk mk-hollow" aria-hidden /> 50–69 times: a reasonable guess</li>
        </ul>
        <p>
          Unmarked forks appeared less than half the time. Most sit near the center, so the oldest
          splits are the least certain.
        </p>
      </>
    ),
    view: { color: "ink", support: true },
  },
  {
    id: "clades",
    photos: ["SALU", "GPYR", "GREY", "COLL"],
    kicker: "Family groups",
    title: "Breeds fall into 23 families",
    body: (
      <>
        <p>
          Pull back, and breeds group into larger branches called <strong><Term id="clade">clades</Term></strong>: a shared ancestor
          and all of its descendants. Almost every breed, 150 in all, falls into one of 23 clades of
          two to 18 breeds. The gray wedges are loners that fit no group.
        </p>
        <p>
          Most groupings are intuitive: terriers with terriers, retrievers with retrievers. Some
          are not. The <strong><Clade id="Mediterranean">Mediterranean</Clade></strong> clade pairs sighthounds like the <B c="SALU">saluki</B> with livestock guardians
          like the <B c="GPYR">Great Pyrenees</B>; the <strong><Clade id="UKRural">UK Rural</Clade></strong> clade pairs <B c="GREY">greyhounds</B> with <B c="COLL">collies</B>. The likely
          explanation is that each region bred its hunting dogs and its farm dogs from the same
          local stock. Origin mattered more than job.
        </p>
      </>
    ),
    view: { color: "clade", clades: ["Mediterranean", "UKRural"], cladeRing: true },
  },
  {
    id: "geography",
    photos: ["KELP", "BORD"],
    kicker: "A surprise",
    title: "Why so many breeds are European",
    body: (
      <>
        <p>
          About <strong>70 percent</strong> of the populations on the globe (115 of 164) are European. That
          reflects history more than biology. The idea of a breed, with a written standard and a
          closed studbook, began in Victorian Britain and spread through kennel clubs in Europe and
          North America, and the study drew mostly on breeds those clubs recognize. Most of the
          world&rsquo;s dogs are village dogs that belong to no breed.
        </p>
        <p>
          Shared <Term id="dna">DNA</Term> follows the map, too: about <strong>three-quarters</strong> of it links breeds from the same
          continent. Asian breeds keep largely to themselves. Breeds from the Americas, Australia
          and Africa trace back mostly to European dogs brought by settlers; the Australian <B c="KELP">kelpie</B>&rsquo;s
          closest relative is the <B c="BORD">border collie</B>. Select a continent to see its breeds.
        </p>
      </>
    ),
    continentGlobe: true,
    view: { color: "clade", cladeRing: true },
  },
  {
    id: "split",
    photos: ["XOLO", "GSD"],
    kicker: "Rule breakers",
    title: "Breeds that won’t sit together",
    body: (
      <>
        <p>
          A few breeds are scattered across more than one wedge. Some are new breeds still taking
          shape. Others split by origin: <B c="CANE">cane corsos</B> from Italy cluster together, while American ones sit
          beside <B c="NEAP">Neapolitan mastiffs</B>.
        </p>
        <p>
          The <B c="XOLO">Xoloitzcuintli</B> (Mexican hairless dog) and the <B c="INCA">Peruvian hairless dog</B> are spread across distant
          branches, some beside the <B c="GSD">German shepherd</B>, a sign of past mixing with European herding dogs.
        </p>
      </>
    ),
    view: { color: "clade", split: true },
  },
  {
    id: "missing-links",
    kicker: "Gaps in the record",
    title: "The missing link",
    body: (
      <>
        <p>
          Every fork in the tree is an ancestor no one has seen. The researchers had <Term id="dna">DNA</Term> only from
          living dogs and inferred each fork from its descendants. In human evolution, such
          ancestors are called <strong>missing links</strong>.
        </p>
        <figure className="ml-fig">
          <MissingLinkFigure />
          <figcaption>
            Humans did not evolve from gorillas; both descend from an ape that lived 8 million to
            10 million years ago, and no fossil of it has been found. Figures are simplified icons.
            Silhouettes: The Nature Box,{" "}
            <a href="https://commons.wikimedia.org/wiki/File:Comparison_of_size_of_western_gorilla_(Gorilla_gorilla)_and_human.svg">CC BY-SA 4.0</a>,
            rearranged.
          </figcaption>
        </figure>
        <p>
          Dogs have one, too: the extinct Ice Age wolf population they came from. If its DNA were
          found, it would join the tree at the fork where dogs part from wolves. Watch the chart:
          the breeds shift to make room, but none changes place.
        </p>
      </>
    ),
    view: { color: "ink", codes: ["WOLF", "BSJI"], ancestor: true },
  },
];

/** Part 3: the same connections drawn as bundled edges along the family tree. */
const BUNDLE_STEPS: Step[] = [
  {
    id: "bundle",
    kicker: "The hidden web",
    title: "The web, routed through the tree",
    body: (
      <>
        <p>
          Here is the same data, drawn another way. In <strong>edge bundling</strong>, each connection leaves one
          breed, follows the tree&rsquo;s branches in toward the two breeds&rsquo; shared ancestor,
          then travels out to the other. Connections that share branches merge into thick
          bundles; a lone thin curve is a one-off cross.
        </p>
        <p>
          The picture combines the ancient family tree with two centuries of crossbreeding: 117
          breeds show recent mixing with other families. It also shows why a tree can mislead. The{" "}
          <B c="EURA">Eurasier</B> lands in a wedge of its own between its three parent breeds, because a tree can only
          split, not merge.
        </p>
      </>
    ),
    view: { color: "clade", links: "cross" },
  },
];

/** Part 2: the chord diagram (the paper's Figure 4) explains shared DNA. */
const strip = (k: string) => k.replace(/^\d+ · /, "");
const CHORD_STEPS: Step[] = CIRCOS_STEPS.filter((c) => c.id !== "explore").map((c) => ({
  id: `c-${c.id}`,
  kicker: `The DNA web · ${strip(c.kicker)}`,
  title: c.title,
  photos: c.photos,
  body: c.body,
  // Behind the chord diagram, keep the tree in its clade colours for the hand-off back.
  view: { color: "clade", cladeRing: true },
  circos: c.view,
}));

export const STEPS: Step[] = [...BREED_STEPS, ...CHORD_STEPS, ...BUNDLE_STEPS];

/**
 * Step ids retired when steps were merged, and the step that now holds their text, so old
 * links (/tree/#rotate, /#where, ...) still land in the right place.
 */
export const STEP_ALIASES: Record<string, string> = {
  where: "wolves",
  root: "ring",
  rotate: "neighbors",
  "c-order": "c-blocks",
  "c-threshold": "c-ribbon",
  "c-color": "c-hubs",
  crossings: "bundle",
};
