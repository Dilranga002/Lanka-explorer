# Week 04 API Notes — Lanka Explorer

## Weather — Open-Meteo
- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Method: GET; uses each destination `lat`/`lng` from JSON and `timezone=Asia/Colombo`.
- Fields: `current.temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`, `weather_code` and `daily` forecast arrays.
- API key: none for the free non-commercial usage described by the lab guide.
- Errors: the weather card shows a friendly message if the API is unavailable.
- Docs: https://open-meteo.com/en/docs

## Currency — Frankfurter
- Endpoint: `https://api.frankfurter.dev/v2/rate/usd/lkr`
- Method: GET. Response contains a numeric `rate`.
- Used to convert sample destination fees in USD to approximately LKR.
- Rate is cached in a Promise for the current page to prevent unnecessary requests.
- Errors: show `LKR rate unavailable` instead of an invented exchange rate.
- Docs: https://frankfurter.dev

## Maps — Leaflet / OpenStreetMap
- Leaflet 1.9.4 assets loaded from unpkg; `L.map`, `L.tileLayer` and `L.marker`.
- Tile URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
- Each location's coordinates are taken from destinations.json.
- Attribution to OpenStreetMap contributors is included.
- Docs: https://leafletjs.com/

## Testing note
APIs require an internet connection and may enforce limits. Do not mistake educational ticket price examples for official admission prices.
