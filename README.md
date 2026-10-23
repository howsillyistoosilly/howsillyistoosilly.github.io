# howsillyistoosilly — portfolio

Portfolio and blog built with Preact, Vite, and Sanity. The UI uses Preact's React compatibility layer for Portable Text and existing component APIs. Blog and motion routes are loaded only when visited.

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

## Sanity Studio

```bash
npm run studio
npm run build:studio
```

Set `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_DATASET`, and `VITE_SANITY_API_VERSION` in `.env.local` to override the default Sanity project settings.

Project data and the home page sections are defined in `src/App.jsx`. Project screenshots live in `src/assets/`.
