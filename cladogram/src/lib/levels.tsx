import type { ReactNode } from "react";
import { data } from "./tree";
import { links, nodes } from "./circos";
import MissingLinkFigure from "@/components/MissingLinkFigure";
import { B, Clade, Term } from "@/components/Hints";

/**
 * Step text for the "Puppy" (about 5th-grade) and "Albert Pawstein" (scientist) reading
 * levels of the family tree story. "Adult" uses each step's own body in steps.tsx. Steps,
 * charts and photos are the same at every level; only the words change. Scientific
 * details follow Parker et al. 2017 (Cell Reports 19:697–708).
 */
export const LEVEL_BODIES: Record<string, { puppy: ReactNode; pro: ReactNode }> = {};

const dogs = data.stats.dogs.toLocaleString("en-US");
const silentCount = nodes.filter((n) => n.degree === 0).length;

const L = (id: string, puppy: ReactNode, pro: ReactNode) => {
  LEVEL_BODIES[id] = { puppy, pro };
};

/** The bootstrap marker key, worded for each level. */
const Markers = ({ items }: { items: [string, string, string] }) => (
  <ul className="legend-list" aria-label="Bootstrap marker legend">
    <li><span className="mk mk-gold" aria-hidden /> {items[0]}</li>
    <li><span className="mk mk-star" aria-hidden /> {items[1]}</li>
    <li><span className="mk mk-hollow" aria-hidden /> {items[2]}</li>
  </ul>
);

const MLFigure = ({ children }: { children: ReactNode }) => (
  <figure className="ml-fig">
    <MissingLinkFigure />
    <figcaption>
      {children} Silhouettes: The Nature Box,{" "}
      <a href="https://commons.wikimedia.org/wiki/File:Comparison_of_size_of_western_gorilla_(Gorilla_gorilla)_and_human.svg">CC BY-SA 4.0</a>,
      rearranged.
    </figcaption>
  </figure>
);

// ---------------------------------------------------------------- the family tree

L(
  "ring",
  <>
    <p>
      This circle is a giant <strong>family tree</strong> for {dogs} dogs. Each tiny sliver on the
      edge is a group of real dogs. Dogs with very alike <Term id="dna">DNA</Term> sit close together. The lines show
      who branched off from whom. How long a line is doesn&rsquo;t matter.
    </p>
    <p>
      The middle is the <strong>oldest</strong> part. Scientists added the <B c="GDJK">golden jackal</B>, a wild cousin, to mark
      it. Next come <B c="WOLF">gray wolves</B>, dogs&rsquo; closest cousins. Then comes the <B c="BSJI">basenji</B>, a very old breed from
      Africa. The closer a dog is to the edge, the newer its branch.
    </p>
  </>,
  <>
    <p>
      A neighbor-joining <strong><Term id="cladogram">cladogram</Term></strong> of {dogs} dogs from 161 breeds, built from
      identity-by-state distances over 150,067 SNPs (Illumina CanineHD). Branch lengths are not
      to scale; read the topology only.
    </p>
    <p>
      The tree is rooted on the <B c="GDJK">golden jackal</B>. <B c="WOLF">Gray wolves</B> resolve as the sister group to dogs (extant
      relatives, not ancestors), and the <B c="BSJI">basenji</B> branches first among breeds. Depth from the root gives
      relative, not absolute, order of divergence.
    </p>
  </>,
);

L(
  "wedge",
  <>
    <p>
      Meet the <B c="BOX">boxers</B>. All 10 boxers in the study have <Term id="dna">DNA</Term> so alike that they always land together,
      so they&rsquo;re drawn as one wedge. Each dot is one dog.
    </p>
    <p>
      Almost every breed does this: 146 of 161 make their own wedge. Each breed is like its own
      little island.
    </p>
  </>,
  <>
    <p>
      Individuals forming one terminal <Term id="clade">clade</Term> are collapsed to a wedge (dot = dog; width ∝ sample
      size); the 10 <B c="BOX">boxers</B> form one. Across 100 <Term id="bootstrap">bootstrap</Term> replicates, 146 of 161 breeds (91%) are
      monophyletic with 100% support. Nine of the other 15 were newly recognized or not yet
      recognized by the AKC at sampling.
    </p>
  </>,
);

