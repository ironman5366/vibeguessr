/**
 * Curated list of worldwide locations known to have Google Street View coverage.
 * Organized by region for global diversity.
 */

export interface Location {
  lat: number;
  lng: number;
}

const NORTH_AMERICA: Location[] = [
  // USA
  { lat: 40.758, lng: -73.9855 },    // Times Square, NYC
  { lat: 34.0522, lng: -118.2437 },   // Los Angeles
  { lat: 41.8781, lng: -87.6298 },    // Chicago
  { lat: 29.9511, lng: -90.0715 },    // New Orleans
  { lat: 37.7749, lng: -122.4194 },   // San Francisco
  { lat: 47.6062, lng: -122.3321 },   // Seattle
  { lat: 25.7617, lng: -80.1918 },    // Miami
  { lat: 36.1699, lng: -115.1398 },   // Las Vegas
  { lat: 38.9072, lng: -77.0369 },    // Washington DC
  { lat: 42.3601, lng: -71.0589 },    // Boston
  { lat: 33.749, lng: -84.388 },      // Atlanta
  { lat: 39.7392, lng: -104.9903 },   // Denver
  { lat: 30.2672, lng: -97.7431 },    // Austin
  { lat: 32.7157, lng: -117.1611 },   // San Diego
  { lat: 35.2271, lng: -80.8431 },    // Charlotte
  { lat: 44.9778, lng: -93.265 },     // Minneapolis
  { lat: 45.5152, lng: -122.6784 },   // Portland
  { lat: 36.1627, lng: -86.7816 },    // Nashville
  { lat: 21.3069, lng: -157.8583 },   // Honolulu
  { lat: 61.2181, lng: -149.9003 },   // Anchorage
  { lat: 35.0844, lng: -106.6504 },   // Albuquerque
  { lat: 43.0389, lng: -87.9065 },    // Milwaukee
  // Canada
  { lat: 43.6532, lng: -79.3832 },    // Toronto
  { lat: 45.5017, lng: -73.5673 },    // Montreal
  { lat: 49.2827, lng: -123.1207 },   // Vancouver
  { lat: 51.0447, lng: -114.0719 },   // Calgary
  { lat: 45.4215, lng: -75.6972 },    // Ottawa
  { lat: 53.5461, lng: -113.4938 },   // Edmonton
  { lat: 49.8951, lng: -97.1384 },    // Winnipeg
  { lat: 46.8139, lng: -71.2082 },    // Quebec City
  // Mexico
  { lat: 19.4326, lng: -99.1332 },    // Mexico City
  { lat: 20.6597, lng: -103.3496 },   // Guadalajara
  { lat: 25.6866, lng: -100.3161 },   // Monterrey
  { lat: 21.1619, lng: -86.8515 },    // Cancun
  { lat: 20.9674, lng: -89.5926 },    // Merida
  { lat: 19.1738, lng: -96.1342 },    // Veracruz
];

const SOUTH_AMERICA: Location[] = [
  // Brazil
  { lat: -22.9068, lng: -43.1729 },   // Rio de Janeiro
  { lat: -23.5505, lng: -46.6333 },   // Sao Paulo
  { lat: -15.7975, lng: -47.8919 },   // Brasilia
  { lat: -12.9714, lng: -38.5124 },   // Salvador
  { lat: -3.1190, lng: -60.0217 },    // Manaus
  { lat: -25.4284, lng: -49.2733 },   // Curitiba
  { lat: -8.0476, lng: -34.877 },     // Recife
  { lat: -19.9167, lng: -43.9345 },   // Belo Horizonte
  // Argentina
  { lat: -34.6037, lng: -58.3816 },   // Buenos Aires
  { lat: -31.4201, lng: -64.1888 },   // Cordoba
  { lat: -32.8895, lng: -68.8458 },   // Mendoza
  { lat: -41.1335, lng: -71.3103 },   // Bariloche
  { lat: -54.8019, lng: -68.3030 },   // Ushuaia
  // Chile
  { lat: -33.4489, lng: -70.6693 },   // Santiago
  { lat: -36.8201, lng: -73.0444 },   // Concepcion
  { lat: -23.6509, lng: -70.3975 },   // Antofagasta
  { lat: -39.8142, lng: -73.2459 },   // Valdivia
  // Colombia
  { lat: 4.711, lng: -74.0721 },      // Bogota
  { lat: 6.2518, lng: -75.5636 },     // Medellin
  { lat: 3.4516, lng: -76.532 },      // Cali
  { lat: 10.3910, lng: -75.5144 },    // Cartagena
  // Peru
  { lat: -12.0464, lng: -77.0428 },   // Lima
  { lat: -13.532, lng: -71.9675 },    // Cusco
  { lat: -16.409, lng: -71.5375 },    // Arequipa
  // Other
  { lat: -34.9011, lng: -56.1645 },   // Montevideo, Uruguay
  { lat: -25.2637, lng: -57.5759 },   // Asuncion, Paraguay
  { lat: -16.5, lng: -68.15 },        // La Paz, Bolivia
  { lat: -0.1807, lng: -78.4678 },    // Quito, Ecuador
  { lat: 10.4806, lng: -66.9036 },    // Caracas, Venezuela
];

