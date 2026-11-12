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
      This circle is a giant <strong>family tree</strong> for {dogs} dogs. Every tiny sliver
      around the edge is a group of real dogs. Scientists looked at each dog&rsquo;s{" "}
      <strong><Term id="dna">DNA</Term></strong>, the set of building instructions inside every body, a bit like the
      instruction booklet that tells you how to build a Lego set.
    </p>
    <p>
      Dogs with very similar instructions sit close together, like brothers and sisters at a
      family reunion. The lines show who branched off from whom. The length of a line
      doesn&rsquo;t mean anything, so don&rsquo;t worry about it.
    </p>
  </>,
  <>
    <p>
      A neighbor-joining <strong><Term id="cladogram">cladogram</Term></strong> of {dogs} dogs from 161 breeds, built from
      an identity-by-state (IBS) distance matrix over 150,067 informative SNPs genotyped on the
      Illumina CanineHD array. Each wedge on the perimeter is a terminal cluster of
      individuals; topology encodes relative branching order only.
    </p>
    <p>
      Branch lengths are not drawn to scale and carry no information about divergence time or
      genetic distance, so the figure should be read for topology alone. The authors favored
      allele-sharing distances over frequency-based statistics because the array&rsquo;s SNPs
      were ascertained largely in the <B c="BOX">boxer</B>, which inflates minor allele frequencies in that
      breed (MAF 0.351 versus 0.260 overall).
    </p>
  </>,
);

L(
  "root",
  <>
    <p>
      Start at the very middle. That&rsquo;s the <strong>oldest</strong> part of the tree, like
      great-great-grandparents at the bottom of a family tree. To know which end is the old
      end, scientists added the <strong><B c="GDJK">golden jackal</B></strong>, a wild animal that split from
      dogs a very long time ago.
    </p>
    <p>
      Next come <strong><B c="WOLF">grey wolves</B></strong>. They&rsquo;re dogs&rsquo; closest cousins, not
      their grandparents: dogs came from an older wolf family that has died out. Then comes
      the <strong><B c="BSJI">basenji</B></strong>, a very old breed from Africa. The closer a dog is to the
      edge, the newer its branch.
    </p>
  </>,
  <>
    <p>
      The tree is rooted on the <strong><B c="GDJK">golden jackal</B></strong> as outgroup, which polarizes the
      topology: the root is the deepest bifurcation, and character states are read outward
      from it.
    </p>
    <p>
      <strong><B c="WOLF">Grey wolves</B></strong> resolve as the sister group to domestic dogs. They are
      extant relatives rather than ancestors; dogs derive from a Late Pleistocene wolf
      population that is now extinct. The <strong><B c="BSJI">basenji</B></strong> branches first among the
      breeds, consistent with its status as a basal, ancient lineage. Depth from the root
      approximates relative order of divergence, not absolute time.
    </p>
  </>,
);

L(
  "wedge",
  <>
    <p>
      Meet the <strong><B c="BOX">boxers</B></strong>! All ten boxers in the study have <Term id="dna">DNA</Term> so alike that they
      always end up together, like siblings who look almost the same. So they&rsquo;re drawn
      as one wedge. Each little dot is one dog.
    </p>
    <p>
      Almost every breed does this: 146 out of 161 make their own neat wedge. Each breed is
      like its own little island of look-alike dogs.
    </p>
  </>,
  <>
    <p>
      The ten <strong><B c="BOX">boxers</B></strong> resolve as a single breed-specific node. Individuals that
      cluster into one terminal <Term id="clade">clade</Term> are collapsed into a wedge; dots mark individual dogs,
      and wedge width scales with sample size.
    </p>
    <p>
      After 100 <Term id="bootstrap">bootstrap</Term> replicates, 146 of 161 breeds (91%) formed monophyletic,
      breed-specific nodes with 100% support, reflecting strong genetic differentiation
      under closed studbooks. Of the remaining 15, nine were newly recognized or not yet
      recognized by the AKC at sampling, suggesting breeds still under development.
    </p>
  </>,
);

