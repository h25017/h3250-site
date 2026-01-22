# WebP Kepkonvertalo

Modern, SEO-optimalizalt kepkonvertalo alkalmazas, amely JPG/PNG kepeket alakit at WebP formatumra magyar ekezet kezelessel.

## Funkciok

### Alapfunkciok
- **Batch feltoltes** - Max 10 kep egyszerre (drag & drop)
- **Kepformatum konverzio** - JPG/PNG -> WebP
- **Kepmeret optimalizalas** - Automatikus atmeretezés 1920px max szelesseg/magassag
- **Kompresszio** - 90% minoseggel, jelentos fajlmeret csokkentes
- **ZIP letoltes** - Osszes konvertalt kep egyben
- **Egyenkenti letoltes** - Minden kep kulon is letoltheto
- **Progress indikator** - Statusz jelzok minden fajlhoz

### SEO Optimalizalas
- **Magyar ekezetek normalizalasa**
  - `a,e,i,o,o,o,u,u,u` -> `a,e,i,o,o,o,u,u,u`
- **URL-barat fajlnevek**
  - `Kemenyteto Szigeteles.jpg` -> `kemenyteto-szigeteles.webp`
- **Automatikus slug generalas**
  - Kisbetusites
  - Specialis karakterek eltavolitasa
  - Szokozok kotojelre cserelese

### UI/UX
- **Dark mode tamogatas** - Automatikus rendszer tema kovetes
- **Responsive design** - Mobil es desktop optimalizalt
- **Tailwind CSS** - Modern, gyors styling
- **Vizualis feedback** - Drag hover, atmenetek, animaciok

## Technologiai Stack

### Frontend Framework
- **Astro 5.16.8** - Static Site Generation
- **React 19** - Interaktiv komponensek (Islands Architecture)
- **TypeScript** - Tipusbiztos fejlesztes

### Styling
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **CSS Variables** - Dinamikus temavaztas
- **Custom Design System** - Konzisztens szinek es spacing

### Kepfeldolgozas
- **browser-image-compression 2.0.2** - Kliens oldali kepkonverzio
- **JSZip 3.10.1** - ZIP fajl generalas
- **FileReader API** - Base64 preview generalas
- **Blob/File API** - Fajlkezeles es letoltes

### Tovabbi Eszkozok
- **Alpine.js 3.15.3** - Konnyu interakciok
- **Lenis 1.3.17** - Smooth scroll
- **Sharp 0.34.5** - Opcionalis szerver oldali kepfeldolgozas

## Projekt Struktura

```
astro-v1/
├── src/
│   ├── components/
│   │   ├── Counter.tsx          # Pelda React komponens (kesobb torolheto)
│   │   └── FileUploader.tsx     # Fo kepkonvertalo komponens
│   ├── lib/
│   │   └── utils.ts             # Slug generalas es helper fuggvenyek
│   ├── pages/
│   │   ├── index.astro          # Fooldal - FileUploader
│   │   └── landing.astro        # Eredeti landing page
│   └── styles/
│       └── tailwind.css         # Tailwind konfiguracio
├── public/                      # Statikus fajlok
├── astro.config.mjs            # Astro konfiguracio
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript konfiguracio
└── tailwind.config.mjs         # Tailwind beallitasok
```

## Telepites es Futtatas

### Elofeltelek
- Node.js 18+ vagy 20+
- npm vagy yarn package manager

### 1. Dependencies telepitese
```bash
npm install
```

### 2. Development szerver inditasa
```bash
npm run dev
```

Az alkalmazas elerheto: `http://localhost:4321`

### 3. Production build
```bash
npm run build
```

### 4. Preview a build-bol
```bash
npm run preview
```

## Telepitett Csomagok

### Core Dependencies
```json
{
  "astro": "^5.16.8",
  "@astrojs/react": "^3.6.2",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "browser-image-compression": "^2.0.2",
  "jszip": "^3.10.1"
}
```

### Styling & UI
```json
{
  "tailwindcss": "^4.1.18",
  "@tailwindcss/vite": "^4.1.18",
  "@tailwindcss/forms": "^0.5.11",
  "@tailwindcss/typography": "^0.5.19",
  "alpinejs": "^3.15.3",
  "lenis": "^1.3.17"
}
```

### Build Tools
```json
{
  "sharp": "^0.34.5",
  "typescript": "^5.x"
}
```

## Komponens Dokumentacio

### FileUploader Component

**Helye:** `src/components/FileUploader.tsx`

**State Management:**
```typescript
interface FileItem {
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'converting' | 'done' | 'error';
    convertedFile?: File;
    slugifiedName?: string;
}

const [files, setFiles] = useState<FileItem[]>([]);
const [isDragging, setIsDragging] = useState(false);
const [isConverting, setIsConverting] = useState(false);
```

**Fobb Fuggvenyek:**

#### `addFiles`
- Tobb fajl hozzaadasa (max 10)
- FileReader API hasznalat preview generalshoz
- Validacio (csak JPG/PNG)

#### `handleConvertAll`
- Batch konverzio szekvencialisan
- Statusz frissites minden fajlhoz (pending -> converting -> done/error)
- browser-image-compression beallitasai:
  - `maxWidthOrHeight: 1920` - Max kepmeret
  - `useWebWorker: true` - Gyorsabb feldolgozas
  - `fileType: 'image/webp'` - WebP konverzio
  - `initialQuality: 0.9` - 90% minoseg

#### `handleDownloadSingle`
- Egyedi fajl letoltese slug-olt nevvel

#### `handleDownloadZip`
- JSZip hasznalata
- Osszes konvertalt kep egy ZIP fajlban
- Automatikus letoltes

