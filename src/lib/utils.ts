/**
 * Generál SEO-barát slug-ot magyar karakterekkel
 * @param text - Eredeti szöveg
 * @returns Normalizált slug
 * 
 * Példa:
 * slugify("Kéménytető Szigetelés.jpg") → "kemenyteto-szigeteles"
 */
export function slugify(text: string): string {
  // 1. Ékezetek cseréje
  const charMap: { [key: string]: string } = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o',
    'ú': 'u', 'ü': 'u', 'ű': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ö': 'O', 'Ő': 'O',
    'Ú': 'U', 'Ü': 'U', 'Ű': 'U'
  };
  
  // 2. Ékezetek cseréje karakterről karakterre
  let result = text.split('').map(char => charMap[char] || char).join('');
  
  // 3. Kisbetűsítés
  result = result.toLowerCase();
  
  // 4. Csak betűk, számok, kötőjel és szóköz marad
  result = result.replace(/[^a-z0-9\s-]/g, '');
  
  // 5. Szóközök → kötőjel
  result = result.replace(/\s+/g, '-');
  
  // 6. Többszörös kötőjel → egyszeres
  result = result.replace(/-+/g, '-');
  
  // 7. Kezdő/záró kötőjel törlése
  result = result.replace(/^-+|-+$/g, '');
  
  return result;
}