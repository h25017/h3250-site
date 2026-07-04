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

## Licensz

MIT License - Szabad felhasznaalas es modositas.


---

**Verzio:** 1.2.0
**Utolso frissites:** 2026. januar 22.
**Status:** Production Ready
