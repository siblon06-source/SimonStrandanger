# Arbetsplan (återupptagbar)

Den här filen är arbetets "sparpunkt". Om arbetet avbryts: läs den här filen, ta nästa PR som inte är klar och fortsätt.

## Uppdrag (från Simon)

1. Fixa alla buggar och problem.
2. Beskriv hur Simon fixar det Claude inte kan själv + hur repo-storleken minskas.
3. Lägg in CV (cv.pdf).
4. Ny, kantigare, modern och ljus design för projektsidorna, med text/statistik där det passar (fråga Simon om text).
5. Undersök sammanslagning av projekt 7 och 2 + ny sida om ArcGIS-projekt med bilder, text och PDF.
6. Fräscha upp "Om mig", "Bakgrund" och "Arbeten" på landningssidan.

## Status

| PR | Gren | Innehåll | Status |
|----|------|----------|--------|
| 1 | `fix/bugs-and-cleanup` | Buggfixar, filnamn, titlar, README | PR #1 öppen |
| 2 | `feat/cv-and-repo-size` (bygger på gren 1) | cv.pdf, `docs/MANUAL-STEPS.md`, .gitignore, untracka source-material | PR #2 öppen |
| 3 | `feat/project-pages-redesign` (bygger på gren 2) | Ny design projektsidor (kantig, ljus, faktarad) | PR #3 öppen |
| 4 | `feat/merge-2-7-and-arcgis` (bygger på gren 3) | Projekt 2+7 sammanslagna till projekt 2; projekt 7 är nu ArcGIS-rapporten | PR #4 öppen. Väntar på bilder + PDF från Simon |
| 5 | `feat/landing-polish` (bygger på gren 4) | Om mig / Bakgrund / Arbeten | KLAR (PR öppnas) |

## Beslut och anteckningar

- Bröd-och-smör-regel: kantiga hörn (border-radius: 0) och ljust, modernt uttryck på projektsidorna.
- CV-filen ligger som bilaga i chatten (Copy_of_Resume_1.pdf) och ska kopieras till `cv.pdf` i repots rot.
- PR:erna ligger i en kedja (1 → 2 → 3 → 4 → 5). Merga i ordning; GitHub byter basgren automatiskt.
- CV:t innehöll bara e-post (ingen adress/telefon), så cv.pdf är oförändrad.
- Faktaraden på projektsidor: Bilder/Video räknas automatiskt av project.js. Roll/Tid läggs för hand i `<dl class="project-page-facts">` (finns bara på projekt 3 än så länge).

## PR 4: vad Simon behöver lägga in

- Projekt 7 = ArcGIS-rapporten (`projects/project-7.html`). Gamla utrustningsbilder flyttades till `images/projects/project-2/equipment/`.
- Bildplatser är tomma `<div class="project-page-gallery-item gis-figure-media">` (Figur 1–6, Bilaga 1). Lägg en `<img src="../images/projects/project-7/NAMN.jpg" alt="...">` inuti, så får de lightbox och räknas i faktaraden.
- PDF: lägg rapporten som `files/sveriges-tillganglighet-till-fots.pdf`.
- Miniatyrer för projekt 7: `images/carousel/7.jpg` (startsidan) och `images/projects/project-7/hero.jpg` (projects.html). Tills de finns visas en tom ruta.
- Refererenser att komplettera: Trafikverket (2025) och årtal för GSD-Höjddata (2004 i tabellen, 2020 i diskussionen i originalrapporten).

## Omgång 2 (UI-fixar och projektstädning)

| PR | Gren | Innehåll | Status |
|----|------|----------|--------|
| A (#10) | `work/ui-fixes` | CV-länk, Photograph-rubrik, Se alla bilder, projekt 1 bild 10.jpg | öppen |
| B | `work/gis-images` | Figur 1–6 + liggande thumbnail i projekt 7, Bilaga 1 borttagen | klar |
| C | `work/blender-merge` | Projekt 9 → projekt 6 (polygonmodellering i Blender), 27.png bort | klar |
| D | `work/webdev-project` | Projekt 4 ersätts av webbutvecklingsprojekt | klar (bildplatser tomma, lägg egen statistik i faktaraden) |
| E | `work/arbeten-rebuild` | Arbeten: erfarenhet, projekt (timeline), utbildning | planerad |

Kedja: A → B → C → D → E. Merga i ordning med "Delete branch".