L(
  "forks",
  <>
    <p>
      Want to know if two breeds are close family? Follow each one toward the middle until
      their lines meet. The spot where they meet is a great-great-grandparent they both share.
      The sooner the lines meet, the closer the cousins.
    </p>
    <p>
      The <strong><B c="GOLD">golden retriever</B></strong>&rsquo;s closest cousin is the{" "}
      <strong><B c="FCR">flat-coated retriever</B></strong>, almost like a sibling. The{" "}
      <strong><B c="LAB">Labrador</B></strong> is a bit further away, like a first cousin, and the{" "}
      <strong><B c="NEWF">Newfoundland</B></strong> is further still, like a second cousin.
    </p>
  </>,
  <>
    <p>
      Relatedness is read from the most recent common ancestor (MRCA): trace two terminals
      inward to their first shared internal node. Shallower MRCAs indicate more recent common
      ancestry.
    </p>
    <p>
      The <strong><B c="GOLD">golden retriever</B></strong>&rsquo;s sister taxon here is the{" "}
      <strong><B c="FCR">flat-coated retriever</B></strong>, followed by the <strong><B c="LAB">Labrador</B></strong> and,
      more distantly, the <strong><B c="NEWF">Newfoundland</B></strong>. <Term id="haplotype">Haplotype</Term> sharing dates the
      golden–flat-coated split to about 1895 (median shared length 66,993,738 bp), close to
      written histories placing the golden retriever&rsquo;s founding crosses in 1868–1890.
    </p>
  </>,
);

L(
  "neighbors",
  <>
    <p>
      The <strong><B c="DACH">dachshund</B></strong> and the <strong><B c="AFGH">Afghan hound</B></strong> sit right next to
      each other, and both are called &ldquo;hounds.&rdquo; So they must be close family,
      right?
    </p>
    <p>
      Nope! Follow their lines in and they don&rsquo;t meet until deep in the tree. It&rsquo;s
      like two kids sitting side by side at school who aren&rsquo;t related at all. Sitting
      next to each other doesn&rsquo;t matter. Only where the lines meet does.
    </p>
  </>,
  <>
    <p>
      The <strong><B c="DACH">dachshund</B></strong> and <strong><B c="AFGH">Afghan hound</B></strong> are adjacent on the
      perimeter and share a functional label (&ldquo;hound&rdquo;), yet their MRCA is deep in
      the tree.
    </p>
    <p>
      Leaf adjacency in a circular layout is not evidence of relatedness: leaf order is only
      partly constrained by topology. Relatedness must be read from node depth, and the
      shared &ldquo;hound&rdquo; designation reflects convergent function rather than common
      descent.
    </p>
  </>,
);

L(
  "rotate",
  <>
    <p>
      Think of the tree like a mobile hanging over a baby&rsquo;s crib. You can spin any piece
      around its hook, and nobody changes families. Watch: we just spun the branch holding the{" "}
      <B c="DACH">dachshund</B> and the <B c="AFGH">Afghan hound</B>.
    </p>
    <p>
      Now they&rsquo;re on opposite sides of the circle, but they still meet at the exact same
      spot. Where the dogs sit around the edge is just how we chose to draw it. The branches
      are what matter.
    </p>
  </>,
  <>
    <p>
      Every internal node can be rotated about its parent without changing the tree: the
      topology is invariant under node rotation. Here we rotated the node subtending the{" "}
      <B c="DACH">dachshund</B> and <B c="AFGH">Afghan hound</B>.
    </p>
    <p>
      The leaves are now diametrically opposed, but their path to the MRCA is identical. Of the
      many possible leaf orderings that are consistent with the same branching pattern, the
      published figure shows one; inferences should rest on the branching pattern, never on
      leaf order.
    </p>
  </>,
);

L(
  "support",
  <>
    <p>
      How sure are the scientists? They checked their work by <strong>reshuffling</strong> the
      data and building the tree again, 100 times! It&rsquo;s like building the same Lego set
      100 times with the pieces mixed up, then seeing which parts always come out the same.
    </p>
    <Markers
      items={[
        "90–100 times out of 100: super sure",
        "70–89 times: pretty sure",
        "50–69 times: a good guess",
      ]}
    />
    <p>
      No marker means that part came out the same less than half the time. Most of those are
      near the middle, so the oldest splits are the least certain.
    </p>
  </>,
  <>
    <p>
      Node support was assessed by nonparametric <strong><Term id="bootstrap">bootstrapping</Term></strong>: loci were
      resampled with replacement and the neighbor-joining tree rebuilt over 100 replicates.
      Markers give the share of replicates recovering each node:
    </p>
    <Markers
      items={[
        "≥90% bootstrap support",
        "70–89% bootstrap support",
        "50–69% bootstrap support",
      ]}
    />
    <p>
      Unmarked nodes fall below 50%. Excluding breed-specific nodes, 105 nodes are supported in
      ≥90% of replicates, 133 in ≥70% and 150 in ≥50%. Weak support concentrates along the
      deep backbone, so basal relationships among <Term id="clade">clades</Term> remain poorly resolved.
    </p>
  </>,
);

