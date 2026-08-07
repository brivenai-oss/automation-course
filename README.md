# Automation Fundamentals — Learn App

Mode A of the automation-freelancing course app: an interactive course teaching the
n8n/Make.com automation-gig fundamentals guide.

## Local development
```
npm install
npm run dev
```

## Build
```
npm run build
```
Outputs a static site to `dist/`.

## Deploy
This is a static Vite site — deploy `dist/` to Cloudflare Pages
(build command: `npm run build`, output directory: `dist`).
