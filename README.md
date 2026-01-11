# 🖼️ WebP Képkonvertáló

Modern, SEO-optimalizált képkonvertáló alkalmazás, amely JPG/PNG képeket alakít át WebP formátumra magyar ékezetkezeléssel.

## ✨ Funkciók

### 🎯 Alapfunkciók
- **Drag & Drop feltöltés** - Vizuális feedback-kel
- **Képformátum konverzió** - JPG/PNG → WebP
- **Képméret optimalizálás** - Automatikus átméretezés 1920px max szélesség/magasság
- **Kompresszió** - 90% minőséggel, jelentős fájlméret csökkentés
- **Élő előnézet** - Eredeti és konvertált kép összehasonlítása

### 📝 SEO Optimalizálás
- **Magyar ékezetek normalizálása**
  - `á,é,í,ó,ö,ő,ú,ü,ű` → `a,e,i,o,o,o,u,u,u`
- **URL-barát fájlnevek**
  - `Kéménytető Szigetelés.jpg` → `kemenyteto-szigeteles.webp`
- **Automatikus slug generálás**
  - Kisbetűsítés
  - Speciális karakterek eltávolítása
  - Szóközök kötőjelre cserélése

### 🎨 UI/UX
- **Dark mode támogatás** - Automatikus rendszer téma követés
- **Responsive design** - Mobil és desktop optimalizált
- **Tailwind CSS** - Modern, gyors styling
- **Vizuális feedback** - Drag hover, átmenetek, animációk

## 🚀 Technológiai Stack

### Frontend Framework
- **Astro 5.16.8** - Static Site Generation
- **React 19** - Interaktív komponensek (Islands Architecture)
- **TypeScript** - Típusbiztos fejlesztés

### Styling
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **CSS Variables** - Dinamikus témaváltás
- **Custom Design System** - Konzisztens színek és spacing

### Képfeldolgozás
- **browser-image-compression 2.0.2** - Kliens oldali képkonverzió
- **FileReader API** - Base64 preview generálás
- **Blob/File API** - Fájlkezelés és letöltés

### További Eszközök
- **Alpine.js 3.15.3** - Könnyű interakciók
- **Lenis 1.3.17** - Smooth scroll
- **Sharp 0.34.5** - Opcionális szerver oldali képfeldolgozás

## 📁 Projekt Struktúra

```
astro-v1/
├── src/
│   ├── components/
│   │   ├── Counter.tsx          # Példa React komponens (később törölhető)
│   │   └── FileUploader.tsx     # Fő képkonvertáló komponens
│   ├── lib/
│   │   └── utils.ts             # Slug generálás és helper függvények
│   ├── pages/
│   │   ├── index.astro          # Főoldal - FileUploader
│   │   └── landing.astro        # Eredeti landing page
│   └── styles/
│       └── tailwind.css         # Tailwind konfiguráció
├── public/                      # Statikus fájlok
├── astro.config.mjs            # Astro konfiguráció
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript konfiguráció
└── tailwind.config.mjs         # Tailwind beállítások
```

## 🛠️ Telepítés és Futtatás

### Előfeltételek
- Node.js 18+ vagy 20+
- npm vagy yarn package manager

### 1. Dependencies telepítése
```bash
npm install
```

### 2. Development szerver indítása
```bash
npm run dev
```

Az alkalmazás elérhető: `http://localhost:4321`

### 3. Production build
```bash
npm run build
```

### 4. Preview a build-ből
```bash
npm run preview
```

## 📦 Telepített Csomagok

