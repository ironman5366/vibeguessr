/**
 * Dynamic location generator for VibeGuessr.
 *
 * Instead of hardcoded locations, we divide the world into ~80 coverage
 * regions (bounding boxes over landmass with known SV coverage), tag each
 * with a density score, and randomly sample points within them.
 *
 * The Google StreetViewService then finds the nearest panorama to each
 * random point. Difficulty controls:
 *   1. Which regions get weighted (easy → cities, extreme → remote)
 *   2. The SV search radius (easy → 100km, extreme → 10km)
 */

export type Difficulty = 1 | 2 | 3 | 4;

export interface Location {
  lat: number;
  lng: number;
}

// ════════════════════════════════════════════
// Region definitions
// ════════════════════════════════════════════
//
// Each region: [minLat, maxLat, minLng, maxLng, density]
// density: 1=sparse SV coverage, 2=moderate, 3=good, 4=dense

type RegionTuple = [number, number, number, number, 1 | 2 | 3 | 4];

const REGIONS: RegionTuple[] = [
  // ── North America ──────────────────────
  // USA
  [40, 45, -80, -70, 4],     // US Northeast (NY, NJ, CT, MA)
  [38, 42, -90, -80, 4],     // US Mid-Atlantic / Great Lakes
  [25, 35, -90, -75, 3],     // US Southeast (FL, GA, Carolinas)
  [41, 49, -95, -82, 3],     // US Upper Midwest (WI, MN, MI)
  [35, 41, -100, -85, 3],    // US Central (MO, KS, OK, TN)
  [32, 49, -125, -118, 4],   // US West Coast (CA, OR, WA coast)
  [35, 49, -118, -109, 2],   // US Mountain (CO, UT, MT, WY, ID)
  [31, 37, -115, -103, 2],   // US Southwest (AZ, NM)
  [30, 38, -105, -93, 3],    // US South Central (TX, LA, AR)
  [38, 42, -100, -90, 2],    // US Great Plains (KS, NE)
  [55, 71, -168, -140, 1],   // Alaska
  [19, 22, -160, -155, 3],   // Hawaii
  // Canada
  [42, 50, -83, -60, 3],     // Eastern Canada (ON, QC, Maritimes)
  [48, 56, -123, -100, 2],   // Western Canada (AB, SK, MB, BC)
  [55, 64, -140, -90, 1],    // Northern Canada
  // Mexico
  [17, 24, -106, -96, 3],    // Central Mexico
  [24, 33, -118, -103, 2],   // Northern Mexico
  [14, 21, -96, -86, 2],     // Southern Mexico & Yucatan
  // Central America & Caribbean
  [7, 18, -92, -77, 2],      // Central America (Guatemala–Panama)
  [17, 24, -85, -64, 2],     // Caribbean islands

  // ── South America ──────────────────────
  [-5, 5, -80, -45, 2],      // Northern SA (Colombia, Venezuela, Guyana coast)
  [-12, -1, -78, -45, 2],    // Amazon basin / Ecuador / Peru
  [-24, -12, -58, -35, 3],   // Central Brazil (MG, GO, BA)
  [-34, -20, -55, -40, 3],   // SE Brazil (SP, RJ, PR, SC)
  [-12, 0, -68, -48, 1],     // Deep Amazon
  [-38, -22, -72, -58, 3],   // Argentina central (BA, Córdoba, Mendoza)
  [-55, -38, -75, -63, 1],   // Patagonia (Arg + Chile south)
  [-36, -18, -76, -68, 2],   // Chile & Peru coast
  [-20, -10, -70, -58, 1],   // Bolivia / Paraguay

  // ── Europe ─────────────────────────────
  [50, 56, -6, 2, 4],        // UK (England, Wales)
  [56, 61, -8, 0, 3],        // Scotland
  [51, 55, -11, -5, 3],      // Ireland
  [43, 51, -5, 3, 4],        // France
  [36, 44, -10, 0, 3],       // Iberia (Spain, Portugal)
  [47, 55, 5, 15, 4],        // Germany / Benelux / Switzerland
  [36, 44, 7, 19, 4],        // Italy
  [55, 62, 5, 16, 3],        // Southern Scandinavia (Denmark, S. Sweden, S. Norway)
  [62, 71, 5, 32, 2],        // Northern Scandinavia / Lapland
  [60, 70, 20, 30, 2],       // Finland
  [49, 55, 14, 25, 3],       // Poland / Czechia / Slovakia
  [45, 49, 16, 27, 3],       // Hungary / Romania / Balkans north
  [40, 45, 13, 24, 3],       // Balkans (Croatia, Serbia, Bosnia, Montenegro)
  [35, 42, 19, 30, 3],       // Greece / Bulgaria
  [35, 42, 26, 45, 3],       // Turkey
  [54, 60, 20, 32, 2],       // Baltics (Lithuania, Latvia, Estonia)
  [50, 60, 28, 42, 2],       // Western Russia / Belarus / Ukraine
  [63, 72, -25, -13, 2],     // Iceland
  [40, 45, 44, 51, 2],       // Caucasus (Georgia, Armenia, Azerbaijan)

  // ── Asia ───────────────────────────────
  [30, 37, 129, 142, 4],     // Japan (Honshu, Shikoku, Kyushu)
  [37, 46, 135, 146, 3],     // Japan (Hokkaido + northern Honshu)
  [33, 39, 125, 130, 4],     // South Korea
  [5, 21, 97, 106, 3],       // Thailand / Myanmar / Laos / Cambodia
  [8, 22, 102, 110, 3],      // Vietnam
  [-1, 7, 100, 105, 3],      // Malaysia / Singapore
  [-8, 6, 95, 115, 2],       // Indonesia (Sumatra, Java, Borneo)
  [-11, -7, 115, 141, 2],    // Indonesia (east) / Timor-Leste
  [4, 21, 117, 127, 2],      // Philippines
  [21, 26, 119, 122, 3],     // Taiwan
  [8, 35, 68, 88, 2],        // India (main)
  [25, 30, 80, 92, 1],       // Nepal / NE India
  [5, 10, 79, 82, 2],        // Sri Lanka
  [23, 30, 46, 57, 3],       // Gulf states (UAE, Oman, Bahrain, Qatar)
  [29, 34, 34, 40, 3],       // Israel / Jordan / Palestine
  [42, 55, 60, 85, 1],       // Central Asia (Kazakhstan, Uzbekistan, Kyrgyzstan)
  [46, 52, 87, 120, 1],      // Mongolia / southern Siberia
  [55, 65, 65, 135, 1],      // Siberia
  [60, 70, 130, 160, 1],     // Russian Far East

  // ── Africa ─────────────────────────────
  [28, 36, -10, 10, 2],      // Morocco / Algeria / Tunisia
  [22, 32, 28, 35, 2],       // Egypt
  [4, 15, -17, -5, 2],       // West Africa coast (Senegal, Guinea, Sierra Leone)
  [4, 12, -5, 10, 2],        // West Africa (Ghana, Togo, Benin, Nigeria west)
  [4, 14, 2, 16, 2],         // Nigeria / Cameroon
  [-5, 5, 28, 42, 2],        // East Africa (Kenya, Uganda, Rwanda, Burundi)
  [-12, -1, 28, 40, 2],      // Tanzania / Malawi
  [-35, -22, 16, 33, 3],     // South Africa / Eswatini / Lesotho
  [-27, -15, 25, 36, 2],     // Zimbabwe / Zambia / Mozambique
  [-24, -17, 12, 26, 1],     // Namibia / Botswana
  [-20, -12, 43, 51, 1],     // Madagascar
  [5, 15, 33, 48, 1],        // Ethiopia / Djibouti / Somalia

  // ── Oceania ────────────────────────────
  [-38, -27, 140, 154, 3],   // SE Australia (NSW, VIC, SA)
  [-28, -20, 145, 154, 3],   // QLD coast, Australia
  [-35, -28, 114, 140, 2],   // SW Australia / SA interior
  [-25, -10, 125, 145, 1],   // Australian outback / NT
  [-47, -34, 165, 179, 3],   // New Zealand
];