const EUROPE: Location[] = [
  // UK
  { lat: 51.5074, lng: -0.1278 },     // London
  { lat: 55.9533, lng: -3.1883 },     // Edinburgh
  { lat: 53.4808, lng: -2.2426 },     // Manchester
  { lat: 51.4545, lng: -2.5879 },     // Bristol
  { lat: 52.4862, lng: -1.8904 },     // Birmingham
  { lat: 53.8008, lng: -1.5491 },     // Leeds
  // France
  { lat: 48.8566, lng: 2.3522 },      // Paris
  { lat: 43.2965, lng: 5.3698 },      // Marseille
  { lat: 45.764, lng: 4.8357 },       // Lyon
  { lat: 43.6047, lng: 1.4442 },      // Toulouse
  { lat: 43.7102, lng: 7.262 },       // Nice
  { lat: 47.2184, lng: -1.5536 },     // Nantes
  { lat: 48.5734, lng: 7.7521 },      // Strasbourg
  // Germany
  { lat: 52.52, lng: 13.405 },        // Berlin
  { lat: 48.1351, lng: 11.582 },      // Munich
  { lat: 50.1109, lng: 8.6821 },      // Frankfurt
  { lat: 53.5511, lng: 9.9937 },      // Hamburg
  { lat: 50.9375, lng: 6.9603 },      // Cologne
  { lat: 51.2277, lng: 6.7735 },      // Dusseldorf
  { lat: 48.7758, lng: 9.1829 },      // Stuttgart
  // Spain
  { lat: 40.4168, lng: -3.7038 },     // Madrid
  { lat: 41.3874, lng: 2.1686 },      // Barcelona
  { lat: 37.3891, lng: -5.9845 },     // Seville
  { lat: 39.4699, lng: -0.3763 },     // Valencia
  { lat: 36.7213, lng: -4.4214 },     // Malaga
  { lat: 43.2627, lng: -2.9253 },     // Bilbao
  // Italy
  { lat: 41.9028, lng: 12.4964 },     // Rome
  { lat: 45.4642, lng: 9.19 },        // Milan
  { lat: 43.7696, lng: 11.2558 },     // Florence
  { lat: 45.4408, lng: 12.3155 },     // Venice
  { lat: 40.8518, lng: 14.2681 },     // Naples
  { lat: 44.4949, lng: 11.3426 },     // Bologna
  { lat: 45.0703, lng: 7.6869 },      // Turin
  // Netherlands
  { lat: 52.3676, lng: 4.9041 },      // Amsterdam
  { lat: 51.9225, lng: 4.4792 },      // Rotterdam
  { lat: 52.0907, lng: 5.1214 },      // Utrecht
  { lat: 52.3667, lng: 4.8945 },      // The Hague (approx)
  // Scandinavia
  { lat: 59.3293, lng: 18.0686 },     // Stockholm
  { lat: 55.6761, lng: 12.5683 },     // Copenhagen
  { lat: 59.9139, lng: 10.7522 },     // Oslo
  { lat: 60.1699, lng: 24.9384 },     // Helsinki
  { lat: 63.4305, lng: 10.3951 },     // Trondheim
  { lat: 57.7089, lng: 11.9746 },     // Gothenburg
  { lat: 64.1466, lng: -21.9426 },    // Reykjavik
  // Eastern Europe
  { lat: 50.0755, lng: 14.4378 },     // Prague
  { lat: 52.2297, lng: 21.0122 },     // Warsaw
  { lat: 47.4979, lng: 19.0402 },     // Budapest
  { lat: 44.4268, lng: 26.1025 },     // Bucharest
  { lat: 42.6977, lng: 23.3219 },     // Sofia
  { lat: 48.2082, lng: 16.3738 },     // Vienna
  { lat: 46.0569, lng: 14.5058 },     // Ljubljana
  { lat: 45.815, lng: 15.9819 },      // Zagreb
  { lat: 54.6872, lng: 25.2797 },     // Vilnius
  { lat: 56.9496, lng: 24.1052 },     // Riga
  { lat: 59.437, lng: 24.7536 },      // Tallinn
  // Other
  { lat: 38.7223, lng: -9.1393 },     // Lisbon
  { lat: 37.9838, lng: 23.7275 },     // Athens
  { lat: 46.2044, lng: 6.1432 },      // Geneva
  { lat: 46.9480, lng: 7.4474 },      // Bern
  { lat: 47.3769, lng: 8.5417 },      // Zurich
  { lat: 50.8503, lng: 4.3517 },      // Brussels
  { lat: 53.3498, lng: -6.2603 },     // Dublin
];

