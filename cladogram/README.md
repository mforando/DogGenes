# Reading the Dog Family Tree

A scrollytelling guide to the 161-breed cladogram (Figure 1) from Parker et al.,
"Genomic Analyses Reveal the Influence of Geographic Origin, Migration, and
Hybridization on Modern Dog Breed Development," *Cell Reports* 19 (2017).
Built with Next.js + React; every visualization is drawn with D3.

| Route | Page |
|---|---|
| `/` | Scrollytelling guide to the cladogram (Figure 1) |
| `/circos/guide` | Scrollytelling guide to the haplotype-sharing circos plot (Figure 4) |
| `/circos` | Interactive full-size replica of Figure 4, with a table of every ribbon |

(With the GitHub Pages base path these become `/<repo>/`, `/<repo>/circos/guide/` and `/<repo>/circos/`.)

```bash
npm install
npm run dev        # http://localhost:3000 (live reload)
npm run build      # static export, then copies the site to the repo root (see below)
npm run preview    # serves the repo root like GitHub Pages: http://localhost:3123/<repo>/
```

## Publishing to GitHub Pages

`npm run build` makes a static export (`next.config.mjs` uses `output: "export"`), and
its `postbuild` step (`scripts/publish.mjs`) copies the result into the **repository root**,
one folder up. That gives the repo an `index.html` entry point plus `_next/`, `circos/`,
`404.html` and a `.nojekyll` file, which stops GitHub Pages from hiding `_next/`.

1. Run `npm run build` from `cladogram/` and commit the files it adds to the repo root.
2. On GitHub, go to **Settings → Pages → Build and deployment**, choose *Deploy from a branch*,
   and pick your branch with the **/ (root)** folder.

**Base path.** A project site is served from `https://<user>.github.io/<repo>/`, so every
URL is built with a `/<repo>` prefix. The repo name comes from `git remote get-url origin`,
or from the folder name (`Genetics`) if there's no remote yet. Override it when needed:

```bash
PAGES_BASE_PATH=/my-repo npm run build   # different repo name
PAGES_BASE_PATH= npm run build           # user site (<user>.github.io) or custom domain: no prefix
```

**Safety.** `.pages-manifest.json` in the root lists what the publish step copied. Each
rebuild deletes only those files before copying fresh ones, and the step refuses to
overwrite any root file it didn't create (your PDFs and spreadsheet are never touched).

## Data pipeline

| File | Source |
|---|---|
| `data/tree.nwk` | Newick string extracted from `../treeFile.pdf` (NEXUS; internal branch "lengths" are bootstrap support out of 100) |
| `data/breeds.json` | Clade / breed / code table and significant haplotype sharing from `../haplotypeSharing.xlsx` (Supplemental Table 2) |
| `src/data/cladogram.json` | `npm run data` – parses the tree, maps sample IDs to breeds, collapses single-breed subtrees into wedges |
| `src/data/circos.json` | `npm run data` – Figure 4 blocks (spreadsheet row order = the paper's circos order) and cross-clade ribbons |
| `src/data/photos.json` | `npm run photos` – photo URLs from the [Dog CEO API](https://dog.ceo/dog-api/) for the 117 study breeds it covers |

## Code map

- `src/lib/tree.ts` – radial layout (supports rotating forks), MRCA helpers
- `src/lib/steps.tsx` – the 13 story steps, each a declarative `View`
- `src/components/Cladogram.tsx` – D3 rendering + transitions (traces, rotation, bootstrap markers, clade ring, edge-bundled haplotype sharing, zoom, tooltip)
- `src/components/Story.tsx` – tree page: hero, cards, photos, explore controls, table view
- `src/lib/circos.ts` – circos geometry: equal blocks counter-clockwise from the wolf, ribbon ends packed per view, hub coloring
- `src/lib/circosSteps.tsx` – the 11 circos story steps
- `src/components/Circos.tsx` – D3 circos (ribbons tween between views, hover isolation, tooltips)
- `src/components/CircosStory.tsx`, `CircosReplica.tsx` – the two circos pages
- `src/components/shared.tsx` – scroll-step hook, photo plates, site nav

Note: the spreadsheet's column header spells the Large Munsterlander `KMUN` while its row
says `LMUN`; the build script aliases them so those pairs are correctly treated as same-clade.
