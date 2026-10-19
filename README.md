# IBDP Computer Science — student resource site

Ambassador International Academy, Dubai · IB Diploma Programme Computer Science, **first assessment 2027**

Live at `https://mudassarqu.github.io/ibdp-cs/` and embedded in
`https://sites.google.com/view/ibdp-cs/home`.

Every page is a single self-contained HTML file. There is no build step, no
framework and no server — drop the folder into the repository and GitHub Pages
serves it as it is.

---

## What is in the folder

| File | What it is | Syllabus |
|---|---|---|
| `index.html` | The landing page. Lists all 25 syllabus topics, with search and filters. | — |
| `a1-1-computer-hardware.html` | Full study notes: 12 panels, 34 review Q&A, 10 past-paper questions, 16 predicted 2027 questions, 33 key terms, every answer page-referenced. | A1.1 |
| `a1-1-quiz.html` | Quiz Arena — 41 timed questions, five formats, explanation after every answer, results to a Google Sheet. | A1.1 |
| `a1-1-performance-lab.html` | Three live simulators: cache hierarchy, pipelining, bus width. | A1.1.1 / .4 / .6 |
| `a1-1-5-fde-simulation.html` | Fetch–decode–execute cycle in 3D. | A1.1.5 |
| `a1-2-1-representing-data.html` | Study notes and practice on number bases and conversions. | A1.2.1 |
| `a1-2-2-storing-data.html` | Study notes and practice on storing text, images, sound and video in binary. | A1.2.2 |
| `a1-2-2-binary-lab.html` | Binary Data Lab — type a character, draw a bitmap, sample a waveform. | A1.2.2 |
| `QuizBackend.gs` | Google Apps Script for the quiz. **Not** part of the website — paste it into Apps Script. | — |

Each page carries a **← All topics** link back to `index.html`.

---

## Putting it on GitHub

1. Go to the `ibdp-cs` repository → **Add file → Upload files**.
2. Drag in everything from this folder **except** `QuizBackend.gs` and this README
   (both are harmless if uploaded, they just are not web pages).
3. Commit.
4. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main`, Folder: `/ (root)`.
5. Give it a minute, then open `https://mudassarqu.github.io/ibdp-cs/`.

Uploading a file with a name that already exists replaces it, so re-uploading
the whole folder is the simplest way to update the site.

---

## Putting it on Google Sites

Google Sites cannot host HTML files, so it has to point at the GitHub Pages copy.

**Insert → Embed → Embed code** (the *Embed code* tab, **not** *By URL*):

```html
<iframe src="https://mudassarqu.github.io/ibdp-cs/"
        width="100%" height="820" frameborder="0"></iframe>
```

Use the same snippet with a specific filename on the end to embed one page on
its own, for example `.../ibdp-cs/a1-1-quiz.html`.

---

## Two things to finish

**1. Connect the quizzes to your Google Sheet.** Open `QuizBackend.gs` and follow
the numbered instructions at the top. When you have the Web app URL, open
`a1-1-quiz.html`, find this line near the top of the `<script>`:

```js
const SHEETS_URL = '';
```

and paste the URL between the quotes. Until you do, students still get their
score on screen — nothing is saved, and the page says so.

**One spreadsheet for the whole course.** Set this up once. Every quiz you add
later uses the *same* URL and writes to the *same* spreadsheet — there is no
second sheet and no second deployment. Three tabs appear by themselves:

| Tab | One row per | Use it for |
|---|---|---|
| `Results` | attempt | who sat which topic, their score and grade |
| `Answers` | question | which questions the class actually got wrong |
| `Summary` | topic + class | class averages per topic, rebuilt after every submit |

What keeps the topics apart is the two lines under `SHEETS_URL`:

```js
const QUIZ_TOPIC = 'A1.1';
const QUIZ_TITLE = 'Computer hardware and operation';
```

They become the **Topic** and **Quiz** columns. When you copy the quiz for a new
topic, change those two lines and leave `SHEETS_URL` exactly as it is.

**2. Add your existing CPU page.** If you still have the earlier CPU fundamentals
page, rename it `a1-1-1-cpu-fundamentals.html`, put it in this folder, and in
`index.html` delete the `/*` and `*/` around this line:

```js
/* ,{k:'notes', t:'A1.1.1 CPU fundamentals hub', href:'a1-1-1-cpu-fundamentals.html'} */
```

---

## Adding a topic later

`index.html` builds itself from one list near the top of its `<script>`, called
`SYLLABUS`. All 25 topics are already in it. To publish a new resource, find the
topic and add a line to its `items` array:

```js
{code:'A1.3', title:'Operating systems and control systems', items:[
  {k:'notes', t:'Study notes and exam practice', href:'a1-3-operating-systems.html'}
]},
```

`k` is one of `notes`, `quiz`, `sim`, `paper` — it sets the icon and colour.
Add `feat:'one line about it'` as well and the resource also appears in the
**Start here** row at the top.

The headline counters, the progress ring, the filters and the search all read
from that list, so they update by themselves. A topic whose `items` array is
empty shows as *In preparation* — nothing else to change.

---

## Source

Baumgarten, Ganea & Turland, *Computer Science*, Hodder Education 2025.
Figures and definitions are reproduced for classroom use with the book page
number shown beside each one.

Two pages pull a library from cdnjs at load time (three.js and GSAP, for the 3D
fetch–decode–execute scene). Everything else, images included, is embedded in
the file.
