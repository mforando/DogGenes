# Language review: the first two tabs

**Scope:** the scrolling narratives of *The history of dogs* (`/`) and *Family tree & DNA web* (`/tree`), in all three reading levels: Puppy, Adult and Albert Pawstein.

**Status:** recommendations only. Nothing on the site has been changed.

**Sources reviewed:**
- `src/lib/steps.tsx` (Adult text)
- `src/lib/circosSteps.tsx` (Adult text, chord section)
- `src/lib/historyLevels.tsx` and `src/lib/levels.tsx` (Puppy and Pawstein text)
- the hero deks in `HistoryStory.tsx` and `Story.tsx`, the glossary intro and the footer

---

## 1. Summary

| | Steps now | Steps proposed | Adult words now | Adult words proposed |
|---|---|---|---|---|
| The history of dogs | 7 | 6 | ~810 | ~560 |
| Family tree & DNA web | 23 | 17 | ~2,150 | ~1,350 |

Puppy and Pawstein shrink by about the same share.

The text is accurate and friendly. It runs long for five reasons:

1. **The same facts are told several times.**
   - **The extinct-wolf ancestor** is explained 5 times: the home *wolves* step, the tree *root* step, and twice in *missing links* (body and caption). Tab 1 should own it; Tab 2 needs a few words at most.
   - **The Victorian breed explosion** (1859 show, 1873 Kennel Club) is told 3 times: home *modern*, home *lineages* and tree *geography*. Pawstein adds a fourth in *crossings*.
   - **The Eurasier's origin** is told twice, in *c-ribbon* and *bundle*.
   - **"Breeds are young"** is said twice on Tab 1 alone, in *first* and *lineages*.
2. **Instructions repeat what the interface already says.**
   - The text keeps telling the reader what to do: "Hover over a photo to read its story", "Pick a site to see what was found", "Watch:", "Point at any block", "Try it yourself".
   - Each widget already prompts for itself. Keep one instruction per new kind of interaction and cut the rest.
   - Most of these also say "hover", which phone users can't do.
3. **Throat-clearing openers.** "Start close to home." "Now zoom out about 60 times." "Here's the twist." "Nope." "Take the Eurasier again." "Sure enough." These are spoken-word transitions. In news writing the fact itself is the transition.
4. **Stacked hedges and asides.**
   - Some sentences pile up qualifiers: "most likely an extinct population of wolves rather than an ancestor of today's dogs"; "they may all be partly right".
   - Some carry two levels of asides, such as the *root* step's "(cousins, not ancestors: dogs come from …)".
5. **A few cards are mini essays.** *Geography* (318 words) and *missing links* (260 words) are each 3–5 times the length of their neighbors. Readers scroll past them.

### Errors and inconsistencies to fix whatever else changes

| Where | Problem | Fix |
|---|---|---|
| `steps.tsx` · *first*, Adult | "Most breeds are a recent invention, **but** a handful are far older, **though**" says the contrast twice. | Drop "though" (see the rewrite). |
| `steps.tsx` / `levels.tsx` · *geography* | "115 of **164**" breeds, while the rest of the site says the study had **161** breeds. | Say "164 populations", or recount by breed. |
| `circosSteps.tsx` · *threshold*, Adult | "share more than 95% of other such pairs" is hard to follow. | "only the top 5 percent of those pairs". |
| `levels.tsx` · *c-ribbon*, Pawstein | "phased with `<B c="BEAG">Beagle</B>`" links BEAGLE, the phasing software, to the beagle **breed**. Hovering it shows a beagle photo. | Remove the `<B>`. Write "BEAGLE (Browning & Browning)" in plain text. |
| *missing-links*, Adult | "in this simple picture none changes places: a sample of that ancestor fills in its fork rather than rearranging the branches that grew from it" | "the breeds shift to make room, but none changes place." |
| Breed names in prose | Capitalization is inconsistent: "samoyed", "chinook", "Belgian malinois", "xoloitzcuintli" (Pawstein) vs "Xoloitzcuintli" (Adult). | Follow AP/NYT style: capitalize the proper-noun part (Samoyed, Chinook, Malinois, Xoloitzcuintli). |
| "grey wolf" | NYT and *The Post* write **gray** wolf. | Keep the data label as is, but use "gray" in Adult prose. |
| Every "Hover over …" | Doesn't work on touch screens. | Use "Select", "Tap or hover", or nothing. |

---

## 2. Voice targets for each mode

### Adult: NYT / *Washington Post* explainer register
*Models: The Upshot, Post graphics explainers.*

- **Reading level:** grade 9–11, average sentences of 16–20 words. Mix long and short sentences.
- **Lead with the finding.** Each card's first sentence is what the reader should remember. Its second sentence is the evidence.
- **Verbs and attribution:**
  - Use concrete verbs ("crashed", "replaced", "cluster").
  - Attribute claims to people: "the researchers found", "the study's authors think".
  - Avoid "Here's the twist" and "Nope".
- **Second person sparingly.** Use "you" only when giving a chart instruction.
- **House style:**
  - numbers: "10 boxers", "about 70 percent", "8 million to 10 million years";
  - spell out "percent" in prose;
  - "counterclockwise";
  - no exclamation points.
- **Length:** 60–100 words per card. One idea per card, plus one supporting example.

### Puppy: about grade 4–5
- **Sentences:** 8–14 words, one idea per sentence.
- **Analogies:** at most one per card, and don't reuse them.
  - The Lego analogy appears **five times** (DNA, bootstrapping, haplotypes, the pug, missing links).
  - "Great-great-grandparent" appears **six times**.
  - Keep the Lego analogy once, for DNA. Give each other concept its own image, or none.
