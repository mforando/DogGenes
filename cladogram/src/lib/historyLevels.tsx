import type { ReactNode } from "react";
import { MODERN_BREEDS } from "./history";
import AncientBreeds from "@/components/AncientBreeds";
import DigSites from "@/components/DigSites";
import SelectionExplainer from "@/components/SelectionExplainer";
import { B, Clade, Term } from "@/components/Hints";

/**
 * Step text for the "Puppy" (about 5th-grade) and "Albert Pawstein" (scientist) reading levels
 * of the history of dogs (the home page). "Adult" uses each step's own body in steps.tsx.
 * Steps, timeline and visuals are the same at every level; only the words change.
 */
export const HISTORY_LEVEL_BODIES: Record<string, { puppy: ReactNode; pro: ReactNode }> = {};
const L = (id: string, puppy: ReactNode, pro: ReactNode) => {
  HISTORY_LEVEL_BODIES[id] = { puppy, pro };
};

const DATED = MODERN_BREEDS.length;
const STUDY_BREEDS = 161;
const Stats = ({ dated, undated }: { dated: ReactNode; undated: ReactNode }) => (
  <div className="hx-stats">
    <div>
      <span className="hx-num">{DATED}</span>
      <span>{dated}</span>
    </div>
    <div>
      <span className="hx-num muted">{STUDY_BREEDS - DATED}</span>
      <span>{undated}</span>
    </div>
  </div>
);

L(
  "modern",
  <>
    <p>
      Most dog breeds are pretty new! About 200 years ago, people in England started holding
      dog shows. The first one was in 1859. Soon there were clubs that kept a list of every
      puppy&rsquo;s mom and dad. Once a breed&rsquo;s list was closed, only dogs from that
      breed could join the family.
    </p>
    <p>
      The timeline shows when some breeds got started, from the <B c="JACK">Jack Russell terrier</B>{" "}
      in 1819 to the <B c="AHRT">American hairless terrier</B> in 1972. Point at a photo to read its
      story.
    </p>
    <Stats
      dated={<>breeds where we know (or can guess) the year they started</>}
      undated={<>breeds with <strong>no birthday on record</strong>. They grew slowly from local farm and village dogs, long before anyone wrote things down.</>}
    />
  </>,
  <>
    <p>
      Formal breeds are a product of the 19th century. Conformation shows (Newcastle upon Tyne,
      1859), the Kennel Club (1873) and the American Kennel Club (1884) introduced written breed
      standards and registries with closed studbooks, which cut gene flow between breeds and
      imposed strong artificial selection on small founder groups. Parker et al. call this the
      Victorian-era breed explosion; it is why most breeds are genetically young, homogeneous
      and sharply bounded.
    </p>
    <p>
      The timeline places the study breeds with a documented founding date, from the{" "}
      <B c="JACK">Jack Russell terrier</B> (1819) to the <B c="AHRT">American hairless terrier</B> (1972).
    </p>
    <Stats
      dated={<>breeds with a documented or approximate founding date</>}
      undated={<>of the study&rsquo;s {STUDY_BREEDS} breeds have <strong>no recorded founding</strong>: landraces formalized from older regional populations.</>}
    />
  </>,
);

L(
  "first",
  <>
    <p>
      Now we go way back, to about 11,400 years ago, when people first started farming. All
      those breeds from the last 200 years squish into a thin line on the right. Dogs were the{" "}
      <strong>very first animal people ever tamed</strong>. They lived with people before there
      were cows, sheep or even fields of wheat.
    </p>
    <p>
      A few kinds of dog are really old. They hunted, herded and kept people company for
      hundreds of years before breed clubs existed. The ones with a rough age are on the
      timeline. Five more are so old that nobody knows when they started.
    </p>
    <AncientBreeds />
  </>,
  <>
    <p>
      At the scale of the Holocene the modern breeds collapse into the last two centuries. The
      dog (<em>Canis familiaris</em>) is the earliest domesticate, predating the Neolithic
      domestication of livestock and cereals; dogs were already integrated into human
      communities by the onset of agriculture, around 11,400 years ago.
    </p>
    <p>
      A few lineages are &ldquo;basal&rdquo; breeds whose ancestry predates the Victorian
      breed explosion. Those with approximate origins (from archaeology, iconography or
      ancient-DNA continuity) are placed on the timeline; five have no agreed date.
    </p>
    <AncientBreeds />
  </>,
);