const ASIA: Location[] = [
  // Japan
  { lat: 35.6762, lng: 139.6503 },    // Tokyo
  { lat: 34.6937, lng: 135.5023 },    // Osaka
  { lat: 35.0116, lng: 135.7681 },    // Kyoto
  { lat: 43.0618, lng: 141.3545 },    // Sapporo
  { lat: 33.5904, lng: 130.4017 },    // Fukuoka
  { lat: 35.1815, lng: 136.9066 },    // Nagoya
  { lat: 34.3853, lng: 132.4553 },    // Hiroshima
  { lat: 26.3344, lng: 127.8056 },    // Naha (Okinawa)
  // South Korea
  { lat: 37.5665, lng: 126.978 },     // Seoul
  { lat: 35.1796, lng: 129.0756 },    // Busan
  { lat: 35.8714, lng: 128.6014 },    // Daegu
  { lat: 33.4996, lng: 126.5312 },    // Jeju
  // Southeast Asia
  { lat: 13.7563, lng: 100.5018 },    // Bangkok
  { lat: 18.7883, lng: 98.9853 },     // Chiang Mai
  { lat: 7.8804, lng: 98.3923 },      // Phuket
  { lat: 1.3521, lng: 103.8198 },     // Singapore
  { lat: 3.139, lng: 101.6869 },      // Kuala Lumpur
  { lat: -6.2088, lng: 106.8456 },    // Jakarta
  { lat: -8.3405, lng: 115.092 },     // Bali
  { lat: 14.5995, lng: 120.9842 },    // Manila
  { lat: 10.3157, lng: 123.8854 },    // Cebu
  { lat: 21.0278, lng: 105.8342 },    // Hanoi
  { lat: 10.8231, lng: 106.6297 },    // Ho Chi Minh City
  { lat: 11.5564, lng: 104.9282 },    // Phnom Penh
  // South Asia
  { lat: 28.6139, lng: 77.209 },      // New Delhi
  { lat: 19.076, lng: 72.8777 },      // Mumbai
  { lat: 12.9716, lng: 77.5946 },     // Bangalore
  { lat: 13.0827, lng: 80.2707 },     // Chennai
  { lat: 22.5726, lng: 88.3639 },     // Kolkata
  { lat: 27.7172, lng: 85.324 },      // Kathmandu
  { lat: 6.9271, lng: 79.8612 },      // Colombo
  // East Asia
  { lat: 25.033, lng: 121.5654 },     // Taipei
  { lat: 22.3193, lng: 114.1694 },    // Hong Kong
  // Central Asia
  { lat: 47.9184, lng: 106.9177 },    // Ulaanbaatar
  { lat: 41.2995, lng: 69.2401 },     // Tashkent
  { lat: 43.238, lng: 76.9458 },      // Almaty
  { lat: 42.8746, lng: 74.5698 },     // Bishkek
];