L(
  "forks",
  <>
    <p>
      Are two breeds close family? Follow each one toward the middle until their lines meet. That
      spot stands for an ancestor they share. The sooner the lines meet, the closer the family.
    </p>
    <p>
      The <B c="GOLD">golden retriever</B>&rsquo;s closest family is the <B c="FCR">flat-coated retriever</B>, almost like a twin. The{" "}
      <B c="LAB">Labrador</B> is more like a cousin. The <B c="NEWF">Newfoundland</B> is a distant cousin.
    </p>
  </>,
  <>
    <p>
      Relatedness is read from the MRCA. The <B c="GOLD">golden retriever</B>&rsquo;s sister taxon is the <B c="FCR">flat-coated retriever</B>,
      then the <B c="LAB">Labrador</B> and the <B c="NEWF">Newfoundland</B>.
    </p>
    <p>
      <Term id="haplotype">Haplotype</Term> sharing (median 66,993,738 bp) dates the golden–flat-coated split to about 1895,
      consistent with recorded founding crosses in 1868–1890.
    </p>
  </>,
);

L(
  "neighbors",
  <>
    <p>
      The <B c="DACH">dachshund</B> and the <B c="AFGH">Afghan hound</B> sit side by side, and both are called hounds. So they must be
      close family, right? Wrong. Their lines don&rsquo;t meet until deep in the tree.
    </p>
    <p>
      Think of a mobile over a baby&rsquo;s crib. You can spin any piece, and nothing really
      changes. Watch us spin this branch. Now the two dogs are far apart, but their lines still
      meet in the same spot. Where a dog sits on the edge doesn&rsquo;t matter. Only where the
      lines meet does.
    </p>
  </>,
  <>
    <p>
      The <B c="DACH">dachshund</B> and <B c="AFGH">Afghan hound</B> are adjacent on the perimeter and share a functional label, yet
      their MRCA is deep.
    </p>
    <p>
      Leaf order in a circular layout is only partly constrained by topology: any internal node
      can rotate without changing the tree. Rotating their subtending node places them
      diametrically opposite with an identical path to the MRCA. The shared &ldquo;hound&rdquo;
      label reflects convergent function, not common descent.
    </p>
  </>,
);

L(
  "support",
  <>
    <p>
      How sure are the scientists? They mixed up their data and built the tree 100 times. Then
      they checked which parts came out the same each time.
    </p>
    <Markers
      items={[
        "90–100 times out of 100: super sure",
        "70–89 times: pretty sure",
        "50–69 times: a good guess",
      ]}
    />
    <p>
      No marker means that part kept changing. Most of those are near the middle, so the oldest
      splits are the hardest to be sure about.
    </p>
  </>,
  <>
    <p>
      Nonparametric <strong><Term id="bootstrap">bootstrap</Term></strong>: loci resampled with replacement, 100 replicates.
    </p>
    <Markers
      items={[
        "≥90% bootstrap support",
        "70–89% bootstrap support",
        "50–69% bootstrap support",
      ]}
    />
    <p>
      Excluding breed-specific nodes, 105 nodes reach ≥90% support, 133 reach ≥70% and 150 reach
      ≥50%. Weak support concentrates along the backbone, so basal relationships among <Term id="clade">clades</Term>{" "}
      remain poorly resolved.
    </p>
  </>,
);