L(
  "clades",
  <>
    <p>
      Look at the bigger branches now. Each one is a <strong><Term id="clade">clade</Term></strong>: one great-great-
      grandparent plus all of its children, grandchildren and cousins. It&rsquo;s like one whole
      side of your family. Almost every breed (150 of them) belongs to one of 23 of these big
      family groups.
    </p>
    <p>
      Most make sense: terriers with terriers, retrievers with retrievers. The gray wedges are
      loners that don&rsquo;t clearly fit into any family.
    </p>
  </>,
  <>
    <p>
      150 of 161 breeds (93%) partition into 23 multi-breed <strong><Term id="clade">clades</Term></strong> of 2–18
      breeds each with &gt;50% <Term id="bootstrap">bootstrap</Term> support. At a stricter ≥90% threshold, 29 multi-breed
      clades of 2–16 breeds together contain 78% of breeds.
    </p>
    <p>
      Eleven breeds group with no other breed at significance: five form independent clades and
      six are paraphyletic to established clades with &lt;50% support (gray). Their isolation may
      reflect unsampled close relatives or breed-specific outcrossing.
    </p>
  </>,
);

L(
  "geography",
  <>
    <p>
      Here&rsquo;s a surprise. Some family groups look like odd couples. The{" "}
      <strong><Clade id="Mediterranean">Mediterranean</Clade></strong> group puts super-fast, skinny <B c="SALU">salukis</B> next to giant fluffy{" "}
      <B c="GPYR">Great Pyrenees</B>. The <strong><Clade id="UKRural">UK Rural</Clade></strong> group puts <B c="GREY">greyhounds</B> with <B c="COLL">collies</B>.
    </p>
    <p>
      Why? People in each place made their hunting dogs and their farm dogs from the same local
      dogs. It&rsquo;s like a big family where one cousin becomes a runner and another becomes a
      farmer: different jobs, same family. Where a dog came from mattered more than its job.
    </p>
    <p>
      Most breeds here (115 of 164) come from Europe. That&rsquo;s because the idea of an
      official &ldquo;breed&rdquo; started in Britain about 150 years ago, with the first dog
      show in 1859. People in Europe and North America wrote down their dogs&rsquo; family
      trees. In most other places, dogs just lived in villages and never got breed names.
    </p>
    <p>
      <Term id="dna">DNA</Term> sharing follows the map too. Most dogs share the most DNA with dogs from their own
      continent, like cousins who live in the same town. Dogs from Australia and the Americas
      are different: many came from dogs that settlers brought from Europe. The Australian{" "}
      <B c="KELP">kelpie</B>&rsquo;s closest cousin is the <B c="BORD">border collie</B>! Pick a continent to light up its
      breeds.
    </p>
  </>,
  <>
    <p>
      Several <Term id="clade">clades</Term> combine breeds of disparate function. The <strong><Clade id="Mediterranean">Mediterranean</Clade></strong>{" "}
      clade unites sighthounds (<B c="SALU">saluki</B>) with livestock guardians (<B c="GPYR">Great Pyrenees</B>), and{" "}
      <strong><Clade id="UKRural">UK Rural</Clade></strong> unites sighthounds with herding breeds. Clade membership tracks
      geographic origin more closely than phenotype or function.
    </p>
    <p>
      The parsimonious interpretation is regional derivation of distinct functional types from a
      shared local founder stock, followed by divergent selection. Population history thus
      leaves a stronger signal than convergent functional selection.
    </p>
    <p>
      The sample is heavily European (115 of 164 breeds with origins, about 70%). This is a
      sampling and historical artifact rather than a biological one: the closed-studbook breed
      concept arose with the Victorian breed explosion (the first conformation show in 1859, the
      Kennel Club in 1873), and the dataset draws mainly on breeds registered by European and
      North American clubs. Most of the world&rsquo;s dogs are free-ranging village dogs outside
      any breed.
    </p>
    <p>
      Pairwise <Term id="haplotype">haplotype</Term> sharing is geographically structured: about three-quarters of the
      study&rsquo;s significant shared length links breeds from the same continent. Asian breeds
      are comparatively self-contained (over half of their sharing is intracontinental), whereas
      North America (~21%), Australia (~16%) and Africa (~8%) share mostly with Europe,
      consistent with colonial-era introductions; the <B c="KELP">kelpie</B>&rsquo;s strongest link is the <B c="BORD">border
      collie</B>, and the <B c="BOER">boerboel</B>&rsquo;s the <B c="BULM">bullmastiff</B>. Select a continent to highlight its breeds.
    </p>
  </>,
);