- **Exclamation points:** at most one per tab. Several cards rely on them now.
- **Concepts:** keep every one; cut the numbers that don't help (72 wolves, 179 Mb).

### Albert Pawstein: a scientist reading a figure legend
- **Lead with the result, then the method in one clause.** The current text often reads like a methods section.
- **Keep numbers that back a claim.** Move instrument details that don't (boxer SNP ascertainment, MAF 0.351 vs 0.260) into the footer's methods note.
- **Keep the jargon,** but define a term once per tab. Readers can open the glossary for the rest.

---

## 3. Condensing the narrative: merges

### Tab 1: The history of dogs (7 → 6 steps)

| New step | Combines | Why |
|---|---|---|
| 1 · Most breeds are younger than you think | *modern* | Unchanged, trimmed. |
| 2 · Dogs came first | *first* | Trimmed. It no longer repeats "breeds are recent". |
| **3 · An extinct wolf, an unknown birthplace** | ***wolves* + *where*** | Both say "the origin is uncertain". *Where* is only 71 words. The timeline view can show the union of both focus sets: `split, lgm, eastasia, europe, siberia`. |
| 4 · The oldest dogs we've dug up | *fossils* | Trimmed. It gains the distemper detail from the Pawstein text, the most human fact on the page. |
| 5 · How a wolf becomes a dog | *how* | Trimmed. |
| 6 · Five family lines by the end of the Ice Age | *lineages* | Drop the middle paragraph, "Today's breeds are far younger…", which repeats step 1. |

**Optional:**
- The Robert K. Wayne quote in *wolves* has no setup; "We're very surprised that they're not" doesn't say what "they" are not. Either cut it, or set it up: *"Everyone assumed dogs came from gray wolves," … "We're very surprised that they're not."* Only add the first half if a source for that wording exists. Otherwise, cut the quote.
- The CTA "Learn more about the genetic history of dogs →" is vague. Suggest **"Next: how 161 breeds are related →"**.

### Tab 2: Family tree & DNA web (23 → 17 steps)

**Part one: the tree**

| New step | Combines | Notes |
|---|---|---|
| **1 · Read it from the center out** | ***ring* + *root*** | Both explain how to read the layout. Use the *root* view: outgroup and basenji highlighted. Drop the extinct-wolf aside; Tab 1 covers it. |
| 2 · Each wedge is a breed | *wedge* | Trimmed. |
| 3 · Follow the lines to where they meet | *forks* | Trimmed. |
| **4 · Neighbors aren't necessarily family** | ***neighbors* + *rotate*** | Same two breeds, same lesson. Show the path, then run the flip about 1.2 s after the step becomes active, or when the reader scrolls 50% through the card. |
| 5 · Little markers rate the confidence | *support* | Cut to the legend and one sentence. |
| **6 · Breeds fall into 23 families** | ***clades* + the first two paragraphs of *geography*** | The "odd couples" point (Mediterranean, UK Rural) is the reason clades are interesting, so it belongs with them. View: the clade ring, with the two example clades emphasized. |
| 7 · Why so European? | the rest of *geography*, plus the globe | Cut from 230 to ~120 words. Keep the globe. |
| 8 · Breeds that won't sit together | *split* | Trimmed. |
| **9 · The missing link** | ***missing-links*, moved here** | It's about the **tree**, not the chord diagram, so it should close Part one. That way Part two (the web) flows straight into bundling, which ties the two together. Cut from 260 to ~110 words; shorten the figure caption. |

**Part two: the DNA web**

| New step | Combines | Notes |
|---|---|---|
| **10 · The tree, bent into a ring** | ***c-blocks* + *c-order*** | Both explain the layout of the ring. Use the *c-order* view (clade ring, start marker). |
| **11 · A ribbon marks a recent cross** | ***c-ribbon* + *c-threshold*** | The threshold explains why a ribbon means something, so it belongs in the definition. View: the Eurasier ribbons. The "all ribbons" view returns in step 16. If you want the full web shown early, keep *c-threshold* as its own card at about 40 words. |
| 12 · Thicker ribbon, more in common | *c-width* | Trimmed. |
| **13 · A handful of breeds hold the web together** | ***c-color* + *c-hubs*** | The color rule exists to find hubs, and the German shepherd is one of the six hubs. View: start on the German shepherd fan; optionally widen to all six hubs halfway through the card. |
| 14 · The pug gets around | *c-pug* | Trimmed. |
| 15 · A tale of two cane corsos | *c-populations* | Trimmed. |
| 16 · No ribbons tells a story too | *c-silent* | Trimmed. |
| **17 · The web, routed through the tree** | ***bundle* + *crossings*** | The Eurasier example repeats step 11. Keep it as one closing sentence. View: `links: "cross"`. Optionally open on the Eurasier-only bundle. |

