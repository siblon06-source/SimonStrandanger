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
| 3 | `feat/project-pages-redesign` (bygger på gren 2) | Ny design projektsidor (kantig, ljus, faktarad) | KLAR (PR öppnas) |
| 4 | `feat/merge-2-7-and-arcgis` | Slå ihop 2+7, ny ArcGIS-sida | EJ PÅBÖRJAD (kräver PDF + text av Simon) |
| 5 | `feat/landing-polish` | Om mig / Bakgrund / Arbeten | EJ PÅBÖRJAD |

## Beslut och anteckningar

- Bröd-och-smör-regel: kantiga hörn (border-radius: 0) och ljust, modernt uttryck på projektsidorna.
- CV-filen ligger som bilaga i chatten (Copy_of_Resume_1.pdf) och ska kopieras till `cv.pdf` i repots rot.
- PR:erna ligger i en kedja (1 → 2 → 3 → 4 → 5). Merga i ordning; GitHub byter basgren automatiskt.
- CV:t innehöll bara e-post (ingen adress/telefon), så cv.pdf är oförändrad.
- Faktaraden på projektsidor: Bilder/Video räknas automatiskt av project.js. Roll/Tid läggs för hand i `<dl class="project-page-facts">` (finns bara på projekt 3 än så länge).