L(
  "split",
  <>
    <p>
      A few breeds don&rsquo;t all sit together. Some are newer breeds that are still settling
      in. Others depend on where the dogs came from: <B c="CANE">cane corsos</B> from Italy stay together, but
      American ones sit next to <B c="NEAP">Neapolitan mastiffs</B>.
    </p>
    <p>
      The <strong><B c="XOLO">Xoloitzcuintli</B></strong> (a hairless dog from Mexico) and the{" "}
      <strong><B c="INCA">Peruvian hairless dog</B></strong> are split up too. Some of them sit right next to
      the <B c="GSD">German shepherd</B>. That&rsquo;s a clue that, long ago, their families got mixed with
      herding dogs from Europe.
    </p>
  </>,
  <>
    <p>
      Fifteen breeds are not monophyletic. Several are recently recognized breeds still under
      development; others reflect population structure by collection site. Italian <B c="CANE">cane corsos</B>{" "}
      form a fully supported <Term id="clade">clade</Term>, whereas US-sampled cane corsos are paraphyletic and nest near
      the <B c="NEAP">Neapolitan mastiffs</B>.
    </p>
    <p>
      The <strong><B c="XOLO">xoloitzcuintli</B></strong> and <strong><B c="INCA">Peruvian hairless dog</B></strong> are split
      between divergent clades, with some individuals adjacent to the <B c="GSD">German shepherd</B>. Treemix
      places admixture events in the <Clade id="NewWorld">New World</Clade> clade centered on the German shepherd,
      consistent with introgression from European herding dogs, possibly during the Columbian
      Exchange.
    </p>
  </>,
);

// ---------------------------------------------------------------- the DNA web

L(
  "c-blocks",
  <>
    <p>
      <strong>Part two.</strong> The family tree shows how breeds split apart. But sometimes
      people mix breeds back together, and that leaves big matching pieces of <Term id="dna">DNA</Term> behind, like
      two Lego sets that share the same special pieces. Scientists drew those as a ring of
      breeds tied together by ribbons.
    </p>
    <p>
      The circle is cut into {nodes.length} blocks, one for each breed, with its name next to
      it. The breeds are in the same spots as on the family tree, so the{" "}
      <strong><B c="WOLF">grey wolf</B></strong> and <strong><B c="BSJI">basenji</B></strong> are still at the top. Point at any
      block to learn more.
    </p>
    <p>
      Every breed gets the same size block, no matter how many dogs were tested. A few breeds
      show up twice because dogs were collected in two countries: the <B c="TIBM">Tibetan mastiff</B>, <B c="SALU">saluki</B>,
      and <B c="CANE">cane corso</B>.
    </p>
  </>,
  <>
    <p>
      <strong>Part two.</strong> A bifurcating tree cannot represent reticulate history, and
      recent admixture leaves long <Term id="haplotype">identical-by-descent</Term> (IBD) haplotypes. The authors summarized
      cross-clade IBD sharing as a circos plot (their Figure 4).
    </p>
    <p>
      The ring holds {nodes.length} populations, labelled by breed name and placed to match the{" "}
      <Term id="cladogram">cladogram</Term>, with the <strong><B c="WOLF">grey wolf</B></strong> and <strong><B c="BSJI">basenji</B></strong> at the top.
      Hover any segment for its sharing profile.
    </p>
    <p>
      Segments are equal-width regardless of sample size. Three breeds (<B c="TIBM">Tibetan mastiff</B>, <B c="SALU">saluki</B>,{" "}
      <B c="CANE">cane corso</B>) are represented by two populations, sampled in the country of origin and in
      the United States, to test the effect of importation.
    </p>
  </>,
);

