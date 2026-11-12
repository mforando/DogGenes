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
      Most dog breeds are pretty new. In 1859, people in England held the first dog show. Soon,
      clubs kept lists of every puppy&rsquo;s parents. After that, only dogs on a breed&rsquo;s
      list could have puppies in that breed.
    </p>
    <p>
      The timeline shows when some breeds began, from the <B c="JACK">Jack Russell terrier</B> in 1819 to the <B c="AHRT">American hairless terrier</B>{" "}
      in 1972. Tap a photo to read its story.
    </p>
    <Stats
      dated={<>breeds with a known birthday</>}
      undated={<>with <strong>no birthday on record</strong>. They grew slowly from village and farm dogs.</>}
    />
  </>,
  <>
    <p>
      Formal breeds date to the 19th century. Conformation shows (Newcastle upon Tyne, 1859), the
      Kennel Club (1873) and the AKC (1884) introduced written standards and closed studbooks,
      which halted gene flow between breeds and imposed strong selection on small founder groups.
      Parker et al. call this the Victorian breed explosion; it is why most breeds are young,
      homogeneous and sharply bounded.
    </p>
    <p>
      Plotted: study breeds with a documented founding date, from the <B c="JACK">Jack Russell terrier</B> (1819) to the <B c="AHRT">American hairless terrier</B>{" "}
      (1972).
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
      Now go back 11,400 years, to when people first started farming. The new breeds squish into
      a thin line on the right. Dogs were the <strong>first animals people ever tamed</strong>. They
      lived with people before there were cows, sheep or wheat fields.
    </p>
    <p>
      A few kinds of dogs are much older than breed clubs. Some have a rough age on the timeline.
      Five are so old that no one knows when they began.
    </p>
    <AncientBreeds />
  </>,
  <>
    <p>
      At Holocene scale the modern breeds collapse into the last two centuries. The dog is the
      earliest domesticate, integrated into human communities before the Neolithic domestication
      of livestock and cereals (~11,400 years ago).
    </p>
    <p>
      A minority of breeds carry ancestry that predates the Victorian expansion. Those with
      approximate origins (archaeology, iconography or ancient-DNA continuity) are plotted; five
      have no agreed date.
    </p>
    <AncientBreeds />
  </>,
);

L(
  "wolves",
  <>
    <p>
      Now go way back, to the Ice Age. Here&rsquo;s a surprise: dogs did <em>not</em> come from
      the <B c="WOLF">gray wolves</B> we see today. They came from a <strong>group of Ice Age wolves that is gone
      now</strong>. Dogs and wolves went separate ways between 40,000 and 27,000 years ago.
    </p>
    <p>
      Later it got so cold that most wolves died. The few that were left spread out again from
      near Alaska. So today&rsquo;s <B c="WOLF">gray wolf</B> is a dog&rsquo;s cousin, not its great-grandparent.
    </p>
    <p>
      Where did the first dogs live? Scientists still don&rsquo;t agree. Some say <strong>East
      Asia</strong>. Some say <strong>Siberia</strong>. Some say <strong>Europe</strong>.
    </p>
  </>,
  <>
    <p>
      Dogs do not descend from extant <em>Canis lupus</em>. Genome-wide data place their source in a{" "}
      <strong>now-extinct Late Pleistocene wolf population</strong>, with divergence at
      ~40,000–27,000 years ago (calibration-dependent). Wolves passed through a severe bottleneck
      near the Last Glacial Maximum (~25,000 years ago), and a lineage expanding from Beringia
      later replaced most others, so the <B c="WOLF">gray wolf</B> rooting the dog tree is a sister lineage, not an
      ancestor.
    </p>
    <p>
      The geographic origin remains contested. Mitochondrial, Y-chromosome and nuclear analyses
      have favored <strong>East Asia</strong>, <strong>Siberia</strong> and <strong>Europe</strong>, and some models invoke more
      than one domestication. Ancient genomes from 72 wolves (Bergström et al. 2022) show that all
      dogs derive mostly from an eastern source, with additional Southwest Asian wolf admixture in
      dogs of Southwest Asia, Africa and southern Europe.
    </p>
  </>,
);

