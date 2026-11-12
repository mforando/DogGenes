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
          Start close to home. In the 1800s, dog breeding became a hobby and a business.
          The first dog show was held in Newcastle, England in 1859, the Kennel Club followed
          in 1873, and the American Kennel Club in 1884. Breeders wrote standards, kept
          pedigrees, and closed each breed&rsquo;s family book. The study behind this site calls
          it the Victorian-era breed explosion.
        </p>
        <p>
          The timeline shows breeds from the study with a known founding date, from the <B c="JACK">Jack
          Russell terrier</B> (1819) to the <B c="AHRT">American hairless terrier</B> (1972). Hover over a photo to
          read its story.
        </p>
        <div className="hx-stats">
          <div>
            <span className="hx-num">{DATED}</span>
            <span>breeds with a known or approximate founding date</span>
          </div>
          <div>
            <span className="hx-num muted">{STUDY_BREEDS - DATED}</span>
            <span>
              of the study&rsquo;s {STUDY_BREEDS} breeds have <strong>no recorded starting point</strong>.
              They grew slowly out of older local dogs, long before anyone kept records.
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
          Now zoom out about 60 times, back to the start of farming 11,400 years ago. Those
          two centuries of breeds shrink to a sliver at the far right. Dogs were the{" "}
          <strong>first animal people ever domesticated</strong>, long before cows, sheep or
          wheat, and they were already living alongside people when farming began.
        </p>
        <p>
          Most breeds are a recent invention, but a handful are far older, though: types of dog that hunted,
          herded and kept people company for centuries before anyone wrote a breed standard. The ones with a
          rough age sit on the timeline; five more have no agreed date at all.
        </p>
        <AncientBreeds />
      </>
    ),
    view: { color: "ink" },
    timeline: { show: ["farming", "breeds"], mode: "farming" },
  },
  {
    id: "wolves",
    kicker: "Wolf ancestors",
    title: "Not from today’s wolves",
    body: (
      <>
        <p>
          Zoom out again, past the farming era and into the last Ice Age. Here&rsquo;s the
          twist: dogs don&rsquo;t come from the <B c="WOLF">grey wolves</B> alive today.
          They come from an <strong>Ice Age wolf population that has since died out</strong>.
          The dog and wolf families split somewhere between 40,000 and 27,000 years ago.
        </p>
        <p>
          About 25,000 years ago, at the coldest point of the Ice Age, wolves crashed to a
          few survivors. They later spread back out from Beringia, the old land bridge
          between Siberia and Alaska, replacing the other wolves. So the <B c="WOLF">grey wolf</B> in our
          family tree is a cousin, not a grandparent.
        </p>
        <blockquote>
          &ldquo;We&rsquo;re very surprised that they&rsquo;re not.&rdquo;
          <cite>Biologist Robert K. Wayne, on dogs not coming from today&rsquo;s wolves</cite>
        </blockquote>
      </>
    ),
    view: { color: "ink" },
    timeline: { show: ["farming", "breeds", "split", "lgm"], focus: ["split", "lgm"] },
  },
  {
    id: "where",
    kicker: "The birthplace",
    title: "Where? Nobody’s sure",
    body: (
      <>
        <p>
          Scientists still argue about where it happened. Different <Term id="dna">DNA</Term> studies point to{" "}
          <strong>East Asia</strong>, <strong>Siberia</strong>, or <strong>Europe</strong>.
        </p>
        <p>
          One recent study read the DNA of 72 ancient wolves. It found that dogs everywhere
          carry ancestry from an eastern wolf population. Dogs in West Asia, Africa, and
          southern Europe also carry extra ancestry from Middle Eastern wolves. There is
          still &ldquo;no firm consensus&rdquo; on when, where, or how many wolf groups were
          involved.
        </p>
      </>
    ),
    view: { color: "ink" },
    timeline: {
      show: ["farming", "breeds", "split", "lgm", "eastasia", "europe", "siberia"],
      focus: ["eastasia", "europe", "siberia"],
    },
  },
  {
    id: "fossils",
    kicker: "The evidence",
    title: "The oldest dogs we’ve dug up",
    body: (
      <>
        <p>
          The oldest bones everyone agrees are a dog come from <strong>Erralla, Spain</strong>,
          about 17,500 years ago. At <strong>Bonn-Oberkassel</strong> in Germany, a puppy was
          buried alongside two people about 14,200 years ago, the oldest known shared grave of
          people and a dog. Pick a site to see what was found.
        </p>
        <DigSites />
        <p>
          Older finds from Goyet in Belgium (36,000 years) and Siberia&rsquo;s Altai
          Mountains (33,300 years) have dog-like skulls, but they&rsquo;re hotly debated. <Term id="dna">DNA</Term>{" "}
          puts the Goyet animal on a side branch, most likely an extinct population of wolves
          rather than an ancestor of today&rsquo;s dogs. Skulls with a clearly dog-shaped
          profile turn up around 11,000 years ago.
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
          There are a few ideas, and they may all be partly right. Calmer, less skittish
          wolves could have scavenged around human camps. Wolves following reindeer herds
          may have teamed up with people doing the same. Or in harsh Ice Age winters,
          people had more lean meat than they could eat, and shared it.
        </p>
        <p>
          Either way, the <Term id="dna">DNA</Term> shows what changed most: <strong>behavior</strong>. Genes for
          brain function, stress hormones like adrenaline, and digesting fat and starch were
          all reshaped. Changes near the genes linked to Williams-Beuren syndrome, which
          makes people unusually friendly, are tied to dogs&rsquo; sociability. Even today,
          when a dog and its owner look into each other&rsquo;s eyes, both get a boost of
          oxytocin, the bonding hormone.
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
          By the time the Ice Age ended, 11,700 years ago, dogs had already split into at
          least <strong>five lineages</strong>. We know them from ancient dogs found in the
          Levant (the eastern <Clade id="Mediterranean">Mediterranean</Clade>), Karelia (northwest Russia), Lake Baikal
          (Siberia), and the ancient Americas, plus the New Guinea singing dog, which is
          still alive today. Dogs likely reached the Americas with the very first people.
        </p>
        <p>
          Today&rsquo;s breeds are far younger. Most were shaped in the last couple of
          centuries out of that much older regional stock.
        </p>
        <p>
          And they were shaped differently. For tens of thousands of years, dogs changed the
          way wild animals do: the world around them decided which pups survived. Breeds were
          made by <strong>people choosing which dogs had puppies</strong>, aiming at a few
          traits and then closing the studbooks. That leaves a very different mark on their{" "}
          <Term id="dna">DNA</Term>, and it means geneticists can&rsquo;t read breeds the way they read the
          evolution of species. Watch the difference play out:
        </p>
        <SelectionExplainer />
      </>
    ),
    view: { color: "ink" },
    timeline: { show: T_ALL, focus: ["lineages", "breeds"] },
  },
];