#### `removeFile`, `clearAll`
- Fajl eltavolitas egyenkent vagy osszes torlese

### Slug Generalas

**Helye:** `src/lib/utils.ts`

**Funkcio:** `slugify(text: string): string`

**Mukodes:**
1. Magyar ekezetek csereje (a->a, e->e, stb.)
2. Kisbetusites
3. Specialis karakterek eltavolitasa
4. Szokozok -> kotojel
5. Tobbszoros kotojelek -> egyszeres
6. Kezdo/zaro kotojelek torlese

**Pelda:**
```typescript
slugify("Kemenyteto Szigeteles 2024.jpg")
// -> "kemenyteto-szigeteles-2024"
```

## Hasznalat

### 1. Fajlok feltoltese
- Kattints a feltolto teruletre VAGY
- Huzd ra a kepeket (drag & drop)
- Max 10 kep egyszerre (fajlszamlalo: X/10)

### 2. Fajl lista
- Minden kep megjelenik thumbnail-lal
- Fajl adatok lathatoak (nev, meret)
- Statusz jelzo: pending (varakozik)

### 3. Konverzio
- Kattints a "Konvertalas (X kep)" gombra
- Spinner animacio konverzio kozben
- Statusz valtozik: converting -> done/error

### 4. Eredmeny
- Zold keret jelzi a kesz fajlokat
- SEO-barat fajlnev lathato
- Meretcsokkenes szazalek mutatva
- Osszesitett megtakaritas megjeleniitve

### 5. Letoltes
- **Egyenkent:** Minden fajl mellett letoltes gomb
- **ZIP-ben:** "ZIP letoltes (X kep)" gomb (2+ kep eseten)

## Konfiguracio

### Kepkonverzio beallitasok

`src/components/FileUploader.tsx` - `handleConvert` fuggvenyben:

```typescript
const options = {
  maxWidthOrHeight: 1920,      // Modosithato: max kepmeret
  useWebWorker: true,          // Ajanlott: true
  fileType: 'image/webp',      // WebP formatum
  initialQuality: 0.9          // 0-1 kozott (0.9 = 90%)
};
```

### Tamogatott formatumok

Input `accept` attributum:
```typescript
accept="image/jpeg,image/png"
```

Bovitheto tovabbi formatumokkal (pl. GIF, BMP).

## Testreszabas

### Szinek

CSS valtozok a `src/pages/index.astro` fajlban:

```css
:root {
  --color-primary: #6366F1;    /* Foszin (kek) */
  --color-accent: #10B981;     /* Kiegeszito (zold) */
  --color-danger: #EF4444;     /* Hiba/warning (piros) */
  --color-bg: #FAFAFA;         /* Hatter */
  --color-surface: #FFFFFF;    /* Kartyak hattere */
  --color-text: #0F172A;       /* Szoveg */
  --color-text-muted: #64748B; /* Halvanyabb szoveg */
  --color-border: #E2E8F0;     /* Keretek */
}
```

Dark mode automatikusan kezelt a `:root.dark` selectorral.

### Fontok

```css
--font-display: 'Outfit', sans-serif;  /* Cimsorok */
--font-body: 'DM Sans', sans-serif;    /* Szovegtorzs */
```

## Deployment

### Vercel (Ajanlott)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Cloudflare Pages
```bash
npm run build
# Publish dist/ folder
```

## Teljesitmeny

### Atlagos eredmenyek
- **Fajlmeret csokkenes:** 85-95%
- **Konverzios ido:** 1-3 masodperc (kliens oldali)
- **Tamogatott kepmeret:** Max 10MB (modosithato)
- **Max szelesseg/magassag:** 1920px (modosithato)

### Pelda
- **Eredeti:** 434 KB (JPG, 1169x669)
- **Konvertalt:** 48 KB (WebP, 1169x669)
- **Megtakaritas:** 89%

## Jovobeli Fejlesztesek

### Megvalositva (v1.1.0)
- [x] Batch feldolgozas (max 10 kep egyszerre)
- [x] ZIP letoltes (tobb kep eseten)
- [x] Progress indikator (statusz jelzok)

### Tervezett Funkciok
- [ ] Egyedi meretezés UI (user altal allithato)
- [ ] Keparany valaszto (16:9, 4:3, negyzet, stb.)
- [ ] Minoseg slider (dinamikus beallitas)
- [ ] Kepvagas/crop funkcio
- [ ] Vizjel hozzaadas
- [ ] EXIF adatok megorzese/torlese
- [ ] PWA (offline hasznalat)
- [ ] Felho storage integracio (optional)

## Hibakeresteés

### Konverzio nem mukodik
- Ellenorizd a bongeszo konzolt (F12)
- Tamogatott formatum? (JPG/PNG)
- Fajl meret alatt 10MB?

### Drag & Drop nem mukodik
- `onDragOver` es `onDrop` event handlerek beallitva?
- `preventDefault()` meghivva?

### Letoltes nem mukodik
- Blob URL letrejott?
- `link.download` attributum beallitva?
- Bongeszo engedelyezi a letoltest?

## Licensz

MIT License - Szabad felhasznaalas es modositas.

## Fejleszto

**Nev:** Zsolt
**Szakertelem:** WordPress -> Modern JavaScript Stack atteres
**Stack:** Astro + React + TypeScript

## Koszonet

- Astro team - Kivalo SSG framework
- Tailwind CSS - Gyors es rugalmas styling
- browser-image-compression - Kliens oldali kepfeldolgozas
- Anthropic Claude - Fejlesztesi tamogatas

---

**Verzio:** 1.2.0
**Utolso frissites:** 2026. januar 22.
**Status:** Production Ready
