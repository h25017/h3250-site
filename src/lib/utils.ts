/**
 * Generál SEO-barát slug-ot magyar karakterekkel
 * @param text - Eredeti szöveg
 * @returns Normalizált slug
 * 
 * Példa:
 * slugify("Kéménytető Szigetelés.jpg") → "kemenyteto-szigeteles"
 */
export function slugify(text: string): string {
  return text
    // 1. NFD normalizálás: ékezetek külön karakterré válnak
    .normalize('NFD')
    // 2. Ékezetek (combining diacritical marks) eltávolítása
    .replace(/[\u0300-\u036f]/g, '')
    // 3. Kisbetűsítés
    .toLowerCase()
    // 4. Minden nem betű/szám karakter → kötőjel
    .replace(/[^a-z0-9]/g, '-')
    // 5. Többszörös kötőjel → egyszeres
    .replace(/-+/g, '-')
    // 6. Kezdő/záró kötőjel törlése
    .replace(/^-+|-+$/g, '');
}