L(
  "wolves",
  <>
    <p>
      Let&rsquo;s go back even further, to the Ice Age. Here&rsquo;s a surprise: dogs did{" "}
      <em>not</em> come from the <B c="WOLF">grey wolves</B> we see today. They came from a{" "}
      <strong>group of Ice Age wolves that are gone now</strong>. Dogs and wolves went their
      own ways somewhere between 40,000 and 27,000 years ago.
    </p>
    <p>
      About 25,000 years ago it got so cold that most wolves died. Only a few were left. Later
      their babies spread out again from a place near Alaska. So today&rsquo;s{" "}
      <B c="WOLF">grey wolf</B> is more like a dog&rsquo;s cousin than its great-great-grandparent.
    </p>
    <blockquote>
      &ldquo;We&rsquo;re very surprised that they&rsquo;re not.&rdquo;
      <cite>Biologist Robert K. Wayne, on dogs not coming from today&rsquo;s wolves</cite>
    </blockquote>
  </>,
  <>
    <p>
      Into the Late Pleistocene. Dogs do not descend from extant <B c="WOLF">grey wolves</B> (
      <em>Canis lupus</em>); genome-wide data place their source in a{" "}
      <strong>now-extinct wolf population</strong>, with dog–wolf divergence estimated at
      roughly 40,000–27,000 years ago (calibration-dependent).
    </p>
    <p>
      Around the Last Glacial Maximum (~25,000 years ago) wolves passed through a severe
      bottleneck, and a lineage expanding out of Beringia later replaced most other wolf
      populations. The <B c="WOLF">grey wolf</B> used to root the dog tree is therefore a sister
      lineage, not an ancestor.
    </p>
    <blockquote>
      &ldquo;We&rsquo;re very surprised that they&rsquo;re not.&rdquo;
      <cite>Robert K. Wayne, on dogs not descending from living wolf populations</cite>
    </blockquote>
  </>,
);

L(
  "where",
  <>
    <p>
      Where did the first dogs live? Scientists still can&rsquo;t agree! Different{" "}
      <Term id="dna">DNA</Term> studies point to <strong>East Asia</strong>, <strong>Siberia</strong>, or{" "}
      <strong>Europe</strong>.
    </p>
    <p>
      One study looked at the DNA of 72 wolves that lived long ago. It found that every dog has
      some family from wolves that lived in the east. Dogs in the Middle East, Africa and
      southern Europe also have some family from Middle Eastern wolves. Nobody knows for sure
      yet when, where, or how many groups of wolves were part of the story.
    </p>
  </>,
  <>
    <p>
      The geographic origin remains contested: mitochondrial, Y-chromosome and nuclear{" "}
      <Term id="dna">DNA</Term> analyses have variously favored <strong>East Asia</strong>,{" "}
      <strong>Siberia</strong> and <strong>Europe</strong>, with some models proposing more than one
      domestication.
    </p>
    <p>
      Ancient-genome sequencing of 72 Pleistocene and Holocene wolves (Bergström et al. 2022)
      found that dogs worldwide derive most of their ancestry from an eastern wolf source, while
      dogs of Southwest Asia, Africa and southern Europe show additional admixture from a
      Southwest Asian wolf population. There is still &ldquo;no firm consensus&rdquo; on the
      timing, location or number of source populations.
    </p>
  </>,
);

L(
  "fossils",
  <>
    <p>
      The oldest bones that everyone agrees came from a dog were found in{" "}
      <strong>Erralla, Spain</strong>. They are about 17,500 years old. At{" "}
      <strong>Bonn-Oberkassel</strong> in Germany, a puppy was buried with two people about 14,200
      years ago. It&rsquo;s the oldest grave we know of where people and a dog were buried
      together. Pick a dig site to see what was found.
    </p>
    <DigSites />
    <p>
      Some even older skulls look a bit like a dog&rsquo;s, from Goyet in Belgium (36,000 years
      old) and the Altai Mountains in Siberia (33,300 years old). But scientists argue about
      them. The <Term id="dna">DNA</Term> says the Goyet animal was probably a kind of wolf that
      died out. Skulls that clearly look like a dog&rsquo;s show up about 11,000 years ago.
    </p>
  </>,
  <>
    <p>
      The earliest generally accepted dog remains are from <strong>Erralla, Spain</strong> (~17,500
      years ago). At <strong>Bonn-Oberkassel</strong>, Germany, a juvenile dog with evidence of
      survived distemper was interred with two humans ~14,200 years ago, the oldest undisputed
      joint human–dog burial and evidence of care.
    </p>
    <DigSites />
    <p>
      Earlier putative &ldquo;Paleolithic dogs&rdquo; from Goyet, Belgium (~36,000 years) and
      Razboinichya Cave in the Altai (~33,300 years) are morphologically dog-like but contested.
      Mitochondrial <Term id="dna">DNA</Term> places the Goyet specimen basal to modern dogs and wolves,
      most consistent with an extinct wolf lineage or a failed early domestication. Crania with
      an unambiguously dog-like profile appear ~11,000 years ago.
    </p>
  </>,
);