### Core Dependencies
```json
{
  "astro": "^5.16.8",
  "@astrojs/react": "^3.6.2",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "browser-image-compression": "^2.0.2"
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

## 🎨 Komponens Dokumentáció

### FileUploader Component

**Helye:** `src/components/FileUploader.tsx`

**State Management:**
```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [convertedFile, setConvertedFile] = useState<File | null>(null);
const [convertedPreview, setConvertedPreview] = useState<string | null>(null);
const [isDragging, setIsDragging] = useState(false);
const [slugifiedName, setSlugifiedName] = useState<string>('');
```

**Főbb Függvények:**

#### `handleFileChange`
- Input onchange és drag & drop kezelés
- FileReader API használat preview generáláshoz
- Base64 konverzió

#### `handleConvert`
- browser-image-compression beállításai:
  - `maxWidthOrHeight: 1920` - Max képméret
  - `useWebWorker: true` - Gyorsabb feldolgozás
  - `fileType: 'image/webp'` - WebP konverzió
  - `initialQuality: 0.9` - 90% minőség
- Slug generálás és mentés
- Konvertált preview létrehozása

#### `handleDownload`
- File objektum létrehozása slug-olt névvel
- Blob URL generálás
- Automatikus letöltés trigger
- Memória cleanup

#### `handleDragOver`, `handleDrop`, `handleDragLeave`
- Drag & Drop funkció implementáció
- Vizuális feedback kezelés

### Slug Generálás

**Helye:** `src/lib/utils.ts`

**Funkció:** `slugify(text: string): string`

**Működés:**
1. Magyar ékezetek cseréje (á→a, é→e, stb.)
2. Kisbetűsítés
3. Speciális karakterek eltávolítása
4. Szóközök → kötőjel
5. Többszörös kötőjelek → egyszeres
6. Kezdő/záró kötőjelek törlése

**Példa:**
```typescript
slugify("Kéménytető Szigetelés 2024.jpg")
// → "kemenyteto-szigeteles-2024"
```

## 🎯 Használat

### 1. Fájl feltöltés
- Kattints a feltöltő területre VAGY
- Húzd rá a képet (drag & drop)

### 2. Előnézet
- Eredeti kép megjelenik
- Fájl adatok láthatók (név, méret, típus)

### 3. Konverzió
- Kattints a "🔄 Konvertálás WebP-re" gombra
- Várakozás (pár másodperc)

### 4. Eredmény
- Konvertált kép megjelenik
- SEO-barát fájlnév látható
- Méretcsökkenés százalék mutatva

### 5. Letöltés
- Kattints a "💾 Letöltés" gombra
- Fájl automatikusan letöltődik slug-olt névvel

## 🔧 Konfiguráció

### Képkonverzió beállítások

`src/components/FileUploader.tsx` - `handleConvert` függvényben:

```typescript
const options = {
  maxWidthOrHeight: 1920,      // Módosítható: max képméret
  useWebWorker: true,          // Ajánlott: true
  fileType: 'image/webp',      // WebP formátum
  initialQuality: 0.9          // 0-1 között (0.9 = 90%)
};
```

### Támogatott formátumok

Input `accept` attribútum:
```typescript
accept="image/jpeg,image/png"
```

Bővíthető további formátumokkal (pl. GIF, BMP).

## 🎨 Testreszabás

### Színek

CSS változók a `src/pages/index.astro` fájlban:

```css
:root {
  --color-primary: #6366F1;    /* Főszín (kék) */
  --color-accent: #10B981;     /* Kiegészítő (zöld) */
  --color-danger: #EF4444;     /* Hiba/warning (piros) */
  --color-bg: #FAFAFA;         /* Háttér */
  --color-surface: #FFFFFF;    /* Kártyák háttere */
  --color-text: #0F172A;       /* Szöveg */
  --color-text-muted: #64748B; /* Halványabb szöveg */
  --color-border: #E2E8F0;     /* Keretek */
}
```

Dark mode automatikusan kezelt a `:root.dark` selectorral.

### Fontok

```css
--font-display: 'Outfit', sans-serif;  /* Címsorok */
--font-body: 'DM Sans', sans-serif;    /* Szövegtörzs */
```

## 🚀 Deployment

### Vercel (Ajánlott)
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

## 📊 Teljesítmény

### Átlagos eredmények
- **Fájlméret csökkenés:** 85-95%
- **Konverziós idő:** 1-3 másodperc (kliens oldali)
- **Támogatott képméret:** Max 10MB (módosítható)
- **Max szélesség/magasság:** 1920px (módosítható)

### Példa
- **Eredeti:** 434 KB (JPG, 1169×669)
- **Konvertált:** 48 KB (WebP, 1169×669)
- **Megtakarítás:** 89%

## 🔮 Jövőbeli Fejlesztések

### Tervezett Funkciók
- [ ] Batch feldolgozás (több fájl egyszerre)
- [ ] ZIP letöltés (több kép esetén)
- [ ] Egyedi méretezés UI (user által állítható)
- [ ] Képarány választó (16:9, 4:3, négyzet, stb.)
- [ ] Minőség slider (dinamikus beállítás)
- [ ] Progress bar (konverzió alatt)
- [ ] Képvágás/crop funkció
- [ ] Vízjel hozzáadás
- [ ] EXIF adatok megőrzése/törlése
- [ ] Felhő storage integráció (optional)

## 🐛 Hibakeresés

### Konverzió nem működik
- Ellenőrizd a böngésző konzolt (F12)
- Támogatott formátum? (JPG/PNG)
- Fájl méret alatt 10MB?

### Drag & Drop nem működik
- `onDragOver` és `onDrop` event handlerek beállítva?
- `preventDefault()` meghívva?

### Letöltés nem működik
- Blob URL létrejött?
- `link.download` attribútum beállítva?
- Böngésző engedélyezi a letöltést?

## 📄 Licensz

MIT License - Szabad felhasználás és módosítás.

## 👨‍💻 Fejlesztő

**Név:** Zsolt  
**Szakértelem:** WordPress → Modern JavaScript Stack áttérés  
**Stack:** Astro + React + TypeScript  

## 🙏 Köszönet

- Astro team - Kiváló SSG framework
- Tailwind CSS - Gyors és rugalmas styling
- browser-image-compression - Kliens oldali képfeldolgozás
- Anthropic Claude - Fejlesztési támogatás

---

**Verzió:** 1.0.0  
**Utolsó frissítés:** 2026. január 11.  
**Status:** ✅ Production Ready