L(
  "clades",
  <>
    <p>
      Now look at the bigger branches. Each one is a <strong><Term id="clade">clade</Term></strong>: an ancestor and all of its
      family. Almost every breed belongs to one of 23 clades. The gray wedges are loners.
    </p>
    <p>
      Most clades make sense, like terriers with terriers. Some are odd couples. Speedy, skinny <B c="SALU">salukis</B>{" "}
      share the <strong><Clade id="Mediterranean">Mediterranean</Clade></strong> clade with giant, fluffy <B c="GPYR">Great Pyrenees</B>. Why? People in each place made
      their hunting dogs and their farm dogs from the same local dogs. Where a dog came from
      mattered more than its job.
    </p>
  </>,
  <>
    <p>
      150 of 161 breeds (93%) fall into 23 <strong><Term id="clade">clades</Term></strong> of 2–18 breeds with &gt;50% <Term id="bootstrap">bootstrap</Term>{" "}
      support (29 clades holding 78% of breeds at ≥90%). Eleven breeds group with no other: five
      form independent clades, and six are paraphyletic to established clades (gray).
    </p>
    <p>
      Clades track geography over function. The <strong><Clade id="Mediterranean">Mediterranean</Clade></strong> clade unites sighthounds (<B c="SALU">saluki</B>) with
      livestock guardians (<B c="GPYR">Great Pyrenees</B>); <strong><Clade id="UKRural">UK Rural</Clade></strong> unites sighthounds with herders. Parsimony favors
      regional derivation of functional types from shared founder stock, followed by divergent
      selection.
    </p>
  </>,
);

L(
  "geography",
  <>
    <p>
      Most breeds here come from Europe: 115 of 164. That&rsquo;s because the idea of an
      official breed started in Britain. In most other places, dogs lived in villages and never
      got breed names.
    </p>
    <p>
      Dogs share the most <Term id="dna">DNA</Term> with dogs from their own continent. But many dogs in Australia and the
      Americas came from dogs that settlers brought from Europe. The Australian <B c="KELP">kelpie</B>&rsquo;s closest
      relative is the <B c="BORD">border collie</B>! Tap a continent to light up its breeds.
    </p>
  </>,
  <>
    <p>
      The sample is ~70% European (115 of 164 populations with origins), a historical and
      sampling artifact: the closed-studbook breed concept arose in Victorian Britain, and the
      dataset draws on European and North American registries. Most dogs worldwide are
      free-ranging village dogs.
    </p>
    <p>
      About three-quarters of significant shared length is intracontinental. Asian breeds are
      comparatively self-contained (&gt;50% intracontinental), whereas North America (~21%),
      Australia (~16%) and Africa (~8%) share mostly with Europe, consistent with colonial-era
      introductions (<B c="KELP">kelpie</B>–<B c="BORD">border collie</B>; <B c="BOER">boerboel</B>–<B c="BULM">bullmastiff</B>).
    </p>
  </>,
);

L(
  "split",
  <>
    <p>
      A few breeds don&rsquo;t all sit together. Some are new breeds that are still settling in.
    </p>
    <p>
      The hairless dogs from Mexico and Peru are split up too. Some of them sit right next to the <B c="GSD">German
      shepherd</B>. That&rsquo;s a clue that long ago, their families mixed with herding dogs from Europe.
    </p>
  </>,
  <>
    <p>
      Fifteen breeds are not monophyletic. Several are still under development; others are
      structured by collection site: Italian <B c="CANE">cane corsos</B> form a fully supported <Term id="clade">clade</Term>, while US-sampled
      dogs are paraphyletic near the <B c="NEAP">Neapolitan mastiff</B>.
    </p>
    <p>
      The <B c="XOLO">Xoloitzcuintli</B> and <B c="INCA">Peruvian hairless dog</B> split between divergent clades, some adjacent to the <B c="GSD">German
      shepherd</B>. TreeMix places admixture into the <Clade id="NewWorld">New World</Clade> clade from European herding stock,
      possibly during the Columbian Exchange.
    </p>
  </>,
);