const BREED_STEPS: Step[] = [
  {
    id: "ring",
    kicker: "The big picture",
    title: `${dogs} dogs in one circle`,
    body: (
      <>
        <p>
          Every sliver around the edge is a group of real dogs whose <Term id="dna">DNA</Term> was tested. The
          lines inside connect dogs by how similar their DNA is. The more two dogs have in
          common, the closer together they sit.
        </p>
        <p>
          It&rsquo;s a <strong><Term id="cladogram">cladogram</Term></strong>: a family tree that shows who split off
          from whom. It doesn&rsquo;t show dates, so don&rsquo;t read anything into how long
          the lines are.
        </p>
      </>
    ),
    view: { color: "ink" },
  },
  {
    id: "root",
    photos: ["BSJI"],
    kicker: "Where to start",
    title: "Start in the middle",
    body: (
      <>
        <p>
          The very center is the <strong>root</strong>, the oldest split in the whole tree.
          To anchor it, the researchers included the <strong><B c="GDJK">golden jackal</B></strong>, a wild
          cousin of dogs. Because we know it branched off long ago, it tells us which end of
          the tree is the old end.
        </p>
        <p>
          Next come <strong><B c="WOLF">grey wolves</B></strong>, dogs&rsquo; closest living relatives
          (cousins, not ancestors: dogs come from an Ice Age wolf population that has since died out), then the <strong><B c="BSJI">basenji</B></strong>, an ancient
          African breed. Every other breed is further out. The rule of thumb: the
          closer to the edge, the more recent the split.
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
          Meet the <strong><B c="BOX">boxers</B></strong>. All ten boxers in the study have such similar <Term id="dna">DNA</Term>{" "}
          that they always clump together, so they&rsquo;re drawn as one wedge. Each little
          dot is one dog. Wider wedges mean more dogs were tested.
        </p>
        <p>
          That&rsquo;s true for almost every breed: 146 of 161 form their own tidy wedge.
          Breeds really are distinct genetic groups, like little islands.
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
          Want to know how closely two breeds are related? Trace each one inward until their
          lines join. That join is their shared ancestor. The sooner the lines meet, the
          closer the relatives.
        </p>
        <p>
          The <strong><B c="GOLD">golden retriever</B></strong>&rsquo;s closest relative here is the{" "}
          <strong><B c="FCR">flat-coated retriever</B></strong>. Next comes the <strong><B c="LAB">Labrador</B></strong>,
          and a bit further back the <strong><B c="NEWF">Newfoundland</B></strong>.
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
    title: "Next-door neighbors can be strangers",
    body: (
      <>
        <p>
          The <strong><B c="DACH">dachshund</B></strong> and the <strong><B c="AFGH">Afghan hound</B></strong> sit side by
          side on the edge, and both are called &ldquo;hounds.&rdquo; Easy to assume
          they&rsquo;re close family, right?
        </p>
        <p>
          Nope. Trace them inward and their lines don&rsquo;t meet until deep in the tree.
          Sitting next to each other on the edge means nothing. Only where the lines join
          counts.
        </p>
      </>
    ),
    view: { color: "ink", codes: ["DACH", "AFGH"], paths: [["DACH", "AFGH"]] },
  },
  {
    id: "rotate",
    kicker: "Why that happens",
    title: "Every fork can spin",
    body: (
      <>
        <p>
          Think of the tree as a hanging mobile. You can spin any branch around its hook and
          nothing about who&rsquo;s related to whom changes. Watch: we just spun the fork
          joining the <B c="DACH">dachshund</B> and <B c="AFGH">Afghan hound</B>.
        </p>
        <p>
          Now they&rsquo;re on opposite sides of the circle, but their path to the shared
          ancestor is exactly the same. The order around the edge is a drawing choice.
          The branching is the real information.
        </p>
      </>
    ),
    view: {
      color: "ink",
      codes: ["DACH", "AFGH"],
      paths: [["DACH", "AFGH"]],
      flip: [["DACH", "AFGH"]],
    },
  },
  {
    id: "support",
    kicker: "How sure are they?",
    title: "Little markers rate the confidence",
    body: (
      <>
        <p>
          The researchers double-checked their tree by <strong><Term id="bootstrap">bootstrapping</Term></strong>: they
          reshuffled the data and rebuilt the tree 100 times. Each marker shows how often a
          fork came out the same way:
        </p>
        <ul className="legend-list" aria-label="Bootstrap marker legend">
          <li><span className="mk mk-gold" aria-hidden /> 90–100 times out of 100: rock solid</li>
          <li><span className="mk mk-star" aria-hidden /> 70–89 times: pretty sure</li>
          <li><span className="mk mk-hollow" aria-hidden /> 50–69 times: a decent hunch</li>
        </ul>
        <p>
          No marker means it showed up less than half the time. Most of those are deep near
          the center, so take the oldest splits with a grain of salt.
        </p>
      </>
    ),
    view: { color: "ink", support: true },
  },
  {
    id: "clades",
    kicker: "Family groups",
    title: "23 big family groups",
    body: (
      <>
        <p>
          Zoom out and the breeds clump into bigger branches called <strong><Term id="clade">clades</Term></strong>:
          a shared ancestor plus all its descendants. Almost every breed (150 of them) falls
          into one of 23 clades, each holding 2 to 18 breeds.
        </p>
        <p>
          Most make intuitive sense: terriers with terriers, retrievers with retrievers.
          The gray wedges are loners that didn&rsquo;t reliably fit into any group.
        </p>
      </>
    ),
    view: { color: "clade", cladeRing: true },
  },
  {
    id: "geography",
    photos: ["SALU", "GPYR", "GREY", "BORD"],
    kicker: "A surprise",
    title: "Where they’re from beats what they do",
    body: (
      <>
        <p>
          Some families look like odd couples. The <strong><Clade id="Mediterranean">Mediterranean</Clade></strong> group puts
          speedy, skinny sighthounds like the <B c="SALU">saluki</B> next to giant sheep guards like the{" "}
          <B c="GPYR">Great Pyrenees</B>. The <strong><Clade id="UKRural">UK Rural</Clade></strong> group pairs <B c="GREY">greyhounds</B> with <B c="COLL">collies</B>.
        </p>
        <p>
          The likely story: each region bred its own hunting dogs and its own farm dogs from
          the same local stock. Home turf mattered more than the job.
        </p>
        <p>
          Why does Europe dominate? About <strong>70%</strong> of the breeds on the globe below
          (115 of 164) are European, and that says more about history than about dogs. The idea
          of a breed, with a written standard and a closed studbook, was invented in Victorian
          Britain: the first dog show was held in 1859 and the Kennel Club was founded in 1873,
          and kennel clubs across Europe and North America followed. Owners there turned their
          local working dogs into named breeds, so Europe&rsquo;s regional dogs were recorded and
          kept apart. Elsewhere, most dogs were, and still are, free-roaming village dogs that
          belong to no breed at all. The study also drew mostly on breeds recognized by
          European and North American kennel clubs, so it reflects which dogs were registered,
          not where dogs live.
        </p>
        <p>
          Shared <Term id="dna">DNA</Term> follows the map too. About <strong>three-quarters</strong> of all the DNA
          that breeds share in the study links breeds from the same continent. Partly
          that&rsquo;s because most breeds are European, but Asia&rsquo;s keep to themselves as
          well: more than half of their sharing is with other Asian breeds, like the <B c="SHIH">Shih Tzu</B>,{" "}
          <B c="LHSA">Lhasa Apso</B> and <B c="PEKE">Pekingese</B>. Breeds from the rest of the world mostly point back to
          Europe, because many were built from dogs that settlers brought with them. Only about
          a fifth of North America&rsquo;s sharing stays on the continent, and less for
          Australia and Africa: the Australian <B c="KELP">kelpie</B>&rsquo;s closest relative is the <B c="BORD">border
          collie</B>, and South Africa&rsquo;s <B c="BOER">boerboel</B>&rsquo;s is the <B c="BULM">bullmastiff</B>. Pick a continent
          to light up its breeds.
        </p>
      </>
    ),
    continentGlobe: true,
    view: { color: "clade", clades: ["Mediterranean", "UKRural"], cladeRing: true },
  },
  {
    id: "split",
    photos: ["XOLO", "GSD"],
    kicker: "Rule breakers",
    title: "Breeds that won’t sit together",
    body: (
      <>
        <p>
          A few breeds are scattered across more than one wedge. Some are newer breeds still
          settling down. Others depend on where the dogs came from: <B c="CANE">cane corsos</B> from Italy
          stick together, while American ones sit beside <B c="NEAP">Neapolitan mastiffs</B>.
        </p>
        <p>
          The <strong><B c="XOLO">Xoloitzcuintli</B></strong> (Mexican hairless dog) and the{" "}
          <strong><B c="INCA">Peruvian hairless dog</B></strong> are split across distant branches. Some of
          them sit right next to the <B c="GSD">German shepherd</B>, a hint of old mixing with European
          herding dogs.
        </p>
      </>
    ),
    view: { color: "clade", split: true },
  },
];

/** Part 3: the same connections drawn as bundled edges along the family tree, then exploring. */
const BUNDLE_STEPS: Step[] = [
  {
    id: "bundle",
    photos: ["CHOW", "KEES", "SAMO"],
    kicker: "Ribbons meet the tree",
    title: "Routing the connections through the tree",
    body: (
      <>
        <p>
          The circle chart drew each connection as a ribbon straight across the middle. Here is
          another way to draw the very same data, called <strong>edge bundling</strong>: each
          curve leaves one breed, follows the family tree&rsquo;s branches in toward the two
          breeds&rsquo; shared ancestor, then travels back out to the other breed.
        </p>
        <p>
          Take the <strong><B c="EURA">Eurasier</B></strong> again. A tree can only split, but this breed was
          made by joining three: in the 1970s breeders crossed the <B c="CHOW">chow chow</B>, <B c="KEES">keeshond</B> and{" "}
          <B c="SAMO">samoyed</B>. Its three curves follow the tree to each parent, which is why it ends up
          in a wedge of its own somewhere between them.
        </p>
      </>
    ),
    view: {
      color: "clade",
      codes: ["EURA", "CHOW", "KEES", "SAMO"],
      links: { codes: ["EURA"] },
    },
  },
  {
    id: "crossings",
    kicker: "The hidden web",
    title: "Every crossing, bundled",
    body: (
      <>
        <p>
          Now every connection between breeds from <em>different</em> families at once. Curves
          that travel the same branches merge into thick bundles, like cables in a wall. A
          bundle shows a lot of mixing between two parts of the tree; a lone thin curve is a
          one-off cross.
        </p>
        <p>
          Bundling trades the circle chart&rsquo;s exact widths for structure: you can see the
          old family tree and the last 200 years of crossbreeding in a single picture. In all,
          117 breeds show this kind of recent mixing.
        </p>
      </>
    ),
    view: { color: "clade", links: "cross" },
  },
  {
    id: "missing-links",
    kicker: "Gaps in the record",
    title: "The missing links",
    body: (
      <>
        <p>
          Every fork in this tree is an ancestor nobody has ever seen. The researchers only had{" "}
          <Term id="dna">DNA</Term> from dogs alive today, so the forks are worked out backwards from their
          descendants. In human evolution these unseen ancestors are called{" "}
          <strong>missing links</strong>: the ape that humans and gorillas both descend from,
          for example, has never been found.
        </p>
        <figure className="ml-fig">
          <MissingLinkFigure />
          <figcaption>
            Humans didn&rsquo;t evolve from gorillas: both descend from an ape that lived
            roughly 8–10 million years ago. That shared ancestor is the &ldquo;missing
            link&rdquo;, and no fossil of it has been found. On the human side, fossils fill in
            later steps: <em>Australopithecus</em> (about 4–2 million years ago) and{" "}
            <em>Homo erectus</em> (about 2 million to 100,000 years ago), before modern humans
            about 300,000 years ago. Figures are simplified icons. Silhouettes: The Nature Box,{" "}
            <a href="https://commons.wikimedia.org/wiki/File:Comparison_of_size_of_western_gorilla_(Gorilla_gorilla)_and_human.svg">CC BY-SA 4.0</a>,
            rearranged.
          </figcaption>
        </figure>
        <p>
          Dogs have a missing link too. The <strong><B c="WOLF">grey wolf</B></strong> and the{" "}
          <strong><B c="BSJI">basenji</B></strong> share an ancestor: the Ice Age wolf population dogs came from,
          which has since died out. Watch the chart: if DNA from that population were found, it
          would join the tree right at the fork where dogs part from wolves, between the wolf
          and the basenji. Every breed shifts over to make room, but in this simple picture
          none changes places: a sample of that ancestor fills in its fork rather than
          rearranging the branches that grew from it. What it would add is a real, dated dog at
          that fork, instead of one inferred from its descendants. (In practice, ancient DNA can
          also reveal old mixing that redraws parts of a tree.)
        </p>
      </>
    ),
    view: { color: "ink", codes: ["WOLF", "BSJI"], ancestor: true },
  },
];

/** Part 2: the chord diagram (the paper's Figure 4) explains shared DNA. */
const strip = (k: string) => k.replace(/^\d+ · /, "");
const CHORD_STEPS: Step[] = CIRCOS_STEPS.filter((c) => c.id !== "explore").map((c, i) => ({
  id: `c-${c.id}`,
  kicker: `The DNA web · ${strip(c.kicker)}`,
  title: c.title,
  photos: c.photos,
  body:
    i === 0 ? (
      <>
        <p>
          <strong>Part two.</strong> The family tree shows how breeds branched apart. But
          breeders also mix breeds back together, and that leaves long shared stretches of <Term id="dna">DNA</Term>{" "}
          behind. The paper drew those as a <em>chord diagram</em>: a ring of breeds tied
          together by ribbons. Here&rsquo;s how to read it.
        </p>
        {c.body}
      </>
    ) : (
      c.body
    ),
  // Behind the chord diagram, keep the tree in its clade colours for the hand-off back.
  view: { color: "clade", cladeRing: true },
  circos: c.view,
}));

// The bundled-edge steps end with "Go exploring", the hand-off to the interactive tree.
export const STEPS: Step[] = [...BREED_STEPS, ...CHORD_STEPS, ...BUNDLE_STEPS];
