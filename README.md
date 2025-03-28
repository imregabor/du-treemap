du-treemap
==========

Visualize output from a `du` output.

![hierarchic layout](doc/screenshot-1.png)

![flat layout](doc/screenshot-2.png)


Getting started
---------------


### Build

``` bash
npm install
npm run build
```

Open `dist/index.html`


Visualize custom `du` output
----------------------------

### Run `du`

Make sure that output ends with `.txt`.

``` bash
du --apparent-size -b > <PATH_TO_DU_OUTPUT_TXT>
```

### Optionally reduce size

Sample `du` output by dropping entries below specified depth to reduce size:

```
MAX_DEPTH=2
grep -Ev '(?/.*){'$MAX_DEPTH',}/' <PATH_TO_DU_OUTPUT_TXT> > <PATH_TO_SAMPLED_OUTPUT_TXT>

```

Sample `du` output by dropping trees below specified size

```
MIN_SIZE_DIGITS=4 # drop subtree when size is abelow 1k
grep -E '^[0-9]{'MIN_SIZE_DIGITS',}' <PATH_TO_DU_OUTPUT_TXT> > <PATH_TO_SAMPLED_OUTPUT_TXT>
```


### Build

Run from the project directory:

``` bash
DATA_FILE=<PATH_TO_DU_OUTPUT_TXT> npm run build
```

Or from elsewhere:

``` bash
DATA_FILE=<PATH_TO_DU_OUTPUT_TXT> npm --prefix <PATH_TO_PROJECT_DIR> run build
```


Inline build
------------

To emit a single self contained `index.html` launch

``` bash
INLINE_BUILD=true npm run build
```

Inline build can also use custom data:

``` bash
DATA_FILE=<PATH_TO_DU_OUTPUT_TXT> INLINE_BUILD=true npm run build
```


Update screenshots
------------------

Cypress can generate screenshots linked in `README.md`:

``` bash
npm run build
npx cypress run --browser chrome --headless
cp cypress_screenshots/screenshot.cy.js/screenshot-1.png doc/
cp cypress_screenshots/screenshot.cy.js/screenshot-2.png doc/
```