const MIDDLE_EAST: Location[] = [
  { lat: 25.2048, lng: 55.2708 },     // Dubai
  { lat: 24.4539, lng: 54.3773 },     // Abu Dhabi
  { lat: 32.0853, lng: 34.7818 },     // Tel Aviv
  { lat: 31.7683, lng: 35.2137 },     // Jerusalem
  { lat: 41.0082, lng: 28.9784 },     // Istanbul
  { lat: 39.9334, lng: 32.8597 },     // Ankara
  { lat: 38.4192, lng: 27.1287 },     // Izmir
  { lat: 36.8969, lng: 30.7133 },     // Antalya
  { lat: 31.9454, lng: 35.9284 },     // Amman
  { lat: 26.2285, lng: 50.5860 },     // Manama, Bahrain
  { lat: 29.3759, lng: 47.9774 },     // Kuwait City
  { lat: 23.5880, lng: 58.3829 },     // Muscat
];

const AFRICA: Location[] = [
  // South Africa
  { lat: -33.9249, lng: 18.4241 },    // Cape Town
  { lat: -26.2041, lng: 28.0473 },    // Johannesburg
  { lat: -29.8587, lng: 31.0218 },    // Durban
  { lat: -33.9608, lng: 25.6022 },    // Port Elizabeth
  // East Africa
  { lat: -1.2921, lng: 36.8219 },     // Nairobi
  { lat: -6.7924, lng: 39.2083 },     // Dar es Salaam
  { lat: 0.3476, lng: 32.5825 },      // Kampala
  { lat: -1.9403, lng: 29.8739 },     // Kigali
  { lat: 9.0192, lng: 38.7525 },      // Addis Ababa
  // West Africa
  { lat: 6.5244, lng: 3.3792 },       // Lagos
  { lat: 5.6037, lng: -0.187 },       // Accra
  { lat: 14.6928, lng: -17.4467 },    // Dakar
  { lat: 12.6392, lng: -8.0029 },     // Bamako
  // North Africa
  { lat: 33.5731, lng: -7.5898 },     // Casablanca
  { lat: 34.0209, lng: -6.8417 },     // Rabat
  { lat: 31.6295, lng: -7.9811 },     // Marrakech
  { lat: 36.8065, lng: 3.0894 },      // Algiers
  { lat: 36.8189, lng: 10.1658 },     // Tunis
  { lat: 30.0444, lng: 31.2357 },     // Cairo
  // Other
  { lat: -15.3875, lng: 28.3228 },    // Lusaka, Zambia
  { lat: -17.8292, lng: 31.0522 },    // Harare, Zimbabwe
  { lat: -25.9692, lng: 32.5732 },    // Maputo, Mozambique
  { lat: -18.8792, lng: 47.5079 },    // Antananarivo, Madagascar
];

const OCEANIA: Location[] = [
  // Australia
  { lat: -33.8688, lng: 151.2093 },   // Sydney
  { lat: -37.8136, lng: 144.9631 },   // Melbourne
  { lat: -27.4698, lng: 153.0251 },   // Brisbane
  { lat: -31.9505, lng: 115.8605 },   // Perth
  { lat: -34.9285, lng: 138.6007 },   // Adelaide
  { lat: -35.2809, lng: 149.13 },     // Canberra
  { lat: -42.8821, lng: 147.3272 },   // Hobart
  { lat: -12.4634, lng: 130.8456 },   // Darwin
  { lat: -16.9186, lng: 145.7781 },   // Cairns
  { lat: -28.0167, lng: 153.4 },      // Gold Coast
  // New Zealand
  { lat: -36.8485, lng: 174.7633 },   // Auckland
  { lat: -41.2865, lng: 174.7762 },   // Wellington
  { lat: -43.532, lng: 172.6306 },    // Christchurch
  { lat: -45.0312, lng: 168.6626 },   // Queenstown
  { lat: -37.7870, lng: 175.2793 },   // Hamilton
  { lat: -46.4132, lng: 168.3538 },   // Invercargill
];

export const ALL_LOCATIONS: Location[] = [
  ...NORTH_AMERICA,
  ...SOUTH_AMERICA,
  ...EUROPE,
  ...ASIA,
  ...MIDDLE_EAST,
  ...AFRICA,
  ...OCEANIA,
];

/**
 * Pick n random unique locations from the pool.
 */
export function pickRandomLocations(n: number): Location[] {
  const shuffled = [...ALL_LOCATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