L(
  "fossils",
  <>
    <p>
      The oldest bones that everyone agrees came from a dog were found in <strong>Erralla,
      Spain</strong>. They are about 17,500 years old. In Germany, a puppy was buried with two
      people about 14,200 years ago. The puppy had been very sick, and someone took care of it.
    </p>
    <DigSites />
    <p>
      Some even older skulls look a bit like a dog&rsquo;s. But scientists argue about them.
      Skulls that clearly look like a dog&rsquo;s show up about 11,000 years ago.
    </p>
  </>,
  <>
    <p>
      The earliest generally accepted dog remains are from <strong>Erralla, Spain</strong> (~17,500
      years ago). At <strong>Bonn-Oberkassel</strong>, a juvenile dog that survived distemper was
      interred with two humans ~14,200 years ago: the oldest undisputed joint burial, and
      evidence of care.
    </p>
    <DigSites />
    <p>
      Putative Paleolithic dogs from Goyet (~36,000 years) and Razboinichya Cave, Altai (~33,300
      years) are dog-like but contested. Goyet&rsquo;s mitochondrial <Term id="dna">DNA</Term> is basal to modern dogs
      and wolves, consistent with an extinct wolf lineage or a failed early domestication.
      Unambiguously dog-like crania appear ~11,000 years ago.
    </p>
  </>,
);

L(
  "how",
  <>
    <p>
      How did a wild wolf turn into a dog? Scientists have a few ideas. Maybe brave, calm wolves
      came close to people&rsquo;s camps to eat scraps. Maybe wolves and people hunted the same
      reindeer and became a team. Maybe people shared extra meat with wolves in the long winters.
    </p>
    <p>
      The <Term id="dna">DNA</Term> shows what changed most: how dogs <strong>act</strong>. Dogs got genes that help them stay
      calm and friendly. When you and your dog look into each other&rsquo;s eyes, both of your
      brains make a feel-good chemical called oxytocin.
    </p>
  </>,
  <>
    <p>
      Three non-exclusive models: a commensal pathway in which less fearful wolves exploited human
      refuse and self-selected for tameness; a partnership with hunter-gatherers tracking the
      same reindeer; and provisioning with surplus lean protein in Ice Age winters.
    </p>
    <p>
      Selection scans are dominated by <strong>behavioral</strong> and metabolic loci: neural development,
      catecholamine signaling, and fat and starch digestion (e.g. <em>AMY2B</em> copy number).
      Structural variants near <em>GTF2I</em> and <em>GTF2IRD1</em>, in the region deleted in
      Williams-Beuren syndrome, are associated with hypersociability. Mutual gaze raises oxytocin
      in both dog and owner.
    </p>
  </>,
);

L(
  "lineages",
  <>
    <p>
      By the end of the Ice Age, 11,700 years ago, there were already at least <strong>five big dog
      families</strong>. Scientists found old dogs near the <Clade id="Mediterranean">Mediterranean</Clade> Sea, in Russia, in Siberia and
      in the Americas. The fifth family is the New Guinea singing dog, which is still alive today.
    </p>
    <p>
      Breeds came much later, and in a different way. In nature, the world decides which pups
      grow up and have puppies. Breeds were made by <strong>people picking which dogs got to have
      puppies</strong>. Try it yourself:
    </p>
    <SelectionExplainer />
  </>,
  <>
    <p>
      By the Pleistocene–Holocene transition (~11,700 years ago), ancient genomes resolve at
      least <strong>five lineages</strong>: Levantine, Karelian, Baikal, ancient American and the New
      Guinea singing dog. Pre-contact American dogs share a Siberian source, consistent with
      dispersal alongside the first Americans.
    </p>
    <p>
      Breeds are recent formalizations of that structure, produced by a different regime: strong
      artificial selection on a few traits, small founder groups and closed studbooks. The result
      is long runs of homozygosity, high linkage disequilibrium and shallow, star-like
      relationships among breeds, which makes breed trees poor analogues of species phylogenies.
      The simulation contrasts the two regimes:
    </p>
    <SelectionExplainer />
  </>,
);