// ════════════════════════════════════════════
// Sampling logic
// ════════════════════════════════════════════

/**
 * Given a difficulty, compute a weight for each region.
 *
 * Easy    → strongly prefer dense coverage (cities, suburbs)
 * Medium  → balanced, slight preference for moderate coverage
 * Hard    → prefer sparse/moderate regions (rural, countryside)
 * Extreme → strongly prefer sparse regions (remote, middle-of-nowhere)
 */
function regionWeight(density: number, difficulty: Difficulty): number {
  // Weight table: [density 1, density 2, density 3, density 4]
  const table: Record<Difficulty, [number, number, number, number]> = {
    1: [0.5, 2, 5, 12],   // Easy → heavily favours dense
    2: [1.5, 4, 5, 5],    // Medium → balanced, slight urban lean
    3: [4, 5, 3, 1],      // Hard → favours sparse
    4: [10, 4, 1, 0.3],   // Extreme → strongly favours sparse
  };
  return table[difficulty][density - 1];
}

/**
 * Pick a random region weighted by difficulty, then generate a random
 * lat/lng within its bounding box.
 */
export function generateRandomPoint(difficulty: Difficulty): Location {
  const weights = REGIONS.map(([, , , , d]) => regionWeight(d, difficulty));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let r = Math.random() * totalWeight;
  let region = REGIONS[0];
  for (let i = 0; i < REGIONS.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      region = REGIONS[i];
      break;
    }
  }

  const [minLat, maxLat, minLng, maxLng] = region;
  const lat = minLat + Math.random() * (maxLat - minLat);
  const lng = minLng + Math.random() * (maxLng - minLng);

  return { lat, lng };
}

/**
 * Street View search radius (metres) per difficulty.
 * Larger radius → more likely to snap to a road, easier to find coverage.
 */
export function getSvRadius(difficulty: Difficulty): number {
  switch (difficulty) {
    case 1: return 100_000;  // 100 km
    case 2: return 50_000;   // 50 km
    case 3: return 20_000;   // 20 km
    case 4: return 8_000;    // 8 km
  }
}

export const DIFFICULTY_META: Record<Difficulty, { label: string; description: string }> = {
  1: { label: "Tourist", description: "Famous cities & landmarks" },
  2: { label: "Explorer", description: "Cities, towns & countryside" },
  3: { label: "Adventurer", description: "Rural roads & villages" },
  4: { label: "Lost", description: "Middle of nowhere" },
};