L(
  "missing-links",
  <>
    <p>
      Every place where two branches meet stands for an ancestor no one has ever seen. Scientists
      only had <Term id="dna">DNA</Term> from dogs alive today, so they worked backward. In the story of people, these
      unknown ancestors are called <strong>missing links</strong>.
    </p>
    <MLFigure>
      People didn&rsquo;t come from gorillas. People and gorillas share an ancestor from 8 to 10
      million years ago. No one has found it yet.
    </MLFigure>
    <p>
      Dogs have a missing link too: the old wolf family that dogs came from. If scientists found
      its DNA, it would slide in where dogs and wolves split. Watch the breeds scoot over to make
      room.
    </p>
  </>,
  <>
    <p>
      Internal nodes are unsampled ancestors inferred from extant taxa, the{" "}
      <strong>missing links</strong> of paleoanthropology.
    </p>
    <MLFigure>
      Humans and gorillas descend from a hominine ancestor of ~8–10 Ma not known from fossils.
    </MLFigure>
    <p>
      For dogs, the analogous node is the extinct Late Pleistocene source population. Here its
      genome joins at the wolf–dog divergence without altering topology, a simplification: real
      ancient genomes may reveal admixture that rearranges deep relationships, and would add a
      directly dated calibration point.
    </p>
  </>,
);

// ---------------------------------------------------------------- the DNA web

L(
  "c-blocks",
  <>
    <p>
      <strong>Part two.</strong> A family tree shows how breeds split apart. But sometimes people
      mix breeds back together. That leaves big matching pieces of <Term id="dna">DNA</Term> behind. Scientists drew
      those as a ring of breeds tied together with ribbons.
    </p>
    <p>
      Each block on the ring is one breed. The blocks go in the same order as the family tree,
      with the same colors. Start at the <strong>wolf</strong> near the top and go around the opposite way from
      a clock&rsquo;s hands.
    </p>
  </>,
  <>
    <p>
      <strong>Part two.</strong> Bifurcating trees cannot represent reticulation, and recent
      admixture leaves long <Term id="haplotype">identical-by-descent</Term> (IBD) haplotypes. The authors summarized
      cross-clade sharing as a circos plot (their Figure 4).
    </p>
    <p>
      The {nodes.length} populations run counterclockwise from the <strong>wolf</strong> in <Term id="cladogram">cladogram</Term> leaf order
      (with the same rotation caveat), colored by <Term id="clade">clade</Term>; segments are equal-width. The <B c="TIBM">Tibetan mastiff</B>,{" "}
      <B c="SALU">saluki</B> and <B c="CANE">cane corso</B> are each represented by origin-country and US samples, to test the effect of
      importation.
    </p>
  </>,
);

L(
  "c-ribbon",
  <>
    <p>
      Every time puppies are born, their <Term id="dna">DNA</Term> gets mixed and cut into smaller pieces. So if two
      breeds still share a <em>big</em> piece, they had the same ancestor not long ago. Usually
      that means someone mixed the two breeds. Only the biggest surprises get a ribbon.
    </p>
    <p>
      The <B c="EURA">Eurasier</B> was made in the 1970s from three breeds: the <B c="CHOW">chow chow</B>, <B c="KEES">keeshond</B> and <B c="SAMO">Samoyed</B>. Its three
      ribbons go right to them.
    </p>
  </>,
  <>
    <p>
      Recombination shortens IBD segments each meiosis, so long shared <strong><Term id="haplotype">haplotypes</Term></strong> imply
      recent common ancestry. Haplotypes were phased with <code>BEAGLE</code> in 100-SNP windows
      (≥232 kb). Within-clade sharing is high by expectation (median 9.74 vs 2.18 Mb between{" "}
      <Term id="clade">clades</Term>; p &lt; 2.2e-16), so only interclade pairs above the 95th percentile (9,744,974 bp)
      are drawn: {links.length} ribbons.
    </p>
    <p>
      The <B c="EURA">Eurasier</B>, a 1970s composite of the <B c="CHOW">chow chow</B> (<Clade id="AsianSpitz">Asian spitz</Clade>), <B c="KEES">keeshond</B> (<Clade id="NordicSpitz">Nordic spitz</Clade>) and <B c="SAMO">Samoyed</B>{" "}
      (unclustered), shares significant haplotypes with all three.
    </p>
  </>,
);

