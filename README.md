sunrise
===

Features
---
- Lookup place name using GeoNames' API
- Calculate sunrise and sunset for a certain place (also uses place lookup logic)
- Get the METAR for an airport, along with information, using either a 3-letter IATA code (e.g. LHR) or a 4-letter ICAO code (e.g. EGLL)

Requirements
---
- Node.js & npm
- A GeoNames account
    - Register [here](http://www.geonames.org/login), verify your email, then enable free webservices at the bottom of [this page](http://www.geonames.org/manageaccount)
    - Put your username in `.env` (see below)
- Discord bot token - if you do not know how, here is a [guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html)

Limitations
---
GeoNames' free API has a limit of 1,000 requests per hour and 20,000 per day.

Installation
---
First, clone this repository:

```bash
git clone https://github.com/Trigonoculus/sunrise
```

Second, install dependencies:

```bash
npm install
```

*If you get an error about node-gyp, see [here](https://github.com/nodejs/node-gyp).*

Thirdly, copy `.env.example` to `.env`. For unix systems:

```bash
cp .env.example .env
```

Then, edit the file using your favorite text editor. Each value is self-explanatory.

Lastly, run the bot:

```bash
node bot.js
```

Acknowledgements
---
This project uses OpenFlights Airport Database, which is available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).

> **This data is not suitable for navigation.** OpenFlights does not assume any responsibility whatsoever for its accuracy, and consequently assumes no liability whatsoever for results obtained or loss or damage incurred as a result of application of the data. OpenFlights expressly disclaims all warranties, expressed or implied, including but not limited to implied warranties of merchantability and fitness for any particular purpose.