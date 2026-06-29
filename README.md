# VG Idea Manager (POC)

Proof of concept for a browser extension that:

- creates a Notion ticket/page for an incomplete idea
- picks one idea at random from a Notion page/database

## Prerequisites

- Node.js 18+
- Google Chrome (or Firefox if using the Firefox scripts)

## Install

1. Clone the repo

2. Install dependencies:
```bash
npm install
```

## Run in Development

Start the dev server:
```bash
npm run dev
```

For Firefox:
```bash
npm run dev:firefox
```

## Build

Build production extension files:
```bash
npm run build
```

For Firefox:
```bash
npm run build:firefox
```

Create a zip package:
```bash
npm run zip
```

For Firefox zip:
```bash
npm run zip:firefox
```

## Type Check

```bash
npm run compile
```

## Load the Extension in Chrome (Unpacked)

1. Build the extension:

```bash
npm run build
```

2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the generated output folder from the WXT build (typically under `.output/`).
