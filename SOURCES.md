# Sources & licenses

Every data source, article, image collection, map, and software library used by the
DogGenes site (https://mforando.github.io/DogGenes/), with the license that applies to each.
The license summary at the end explains what those licenses mean for reusing this site.

> Not legal advice. Licenses are as stated by each source when checked in October 2026; check
> the source before reusing anything commercially.

---

## 1. Primary study data

| Source | Used for | License |
|---|---|---|
| **Parker, H.G., Dreger, D.L., Rimbault, M., Davis, B.W., Mullen, A.B., Carpintero-Ramirez, G., Ostrander, E.A. (2017).** "Genomic Analyses Reveal the Influence of Geographic Origin, Migration, and Hybridization on Modern Dog Breed Development." *Cell Reports* 19(4), 697–708. [doi:10.1016/j.celrep.2017.03.079](https://doi.org/10.1016/j.celrep.2017.03.079) — copy in `article.pdf` | Family tree, 23 clades, breed list, Figure 1 and Figure 4 replicas, Figure 7 disease case studies, all facts quoted from the paper | **CC BY 4.0** ("open access article under the CC BY license", stated on the article) |
| Study supplementary data: neighbor-joining bootstrap tree (NEXUS) — `treeFile.pdf` | The cladogram on the Family tree & DNA web tab and everywhere the tree appears | **CC BY 4.0** (published with the article) |
| Study supplementary data: Supplemental Table 2, haplotype sharing between breeds — `haplotypeSharing.xlsx` | Chord diagram, edge bundles, Breed pairs, "shares DNA with" lists, health-page carrier candidates | **CC BY 4.0** (published with the article) |

## 2. History of dogs

| Source | Used for | License |
|---|---|---|
| Wikipedia contributors, "[Domestication of the dog](https://en.wikipedia.org/wiki/Domestication_of_the_dog)" | The history of dogs tab: timeline dates, origin hypotheses, oldest remains (Goyet, Altai, Erralla, Bonn-Oberkassel), five ancient lineages, domestication theories, the Robert K. Wayne quote. Text is paraphrased, not copied. | **CC BY-SA 4.0** |
| Wikipedia contributors, breed articles: [Siberian Husky](https://en.wikipedia.org/wiki/Siberian_Husky), [Alaskan Malamute](https://en.wikipedia.org/wiki/Alaskan_Malamute), [Chow Chow](https://en.wikipedia.org/wiki/Chow_Chow), [Basenji](https://en.wikipedia.org/wiki/Basenji), [Saluki](https://en.wikipedia.org/wiki/Saluki), [Shar Pei](https://en.wikipedia.org/wiki/Shar_Pei), [Lhasa Apso](https://en.wikipedia.org/wiki/Lhasa_Apso), [Tibetan Mastiff](https://en.wikipedia.org/wiki/Tibetan_Mastiff), [Shiba Inu](https://en.wikipedia.org/wiki/Shiba_Inu), [Akita](https://en.wikipedia.org/wiki/Akita_(dog)), [Pekingese](https://en.wikipedia.org/wiki/Pekingese), [Xoloitzcuintle](https://en.wikipedia.org/wiki/Xoloitzcuintle) | Approximate origin dates (or "unknown") for the 12 ancient breeds on the History tab's "Dogs came first" step and timeline | **CC BY-SA 4.0** |
| Wikipedia contributors, "[Last Glacial Period](https://en.wikipedia.org/wiki/Last_Glacial_Period)" and "[Last Glacial Maximum](https://en.wikipedia.org/wiki/Last_Glacial_Maximum)" | The Ice Age band on the timeline: began ~115,000 years ago, coldest ~26,000–20,000, ended 11,700 years ago | **CC BY-SA 4.0** |
| Wikipedia contributors, "[Bonn–Oberkassel dog](https://en.wikipedia.org/wiki/Bonn%E2%80%93Oberkassel_dog)" and "[Paleolithic dog](https://en.wikipedia.org/wiki/Paleolithic_dog)" | The dig-site globe on "The oldest dogs we've dug up": the 1914 quarry find, double human burial with red hematite, the puppy's age and survival of distemper with human care, its DNA, the museum; the Erralla humerus and its identification; the Goyet debate | **CC BY-SA 4.0** |
| Standard breed-club histories (e.g. American Kennel Club and national breed clubs), general reference knowledge | One-line histories of the ancient-breed cards; the founding years of the 28 dated breeds and the milestones (first dog show 1859, Kennel Club 1873, AKC 1884) on the "last 200 years" timeline | Facts; not copyrightable as facts. No text copied. |
| Parker, H.G. et al. (2004). "Genetic structure of the purebred domestic dog." *Science* 304(5674): 1160–1164. [doi:10.1126/science.1097406](https://doi.org/10.1126/science.1097406) | "Natural selection vs. breeding": ~30% of dog genetic variation lies between breeds; 99% of dogs assigned to the right breed | Facts cited; article © AAAS |
| Rosenberg, N.A. et al. (2002). "Genetic structure of human populations." *Science* 298(5602): 2381–2385. [doi:10.1126/science.1078311](https://doi.org/10.1126/science.1078311) | Comparison: 93–95% of human variation lies within populations | Facts cited; article © AAAS |
| Boyko, A.R. et al. (2010). "A simple genetic architecture underlies morphological variation in dogs." *PLOS Biology* 8(8): e1000451. [doi:10.1371/journal.pbio.1000451](https://doi.org/10.1371/journal.pbio.1000451) | Three or fewer loci explain most variation in breed traits | **CC BY 4.0** |
| Yengo, L. et al. (2022). "A saturated map of common genetic variants associated with human height." *Nature* 610: 704–712. [doi:10.1038/s41586-022-05275-y](https://doi.org/10.1038/s41586-022-05275-y) | Comparison: 12,111 height variants explaining ~40% of variation | **CC BY 4.0** |
| Selection simulation (`cladogram/src/lib/selection.ts`) | The animated dot plots: a toy model written for this site, not real breed data | Site's own work |

## 3. Dog photos

| Source | Used for | License |
|---|---|---|
| [Dog CEO API](https://dog.ceo/dog-api/) — image repository [jigsawpieces/dog-api-images](https://github.com/jigsawpieces/dog-api-images) | All dog photos: breed cards, tooltips, galleries, the Breed Explorer (18,006 photos as thumbnails in `cladogram/public/explorer/`) | Repository: **GPL-3.0**. Its images come from the Stanford Dogs Dataset plus user submissions. |
| [Stanford Dogs Dataset](http://vision.stanford.edu/aditya86/ImageNetDogs/) (Khosla, Jayadevaprakash, Yao & Fei-Fei, 2011), built from **ImageNet** | Original source of most Dog CEO photos | **ImageNet terms: non-commercial research and educational use.** Photographers hold their own copyrights. |
| [Wikimedia Commons](https://commons.wikimedia.org/) contributors: 102 breed photos (`cladogram/src/data/commons.json`, fetched by `cladogram/scripts/fetch-commons-photos.mjs`) | Breeds the Dog CEO API doesn't cover: 48 study breeds (including the grey wolf and golden jackal), 54 more AKC breeds on the Most popular breeds tab, and the Goldendoodle on the How we name our dogs tab. Mostly each breed's lead photo on English Wikipedia, checked by eye; the Manchester terriers, Belgian Laekenois and Goldendoodle were picked by hand | Each photo's own license: **CC BY**, **CC BY-SA**, **CC0**, **public domain** or **copyrighted free use** (all allow reuse with credit). Credits below |

### Wikimedia Commons photo credits

Photos are shown as published (scaled and cropped to circles or squares on the site).

<!-- commons-credits:start -->
| Breed | Photo (Wikimedia Commons file page) | Author | License |
|---|---|---|---|
| Affenpinscher | [2013 Westminster Kennel Club Dog Show- Affenpinscher Joey aka GCH Banana Joe V Tani Kazari (8471258772).jpg](https://commons.wikimedia.org/wiki/File:2013_Westminster_Kennel_Club_Dog_Show-_Affenpinscher_Joey_aka_GCH_Banana_Joe_V_Tani_Kazari_(8471258772).jpg) | Kristy May for Pets Advisor www.petful.com - Uploaded at Petful | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| American Cocker Spaniel | [PointbreakHoneyimHome.jpg](https://commons.wikimedia.org/wiki/File:PointbreakHoneyimHome.jpg) | Kulala | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| American English Coonhound | [English Coonhound.jpg](https://commons.wikimedia.org/wiki/File:English_Coonhound.jpg) | Not stated (see file page) | Public domain |
| American Foxhound | [AmericanFoxhound2.jpg](https://commons.wikimedia.org/wiki/File:AmericanFoxhound2.jpg) | Not stated (see file page) | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| American Hairless Terrier | [American Hairless Terrier Adelor.jpg](https://commons.wikimedia.org/wiki/File:American_Hairless_Terrier_Adelor.jpg) | Nyaah | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| American Water Spaniel | [Chien d'eau americain champion 1.JPG](https://commons.wikimedia.org/wiki/File:Chien_d%27eau_americain_champion_1.JPG) | Awsguy1 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Anatolian Shepherd | [Kangal front on.jpg](https://commons.wikimedia.org/wiki/File:Kangal_front_on.jpg) | Kangalshepherddog | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Azawakh | [Bistrita 2015 (22).jpg](https://commons.wikimedia.org/wiki/File:Bistrita_2015_(22).jpg) | Cristian.vantu | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Barbet | [Chien de race Barbet.jpg](https://commons.wikimedia.org/wiki/File:Chien_de_race_Barbet.jpg) | Not stated (see file page) | Public domain |
| Bearded Collie | [Bearded Collie 600.jpg](https://commons.wikimedia.org/wiki/File:Bearded_Collie_600.jpg) | Not stated (see file page) | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Beauceron | [BeauceronStand.jpg](https://commons.wikimedia.org/wiki/File:BeauceronStand.jpg) | Stefan Schmitz | [CC BY-SA 3.0 de](https://creativecommons.org/licenses/by-sa/3.0/de/deed.en) |
| Belgian Laekenois | [Laekenois Shepherd.JPG](https://commons.wikimedia.org/wiki/File:Laekenois_Shepherd.JPG) | Canarian | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Bergamasco Sheepdog | [Ortensia di Valle Scrivia (cropped).jpg](https://commons.wikimedia.org/wiki/File:Ortensia_di_Valle_Scrivia_(cropped).jpg) | Luigi Guidobono Cavalchini (Josephine06) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| Berger Picard | [Picard Delice Stacked.jpg](https://commons.wikimedia.org/wiki/File:Picard_Delice_Stacked.jpg) | Cufleadh | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Biewer Terrier | [BiewerHündin.jpg](https://commons.wikimedia.org/wiki/File:BiewerH%C3%BCndin.jpg) | Detlef Breiting | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Black and Tan Coonhound | [Black and Tan Coonhound.jpg](https://commons.wikimedia.org/wiki/File:Black_and_Tan_Coonhound.jpg) | Steffen Heinz (Caronna) | [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5) |
| Black Russian Terrier | [Wystawa Rybnik 02.10.2011 czarny terier rosyjski 2pl.jpg](https://commons.wikimedia.org/wiki/File:Wystawa_Rybnik_02.10.2011_czarny_terier_rosyjski_2pl.jpg) | Pleple2000 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Bluetick Coonhound | [BluetickCoonhound.jpg](https://commons.wikimedia.org/wiki/File:BluetickCoonhound.jpg) | Not stated (see file page) | Public domain |
| Boerboel | [Boerboelmusta3.jpg](https://commons.wikimedia.org/wiki/File:Boerboelmusta3.jpg) | Canarian | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) |
| Boykin Spaniel | [Boykin Spaniel April Jet.jpg](https://commons.wikimedia.org/wiki/File:Boykin_Spaniel_April_Jet.jpg) | jetsonphoto | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| Bracco Italiano | [Bracco Italiano (cropped).jpg](https://commons.wikimedia.org/wiki/File:Bracco_Italiano_(cropped).jpg) | Mohawk28 at German Wikipedia | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Brussels Griffon | [Monkey Bizniz Drama Queen.jpg](https://commons.wikimedia.org/wiki/File:Monkey_Bizniz_Drama_Queen.jpg) | Arne Fagerholt | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| Bull Terrier | [Bullterrier-3453301920.jpg](https://commons.wikimedia.org/wiki/File:Bullterrier-3453301920.jpg) | Pixabay User TC-TORRES | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Canaan Dog | [CanaanDogChakede.jpg](https://commons.wikimedia.org/wiki/File:CanaanDogChakede.jpg) | Canaan Dog, Hodowla Samorodok Hanaana http://www.ruscanaan.ru | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Cane Corso | [Cane corso temi 1 1024x768x24 (cropped).png](https://commons.wikimedia.org/wiki/File:Cane_corso_temi_1_1024x768x24_(cropped).png) | Claudio Domiziani | [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5) |
| Cane Paratore | [Cane Paratore.jpg](https://commons.wikimedia.org/wiki/File:Cane_Paratore.jpg) | Chili The Border Collie | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Cesky Terrier | [Terier czeski suka 2009 pl2.jpg](https://commons.wikimedia.org/wiki/File:Terier_czeski_suka_2009_pl2.jpg) | Pleple2000 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Chesapeake Bay Retriever | [CH Chesapeake.jpg](https://commons.wikimedia.org/wiki/File:CH_Chesapeake.jpg) | George Makatura | Public domain |
| Chinese Crested | [IndyStands.jpg](https://commons.wikimedia.org/wiki/File:IndyStands.jpg) | Tommy Gildseth | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| Chinook | [Mountan Laurel Ajax the Chinook dog.jpg](https://commons.wikimedia.org/wiki/File:Mountan_Laurel_Ajax_the_Chinook_dog.jpg) | Not stated (see file page) | Copyrighted free use |
| Cirneco dell'Etna | [Cirneco dell Etna 611.jpg](https://commons.wikimedia.org/wiki/File:Cirneco_dell_Etna_611.jpg) | de:Benutzer:Jan Eduard, contrast Pleple2000 | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Clumber Spaniel | [Clumber spaniel rybnik kamien pppl.jpg](https://commons.wikimedia.org/wiki/File:Clumber_spaniel_rybnik_kamien_pppl.jpg) | Pleple2000 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Dandie Dinmont Terrier | [Dandie Dinmont Terrier 600.jpg](https://commons.wikimedia.org/wiki/File:Dandie_Dinmont_Terrier_600.jpg) | en:User:Sannse | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Danish-Swedish Farmdog | [Danish Farm Dog1604fxcr wb.jpg](https://commons.wikimedia.org/wiki/File:Danish_Farm_Dog1604fxcr_wb.jpg) | Ellen Levy Finch (User:Elf) | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Dogo Argentino | [Argentine Dogo (535032632) (cropped).jpg](https://commons.wikimedia.org/wiki/File:Argentine_Dogo_(535032632)_(cropped).jpg) | Ricardo Martins from Gent, Belgium | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Dogue de Bordeaux | [French Mastiff female 4.jpg](https://commons.wikimedia.org/wiki/File:French_Mastiff_female_4.jpg) | Canarian | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| English Foxhound | [English Foxhound portrait.jpg](https://commons.wikimedia.org/wiki/File:English_Foxhound_portrait.jpg) | Flickr user Thowra_uk | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| English Toy Spaniel | [King Charles Spaniel 200.jpg](https://commons.wikimedia.org/wiki/File:King_Charles_Spaniel_200.jpg) | Pleple2000 10:18, 5 April 2006 (UTC) | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Entlebucher Mountain Dog | [Elio v Schaerlig im Juni 2007 klein.jpg](https://commons.wikimedia.org/wiki/File:Elio_v_Schaerlig_im_Juni_2007_klein.jpg) | Serge Renggli | [CC BY-SA 2.0 de](https://creativecommons.org/licenses/by-sa/2.0/de/deed.en) |
| Eurasier | [Eurasier BailyWtatze.jpg](https://commons.wikimedia.org/wiki/File:Eurasier_BailyWtatze.jpg) | Kerstin Kühnel Wuppertatzen | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Field Spaniel | [Field spaniel 581.jpg](https://commons.wikimedia.org/wiki/File:Field_spaniel_581.jpg) | Pleple2000 | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Finnish Lapphund | [Finnish Lapphund Glenchess Revontuli.jpg](https://commons.wikimedia.org/wiki/File:Finnish_Lapphund_Glenchess_Revontuli.jpg) | Apdevries [2] | [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5) |
| Finnish Spitz | [Finnish Spitz 600.jpg](https://commons.wikimedia.org/wiki/File:Finnish_Spitz_600.jpg) | Not stated (see file page) | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| German Pinscher | [Bvdb-duitse pincher.jpg](https://commons.wikimedia.org/wiki/File:Bvdb-duitse_pincher.jpg) | Bonnie van den Born, http://www.bonfoto.nl | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| German Wirehaired Pointer | [Dan vom hardenberg (cropped).jpg](https://commons.wikimedia.org/wiki/File:Dan_vom_hardenberg_(cropped).jpg) | JainaKo | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Glen of Imaal Terrier | [Blue Brindle Adult Glen of Imaal Terrier.jpg](https://commons.wikimedia.org/wiki/File:Blue_Brindle_Adult_Glen_of_Imaal_Terrier.jpg) | Irish-Terrier-2023 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Golden Jackal | [033 Golden jackal in Keoladeo National Park Photo by Giles Laurent.jpg](https://commons.wikimedia.org/wiki/File:033_Golden_jackal_in_Keoladeo_National_Park_Photo_by_Giles_Laurent.jpg) | Giles Laurent | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Goldendoodle | [Goldendoodle on the beach.jpg](https://commons.wikimedia.org/wiki/File:Goldendoodle_on_the_beach.jpg) | Ryan Schwark | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Grand Basset Griffon Vendéen | [GrandBassettGriffonVendéen.jpg](https://commons.wikimedia.org/wiki/File:GrandBassettGriffonVend%C3%A9en.jpg) | Walbharri | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Greenland Sledge Dog | [Greenland dog upernavik 2007-06-02 sample.jpg](https://commons.wikimedia.org/wiki/File:Greenland_dog_upernavik_2007-06-02_sample.jpg) | Slaunger, edited by Thegreenj | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Grey Wolf | [Eurasian wolf 2.jpg](https://commons.wikimedia.org/wiki/File:Eurasian_wolf_2.jpg) | User:Mas3cf | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Harrier | [Harrier Hound -Pedigree Harrier.jpg](https://commons.wikimedia.org/wiki/File:Harrier_Hound_-Pedigree_Harrier.jpg) | Evforce | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Icelandic Sheepdog | [Icelandic Sheepdog Alisa von Lehenberg.jpg](https://commons.wikimedia.org/wiki/File:Icelandic_Sheepdog_Alisa_von_Lehenberg.jpg) | Veronica Druk | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Irish Red and White Setter | [Irish Red And White Setter 2005.jpg](https://commons.wikimedia.org/wiki/File:Irish_Red_And_White_Setter_2005.jpg) | Missledwidge | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Lagotto Romagnolo | [Bellalagotto4.jpg](https://commons.wikimedia.org/wiki/File:Bellalagotto4.jpg) | Entheta | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Lakeland Terrier | [Lakeland Terrier.jpg](https://commons.wikimedia.org/wiki/File:Lakeland_Terrier.jpg) | sannse | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Lancashire Heeler | [Grupp 1, LANCASHIRE HEELER, NO UCH NO V-14 NO V-15 SE UCH Ståhlskyttens Longed For Antony (24284065606).jpg](https://commons.wikimedia.org/wiki/File:Grupp_1,_LANCASHIRE_HEELER,_NO_UCH_NO_V-14_NO_V-15_SE_UCH_St%C3%A5hlskyttens_Longed_For_Antony_(24284065606).jpg) | Svenska Mässan from Sweden | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Large Munsterlander | [GrosserMuensterlaender.jpg](https://commons.wikimedia.org/wiki/File:GrosserMuensterlaender.jpg) | Pia C. Groening | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Löwchen | [Adult Lowchen Gaiting.jpg](https://commons.wikimedia.org/wiki/File:Adult_Lowchen_Gaiting.jpg) | Jk9dat | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Manchester Terrier | [Manchester terrier Koira 2013.JPG](https://commons.wikimedia.org/wiki/File:Manchester_terrier_Koira_2013.JPG) | Томасина | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Miniature American Shepherd | [Blue Merle Miniature American Shepherd in Grass.jpg](https://commons.wikimedia.org/wiki/File:Blue_Merle_Miniature_American_Shepherd_in_Grass.jpg) | Lextergrace | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Miniature Bull Terrier | [Minibull 2 Moletai May 2014.jpg](https://commons.wikimedia.org/wiki/File:Minibull_2_Moletai_May_2014.jpg) | Томасина | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Miniature Xoloitzcuintli | [BIR Grupp 5- MEXIKANSK NAKENHUND, Lokal Hero’s King Og Hart’s Istas (23607403303).jpg](https://commons.wikimedia.org/wiki/File:BIR_Grupp_5-_MEXIKANSK_NAKENHUND,_Lokal_Hero%E2%80%99s_King_Og_Hart%E2%80%99s_Istas_(23607403303).jpg) | Svenska Mässan from Sweden | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Mudi | [Hondenras Mudi.jpg](https://commons.wikimedia.org/wiki/File:Hondenras_Mudi.jpg) | Vulpes at Dutch Wikipedia | Public domain |
| Neapolitan Mastiff | [5 Year old male in Napoli Stance (2).jpg](https://commons.wikimedia.org/wiki/File:5_Year_old_male_in_Napoli_Stance_(2).jpg) | Philip Thompson | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Nederlandse Kooikerhondje | [Kooiker03.jpg](https://commons.wikimedia.org/wiki/File:Kooiker03.jpg) | Not stated (see file page) | [CC BY 2.5](https://creativecommons.org/licenses/by/2.5) |
| Norwegian Buhund | [Norwegian Buhund 600.jpg](https://commons.wikimedia.org/wiki/File:Norwegian_Buhund_600.jpg) | Not stated (see file page) | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Norwegian Lundehund | [Lundehund-2003.jpg](https://commons.wikimedia.org/wiki/File:Lundehund-2003.jpg) | Karen Elise Dahlmo | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Nova Scotia Duck Tolling Retriever | [Duck Toller.jpg](https://commons.wikimedia.org/wiki/File:Duck_Toller.jpg) | Cal119 at English Wikipedia | Public domain |
| Parson Russell Terrier | [05052881 PRT braun rau.jpg](https://commons.wikimedia.org/wiki/File:05052881_PRT_braun_rau.jpg) | Alephalpha | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Peruvian Hairless Dog | [PHDStandardStanding - Perro Sin Pelo del Perú.jpg](https://commons.wikimedia.org/wiki/File:PHDStandardStanding_-_Perro_Sin_Pelo_del_Per%C3%BA.jpg) | Brunobarreto | Public domain |
| Petit Basset Griffon Vendeen | [P Basset Griffon Vendeen 600.jpg](https://commons.wikimedia.org/wiki/File:P_Basset_Griffon_Vendeen_600.jpg) | Sannse | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Pharaoh Hound | [Pies faraona e34.jpg](https://commons.wikimedia.org/wiki/File:Pies_faraona_e34.jpg) | Pleple2000 | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Plott Hound | [Plotthund Kynnagardens Ziggy Lundamo.JPG](https://commons.wikimedia.org/wiki/File:Plotthund_Kynnagardens_Ziggy_Lundamo.JPG) | Plotthund | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Pointer | [English Pointer orange-white.jpg](https://commons.wikimedia.org/wiki/File:English_Pointer_orange-white.jpg) | Canarian | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Polish Lowland Sheepdog | [Polski owczarek nizinny rybnik-kamien pl.jpg](https://commons.wikimedia.org/wiki/File:Polski_owczarek_nizinny_rybnik-kamien_pl.jpg) | Pleple2000 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Portuguese Podengo Pequeno | [Evitarocks (cropped).jpg](https://commons.wikimedia.org/wiki/File:Evitarocks_(cropped).jpg) | APPMGC | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Portuguese Water Dog | [Cão de agua Português 2.jpg](https://commons.wikimedia.org/wiki/File:C%C3%A3o_de_agua_Portugu%C3%AAs_2.jpg) | Silke Hollje-Schumacher | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Puli | [PuliBlack wb.jpg](https://commons.wikimedia.org/wiki/File:PuliBlack_wb.jpg) | Original uploader was Elf at en.wikipedia | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Pumi | [Pumi 2.jpg](https://commons.wikimedia.org/wiki/File:Pumi_2.jpg) | Caronna | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Pyrenean Shepherd | [Berger-des-Pyrenees Ellea 800x600.jpg](https://commons.wikimedia.org/wiki/File:Berger-des-Pyrenees_Ellea_800x600.jpg) | KeJa | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Rat Terrier | [Amberina the Rat Terrier.jpg](https://commons.wikimedia.org/wiki/File:Amberina_the_Rat_Terrier.jpg) | Jadenschaul | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Russell Terrier | [FCI JRT.jpg](https://commons.wikimedia.org/wiki/File:FCI_JRT.jpg) | The original uploader was Russellsterrier at English Wikipedia. | Public domain |
| Russian Toy | [RusskiyToyWelpe9Mon.JPG](https://commons.wikimedia.org/wiki/File:RusskiyToyWelpe9Mon.JPG) | Not stated (see file page) | Public domain |
| Sealyham Terrier | [SealyhamTerrier01.jpg](https://commons.wikimedia.org/wiki/File:SealyhamTerrier01.jpg) | Dr. Sabine Schumann | Public domain |
| Skye Terrier | [Skye terrier 800.jpg](https://commons.wikimedia.org/wiki/File:Skye_terrier_800.jpg) | Pleple2000 | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Sloughi | [Sloughi male.jpg](https://commons.wikimedia.org/wiki/File:Sloughi_male.jpg) | Denhulde | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Smooth Fox Terrier | [Patrick the Smooth Fox Terrier.jpg](https://commons.wikimedia.org/wiki/File:Patrick_the_Smooth_Fox_Terrier.jpg) | Tialin at English Wikipedia | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Spanish Water Dog | [Perro agua (cropped).jpg](https://commons.wikimedia.org/wiki/File:Perro_agua_(cropped).jpg) | Brindis320 | Public domain |
| Spinone Italiano | [05042363 Spinone braun.jpg](https://commons.wikimedia.org/wiki/File:05042363_Spinone_braun.jpg) | Alephalpha | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Sussex Spaniel | [Sussex spaniel t43.jpg](https://commons.wikimedia.org/wiki/File:Sussex_spaniel_t43.jpg) | Pleple2000 | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Swedish Vallhund | [Västgötaspets hane 5 år.jpg](https://commons.wikimedia.org/wiki/File:V%C3%A4stg%C3%B6taspets_hane_5_%C3%A5r.jpg) | TS Eriksson | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| Tibetan Spaniel | [Tibetansk spaniel.jpg](https://commons.wikimedia.org/wiki/File:Tibetansk_spaniel.jpg) | Wolfman1 | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) |
| Toy Fox Terrier | [Toy Fox Terrier 2.jpg](https://commons.wikimedia.org/wiki/File:Toy_Fox_Terrier_2.jpg) | Terry Best | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Toy Manchester Terrier | [ToyManchesterTerrier.jpg](https://commons.wikimedia.org/wiki/File:ToyManchesterTerrier.jpg) | sally9258 | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| Treeing Walker Coonhound | [Treeing-walker-coonhound-standing.jpg](https://commons.wikimedia.org/wiki/File:Treeing-walker-coonhound-standing.jpg) | Kingkong954 | Public domain |
| Volpino | [Szpic miniaturowy Volpino MWPR Katowice 2008 (cropped).JPG](https://commons.wikimedia.org/wiki/File:Szpic_miniaturowy_Volpino_MWPR_Katowice_2008_(cropped).JPG) | Lilly M real name: Małgorzata Miłaszewska | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Welsh Springer Spaniel | [Welsh Springer Spaniel 1.jpg](https://commons.wikimedia.org/wiki/File:Welsh_Springer_Spaniel_1.jpg) | Udo Tjalsma | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Welsh Terrier | [Terier walijski suka 2009 pl.jpg](https://commons.wikimedia.org/wiki/File:Terier_walijski_suka_2009_pl.jpg) | Pleple2000 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Wirehaired Pointing Griffon | [GCH Int Ch UCH Zerubbabel von Herrenhausen CGC MHA.jpg](https://commons.wikimedia.org/wiki/File:GCH_Int_Ch_UCH_Zerubbabel_von_Herrenhausen_CGC_MHA.jpg) | CarolPtak | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Wirehaired Vizsla | [Drótosvizsla vadat áll.jpg](https://commons.wikimedia.org/wiki/File:Dr%C3%B3tosvizsla_vadat_%C3%A1ll.jpg) | Noveczki Katalin | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Xigou | [一隻遠處的黑色陝西細犬.jpg](https://commons.wikimedia.org/wiki/File:%E4%B8%80%E9%9A%BB%E9%81%A0%E8%99%95%E7%9A%84%E9%BB%91%E8%89%B2%E9%99%9D%E8%A5%BF%E7%B4%B0%E7%8A%AC.jpg) | Wtf35861887 | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
<!-- commons-credits:end -->

## 4. Health & heredity

| Source | Used for | License |
|---|---|---|
| [OMIA — Online Mendelian Inheritance in Animals](https://omia.org/) (University of Sydney): entries [000218-9615](https://omia.org/OMIA000218/9615/) collie eye anomaly, [001402-9615](https://omia.org/OMIA001402/9615/) MDR1, [000263-9615](https://omia.org/OMIA000263/9615/) degenerative myelopathy, [001298-9615](https://omia.org/OMIA001298/9615/) prcd-PRA | Carrier-breed lists, genes and variants | **CC BY** (per OMIA's published description) |
| Donner, J. et al. (2018). "Frequency and distribution of 152 genetic disease variants in over 100,000 mixed breed and purebred dogs." *PLOS Genetics* 14(4): e1007361. [PMC5945203](https://pmc.ncbi.nlm.nih.gov/articles/PMC5945203/) | Mixed-breed variant frequencies, "2 in 5 dogs carry a variant", "2.7× more likely" | **CC BY 4.0** |
| Donner et al. genotype dataset, Dryad [doi:10.5061/dryad.dd91b](https://datadryad.org/stash/dataset/doi:10.5061/dryad.dd91b) | Listed as open data (not downloaded) | **CC0 1.0** (public domain dedication) |
| Brown, E.A. et al. (2017). "FGF4 retrogene on CFA12 is responsible for chondrodystrophy and intervertebral disc disease in dogs." *PNAS* 114(43): 11476–11481. [PMC5664524](https://pmc.ncbi.nlm.nih.gov/articles/PMC5664524/) | Short legs / disc disease variant, 51-fold odds | **PNAS open access license** (attribution required) |
| Marchant, T.W. et al. (2017). "Canine Brachycephaly Is Associated with a Retrotransposon-Mediated Missplicing of SMOC2." *Current Biology*. [PMC5462623](https://pmc.ncbi.nlm.nih.gov/articles/PMC5462623) | Short-muzzle (SMOC2) variant | **CC BY 4.0** |
| Johansson, E. (2019). Student thesis on SMOC2/BMP3 in Swedish brachycephalic breeds, SLU ([stud.epsilon.slu.se/14846](https://stud.epsilon.slu.se/14846/)) | "Fixed in all four breeds" note | Facts only; see the thesis for terms |
| Karmi, N., Safra, N., Young, A., Bannasch, D.L. (2010). "Validation of a urine test and characterization of the putative genetic mutation for hyperuricosuria in Bulldogs and Black Russian Terriers." *Am. J. Vet. Res.* [PMC5551899](https://pmc.ncbi.nlm.nih.gov/articles/PMC5551899); Bannasch, D. et al. (2008), *PLOS Genetics* (SLC2A9 in Dalmatians) | Hyperuricosuria carriers and the Dalmatian backcross | Karmi 2010: publisher copyright (facts cited, no text copied); Bannasch 2008: CC BY |
| [DogWellNet](https://dogwellnet.com/) (International Partnership for Dogs) — exercise-induced collapse page | EIC carrier breeds; listed as a resource | Facts cited, no text copied; see site terms |
| [Dog Aging Project](https://dogagingproject.org/open_data_access/) | Listed as an open-data resource only | Data available to researchers on request (not used) |
| Works cited inside Parker et al. 2017 and OMIA: Parker et al. 2007 (*Genome Research*, CEA deletion); Mealey et al. 2001 and Mealey & Meurs 2008 (MDR1); Lowe et al. 2003 (CEA) | Background for the case studies | Cited via the sources above |

## 5. How we name our dogs (New York City and Toronto)

| Source | Used for | License |
|---|---|---|
| NYC Department of Health and Mental Hygiene, [NYC Dog Licensing Dataset](https://data.cityofnewyork.us/Health/NYC-Dog-Licensing-Dataset/nu7n-tubp) (NYC Open Data), 819,323 license records, 2016–2026 | The How we name our dogs tab, including the 2019 New York vs. Toronto comparison (aggregated summary in `cladogram/src/data/nycnames.json`; the raw CSV is not redistributed) | **NYC Open Data [Terms of Use](https://www.nyc.gov/html/data/terms.html):** free to use; provided as-is with no warranty of accuracy; reuses should note the data was modified from its original source and must not suggest City endorsement. |
| City of Toronto, [Licensed Dog and Cat Names](https://open.toronto.ca/dataset/licensed-dog-and-cat-names/) (City of Toronto Open Data): complete dog-name lists for 2012–2019 and the top 200 names for 2020–2025; plus licensed-dog totals from [Licensed Dogs and Cats Reports](https://open.toronto.ca/dataset/licensed-dogs-and-cats-reports/) (2020–2022) and [Licensed Dogs and Cats](https://open.toronto.ca/dataset/licensed-dogs-and-cats/) (2023–2025); cats excluded | The New York vs. Toronto section: each city's top 10 and most distinctive names (dogs licensed in 2019), and the two-city name lookup, 2012–2025 (aggregated in `cladogram/src/data/torontonames.json` by `cladogram/scripts/build-toronto-names.py`) | **[Open Government Licence – Toronto](https://open.toronto.ca/open-data-licence/)**: free to use, including commercially, with the statement "Contains information licensed under the Open Government Licence – Toronto." (shown on the page and in its footer) |
| Statistics Canada, 2021 Census of Population (custom tabulation), published in City of Toronto [Ward Profiles (25-Ward Model)](https://open.toronto.ca/dataset/ward-profiles-25-ward-model/), sheet "2021 One Variable" | The Irish and Scottish origin bars: 226,865 Irish and 211,180 Scottish of 2,761,285 Torontonians in private households (people can report several origins) | **Open Government Licence – Toronto** |
| U.S. Census Bureau, [American Community Survey 2020–2024 5-year estimates, table B04006](https://censusreporter.org/tables/B04006/) (people reporting ancestry), New York city, via Census Reporter | The New York side of the same bars: 372,527 Irish and 43,017 Scottish of 8,483,844 residents | **Public domain** (U.S. government work) |
| Monroe, B.L., Colaresi, M.P., Quinn, K.M. (2008). "Fightin' Words." *Political Analysis* 16(4): 372–403 | Method for "most distinctive names" | Method only |

## 6. Most popular breeds

| Source | Used for | License |
|---|---|---|
| American Kennel Club, "Most Popular Dog Breeds" announcements for [2021](https://www.akc.org/expert-advice/dog-breeds/most-popular-dog-breeds-of-2021/), [2022](https://www.akc.org/expert-advice/news/most-popular-dog-breeds-2022/), [2023](https://www.akc.org/expert-advice/news/most-popular-dog-breeds-2023/), [2024](https://www.akc.org/expert-advice/news/most-popular-dog-breeds-2024/) and [2025](https://www.akc.org/expert-advice/news/most-popular-dog-breeds-2025/) | Full breed rankings 2021–2025 (`cladogram/src/data/akc.json`) | Rankings are facts; AKC web pages © American Kennel Club |
| K. Kakey, [dog_traits_AKC](https://github.com/kkakey/dog_traits_AKC), via R4DS [TidyTuesday 2022-02-01](https://github.com/rfordatascience/tidytuesday/tree/main/data/2022/2022-02-01) (`breed_rank.csv`) | Breed rankings 2013–2020 (AKC registration statistics) | Repository **CC0 1.0**; underlying data from the AKC |
| AKC, "[Top Ten Breeds of the 1940s](https://www.akc.org/expert-advice/lifestyle/did-you-know/top-ten-breeds-of-the-1940s/)"; Wikipedia contributors, "[Beagle](https://en.wikipedia.org/wiki/Beagle)", "[Poodle](https://en.wikipedia.org/wiki/Poodle)", "[American Cocker Spaniel](https://en.wikipedia.org/wiki/American_Cocker_Spaniel)" | Years each breed held #1, 1936–2012 (sources differ by a year on the Cocker Spaniel's second run) | Facts; Wikipedia **CC BY-SA 4.0** |

## 7. Maps

| Source | Used for | License |
|---|---|---|
| [Natural Earth](https://www.naturalearthdata.com/) Admin 0 countries, 1:110m, v4.1.0 | Breed-origin globe, dig-site globe, Breed Explorer map | **Public domain** |
| [world-atlas](https://github.com/topojson/world-atlas) (TopoJSON packaging of Natural Earth) | Same | **ISC** |
| Breed origins (`cladogram/src/lib/origins.ts`) and original jobs (`cladogram/src/lib/purpose.ts`, `explorer.ts`) | Where they came from, Bred for purpose, Breed Explorer | Compiled for this site from standard breed histories (facts) |

## 8. Software, fonts & design references

| Source | Used for | License |
|---|---|---|
| [D3.js](https://d3js.org/) v7 | All charts and diagrams | ISC |
| [Next.js](https://nextjs.org/) 16, [React](https://react.dev/) 19 | Site framework | MIT |
| [topojson-client](https://github.com/topojson/topojson-client) | Map decoding | ISC |
| Google Fonts: **Bodoni Moda**, **Spectral**, **IBM Plex Sans Condensed** | Typography (bundled into the site at build time) | **SIL Open Font License 1.1** |
| pandas, scikit-learn, Pillow (build scripts only, not shipped) | NYC and Toronto names analysis, photo thumbnails | BSD-3-Clause / BSD-3-Clause / MIT-CMU |
| `Skill.md` — "frontend-design" skill | Design guidance | MIT (stated in the file) |
| The Pudding, "[Every Outdoor Basketball Court in the U.S.A.](https://pudding.cool/2024/09/courts/)" (2024) | Layout inspiration for the Breed Explorer (no content used) | n/a |

---

## License summary

**What applies to what**

| License | Applies to | What it requires |
|---|---|---|
| **CC BY / CC BY-SA (2.0–4.0), CC0, public domain** | Wikimedia Commons breed photos (credits in section 3) | Credit the author and license and link to the file page (done in the credits table). CC BY-SA photos shared in changed form must keep CC BY-SA. |
| **CC BY 4.0** | Parker et al. 2017 article and its supplementary data (`article.pdf`, `treeFile.pdf`, `haplotypeSharing.xlsx`); Donner et al. 2018; Marchant et al. 2017; Boyko et al. 2010; Yengo et al. 2022; OMIA content | Free to share and adapt, including commercially, **with credit** to the authors and a note of changes. |
| **CC BY-SA 4.0** | Wikipedia "Domestication of the dog", "Last Glacial Period", "Last Glacial Maximum", "Bonn–Oberkassel dog", "Paleolithic dog", 12 breed articles, and "Beagle", "Poodle", "American Cocker Spaniel" (years at #1) | Credit, **and share-alike**: adaptations of the article's *text* must use the same license. This site paraphrases facts rather than copying text, and credits the article on the History tab. |
| **CC0 / public domain** | Dryad dataset; Natural Earth; TidyTuesday AKC ranking compilation | No conditions. |
| **Facts, cited (no license needed for the facts)** | AKC breed rankings 2021–2025; figures from Parker et al. 2004 and Rosenberg et al. 2002 | Only the numbers are used, with credit; no text or figures are copied from the AKC pages or *Science* articles. |
| **PNAS open access license** | Brown et al. 2017 | Reuse with attribution under PNAS terms. |
| **Open Government Licence – Toronto** | Toronto Licensed Dog and Cat Names; Licensed Dogs and Cats Reports; Licensed Dogs and Cats | Free use with the attribution statement "Contains information licensed under the Open Government Licence – Toronto." No implied City endorsement. |
| **NYC Open Data Terms of Use** | NYC Dog Licensing Dataset | Free use; as-is, no warranty; say the data was modified; no implied City endorsement. |
| **ImageNet terms (non-commercial research/education) + GPL-3.0 repository + photographers' copyrights** | All dog photos (Dog CEO API / Stanford Dogs) | **The most restrictive part of the site.** Fine for this non-commercial, educational site; anyone reusing the site **commercially should remove or replace the photos** (including the Breed Explorer sprite sheets). |
| **MIT / ISC / OFL 1.1** | Code libraries and fonts | Keep copyright and license notices; fonts may be bundled and redistributed. |

**Bottom line**

- **Everything except the photos** can be reused, even commercially, as long as the sources
  above are credited (and the Wikipedia-derived text keeps CC BY-SA if copied verbatim).
- **The dog photos** are for non-commercial, educational use only.
- **The site's own code** (`cladogram/`) has no license file yet, so by default all rights are
  reserved by its author. Add a `LICENSE` file (for example MIT) if you want others to reuse it.
- **The NYC data and the health information are provided as-is.** The site is for learning, not
  veterinary advice.