**Implementation notes, for later:**
- Keep the surviving step ids so existing hash links keep working: `#geography` (the target of the `/geography` redirect), `#c-blocks` (CircosReplica's "Back to the walkthrough") and `#c-pug`.
- For each retired id, point it at the step that absorbed it with a small alias map in `Story.tsx`.

**Elsewhere on Tab 2:**
- **Glossary vs step text.** The Primer above the scroller already defines *cladogram*, *clade*, *bootstrap*, *haplotype* and *DNA*, and every one of those words opens its definition on hover. The step text can therefore drop its own inline definitions, except the first use of *clade* and *haplotype*, where the definition drives the story.
- **CircosReplica caption.** It restates step 11. Shorten it to: *"Each block is a breed, in family-tree order. Ribbons join breeds from different families that share unusually long stretches of DNA, a sign of crossing in the last two centuries. Wider ribbons mean more sharing."*

---

## 4. Proposed copy: The history of dogs

Kickers and titles stay unless noted. `[Widget]` marks where an existing component sits.

### Hero dek

- **Adult:** Dogs were the first animal people domesticated, thousands of years before anyone planted a crop. Their story begins with a wolf that no longer exists. Scroll back through 40,000 years of evidence.
- **Puppy:** Dogs were the first animals people ever tamed, long before farms or towns. Scroll down to travel back 40,000 years and meet the very first dogs.
- **Pawstein:** The dog was the first domesticate, predating agriculture by millennia. Scroll through 40,000 years: the contested origin, the genomic signatures of domestication and the earliest archaeological evidence.

### 1 · Most breeds are younger than you think

**Adult**
> Most of today's breeds were invented in Victorian Britain. The first dog show was held in Newcastle in 1859; the Kennel Club followed in 1873 and the American Kennel Club in 1884. Breeders wrote standards, recorded pedigrees and closed each breed to outsiders.
>
> The timeline shows the study's breeds with a known founding date, from the Jack Russell terrier (1819) to the American hairless terrier (1972).
>
> *Stats:* **N** breeds with a known founding date · **M** have no recorded start; they grew out of older local dogs.

**Puppy**
> Most dog breeds are pretty new. In 1859, people in England held the first dog show. Soon, clubs kept lists of every puppy's parents. After that, only dogs on a breed's list could have puppies in that breed.
>
> The timeline shows when some breeds began, from the Jack Russell terrier in 1819 to the American hairless terrier in 1972. Tap a photo to read its story.
>
> *Stats:* **N** breeds with a known birthday · **M** with no birthday on record. They grew slowly from village and farm dogs.

**Pawstein**
> Formal breeds date to the 19th century. Conformation shows (Newcastle upon Tyne, 1859), the Kennel Club (1873) and the AKC (1884) introduced written standards and closed studbooks, which halted gene flow between breeds and imposed strong selection on small founder groups. Parker et al. call this the Victorian breed explosion; it is why most breeds are young, homogeneous and sharply bounded.
>
> Plotted: study breeds with a documented founding date, from the Jack Russell terrier (1819) to the American hairless terrier (1972).

### 2 · Dogs came first

**Adult**
> Pull back to the dawn of farming, about 11,400 years ago, and two centuries of breeds shrink to a sliver on the right. Dogs were the first animal people domesticated. They lived with humans before there were cattle, sheep or fields of wheat.
>
> A few breeds are much older than the Victorian era: types of dog that hunted, herded and kept people company for centuries before anyone wrote a standard. Those with an approximate age appear on the timeline; five have no agreed date.
>
> `[AncientBreeds]`

**Puppy**
> Now go back 11,400 years, to when people first started farming. The new breeds squish into a thin line on the right. Dogs were the first animals people ever tamed. They lived with people before there were cows, sheep or wheat fields.
>
> A few kinds of dogs are much older than breed clubs. Some have a rough age on the timeline. Five are so old that no one knows when they began.

**Pawstein**
> At Holocene scale the modern breeds collapse into the last two centuries. The dog is the earliest domesticate, integrated into human communities before the Neolithic domestication of livestock and cereals (~11,400 years ago).
>
> A minority of breeds carry ancestry that predates the Victorian expansion. Those with approximate origins (archaeology, iconography or ancient-DNA continuity) are plotted; five have no agreed date.

### 3 · An extinct wolf, an unknown birthplace *(merges wolves + where)*
Kicker: **Origins** · Title: **Not from today's wolves**

**Adult**
> Go back into the last Ice Age, and the story takes a turn: dogs did not descend from the gray wolves alive today. Their ancestor was an Ice Age wolf population that has since died out. The two lineages split between 40,000 and 27,000 years ago.
>
> About 25,000 years ago, at the coldest point of the Ice Age, wolf numbers crashed. Survivors spread out from Beringia, the land bridge between Siberia and Alaska, and replaced wolves elsewhere. Today's gray wolf is the dog's cousin, not its grandparent.
>
> Where domestication happened is still disputed. Studies have pointed to East Asia, Siberia and Europe. A 2022 analysis of 72 ancient wolf genomes found that all dogs carry ancestry from an eastern wolf population, and that dogs in West Asia, Africa and southern Europe carry extra ancestry from Middle Eastern wolves.

**Puppy**
> Now go way back, to the Ice Age. Here's a surprise: dogs did not come from the gray wolves we see today. They came from a group of Ice Age wolves that is gone now. Dogs and wolves went separate ways between 40,000 and 27,000 years ago.
>
> Later it got so cold that most wolves died. The few that were left spread out again from near Alaska. So today's gray wolf is a dog's cousin, not its great-grandparent.
>
> Where did the first dogs live? Scientists still don't agree. Some say East Asia. Some say Siberia. Some say Europe.

**Pawstein**
> Dogs do not descend from extant *Canis lupus*. Genome-wide data place their source in a now-extinct Late Pleistocene wolf population, with divergence at ~40,000–27,000 years ago (calibration-dependent). Wolves passed through a severe bottleneck near the Last Glacial Maximum (~25,000 years ago), and a lineage expanding from Beringia later replaced most others, so the gray wolf rooting the dog tree is a sister lineage, not an ancestor.
>
> The geographic origin remains contested. Mitochondrial, Y-chromosome and nuclear analyses have favored East Asia, Siberia and Europe, and some models invoke more than one domestication. Ancient genomes from 72 wolves (Bergström et al. 2022) show that all dogs derive mostly from an eastern source, with additional Southwest Asian wolf admixture in dogs of Southwest Asia, Africa and southern Europe.

### 4 · The oldest dogs we've dug up

**Adult**
> The oldest bones that scientists agree came from a dog were found at Erralla, Spain, and are about 17,500 years old. At Bonn-Oberkassel in Germany, a puppy was buried with two people about 14,200 years ago, the oldest known grave shared by people and a dog. The puppy had survived distemper, which suggests someone nursed it.
>
> `[DigSites]`
>
> Older dog-like skulls from Goyet, Belgium (36,000 years) and Siberia's Altai Mountains (33,300 years) remain disputed; DNA suggests the Goyet animal belonged to an extinct wolf population. Skulls with an unmistakably dog-like shape appear about 11,000 years ago.

**Puppy**
> The oldest bones that everyone agrees came from a dog were found in Erralla, Spain. They are about 17,500 years old. In Germany, a puppy was buried with two people about 14,200 years ago. The puppy had been very sick, and someone took care of it.
>
> `[DigSites]`
>
> Some even older skulls look a bit like a dog's. But scientists argue about them. Skulls that clearly look like a dog's show up about 11,000 years ago.

**Pawstein**
> The earliest generally accepted dog remains are from Erralla, Spain (~17,500 years ago). At Bonn-Oberkassel, a juvenile dog that survived distemper was interred with two humans ~14,200 years ago: the oldest undisputed joint burial, and evidence of care.
>
> `[DigSites]`
>
> Putative Paleolithic dogs from Goyet (~36,000 years) and Razboinichya Cave, Altai (~33,300 years) are dog-like but contested. Goyet's mitochondrial DNA is basal to modern dogs and wolves, consistent with an extinct wolf lineage or a failed early domestication. Unambiguously dog-like crania appear ~11,000 years ago.

### 5 · How a wolf becomes a dog

**Adult**
> Scientists have several explanations, and more than one may be right. Bolder, calmer wolves may have scavenged around human camps. Wolves and people may have teamed up while following the same reindeer herds. Or, in hard winters, people may have shared surplus lean meat with wolves.
>
> The DNA shows what changed most: behavior. Domestication reshaped genes involved in brain development, the adrenaline stress response and the digestion of fat and starch. Variants near the genes behind Williams-Beuren syndrome, a human condition marked by unusual friendliness, are linked to dogs' sociability. When dogs and their owners gaze at each other, oxytocin rises in both.

**Puppy**
> How did a wild wolf turn into a dog? Scientists have a few ideas. Maybe brave, calm wolves came close to people's camps to eat scraps. Maybe wolves and people hunted the same reindeer and became a team. Maybe people shared extra meat with wolves in the long winters.
>
> The DNA shows what changed most: how dogs act. Dogs got genes that help them stay calm and friendly. When you and your dog look into each other's eyes, both of your brains make a feel-good chemical called oxytocin.

**Pawstein**
> Three non-exclusive models: a commensal pathway in which less fearful wolves exploited human refuse and self-selected for tameness; a partnership with hunter-gatherers tracking the same reindeer; and provisioning with surplus lean protein in Ice Age winters.
>
> Selection scans are dominated by behavioral and metabolic loci: neural development, catecholamine signaling, and fat and starch digestion (e.g. *AMY2B* copy number). Structural variants near *GTF2I* and *GTF2IRD1*, in the region deleted in Williams-Beuren syndrome, are associated with hypersociability. Mutual gaze raises oxytocin in both dog and owner.

### 6 · Five family lines by the end of the Ice Age

**Adult**
> By the end of the Ice Age, 11,700 years ago, dogs had divided into at least five lineages. They are known from ancient remains in the Levant, northwest Russia, Siberia's Lake Baikal region and the early Americas, and from the New Guinea singing dog, which survives today. Dogs most likely reached the Americas with the first people.
>
> Modern breeds were carved from that regional stock, mostly in the last two centuries, and by a different process. For most of their history, dogs changed the way wild animals do. Breeds were made by people choosing which dogs had puppies, selecting for a few traits and then closing the studbooks. That leaves a distinct mark in their DNA. The simulation below shows the difference.
>
> `[SelectionExplainer]`

**Puppy**
> By the end of the Ice Age, 11,700 years ago, there were already at least five big dog families. Scientists found old dogs near the Mediterranean Sea, in Russia, in Siberia and in the Americas. The fifth family is the New Guinea singing dog, which is still alive today.
>
> Breeds came much later, and in a different way. In nature, the world decides which pups grow up and have puppies. Breeds were made by people picking which dogs got to have puppies. Try it yourself:

**Pawstein**
> By the Pleistocene–Holocene transition (~11,700 years ago), ancient genomes resolve at least five lineages: Levantine, Karelian, Baikal, ancient American and the New Guinea singing dog. Pre-contact American dogs share a Siberian source, consistent with dispersal alongside the first Americans.
>
> Breeds are recent formalizations of that structure, produced by a different regime: strong artificial selection on a few traits, small founder groups and closed studbooks. The result is long runs of homozygosity, high linkage disequilibrium and shallow, star-like relationships among breeds, which makes breed trees poor analogues of species phylogenies. The simulation contrasts the two regimes.

---

## 5. Proposed copy: Family tree & DNA web

### Hero dek

- **Adult:** In 2017, scientists analyzed the DNA of {N} dogs from 161 breeds and drew a single family tree showing how the breeds are related. It is elegant, and easy to misread. Here is how to read it, one step at a time. No science background needed.
- **Puppy:** In 2017, scientists checked the DNA of {N} dogs from 161 breeds. Then they drew one giant family tree of all the breeds. It's tricky to read, so we'll go step by step.
- **Pawstein:** Keep the current text. It is already tight.

### Glossary intro

- **Adult:** A few terms come up often. Hover over or tap any underlined word to see its definition again.
- **Puppy:** Here are a few science words you'll see. Tap any underlined word to see what it means.
- **Pawstein:** Keep the current text.

### Part one: the tree

#### 1 · Read it from the center out *(merges ring + root)*
Kicker: **The big picture**

**Adult**
> Each sliver on the rim is a group of dogs whose DNA was tested, {N} in all. Lines connect them by genetic similarity: the more alike two dogs' DNA, the closer they sit. The chart is a cladogram, a family tree that shows the order in which groups split apart, but not when. Line lengths carry no meaning.
>
> The center is the oldest split, anchored by the golden jackal, a wild relative. Next come gray wolves, dogs' closest living relatives, then the basenji, an ancient African breed. The farther a branch sits from the center, the more recent the split.

**Puppy**
> This circle is a giant family tree for {N} dogs. Each tiny sliver on the edge is a group of real dogs. Dogs with very alike DNA sit close together. The lines show who branched off from whom. How long a line is doesn't matter.
>
> The middle is the oldest part. Scientists added the golden jackal, a wild cousin, to mark it. Next come gray wolves, dogs' closest cousins. Then comes the basenji, a very old breed from Africa. The closer a dog is to the edge, the newer its branch.

**Pawstein**
> A neighbor-joining cladogram of {N} dogs from 161 breeds, built from identity-by-state distances over 150,067 SNPs (Illumina CanineHD). Branch lengths are not to scale; read the topology only.
>
> The tree is rooted on the golden jackal. Gray wolves resolve as the sister group to dogs (extant relatives, not ancestors), and the basenji branches first among breeds. Depth from the root gives relative, not absolute, order of divergence.
>
> *Move the note on boxer SNP ascertainment (MAF 0.351 vs 0.260) to the Pawstein footer.*

#### 2 · Each wedge is a breed

**Adult**
> The 10 boxers in the study have DNA so similar that they always cluster, so they are drawn as one wedge; each dot is a dog. Nearly every breed behaves the same way: 146 of 161 form their own tidy wedge. Breeds, in other words, are genetic islands.

**Puppy**
> Meet the boxers. All 10 boxers in the study have DNA so alike that they always land together, so they're drawn as one wedge. Each dot is one dog. Almost every breed does this: 146 of 161 make their own wedge. Each breed is like its own little island.

**Pawstein**
> Individuals forming one terminal clade are collapsed to a wedge (dot = dog; width ∝ sample size); the 10 boxers form one. Across 100 bootstrap replicates, 146 of 161 breeds (91%) are monophyletic with 100% support. Nine of the other 15 were newly recognized or not yet recognized by the AKC at sampling.

#### 3 · Follow the lines to where they meet

**Adult**
> To see how closely two breeds are related, trace each one inward until their lines meet. That junction is their most recent shared ancestor; the sooner the lines meet, the closer the relationship. The golden retriever's nearest relative here is the flat-coated retriever, followed by the Labrador and, further back, the Newfoundland.

**Puppy**
> Are two breeds close family? Follow each one toward the middle until their lines meet. That spot stands for an ancestor they share. The sooner the lines meet, the closer the family. The golden retriever's closest family is the flat-coated retriever, almost like a twin. The Labrador is more like a cousin. The Newfoundland is a distant cousin.

**Pawstein**
> Relatedness is read from the MRCA. The golden retriever's sister taxon is the flat-coated retriever, then the Labrador and the Newfoundland. Haplotype sharing (median 66,993,738 bp) dates the golden–flat-coated split to about 1895, consistent with recorded founding crosses in 1868–1890.

#### 4 · Neighbors aren't necessarily family *(merges neighbors + rotate)*
Kicker: **Watch out**

**Adult**
> The dachshund and the Afghan hound sit side by side on the rim, and both are called hounds. But their lines don't meet until deep in the tree.
>
> Think of the tree as a hanging mobile: any branch can spin on its hook without changing who is related to whom. Spin this one and the two breeds land on opposite sides of the circle, with exactly the same path to their common ancestor. The order around the rim is a drawing choice. Only the branching counts.

**Puppy**
> The dachshund and the Afghan hound sit side by side, and both are called hounds. So they must be close family, right? Wrong. Their lines don't meet until deep in the tree.
>
> Think of a mobile over a baby's crib. You can spin any piece, and nothing really changes. Watch us spin this branch. Now the two dogs are far apart, but their lines still meet in the same spot. Where a dog sits on the edge doesn't matter. Only where the lines meet does.

**Pawstein**
> The dachshund and Afghan hound are adjacent on the perimeter and share a functional label, yet their MRCA is deep. Leaf order in a circular layout is only partly constrained by topology: any internal node can rotate without changing the tree. Rotating their subtending node places them diametrically opposite with an identical path to the MRCA. The shared "hound" label reflects convergent function, not common descent.

#### 5 · Little markers rate the confidence

**Adult**
> The researchers rebuilt the tree 100 times from resampled data, a test called bootstrapping. Each marker shows how often a fork came out the same way:
>
> `[legend: 90–100 times: rock solid · 70–89: fairly sure · 50–69: a reasonable guess]`
>
> Unmarked forks appeared less than half the time. Most sit near the center, so the oldest splits are the least certain.

**Puppy**
> How sure are the scientists? They mixed up their data and built the tree 100 times. Then they checked which parts came out the same each time.
>
> `[legend: super sure · pretty sure · a good guess]`
>
> No marker means that part kept changing. Most of those are near the middle, so the oldest splits are the hardest to be sure about.

**Pawstein**
> Nonparametric bootstrap: loci resampled with replacement, 100 replicates.
>
> `[legend unchanged]`
>
> Excluding breed-specific nodes, 105 nodes reach ≥90% support, 133 reach ≥70% and 150 reach ≥50%. Weak support concentrates along the backbone, so basal relationships among clades remain poorly resolved.

#### 6 · Breeds fall into 23 families *(clades + the first half of geography)*
Kicker: **Family groups**

**Adult**
> Pull back, and breeds group into larger branches called clades: a shared ancestor and all of its descendants. Almost every breed, 150 in all, falls into one of 23 clades of two to 18 breeds. The gray wedges are loners that fit no group.
>
> Most groupings are intuitive: terriers with terriers, retrievers with retrievers. Some are not. The Mediterranean clade pairs sighthounds like the saluki with livestock guardians like the Great Pyrenees; the UK Rural clade pairs greyhounds with collies. The likely explanation is that each region bred its hunting dogs and its farm dogs from the same local stock. Origin mattered more than job.

**Puppy**
> Now look at the bigger branches. Each one is a clade: an ancestor and all of its family. Almost every breed belongs to one of 23 clades. The gray wedges are loners.
>
> Most clades make sense, like terriers with terriers. Some are odd couples. Speedy, skinny salukis share a clade with giant, fluffy Great Pyrenees. Why? People in each place made their hunting dogs and their farm dogs from the same local dogs. Where a dog came from mattered more than its job.

**Pawstein**
> 150 of 161 breeds (93%) fall into 23 clades of 2–18 breeds with >50% bootstrap support (29 clades holding 78% of breeds at ≥90%). Eleven breeds group with no other: five form independent clades, and six are paraphyletic to established clades (gray).
>
> Clades track geography over function. The Mediterranean clade unites sighthounds (saluki) with livestock guardians (Great Pyrenees); UK Rural unites sighthounds with herders. Parsimony favors regional derivation of functional types from shared founder stock, followed by divergent selection.

#### 7 · Why so European? *(the second half of geography, with the globe)*
Kicker: **A surprise** · Title: **Where they're from beats what they do** → suggest **Why so many breeds are European**

**Adult**
> About 70 percent of the populations on the globe (115 of 164) are European. That reflects history more than biology. The idea of a breed, with a written standard and a closed studbook, began in Victorian Britain and spread through kennel clubs in Europe and North America, and the study drew mostly on breeds those clubs recognize. Most of the world's dogs are village dogs that belong to no breed.
>
> Shared DNA follows the map, too: about three-quarters of it links breeds from the same continent. Asian breeds keep largely to themselves. Breeds from the Americas, Australia and Africa trace back mostly to European dogs brought by settlers; the Australian kelpie's closest relative is the border collie. Select a continent to see its breeds.

**Puppy**
> Most breeds here come from Europe: 115 of 164. That's because the idea of an official breed started in Britain. In most other places, dogs lived in villages and never got breed names.
>
> Dogs share the most DNA with dogs from their own continent. But many dogs in Australia and the Americas came from dogs that settlers brought from Europe. The Australian kelpie's closest relative is the border collie! Tap a continent to light up its breeds.

**Pawstein**
> The sample is ~70% European (115 of 164 populations with origins), a historical and sampling artifact: the closed-studbook breed concept arose in Victorian Britain, and the dataset draws on European and North American registries. Most dogs worldwide are free-ranging village dogs.
>
> About three-quarters of significant shared length is intracontinental. Asian breeds are comparatively self-contained (>50% intracontinental), whereas North America (~21%), Australia (~16%) and Africa (~8%) share mostly with Europe, consistent with colonial-era introductions (kelpie–border collie; boerboel–bullmastiff).

#### 8 · Breeds that won't sit together

**Adult**
> A few breeds are scattered across more than one wedge. Some are new breeds still taking shape. Others split by origin: cane corsos from Italy cluster together, while American ones sit beside Neapolitan mastiffs. The Xoloitzcuintli (Mexican hairless dog) and the Peruvian hairless dog are spread across distant branches, some beside the German shepherd, a sign of past mixing with European herding dogs.

**Puppy**
> A few breeds don't all sit together. Some are new breeds that are still settling in. The hairless dogs from Mexico and Peru are split up too. Some of them sit right next to the German shepherd. That's a clue that long ago, their families mixed with herding dogs from Europe.

**Pawstein**
> Fifteen breeds are not monophyletic. Several are still under development; others are structured by collection site: Italian cane corsos form a fully supported clade, while US-sampled dogs are paraphyletic near the Neapolitan mastiff. The Xoloitzcuintli and Peruvian hairless dog split between divergent clades, some adjacent to the German shepherd. TreeMix places admixture into the New World clade from European herding stock, possibly during the Columbian Exchange.

#### 9 · The missing link *(moved to close Part one)*
Kicker: **Gaps in the record**

**Adult**
> Every fork in the tree is an ancestor no one has seen. The researchers had DNA only from living dogs and inferred each fork from its descendants. In human evolution, such ancestors are called missing links.
>
> `[MissingLinkFigure]` *Caption:* Humans did not evolve from gorillas; both descend from an ape that lived 8 million to 10 million years ago, and no fossil of it has been found. Figures are simplified icons. Silhouettes: The Nature Box, CC BY-SA 4.0, rearranged.
>
> Dogs have one, too: the extinct Ice Age wolf population they came from. If its DNA were found, it would join the tree at the fork where dogs part from wolves. Watch the chart: the breeds shift to make room, but none changes place.

**Puppy**
> Every place where two branches meet stands for an ancestor no one has ever seen. Scientists only had DNA from dogs alive today, so they worked backward. In the story of people, these unknown ancestors are called missing links.
>
> *Caption:* People didn't come from gorillas. People and gorillas share an ancestor from 8 to 10 million years ago. No one has found it yet.
>
> Dogs have a missing link too: the old wolf family that dogs came from. If scientists found its DNA, it would slide in where dogs and wolves split. Watch the breeds scoot over to make room.

**Pawstein**
> Internal nodes are unsampled ancestors inferred from extant taxa, the "missing links" of paleoanthropology.
>
> *Caption:* Humans and gorillas descend from a hominine ancestor of ~8–10 Ma not known from fossils.
>
> For dogs, the analogous node is the extinct Late Pleistocene source population. Here its genome joins at the wolf–dog divergence without altering topology, a simplification: real ancient genomes may reveal admixture that rearranges deep relationships, and would add a directly dated calibration point.

### Part two: the DNA web

#### 10 · The tree, bent into a ring *(merges c-blocks + c-order)*
Kicker: **Part two · The ring**

**Adult**
> A family tree shows how breeds branched apart. But breeders also crossed breeds back together, leaving long shared stretches of DNA. The study drew those connections as a chord diagram: a ring of breeds tied together by ribbons.
>
> The ring has {n} blocks, one per breed, in the same order and colors as the tree, starting from the wolf just left of the top and running counterclockwise. Every block is the same size, however many dogs were tested. Three breeds appear twice because they were sampled in two countries: the Tibetan mastiff, the saluki and the cane corso.

**Puppy**
> Part two. A family tree shows how breeds split apart. But sometimes people mix breeds back together. That leaves big matching pieces of DNA behind. Scientists drew those as a ring of breeds tied together with ribbons.
>
> Each block on the ring is one breed. The blocks go in the same order as the family tree, with the same colors. Start at the wolf near the top and go around the opposite way from a clock's hands.

**Pawstein**
> Part two. Bifurcating trees cannot represent reticulation, and recent admixture leaves long IBD haplotypes. The authors summarized cross-clade sharing as a circos plot (their Figure 4).
>
> The {n} populations run counterclockwise from the wolf in cladogram leaf order (with the same rotation caveat), colored by clade; segments are equal-width. The Tibetan mastiff, saluki and cane corso are each represented by origin-country and US samples, to test the effect of importation.

#### 11 · A ribbon marks a recent cross *(merges c-ribbon + c-threshold)*

**Adult**
> Each generation, the DNA a puppy inherits is cut into smaller pieces, called haplotypes. When dogs from two breeds share long pieces, they had a common ancestor recently, usually because someone crossed the breeds.
>
> Breeds in the same family share plenty of DNA anyway, so the chart shows only pairs from different families, and only the top 5 percent of those: {L} ribbons. The Eurasier, created in the 1970s from the chow chow, keeshond and Samoyed, has three, one to each parent.

**Puppy**
> Every time puppies are born, their DNA gets mixed and cut into smaller pieces. So if two breeds still share a big piece, they had the same ancestor not long ago. Usually that means someone mixed the two breeds. Only the biggest surprises get a ribbon.
>
> The Eurasier was made in the 1970s from three breeds: the chow chow, keeshond and Samoyed. Its three ribbons go right to them.

**Pawstein**
> Recombination shortens IBD segments each meiosis, so long shared haplotypes imply recent common ancestry. Haplotypes were phased with BEAGLE in 100-SNP windows (≥232 kb). Within-clade sharing is high by expectation (median 9.74 vs 2.18 Mb between clades; p < 2.2e-16), so only interclade pairs above the 95th percentile (9,744,974 bp) are drawn: {L} ribbons.
>
> The Eurasier, a 1970s composite of the chow chow (Asian spitz), keeshond (Nordic spitz) and Samoyed (unclustered), shares significant haplotypes with all three.
>
> *Fix:* "BEAGLE" must be plain text, not a breed hint.

#### 12 · Thicker ribbon, more in common

**Adult**
> Wider ribbons mean more shared DNA. The Eurasier and chow chow share about 179 million DNA letters (179 Mb), the most of any pair; the Berger Picard and Bouvier des Flandres share 78 Mb. The thin ribbon between the Italian cane corso and the Saint Bernard, under 10 Mb, barely qualified. Compare ribbons with one another, not with block size: a breed with many ribbons must fit them all into one block.

**Puppy**
> Wider ribbons mean more shared DNA. The Eurasier and the chow chow share the most of any pair. The thin ribbon between the cane corso and the Saint Bernard only just made the list. Tip: compare ribbons to each other, not to the size of the blocks.

**Pawstein**
> Ribbon width scales with median pairwise IBD length: Eurasier–chow chow ~179 Mb (the maximum), Berger Picard–Bouvier des Flandres ~78 Mb, Italian cane corso–Saint Bernard <10 Mb (just above threshold). Arc length is fixed per segment, so widths compare across ribbons, not against segments.

#### 13 · A handful of breeds hold the web together *(merges c-color + c-hubs)*
Kicker: **Super-connectors**

**Adult**
> About half the breeds have one ribbon or none. Six connect to more than eight breeds outside their family: the toy Manchester terrier, pug, Chinook, Airedale, German shepherd and Berger Picard. Each ribbon takes the color of its busier end, so a fan of one color points back to a hub.
>
> A hub is usually either a recent blend, like the Chinook, bred from sled dogs and shepherds in the 1910s, or a favorite ingredient. The German shepherd, created in the late 1800s, is the second kind: its ribbons reach the Belgian Malinois, Doberman, Leonberger and Italian cane corso, among others.

**Puppy**
> About half the breeds have one ribbon or none. But six breeds connect to more than eight others. Each ribbon takes the color of its busier end, so a fan of one color leads back to one busy breed.
>
> Some busy breeds were made by mixing lots of others, like the Chinook. Others were so popular that people used them to make new breeds, like the German shepherd.

**Pawstein**
> Degree is highly skewed: 54% of breeds in the 23 clades share with one or no breed outside their clade, consistent with breed formation within founder populations. Six share with more than eight: the toy Manchester terrier, pug, Chinook, Airedale, German shepherd and Berger Picard. Ribbons take the color of the higher-degree endpoint, so same-colored fans mark donors.
>
> High degree indicates a recent composite (the Chinook, 1910s) or a popular donor. The German shepherd is the latter, and is also implicated in spreading the MDR1 drug-sensitivity variant (~10% in the breed).

#### 14 · The pug gets around

**Adult**
> On the tree, the pug sits beside the Brussels griffon. Its ribbons tell a broader story, reaching Asian lapdogs like the Pekingese, shih tzu and Lhasa apso, and small breeds around the ring. The researchers think pugs left Asia early and were then used to build many small European breeds.

**Puppy**
> On the family tree, the pug sits next to the Brussels griffon. But its ribbons reach Asian lapdogs like the Pekingese and shih tzu, and small breeds all around the ring. Scientists think pugs left Asia long ago. Then people used them to make lots of small European breeds.

**Pawstein**
> Keep the current text. At 58 words it is already tight.

#### 15 · A tale of two cane corsos

**Adult**
> The two cane corso blocks diverge. Dogs sampled in Italy connect to the German shepherd and Chinook; dogs sampled in the United States connect to the Rottweiler, a link the Italian dogs lack. The breed has been in the United States for only about 30 years, and American dogs have already mixed with local breeds.

**Puppy**
> Look at the two cane corso blocks. Cane corsos from Italy connect to the German shepherd. Cane corsos from the United States connect to the Rottweiler. Cane corsos have only lived in the US for about 30 years, and already the American dogs have mixed a little with dogs there.

**Pawstein**
> Keep the current text, with one change: drop "With fewer than 30 years in the US," and start the sentence at "This reflects post-importation admixture".

#### 16 · No ribbons tells a story too

**Adult**
> The {S} highlighted blocks have no ribbons at all. They include most Mediterranean breeds (salukis, Afghan hounds, Great Pyrenees), most scent hounds, like the basset and beagle, and all three poodles. No ribbons means no recent mixing with other families. The researchers think the Mediterranean and Asian spitz groups, which share the least, may be among the oldest dog families.

**Puppy**
> The {S} lit-up blocks have no ribbons at all. They include salukis, beagles and poodles. No ribbons means no recent mixing with other families. Scientists think two of these groups may be some of the oldest dog families of all.

**Pawstein**
> Keep the current text. It is the right length for the claim.

#### 17 · The web, routed through the tree *(merges bundle + crossings)*
Kicker: **The hidden web**

**Adult**
> Here is the same data, drawn another way. In edge bundling, each connection leaves one breed, follows the tree's branches in toward the two breeds' shared ancestor, then travels out to the other. Connections that share branches merge into thick bundles; a lone thin curve is a one-off cross.
>
> The picture combines the ancient family tree with two centuries of crossbreeding: 117 breeds show recent mixing with other families. It also shows why a tree can mislead. The Eurasier lands in a wedge of its own between its three parent breeds, because a tree can only split, not merge.

**Puppy**
> Here's another way to draw the same ribbons. Each line starts at one breed, follows the tree's branches inward, then goes back out to the other breed. Lines that use the same branches bunch together into thick bundles. A thick bundle means lots of mixing; one thin line means just one mix.

**Pawstein**
> Interclade sharing rendered with hierarchical edge bundling: each edge is a B-spline routed through internal nodes via the MRCA, so edges sharing tree paths coalesce, and bundle density tracks admixture volume between subtrees. 117 breeds show strong interclade admixture, mostly within the past ~200 years. The Eurasier shows the model's limit: a three-way composite cannot be represented by bifurcation, so neighbor-joining places it between its sources.

### Footer

- **Adult:** "Where this comes from: the family tree and DNA-sharing data published by Parker et al. in 2017. As in their chart, dogs of one breed that cluster together are drawn as a single wedge; when a breed is split, only its largest piece is labeled. Colors are ours. Photos for {n} breeds come from the free Dog CEO API."
- **Pawstein:** add the moved boxer-ascertainment note.

---

## 6. Optional further cuts

These go beyond the merges above. They are listed roughly by how much each saves.

1. **Make the bootstrap step (5) a toggle instead of a step.** A "Show confidence markers" switch in the chart's corner would cut another card. Most readers don't need it to follow the story.
2. **Combine steps 14–16 (pug, cane corsos, silent).** Use one "Three stories in the ribbons" card with three tabs or chips, each driving the chord view. That turns 3 scroll stops into 1.
3. **Share the extinct-wolf fact across tabs.** Tab 2 never needs to restate it. Tab 1's step 3 can end with "You'll meet this wolf again on the family tree", which lets the missing-link step on Tab 2 refer back to it.
4. **Retire the Primer cards for terms the story defines itself.** *Cladogram* and *clade* are each defined in their own step, so the glossary could keep only *DNA*, *haplotype* and *bootstrap*. That makes the page shorter before the scroller even starts.