L(
  "how",
  <>
    <p>
      How did a wild wolf turn into a dog? There are a few ideas, and they might all be a little
      bit true. Maybe calm, brave wolves came near people&rsquo;s camps to eat scraps. Maybe
      wolves and people hunted the same reindeer and became a team. Or maybe in the long, cold
      winters, people had extra meat and shared it with wolves.
    </p>
    <p>
      Either way, the <Term id="dna">DNA</Term> shows what changed most: how dogs{" "}
      <strong>act</strong>. Dogs got genes that help them stay calm and friendly, and genes for
      eating foods like bread and starch. When you and your dog look into each other&rsquo;s eyes,
      both of your brains make a &ldquo;love&rdquo; chemical called oxytocin.
    </p>
  </>,
  <>
    <p>
      Competing (not mutually exclusive) models: the commensal pathway, in which bolder, less
      fearful wolves exploited refuse around human settlements and selected themselves for
      tameness; a partnership model in which wolves and hunter-gatherers tracked the same
      reindeer herds; and a provisioning model in which surplus lean protein in Ice Age winters
      was shared with wolves.
    </p>
    <p>
      Selection scans of the dog <Term id="dna">genome</Term> are dominated by{" "}
      <strong>behavioral</strong> and metabolic loci: genes for neural development, the
      catecholamine (adrenaline) pathway, and fat and starch digestion (e.g. <em>AMY2B</em> copy
      number). Structural variants near <em>GTF2I</em> and <em>GTF2IRD1</em>, in the region deleted in
      human Williams-Beuren syndrome, are associated with hypersociability. Mutual gaze between
      dogs and owners raises oxytocin in both.
    </p>
  </>,
);

L(
  "lineages",
  <>
    <p>
      By the end of the Ice Age, 11,700 years ago, dogs had already split into at least{" "}
      <strong>five big family lines</strong>. We know because scientists found old dogs near the
      eastern <Clade id="Mediterranean">Mediterranean</Clade> Sea, in northwest Russia, by Lake Baikal in
      Siberia, and in the ancient Americas. The fifth is the New Guinea singing dog, which is
      still alive today. Dogs probably came to the Americas with the very first people.
    </p>
    <p>Today&rsquo;s breeds are much younger. Most were made in the last 200 years from those older dogs.</p>
    <p>
      Breeds were made in a different way, too. For a very long time, nature decided which pups
      grew up and had puppies of their own. Breeds were made by{" "}
      <strong>people picking which dogs got to have puppies</strong>. That leaves different clues in
      their <Term id="dna">DNA</Term>. Try it yourself:
    </p>
    <SelectionExplainer />
  </>,
  <>
    <p>
      By the Pleistocene–Holocene transition (~11,700 years ago), ancient genomes resolve at least{" "}
      <strong>five dog lineages</strong>: Levantine (eastern <Clade id="Mediterranean">Mediterranean</Clade>),
      Karelian (northwest Russia), Baikal (Siberia), ancient American, and New Guinea singing
      dog. Pre-contact American dogs share a Siberian source, consistent with dispersal
      alongside the first people of the Americas.
    </p>
    <p>
      Modern breeds are recent formalizations of that older regional structure; most date to
      the last two centuries.
    </p>
    <p>
      Breed formation also differs in kind from natural evolution: strong artificial selection on
      a few traits, small founder groups and closed studbooks produce long runs of homozygosity,
      high linkage disequilibrium and shallow, star-like relationships among breeds. Those
      signatures make breed trees poor analogues of species phylogenies. The simulation contrasts
      the two regimes:
    </p>
    <SelectionExplainer />
  </>,
);