L(
  "c-order",
  <>
    <p>
      Start at the <strong>wolf</strong>, just left of the top, and go around the circle the
      other way from a clock&rsquo;s hands. The breeds come in the same order as the edge of the
      family tree, with the same colors for each family.
    </p>
    <p>
      So the ring is the family tree, squashed flat. Blocks next to each other are close
      family. Everything drawn <em>inside</em> the ring is new information the tree
      couldn&rsquo;t show.
    </p>
  </>,
  <>
    <p>
      From the <strong>wolf</strong> (just left of top), populations run counter-clockwise in{" "}
      <Term id="cladogram">cladogram</Term> leaf order, colored by <Term id="clade">clade</Term>, so the ring is the cladogram&rsquo;s perimeter
      projected onto a circle.
    </p>
    <p>
      Adjacency on the ring therefore inherits the tree&rsquo;s leaf ordering (with the same
      caveat about node rotation). Ribbons in the interior encode orthogonal information:
      recent IBD <Term id="haplotype">haplotype</Term> sharing across clades.
    </p>
  </>,
);

L(
  "c-ribbon",
  <>
    <p>
      Every time puppies are born, the <Term id="dna">DNA</Term> they get from their parents gets broken into smaller
      pieces, like a Lego build that loses a few connections every generation. So if two breeds
      still share a <em>big</em> piece, they had the same great-grandparent not long ago.
      Usually, that means someone mixed the two breeds.
    </p>
    <p>
      The <strong><B c="EURA">Eurasier</B></strong> was made in the 1970s from the <B c="CHOW">chow chow</B>, <B c="KEES">keeshond</B>, and{" "}
      <B c="SAMO">samoyed</B>. And sure enough, its three ribbons go straight to those three breeds.
    </p>
  </>,
  <>
    <p>
      Recombination shortens IBD segments each meiosis, so long shared{" "}
      <strong><Term id="haplotype">haplotypes</Term></strong> imply recent common ancestry. Haplotypes were phased with{" "}
      <B c="BEAG">Beagle</B> in 100-SNP windows (minimum 232 kb, above background sharing) and summed per pair
      of dogs, targeting admixture from breed formation rather than domestication.
    </p>
    <p>
      The <strong><B c="EURA">Eurasier</B></strong>, created in the 1970s as a composite of the <B c="CHOW">chow chow</B> (<Clade id="AsianSpitz">Asian
      spitz</Clade>), <B c="KEES">keeshond</B> (<Clade id="NordicSpitz">Nordic spitz</Clade>) and <B c="SAMO">samoyed</B> (unclustered), shares significant haplotypes
      with all three; because its sources sit in different <Term id="clade">clades</Term>, it resolves as its own
      single-breed clade between them.
    </p>
  </>,
);

L(
  "c-width",
  <>
    <p>
      Wider ribbons mean more shared <Term id="dna">DNA</Term>. The <B c="EURA">Eurasier</B> and <B c="CHOW">chow chow</B> share about 179 million
      DNA letters, the most of any pair. The <B c="BPIC">Berger Picard</B> and <B c="BOUV">Bouvier des Flandres</B> share 78
      million. The skinny ribbon between the Italian <B c="CANE">cane corso</B> and the <B c="STBD">Saint Bernard</B>, under 10
      million, only just made the list.
    </p>
    <p>
      One tip: a breed with lots of ribbons has to squeeze them all into one block. So compare
      ribbons to each other, not to the size of the block.
    </p>
  </>,
  <>
    <p>
      Ribbon width scales with median total pairwise IBD length. The <B c="EURA">Eurasier</B>–<B c="CHOW">chow chow</B> pair is
      the maximum (~179 Mb), <B c="BPIC">Berger Picard</B>–<B c="BOUV">Bouvier des Flandres</B> ~78 Mb, and Italian <B c="CANE">cane
      corso</B>–<B c="STBD">Saint Bernard</B> (&lt;10 Mb) sits just above the inclusion threshold.
    </p>
    <p>
      In the full plot, segment arc length is fixed while a high-degree node must partition it
      among many ribbons, so widths are comparable between ribbons but not against segment
      length.
    </p>
  </>,
);

