# howsillyistoosilly — portfolio

## setup

```bash
npm install
npm run dev
```

## build for production

```bash
npm run build
npm run preview
```

## adding screenshots

In `src/App.jsx`, find the project you want and replace the `proj-screen` div contents with:

```jsx
<div className="proj-screen">
  <img src="/screenshots/your-image.png" alt="project name" />
</div>
```

Put your images in `public/screenshots/`.

## tweaking the pixel trail

In `src/App.jsx`, find `<PixelTrail` and adjust:

- `gridSize` — pixel square size (higher = smaller squares)
- `trailSize` — brush radius (0.05–0.3)
- `maxAge` — how long trail stays (ms)
- `color` — trail color (currently `#0a0a0a`)
