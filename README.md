# SABGA League

A phone-first, installable web app for SABGA Round Robin League standings, fixtures, match results and Performance Ratings.

## Run locally

Requires Node.js 20 or newer. From this folder, run `npm start` and open `http://localhost:3000`.

## Deploy to Render

Create a **Web Service** connected to this GitHub repository. Render can build it from the included `Dockerfile`; alternatively, choose the Node runtime, leave the build command blank, and set the start command to `npm start`. Render provides the port automatically.

After deployment, open the HTTPS address on a phone and choose **Add to Home Screen** or **Install app** in the browser menu. The app shell is cached after the first visit for offline use.

## League data

`public/data.json` contains the A-League snapshot captured on 19 October 2026. The app labels it as a snapshot and links to SABGA's official page for live information. Other groups are available through that official page and are not included in this snapshot.

- [Current standings and live league data](https://www.sabga.co.za/league/)
- [About the SABGA Round Robin leagues](https://www.sabga.co.za/sabga-round-robin-leagues/)