L(
  "c-threshold",
  <>
    <p>
      Breeds in the same family share lots of <Term id="dna">DNA</Term> anyway, like brothers and sisters. So those
      pairs are left out. A ribbon only shows up when two breeds from <em>different</em>{" "}
      families share more than almost any other such pair. That leaves {links.length} ribbons.
    </p>
    <p>
      What&rsquo;s left are the surprises: people mixing in a new trait, or dogs moving to a new
      country and mixing with the dogs there.
    </p>
  </>,
  <>
    <p>
      Within-clade sharing is high by expectation (median 9,742,000 bp versus 2,184,000 bp
      between <Term id="clade">clades</Term>; K–S and Wilcoxon p &lt; 2.2e-16), so only interclade pairs are drawn. A
      ribbon requires median sharing above the 95th percentile of all interclade sharing
      (9,744,974 bp), leaving {links.length} ribbons.
    </p>
    <p>
      These outliers indicate recent admixture: deliberate outcrossing to introduce a trait, or
      introgression after importation into a new region. Strong cross-clade admixture was found
      in 117 breeds.
    </p>
  </>,
);

L(
  "c-color",
  <>
    <p>
      Each ribbon takes the color of its busier end, the breed with more friends. When lots of
      ribbons of the same color fan out across the ring, they all lead back to one popular
      breed.
    </p>
    <p>
      The <strong><B c="GSD">German shepherd</B></strong> is a great example. Its ribbons reach the <B c="BMAL">Belgian
      malinois</B>, <B c="DOBP">Doberman</B>, <B c="LEON">Leonberger</B>, Italian <B c="CANE">cane corso</B>, and more. It was created in the late
      1800s, and people have used it to help make other breeds ever since.
    </p>
  </>,
  <>
    <p>
      Ribbons are colored by their higher-degree endpoint, so same-colored fans identify hubs:
      breeds that are frequent donors of <Term id="haplotype">haplotypes</Term> to other lineages.
    </p>
    <p>
      The <strong><B c="GSD">German shepherd</B></strong> links to the <B c="BMAL">Belgian malinois</B>, <B c="DOBP">Doberman</B>, <B c="LEON">Leonberger</B>,
      Italian <B c="CANE">cane corso</B> and others. Derived from a herding dog of uncertain ancestry in the late
      1800s, it is also implicated in spreading the MDR1 drug-sensitivity variant, reported in
      about 10% of German shepherds, with links to <Clade id="UKRural">UK Rural</Clade> breeds through the <B c="AUSS">Australian
      shepherd</B>.
    </p>
  </>,
);

L(
  "c-pug",
  <>
    <p>
      On the family tree, the <B c="PUG">pug</B> sits next to the <B c="BRUS">Brussels griffon</B>. But its ribbons tell a
      bigger story. They reach Asian lapdogs like the <B c="PEKE">Pekingese</B>, <B c="SHIH">shih tzu</B>, and <B c="LHSA">Lhasa apso</B>, plus
      small breeds all around the ring.
    </p>
    <p>
      Scientists think <B c="PUG">pugs</B> were taken out of Asia long ago and then used to help make lots of
      small European breeds, like a favorite Lego piece used in many different builds.
    </p>
  </>,
  <>
    <p>
      The <B c="PUG">pug</B> nests with the <B c="BRUS">Brussels griffon</B> in the <Clade id="ToySpitz">toy spitz</Clade> <Term id="clade">clade</Term>, yet shares extensive{" "}
      <Term id="haplotype">haplotypes</Term> with the <Clade id="AsianToy">Asian toy</Clade> breeds (<B c="PEKE">Pekingese</B>, <B c="SHIH">shih tzu</B>, <B c="LHSA">Lhasa apso</B>) and with small
      breeds across many clades.
    </p>
    <p>
      The authors interpret this as early exportation from Asia followed by widespread
      contribution to European toy breeds, a case where phylogeny alone misrepresents breed
      relationships.
    </p>
  </>,
);

