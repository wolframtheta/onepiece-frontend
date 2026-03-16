# One Piece Frontend - Angular 19

Migració de SolidStart a Angular 19 amb SSR, standalone components, signals, i Tailwind CSS.

## Stack Tecnològic

- **Angular 19** amb standalone components
- **Angular SSR** (`@angular/ssr`) per server-side rendering
- **Angular Signals** per gestió d'estat reactiu
- **HttpClient** amb interceptors funcionals per autenticació
- **Tailwind CSS** (@tailwindcss/postcss) per estils
- **Reactive Forms** per formularis
- **Angular Router** amb lazy loading

## Estructura del Projecte

```
src/
├── app/
│   ├── components/          # Components reutilitzables
│   │   ├── top-bar/
│   │   ├── continue-watching/
│   │   └── video-player/
│   ├── pages/              # Pàgines principals
│   │   ├── home/
│   │   ├── login/
│   │   └── season/
│   ├── services/           # Serveis HTTP
│   │   ├── auth.service.ts
│   │   ├── shows.service.ts
│   │   └── progress.service.ts
│   ├── stores/             # Gestió d'estat amb signals
│   │   └── auth.store.ts
│   ├── interceptors/       # HTTP interceptors
│   │   └── auth.interceptor.ts
│   ├── models/             # Interfícies TypeScript
│   │   ├── auth.model.ts
│   │   ├── show.model.ts
│   │   └── progress.model.ts
│   ├── config.ts           # Configuració de l'aplicació
│   ├── app.routes.ts       # Definició de rutes
│   └── app.config.ts       # Configuració d'Angular
├── styles.css              # Estils globals amb Tailwind
└── server.ts               # Servidor SSR Express
```

## Característiques Principals

### 1. SSR i Compatibilitat amb el Navegador

- Totes les operacions amb `localStorage`, `window`, i `document` estan protegides amb `isPlatformBrowser()`
- Prerendering per les rutes estàtiques (home i login)
- Server-side rendering per rutes dinàmiques (temporades amb paràmetres)

### 2. Autenticació

- Interceptor HTTP que afegeix el token Bearer automàticament
- Refresh automàtic del token en rebre un 401
- Cua de peticions fallides per evitar múltiples crides de refresh
- Redirect automàtic a `/login` si el refresh falla

### 3. Gestió d'Estat

- `AuthStore` amb Angular signals per l'estat d'autenticació
- Signals per dades reactives als components
- `computed()` per valors derivats

### 4. Reproductor de Vídeo

- Represa automàtica des de la última posició
- Guardat del progrés al fer pausa i abans de sortir
- Salt d'intro configurable
- Navegació entre episodis (anterior/següent)
- Marcatge d'episodis com a visualitzats

### 5. Estils amb Tailwind CSS

- Theme fosc amb palette slate
- Classes utility-first
- Responsive design
- Transicions i animacions fluides

## Scripts Disponibles

- `npm run dev` - Servidor de desenvolupament
- `npm run build` - Build de producció
- `npm run start` - Executar el servidor SSR

## Variables d'Entorn

L'aplicació utilitza la variable `API_URL` per configurar l'endpoint del backend:

- **Development**: `http://localhost:3001/api` (`.env`)
- **Production**: `https://onepiece.scrum-app.com/api` (`.env.pro`)

La configuració s'injecta via `APP_CONFIG` token i es pot configurar amb variables d'entorn en build time.

## Docker

El projecte inclou un `Dockerfile` multi-stage per desplegament:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
...build the app...

# Production stage
FROM node:20-alpine AS runner
...run the SSR server...
```

Build amb Docker:
```bash
docker build --build-arg API_URL=https://onepiece.scrum-app.com/api -t one-piece-frontend .
docker run -p 3000:3000 one-piece-frontend
```

## Migració de SolidJS a Angular

### Conceptes Clau

| SolidJS | Angular 19 |
|---------|-----------|
| `createSignal()` | `signal()` |
| `createEffect()` | `effect()` |
| `createResource()` | `HttpClient` + `toSignal()` |
| `<Show when={}>` | `@if` (control flow) |
| `<For each={}>` | `@for` (control flow) |
| `<Suspense>` | `@defer` o loading states |
| File-based routing | `app.routes.ts` explícit |
| Axios interceptors | `HttpInterceptorFn` |

### Diferències Importants

1. **Templates**: JSX → Templates d'Angular amb nova sintaxi de control flow
2. **Reactivitat**: Signals de SolidJS → Angular signals (API similar)
3. **HTTP**: Axios → HttpClient amb RxJS
4. **Formularis**: Gestió manual → Reactive Forms
5. **SSR**: `typeof window !== 'undefined'` → `isPlatformBrowser(platformId)`

## Notes de la Migració

- El backend manté la mateixa API, només canvia el client
- Els fitxers `.env` i `.env.pro` es mantenen per compatibilitat
- L'aplicació original SolidStart està a `../one-piece-frontend-solidstart`
- Tailwind CSS utilitza la nova versió v4 amb `@import "tailwindcss"`
