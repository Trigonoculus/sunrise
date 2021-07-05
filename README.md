sunrise
===

Features
---
- Lookup place name using GeoNames' API
- Calculate sunrise and sunset for a certain place (also uses GeoNames API)
- More coming soon

Requirements
---
- Node.js & npm
- A GeoNames account
    - Register [here](http://www.geonames.org/login), verify your email, then enable free webservices at the bottom of [this page](http://www.geonames.org/manageaccount)
    - Put your username in `.env` (see below)

Usage
---
First, clone this repository:

```git clone https://github.com/Trigonoculus/sunrise```

Second, install dependencies:

```npm install```

Thirdly, copy `.env.example` to `.env`. For unix systems:

```cp .env.example .env```

Then, edit the file using your favorite text editor. Each value is self-explanatory.

Lastly, run the bot:

```node bot.js```