L(
  "c-hubs",
  <>
    <p>
      About half the breeds have one ribbon or none. Just six are connected to more than eight
      breeds outside their family: the <strong><B c="MNTY">toy Manchester terrier</B></strong>,{" "}
      <strong><B c="PUG">pug</B></strong>, <strong><B c="COOK">chinook</B></strong>, <strong><B c="AIRT">Airedale</B></strong>,{" "}
      <strong><B c="GSD">German shepherd</B></strong>, and <strong><B c="BPIC">Berger Picard</B></strong>.
    </p>
    <p>
      That many ribbons usually means one of two things. The breed was built from lots of other
      breeds, like the <B c="COOK">chinook</B>, made from sled dogs and shepherds more than 100 years ago. Or
      people liked it so much they used it to make other breeds.
    </p>
  </>,
  <>
    <p>
      Degree is highly skewed: 54% of breeds in the 23 <Term id="clade">clades</Term> share with one or zero breeds
      outside their clade, consistent with breed formation by selection within a founder
      population. Only six breeds share extensively with &gt;8 others: the{" "}
      <strong><B c="MNTY">toy Manchester terrier</B></strong>, <strong><B c="PUG">pug</B></strong>, <strong><B c="COOK">chinook</B></strong>,{" "}
      <strong><B c="AIRT">Airedale</B></strong>, <strong><B c="GSD">German shepherd</B></strong> and{" "}
      <strong><B c="BPIC">Berger Picard</B></strong>.
    </p>
    <p>
      High degree indicates either a recent composite origin (the <B c="COOK">chinook</B>, created in the 1910s
      from sled and shepherd breeds) or a popular donor breed. The generally low interclade
      sharing suggests crosses were made deliberately and for specific traits.
    </p>
  </>,
);

L(
  "c-populations",
  <>
    <p>
      Look at the two <B c="CANE">cane corso</B> blocks. Dogs from <strong>Italy</strong> connect to the <B c="GSD">German
      shepherd</B> and the <B c="COOK">chinook</B>. Dogs from the <strong>United States</strong> connect to the{" "}
      <strong><B c="ROTT">Rottweiler</B></strong>, and the Italian dogs don&rsquo;t.
    </p>
    <p>
      <B c="CANE">Cane corsos</B> have only lived in the US for about 30 years, and the American dogs have
      already mixed a little with local dogs. It&rsquo;s like cousins who moved to a new town
      and made new friends.
    </p>
  </>,
  <>
    <p>
      The two <B c="CANE">cane corso</B> populations diverge. <strong>Italian</strong> dogs share with the <B c="GSD">German
      shepherd</B> and <B c="COOK">chinook</B>; <strong>US</strong> dogs share significantly with the{" "}
      <strong><B c="ROTT">Rottweiler</B></strong> and other mastiffs, sharing absent from the Italian sample.
    </p>
    <p>
      With fewer than 30 years in the US, this reflects post-importation admixture. Importation
      bottlenecks are also visible in inbreeding coefficients: US versus Chinese <B c="TIBM">Tibetan mastiffs</B>{" "}
      (F = 0.15 versus 0.07) and US versus country-of-origin <B c="SALU">salukis</B> (F = 0.21 versus 0.10).
    </p>
  </>,
);

L(
  "c-silent",
  <>
    <p>
      The {silentCount} lit-up blocks have no ribbons at all. They include most <Clade id="Mediterranean">Mediterranean</Clade>{" "}
      breeds (<B c="SALU">salukis</B>, <B c="AFGH">Afghan hounds</B>, <B c="GPYR">Great Pyrenees</B>), most sniffing hounds like the basset and{" "}
      <B c="BEAG">beagle</B>, and the poodles.
    </p>
    <p>
      No ribbons means no recent mixing with other families. Scientists think the
      Mediterranean and <Clade id="AsianSpitz">Asian spitz</Clade> families, which share the least, might be some of the
      oldest dog families of all, like the oldest branch of a very old family tree.
    </p>
  </>,
  <>
    <p>
      The {silentCount} highlighted populations show no significant interclade sharing,
      including most <Clade id="Mediterranean">Mediterranean</Clade> breeds, most <Clade id="ScentHound">scent hounds</Clade> and all three poodle varieties.
    </p>
    <p>
      Median interclade sharing is lowest in the <Clade id="AsianSpitz">Asian spitz</Clade> (0) and Mediterranean (516,900 bp){" "}
      <Term id="clade">clades</Term>, implying they are the most divergent and possibly oldest, consistent with an early
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
      The circle chart drew each connection as a ribbon straight across the middle. Here&rsquo;s
      another way to draw it: each line starts at one breed, follows the family tree&rsquo;s
      branches in toward the great-grandparent the two breeds share, then goes back out to the
      other breed, like walking from one cousin&rsquo;s house to another along family roads.
    </p>
    <p>
      Take the <strong><B c="EURA">Eurasier</B></strong> again. A family tree can only split, but this breed was
      made by joining three: the <B c="CHOW">chow chow</B>, <B c="KEES">keeshond</B> and <B c="SAMO">samoyed</B>. Its three lines go to each of
      those families, so it ends up in a spot of its own between them.
    </p>
  </>,
  <>
    <p>
      The same interclade sharing is rendered with hierarchical <strong>edge bundling</strong>:
      each edge is a B-spline routed through the <Term id="cladogram">cladogram</Term>&rsquo;s internal nodes along the path
      between the two leaves via their MRCA, so edges sharing tree paths coalesce.
    </p>
    <p>
      The <strong><B c="EURA">Eurasier</B></strong> illustrates why a tree is an incomplete model of breed
      history: a composite of three lineages cannot be represented by bifurcation, so
      neighbor-joining places it between its sources. As the authors note, adding further
      hybrids will continue to rearrange the topology.
    </p>
  </>,
);

