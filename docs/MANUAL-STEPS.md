# Saker du gör själv

## 1. Koppla GitHub så Claude kan skapa pull requests

Claude hade bara läsrätt till repot. Gör så här en gång:

1. Gå till https://github.com/apps/claude/installations/select_target
2. Välj ditt konto (`siblon06-source`) och ge appen åtkomst till repot `SimonStrandanger`.
3. Säg till i chatten, så pushar Claude brancherna och öppnar pull requests.

Alternativ utan koppling: ta patchfilerna Claude lämnat och kör `git am <fil>.patch` i din lokala klon, skapa en gren per patch och öppna pull requests på github.com.

## 2. Minska sajtens storlek

Läget: `.git` är ca 1,2 GB, `images/` ca 690 MB. GitHub Pages har en rekommenderad gräns på 1 GB för publicerad sajt, och sidan blir seg för besökare.

**Steg A – sluta spåra originalmaterial (görs i PR 2).** `source-material/` (ca 700 MB) är borttagen från Git men ligger kvar på din dator och finns i `.gitignore`.

**Steg B – ta bort oanvänd media.** Dessa filer används inte av någon sida:

- `images/projects/project-3/MVI_7390.MP4` (97 MB)
- `images/projects/project-1/video.mp4` (80 MB)
- `images/projects/project-7/KomplettVideo.mp4` (12 MB)
- `images/projects/project-3/9.JPG`, `10.JPG`, `12.JPG` (ca 20 MB tillsammans)

Flytta dem till en mapp utanför repot, sedan `git rm` på dem.

**Steg C – komprimera video som används.** Installera ffmpeg och kör per fil:

```
ffmpeg -i in.mp4 -vf "scale=-2:1080" -c:v libx264 -crf 26 -preset slow -an -movflags +faststart ut.mp4
```

(`-an` tar bort ljud, ta bort om du vill ha ljud.) 1080p med CRF 26 ger oftast 5–10 gånger mindre filer. Överväg att lägga långa filmer på YouTube/Vimeo och bädda in dem.

**Steg D – komprimera bilder.** PNG-renderingar på 10–18 MB (t.ex. i `project-5`) kan bli JPG eller WebP i kvalitet 80–85 med t.ex. Squoosh (squoosh.app) eller:

```
magick in.png -quality 85 -resize 2400x ut.webp
```

**Steg E – rensa Git-historiken.** Steg A–D minskar bara framtida storlek. Historiken har kvar allt gammalt. Gör en backup först (kopiera hela mappen), sedan:

```
pip install git-filter-repo
git filter-repo --path source-material --invert-paths
git filter-repo --path images/projects/project-3/MVI_7390.MP4 --invert-paths
git remote add origin https://github.com/siblon06-source/SimonStrandanger.git
git push --force --all
```

Det skriver om historiken, så alla andra kloner måste klonas om. Enklast om du är ensam om repot. Alternativ: skapa ett nytt, tomt repo och pusha bara nuvarande innehåll.

**Steg F – Git LFS (valfritt).** Om du vill behålla stora filer i repot: `git lfs install` och `git lfs track "*.mp4"`. Obs att GitHub har en gräns på lagring och bandbredd för LFS i gratisplanen.

## 3. Saker Claude behöver av dig

- ArcGIS-projektet: PDF, 3–8 bilder och en kort text (PR 4).
- Text eller siffror till projektsidorna (PR 3): Claude lägger platshållare där det saknas.
- Bestäm om hemadress och telefonnummer i `cv.pdf` ska vara kvar. PDF:en är nu publik på sajten. Vill du slippa det, exportera en version utan adress.
