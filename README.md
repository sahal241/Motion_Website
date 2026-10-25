# Pillow Paws 🐾

A responsive landing page concept for a premium dog hotel. Pillow Paws pairs a cozy, playful design with an interactive two-dog hero and a simple stay-planning demo.

**Live site:** [motionwebsite.vercel.app](https://motionwebsite.vercel.app/)

## Features

- Two illustrated dogs whose pupils smoothly follow the cursor while their heads, bodies, ears, and paws stay still.
- Independent idle glances and gentle blinking, with support for reduced-motion preferences.
- Room cards with photos, descriptions, and illustrative nightly prices in INR.
- A day-at-the-hotel guide, team introduction, and frequently asked questions.
- A responsive booking demo for dates, room choice, and dog details, with a live cost estimate.

## Built with

HTML, CSS, and vanilla JavaScript. The site uses WebP artwork and photos from `assets/`; no framework or build step is required.

## Run locally

Clone the repository and open `index.html` in a browser:

```bash
git clone https://github.com/sahal241/Motion_Website.git
cd Motion_Website
open index.html
```

On other systems, open `index.html` with your browser's file picker. You can also serve the folder locally with `python3 -m http.server 8000` and visit `http://localhost:8000`.

## Project files

| Path | Purpose |
| --- | --- |
| `index.html` | Page content and booking form |
| `styles.css` | Layout, responsive design, and eye styling |
| `script.js` | Eye interaction and booking preview |
| `assets/` | Optimized dog artwork and hotel imagery |

## Booking demo

The booking form is a front-end preview only. It calculates an estimated total in the browser; it does **not** send form details, reserve a room, or take payment. Room prices are illustrative.