L(
  "crossings",
  <>
    <p>
      Now we&rsquo;re showing every connection between breeds from <em>different</em> families,
      all at once. Lines that travel the same branches bunch into thick bundles, like the wires
      behind a TV. A thick bundle means lots of mixing between two parts of the tree; a single
      thin line is a one-time mix.
    </p>
    <p>
      This picture shows the old family tree and the last 200 years of mixing together. In all,
      117 breeds show this kind of recent mixing.
    </p>
  </>,
  <>
    <p>
      All significant interclade edges are bundled simultaneously. Bundle density reflects the
      volume of admixture between subtrees; isolated edges represent single introgression events.
    </p>
    <p>
      The representation sacrifices the circos plot&rsquo;s quantitative widths for topological
      context, overlaying reticulate admixture on the bifurcating phylogeny. 117 breeds show
      strong interclade admixture; calibrated against dated crosses, these events fall mostly
      within the past ~200 years, the Victorian breed explosion.
    </p>
  </>,
);

L(
  "missing-links",
  <>
    <p>
      Every place where two branches meet is a great-great-grandparent nobody has ever met.
      Scientists only had <Term id="dna">DNA</Term> from dogs alive today, so they figured out those grandparents by
      working backwards, like guessing what your great-great-grandma looked like from all her
      great-grandchildren. In human history, these unknown ancestors are called{" "}
      <strong>missing links</strong>.
    </p>
    <MLFigure>
      People didn&rsquo;t come from gorillas! Gorillas and people are more like distant cousins
      who share a great-great-great-grandparent from about 8 to 10 million years ago. Nobody has
      ever found that ancestor. That&rsquo;s the missing link. Figures are simple icons.
    </MLFigure>
    <p>
      Dogs have a missing link too: the old wolf family that dogs came from, which has died out.
      Watch the chart. If scientists found that family&rsquo;s DNA, it would slide in right where
      dogs and wolves split. Every breed scoots over to make room, like adding a new piece to a
      Lego build without moving the rest.
    </p>
  </>,
  <>
    <p>
      Every internal node is an unsampled hypothetical ancestor, inferred from extant taxa
      alone. In paleoanthropology such unsampled ancestral forms are popularly called{" "}
      <strong>missing links</strong>; the last common ancestor of humans and gorillas, for
      instance, remains unrecovered.
    </p>
    <MLFigure>
      Humans and gorillas are sister lineages descending from a hominine ancestor of roughly
      8–10 Ma, not known from fossils. On the human side the record includes{" "}
      <em>Australopithecus</em> (~4–2 Ma) and <em>Homo erectus</em> (~2 Ma–100 ka) before
      anatomically modern humans (~300 ka). Figures are simplified icons.
    </MLFigure>
    <p>
      For dogs, the analogous node is the extinct Late Pleistocene wolf population that gave rise
      to dogs. In the animation, ancient <Term id="dna">DNA</Term> from that population joins as a terminal at the
      wolf–dog divergence node, displacing leaves without altering the existing topology, a
      simplification. In practice, ancient genomes can reveal admixture that rearranges deep
      relationships and would supply a directly dated calibration point.
    </p>
  </>,
);