L(
  "c-width",
  <>
    <p>
      Wider ribbons mean more shared <Term id="dna">DNA</Term>. The <B c="EURA">Eurasier</B> and the <B c="CHOW">chow chow</B> share the most of any pair. The
      thin ribbon between the <B c="CANE">cane corso</B> and the <B c="STBD">Saint Bernard</B> only just made the list.
    </p>
    <p>
      Tip: compare ribbons to each other, not to the size of the blocks.
    </p>
  </>,
  <>
    <p>
      Ribbon width scales with median pairwise IBD length: <B c="EURA">Eurasier</B>–<B c="CHOW">chow chow</B> ~179 Mb (the maximum),{" "}
      <B c="BPIC">Berger Picard</B>–<B c="BOUV">Bouvier des Flandres</B> ~78 Mb, Italian <B c="CANE">cane corso</B>–<B c="STBD">Saint Bernard</B> &lt;10 Mb (just above
      threshold). Arc length is fixed per segment, so widths compare across ribbons, not against
      segments.
    </p>
  </>,
);

L(
  "c-hubs",
  <>
    <p>
      About half the breeds have one ribbon or none. But six breeds connect to more than eight
      others. Each ribbon takes the color of its busier end, so a fan of one color leads back to
      one busy breed.
    </p>
    <p>
      Some busy breeds were made by mixing lots of others, like the <B c="COOK">Chinook</B>. Others were so popular that
      people used them to make new breeds, like the <B c="GSD">German shepherd</B>.
    </p>
  </>,
  <>
    <p>
      Degree is highly skewed: 54% of breeds in the 23 <Term id="clade">clades</Term> share with one or no breed outside
      their clade, consistent with breed formation within founder populations. Six share with
      more than eight: the <strong><B c="MNTY">toy Manchester terrier</B></strong>, <strong><B c="PUG">pug</B></strong>, <strong><B c="COOK">Chinook</B></strong>, <strong><B c="AIRT">Airedale</B></strong>,{" "}
      <strong><B c="GSD">German shepherd</B></strong> and <strong><B c="BPIC">Berger Picard</B></strong>. Ribbons take the color of the higher-degree
      endpoint, so same-colored fans mark donors.
    </p>
    <p>
      High degree indicates a recent composite (the <B c="COOK">Chinook</B>, 1910s) or a popular donor. The <B c="GSD">German shepherd</B> is
      the latter, and is also implicated in spreading the MDR1 drug-sensitivity variant (~10% in
      the breed).
    </p>
  </>,
);

L(
  "c-pug",
  <>
    <p>
      On the family tree, the <B c="PUG">pug</B> sits next to the <B c="BRUS">Brussels griffon</B>. But its ribbons reach Asian lapdogs
      like the <B c="PEKE">Pekingese</B> and <B c="SHIH">shih tzu</B>, and small breeds all around the ring.
    </p>
    <p>
      Scientists think <B c="PUG">pugs</B> left Asia long ago. Then people used them to make lots of small European
      breeds.
    </p>
  </>,
  <>
    <p>
      The <B c="PUG">pug</B> nests with the <B c="BRUS">Brussels griffon</B> in the <Clade id="ToySpitz">toy spitz</Clade> <Term id="clade">clade</Term>, yet shares extensive <Term id="haplotype">haplotypes</Term> with the <Clade id="AsianToy">Asian toy</Clade>{" "}
      breeds (<B c="PEKE">Pekingese</B>, <B c="SHIH">shih tzu</B>, <B c="LHSA">Lhasa apso</B>) and with small breeds across many clades.
    </p>
    <p>
      The authors interpret this as early exportation from Asia followed by widespread
      contribution to European toy breeds, a case where phylogeny alone misrepresents breed
      relationships.
    </p>
  </>,
);

L(
  "c-populations",
  <>
    <p>
      Look at the two <B c="CANE">cane corso</B> blocks. Cane corsos from <strong>Italy</strong> connect to the <B c="GSD">German shepherd</B>. Cane corsos
      from the <strong>United States</strong> connect to the <B c="ROTT">Rottweiler</B>.
    </p>
    <p>
      <B c="CANE">Cane corsos</B> have only lived in the US for about 30 years, and already the American dogs have
      mixed a little with dogs there.
    </p>
  </>,
  <>
    <p>
      The two <B c="CANE">cane corso</B> populations diverge. <strong>Italian</strong> dogs share with the <B c="GSD">German shepherd</B> and <B c="COOK">Chinook</B>;{" "}
      <strong>US</strong> dogs share significantly with the <B c="ROTT">Rottweiler</B> and other mastiffs, sharing absent from the
      Italian sample.
    </p>
    <p>
      This reflects post-importation admixture. Importation bottlenecks are also visible in
      inbreeding coefficients: US versus Chinese <B c="TIBM">Tibetan mastiffs</B> (F = 0.15 versus 0.07) and US versus
      country-of-origin <B c="SALU">salukis</B> (F = 0.21 versus 0.10).
    </p>
  </>,
);

L(
  "c-silent",
  <>
    <p>
      The {silentCount} lit-up blocks have no ribbons at all. They include <B c="SALU">salukis</B>, <B c="BEAG">beagles</B> and poodles.
    </p>
    <p>
      No ribbons means no recent mixing with other families. Scientists think two of these groups,
      the <Clade id="Mediterranean">Mediterranean</Clade> dogs and the <Clade id="AsianSpitz">Asian spitz</Clade> dogs, may be some of the oldest dog families of all.
    </p>
  </>,
  <>
    <p>
      The {silentCount} highlighted populations show no significant interclade sharing,
      including most <Clade id="Mediterranean">Mediterranean</Clade> breeds, most <Clade id="ScentHound">scent hounds</Clade> and all three poodle varieties.
    </p>
    <p>
      Median interclade sharing is lowest in the <Clade id="AsianSpitz">Asian spitz</Clade> (0) and Mediterranean (516,900 bp) <Term id="clade">clades</Term>,
      implying they are the most divergent and possibly oldest, consistent with an early
      Central/East Asian origin of dogs. Mean sharing is slightly higher in Asian spitz
      (1,596,000 versus 1,317,000 bp), suggesting Asian spitz breeds feature in recent crosses
      while Mediterranean breeds remain segregated.
    </p>
  </>,
);

// ---------------------------------------------------------------- bundled edges

L(
  "bundle",
  <>
    <p>
      Here&rsquo;s another way to draw the same ribbons. Each line starts at one breed, follows
      the tree&rsquo;s branches inward, then goes back out to the other breed.
    </p>
    <p>
      Lines that use the same branches bunch together into thick bundles. A thick bundle means
      lots of mixing; one thin line means just one mix. The picture shows the old family tree and
      200 years of mixing at once.
    </p>
  </>,
  <>
    <p>
      Interclade sharing rendered with hierarchical <strong>edge bundling</strong>: each edge is a
      B-spline routed through internal nodes via the MRCA, so edges sharing tree paths coalesce,
      and bundle density tracks admixture volume between subtrees.
    </p>
    <p>
      117 breeds show strong interclade admixture, mostly within the past ~200 years. The <B c="EURA">Eurasier</B> shows
      the model&rsquo;s limit: a three-way composite cannot be represented by bifurcation, so
      neighbor-joining places it between its sources.
    </p>
  </>,
);
