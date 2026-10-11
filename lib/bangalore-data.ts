export type BangaloreLocation = {
  id: string;
  name: string;
  district: "Bangalore Urban" | "Bangalore Rural";
  area: string;
  lat: number;
  lng: number;
  aliases?: string[];
};

export type BangaloreRoad = {
  id: string;
  name: string;
  corridor: string;
  district: "Bangalore Urban" | "Bangalore Rural" | "Both Districts";
  lat: number;
  lng: number;
};

export const BANGALORE_LOCATIONS: BangaloreLocation[] = [
  // --- Central / Core Bangalore Urban ---
  { id: "majestic", name: "Kempegowda Bus Station (Majestic)", district: "Bangalore Urban", area: "Central Bengaluru", lat: 12.9767, lng: 77.5713, aliases: ["KBS", "City Railway Station", "Sangam", "Gandhi Nagar"] },
  { id: "vidhana-soudha", name: "Vidhana Soudha / Cubbon Park", district: "Bangalore Urban", area: "Central Bengaluru", lat: 12.9791, lng: 77.5913, aliases: ["High Court", "General Post Office", "Ambedkar Veedhi"] },
  { id: "mg-road", name: "MG Road / Trinity Circle", district: "Bangalore Urban", area: "Central Bengaluru", lat: 12.9756, lng: 77.6066, aliases: ["Mahatma Gandhi Road", "Cauvery Emporium", "Anil Kumble Circle"] },
  { id: "brigade-road", name: "Brigade Road / Residency Road", district: "Bangalore Urban", area: "Central Bengaluru", lat: 12.9737, lng: 77.6074, aliases: ["Rex", "Commercial Core", "Museum Road"] },
  { id: "shivajinagar", name: "Shivajinagar Bus Station", district: "Bangalore Urban", area: "Central Bengaluru", lat: 12.9856, lng: 77.6006, aliases: ["Russell Market", "St Mary's Basilica"] },
  { id: "basavanagudi", name: "Basavanagudi / Gandhi Bazaar", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9422, lng: 77.5684, aliases: ["Bull Temple", "Vidyarthi Bhavan", "Tagore Circle"] },
  { id: "chamarajpet", name: "Chamarajpet / Sirsi Circle", district: "Bangalore Urban", area: "Central Bengaluru", lat: 12.9587, lng: 77.5582, aliases: ["Makkala Koota", "Fort High School"] },
  { id: "malleshwaram", name: "Malleshwaram (8th Cross)", district: "Bangalore Urban", area: "North Bengaluru", lat: 12.9982, lng: 77.5704, aliases: ["Sampige Road", "Margosa Road", "CTR", "Kadu Malleshwara"] },
  { id: "rajajinagar", name: "Rajajinagar / Navrang Circle", district: "Bangalore Urban", area: "West Bengaluru", lat: 12.9988, lng: 77.5530, aliases: ["Dr Rajkumar Road", "1st Block", "Orion Mall"] },

  // --- South Bangalore Urban ---
  { id: "jayanagar-4th", name: "Jayanagar 4th Block", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9299, lng: 77.5824, aliases: ["Jayanagar Shopping Complex", "Cool Joint"] },
  { id: "jayanagar-9th", name: "Jayanagar 9th Block (Ragigudda)", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9172, lng: 77.5910, aliases: ["Ragigudda Temple", "East End"] },
  { id: "jp-nagar-2nd", name: "JP Nagar 2nd Phase", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9098, lng: 77.5865, aliases: ["Ranga Shankara", "Dalmia Circle"] },
  { id: "jp-nagar-7th", name: "JP Nagar 7th Phase (Brigade Millennium)", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.8942, lng: 77.5796, aliases: ["RBI Layout", "Puttenahalli Lake"] },
  { id: "banashankari-ttmc", name: "Banashankari TTMC / Bus Stand", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9255, lng: 77.5468, aliases: ["BSK", "Banashankari Amma Temple", "Kanakapura Road Junction"] },
  { id: "padmanabhanagar", name: "Padmanabhanagar", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9192, lng: 77.5559, aliases: ["Devegowda Petrol Bunk", "Carmel School"] },
  { id: "btm-layout-2nd", name: "BTM Layout 2nd Stage", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9166, lng: 77.6101, aliases: ["Udupi Garden Signal", "MICO Layout"] },
  { id: "silk-board", name: "Central Silk Board Junction", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9175, lng: 77.6238, aliases: ["Silkboard Flyover", "Madiwala Junction"] },
  { id: "madiwala", name: "Madiwala Market", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9226, lng: 77.6190, aliases: ["St John's Hospital", "Total Mall"] },
  { id: "bannerghatta-road", name: "Bannerghatta Road (Meenakshi Mall)", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.8767, lng: 77.5957, aliases: ["IIM Bangalore", "Hulimavu Gate", "Gottigere"] },
  { id: "bannerghatta-park", name: "Bannerghatta National Park", district: "Bangalore Urban", area: "Anekal / South", lat: 12.8009, lng: 77.5777, aliases: ["Zoo", "Safari", "Jigani Junction"] },

  // --- South-East & Tech Corridors ---
  { id: "koramangala-sony", name: "Koramangala (Sony World Signal)", district: "Bangalore Urban", area: "South-East Bengaluru", lat: 12.9352, lng: 77.6245, aliases: ["4th Block", "80 Feet Road", "Wipro Park", "Forum Mall"] },
  { id: "hsr-sector-1", name: "HSR Layout Sector 1 & 2", district: "Bangalore Urban", area: "South-East Bengaluru", lat: 12.9116, lng: 77.6474, aliases: ["Agara Lake", "27th Main Road", "BDA Complex"] },
  { id: "agara-lake", name: "Agara Junction / Lake", district: "Bangalore Urban", area: "South-East Bengaluru", lat: 12.9238, lng: 77.6508, aliases: ["Sarjapur Road Junction", "Agara Flyover"] },
  { id: "bellandur-ecospace", name: "Bellandur (EcoSpace / ORR)", district: "Bangalore Urban", area: "East Bengaluru", lat: 12.9260, lng: 77.6762, aliases: ["Central Mall Bellandur", "Outer Ring Road"] },
  { id: "sarjapur-road", name: "Sarjapur Road (Wipro Gate)", district: "Bangalore Urban", area: "East Bengaluru", lat: 12.9123, lng: 77.6845, aliases: ["Kaikondrahalli Lake", "Carmelaram Station"] },
  { id: "electronic-city-p1", name: "Electronic City Phase 1", district: "Bangalore Urban", area: "South-East / Anekal", lat: 12.8452, lng: 77.6602, aliases: ["Infosys Gate 1", "Wipro E-City", "Tollway"] },
  { id: "electronic-city-p2", name: "Electronic City Phase 2", district: "Bangalore Urban", area: "South-East / Anekal", lat: 12.8398, lng: 77.6770, aliases: ["Tech Mahindra", "TCS", "Velankani Drive"] },
  { id: "bommanahalli", name: "Bommanahalli Junction", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.9089, lng: 77.6241, aliases: ["Hosur Main Road", "Garvebhavipalya"] },
  { id: "kudlu-gate", name: "Kudlu Gate / Singasandra", district: "Bangalore Urban", area: "South Bengaluru", lat: 12.8898, lng: 77.6416, aliases: ["Hosa Road Junction", "Parappana Agrahara"] },

  // --- East & North-East Bangalore Urban ---
  { id: "indiranagar-100ft", name: "Indiranagar (100 Feet Road)", district: "Bangalore Urban", area: "East Bengaluru", lat: 12.9719, lng: 77.6412, aliases: ["CMH Road", "12th Main", "HAL 2nd Stage", "Doopanahalli"] },
  { id: "domlur-flyover", name: "Domlur Flyover / EGL", district: "Bangalore Urban", area: "East Bengaluru", lat: 12.9609, lng: 77.6387, aliases: ["Embassy GolfLinks", "Intermediate Ring Road"] },
  { id: "marathahalli-bridge", name: "Marathahalli Bridge & Market", district: "Bangalore Urban", area: "East Bengaluru", lat: 12.9591, lng: 77.6974, aliases: ["Multiplex", "Kalamandir", "ORR Junction"] },
  { id: "whitefield-itpl", name: "Whitefield (ITPL / Hope Farm)", district: "Bangalore Urban", area: "East Bengaluru", lat: 12.9855, lng: 77.7289, aliases: ["International Tech Park", "Ascendas", "Whitefield Railway Station"] },
  { id: "kadugodi-metro", name: "Kadugodi / Whitefield Metro", district: "Bangalore Urban", area: "East Bengaluru", lat: 12.9977, lng: 77.7609, aliases: ["Hope Farm Circle", "Channasandra"] },
  { id: "varthur", name: "Varthur Lake & Town", district: "Bangalore Urban", area: "East Bengaluru", lat: 12.9398, lng: 77.7471, aliases: ["Gunjur", "Varthur Kodi"] },
  { id: "kr-puram", name: "KR Puram Hanging Bridge", district: "Bangalore Urban", area: "East Bengaluru", lat: 13.0039, lng: 77.6966, aliases: ["Railway Station", "Tin Factory", "Old Madras Road"] },
  { id: "kalyan-nagar", name: "Kalyan Nagar / HRBR Layout", district: "Bangalore Urban", area: "North-East Bengaluru", lat: 13.0221, lng: 77.6403, aliases: ["Kammanahalli", "Banaswadi", "CMR Road"] },
  { id: "hennur-cross", name: "Hennur Cross & Ring Road", district: "Bangalore Urban", area: "North-East Bengaluru", lat: 13.0259, lng: 77.6433, aliases: ["Hennur Main Road", "Geddalahalli"] },
  { id: "manyata-tech-park", name: "Manyata Tech Park / Nagawara", district: "Bangalore Urban", area: "North Bengaluru", lat: 13.0456, lng: 77.6200, aliases: ["Nagawara Junction", "Hebbal ORR"] },

  // --- North Bangalore Urban ---
  { id: "hebbal-flyover", name: "Hebbal Flyover / Esteem Mall", district: "Bangalore Urban", area: "North Bengaluru", lat: 13.0358, lng: 77.5970, aliases: ["Hebbal Lake", "Airport Expressway Start", "Bellary Road"] },
  { id: "sahakara-nagar", name: "Sahakara Nagar / Kodigehalli", district: "Bangalore Urban", area: "North Bengaluru", lat: 13.0622, lng: 77.5878, aliases: ["Tindlu", "GKVK Gate"] },
  { id: "yelahanka-newtown", name: "Yelahanka New Town", district: "Bangalore Urban", area: "North Bengaluru", lat: 13.1007, lng: 77.5963, aliases: ["Major Sandeep Unnikrishnan Road", "NES Office", "Rail Wheel Factory"] },
  { id: "yelahanka-oldtown", name: "Yelahanka Old Town (Kogilu Cross)", district: "Bangalore Urban", area: "North Bengaluru", lat: 13.1005, lng: 77.6050, aliases: ["Venkatala", "Police Station Yelahanka"] },
  { id: "vidyaranyapura", name: "Vidyaranyapura Main Road", district: "Bangalore Urban", area: "North Bengaluru", lat: 13.0801, lng: 77.5594, aliases: ["BEL Circle", "Thindlu Main Road"] },
  { id: "yeshwanthpur", name: "Yeshwanthpur Junction & TTMC", district: "Bangalore Urban", area: "North-West Bengaluru", lat: 13.0238, lng: 77.5501, aliases: ["Railway Station", "APMC Yard", "Goraguntepalya"] },
  { id: "peenya-ind", name: "Peenya Industrial Area", district: "Bangalore Urban", area: "North-West Bengaluru", lat: 13.0285, lng: 77.5195, aliases: ["Peenya 1st Stage", "Jalahalli Cross", "100ft Road Peenya"] },

  // --- West & South-West Bangalore Urban ---
  { id: "vijayanagar", name: "Vijayanagar / Club Road", district: "Bangalore Urban", area: "West Bengaluru", lat: 12.9716, lng: 77.5306, aliases: ["MC Road", "Maruthi Mandir", "Attiguppe"] },
  { id: "nagarbhavi", name: "Nagarbhavi (BDA Complex)", district: "Bangalore Urban", area: "West Bengaluru", lat: 12.9602, lng: 77.5098, aliases: ["National Law School", "Bangalore University Jn"] },
  { id: "rr-nagar", name: "Rajarajeshwari Nagar (RR Nagar Gate)", district: "Bangalore Urban", area: "West Bengaluru", lat: 12.9272, lng: 77.5154, aliases: ["BEML Layout", "Rajarajeshwari Temple"] },
  { id: "kengeri-satellite", name: "Kengeri Satellite Town & TTMC", district: "Bangalore Urban", area: "South-West Bengaluru", lat: 12.9177, lng: 77.4833, aliases: ["Mysore Road Metro Terminal", "Shirke Apartments"] },
  { id: "kumbalgodu", name: "Kumbalgodu (Mysore Road NH 275)", district: "Bangalore Urban", area: "South-West Bengaluru", lat: 12.8791, lng: 77.4492, aliases: ["Rajarajeswari Medical College", "Industrial Area"] },

  // --- Anekal Taluk (Bangalore Urban District) ---
  { id: "anekal-town", name: "Anekal Town (Bus Stand / Taluk)", district: "Bangalore Urban", area: "Anekal Taluk", lat: 12.7108, lng: 77.6961, aliases: ["Anekal Circle", "Taluk Hospital"] },
  { id: "attibele-toll", name: "Attibele Border & Toll Gate", district: "Bangalore Urban", area: "Anekal Taluk", lat: 77.7719 ? 12.7797 : 12.7797, lng: 77.7719, aliases: ["Tamil Nadu Border", "Hosur Highway"] },
  { id: "chandapura", name: "Chandapura Circle (Anekal Road)", district: "Bangalore Urban", area: "Anekal Taluk", lat: 12.7937, lng: 77.7011, aliases: ["Alliance University", "Surya City"] },
  { id: "jigani-industrial", name: "Jigani Industrial Area & APC Circle", district: "Bangalore Urban", area: "Anekal Taluk", lat: 12.7825, lng: 77.6410, aliases: ["Bommasandra Link Road", "Granite Hub"] },
  { id: "sarjapur-town", name: "Sarjapur Town / Circle", district: "Bangalore Urban", area: "Anekal Taluk", lat: 12.8601, lng: 77.7876, aliases: ["Bagalur Road Junction", "Dommasandra"] },

  // --- BANGALORE RURAL DISTRICT ---
  // 1. Devanahalli Taluk (North-East)
  { id: "devanahalli-town", name: "Devanahalli Town & Fort", district: "Bangalore Rural", area: "Devanahalli Taluk", lat: 13.2437, lng: 77.7126, aliases: ["Tipu Sultan Birthplace", "Devanahalli Bus Stand"] },
  { id: "kial-airport", name: "Kempegowda International Airport (BLR)", district: "Bangalore Rural", area: "Devanahalli Taluk", lat: 13.1986, lng: 77.7066, aliases: ["BLR Airport", "T1 / T2", "Airport Toll Plaza"] },
  { id: "aerospace-park", name: "Aerospace Park / SEZ (Devanahalli)", district: "Bangalore Rural", area: "Devanahalli Taluk", lat: 13.2120, lng: 77.6740, aliases: ["KIADB Aerospace", "Hardware Park"] },
  { id: "vijayapura", name: "Vijayapura Town", district: "Bangalore Rural", area: "Devanahalli Taluk", lat: 13.2925, lng: 77.8016, aliases: ["Vijayapura Bus Stand", "Shidlaghatta Highway"] },
  { id: "bagalur-rural", name: "Bagalur (Aero City / Junction)", district: "Bangalore Rural", area: "Devanahalli Taluk", lat: 13.1348, lng: 77.6685, aliases: ["Bagalur Cross", "Razackpalya"] },

  // 2. Doddaballapura Taluk (North)
  { id: "doddaballapura-town", name: "Doddaballapura Town & TTMC", district: "Bangalore Rural", area: "Doddaballapura Taluk", lat: 13.2929, lng: 77.5427, aliases: ["Doddaballapur Railway Station", "D-Cross", "Bashettihalli"] },
  { id: "rajankunte", name: "Rajankunte (SH 9 Corridor)", district: "Bangalore Rural", area: "Doddaballapura Taluk", lat: 13.1912, lng: 77.5517, aliases: ["Presidency University", "Kakolu Road"] },
  { id: "ghati-subramanya", name: "Ghati Subramanya Temple Area", district: "Bangalore Rural", area: "Doddaballapura Taluk", lat: 13.3243, lng: 77.5132, aliases: ["Makali Hills", "Subramanya Swamy"] },
  { id: "makalidurga", name: "Makalidurga (Trek Base & Railway)", district: "Bangalore Rural", area: "Doddaballapura Taluk", lat: 13.4245, lng: 77.5020, aliases: ["Makali Fort", "Gauribidanur Border"] },
  { id: "doddabelavangala", name: "Doddabelavangala Town", district: "Bangalore Rural", area: "Doddaballapura Taluk", lat: 13.3855, lng: 77.4485, aliases: ["Belavangala Circle", "Thondebhavi Border"] },

  // 3. Nelamangala Taluk (North-West)
  { id: "nelamangala-town", name: "Nelamangala Town & Toll Plaza", district: "Bangalore Rural", area: "Nelamangala Taluk", lat: 13.0975, lng: 77.3934, aliases: ["Tumkur Road Toll", "Nelamangala Bypass", "NH 48"] },
  { id: "dobbaspet", name: "Dobbaspet Industrial Area & Junction", district: "Bangalore Rural", area: "Nelamangala Taluk", lat: 13.2372, lng: 77.2435, aliases: ["Dabaspete", "Sompura", "Shivagange Foothills"] },
  { id: "sompura-ind", name: "Sompura Industrial Hub", district: "Bangalore Rural", area: "Nelamangala Taluk", lat: 13.2201, lng: 77.2289, aliases: ["KIADB Sompura", "Dobbaspet 2nd Stage"] },
  { id: "thyamagondlu", name: "Thyamagondlu Town", district: "Bangalore Rural", area: "Nelamangala Taluk", lat: 13.2081, lng: 77.3015, aliases: ["Thyamagondlu Circle", "Railway Gate"] },
  { id: "solur-border", name: "Solur (Hassan / Mangalore NH 75)", district: "Bangalore Rural", area: "Nelamangala Taluk", lat: 13.0852, lng: 77.2014, aliases: ["Solur Toll", "Kudumalakunte"] },
  { id: "tavarekere-border", name: "Tavarekere (Magadi Road Border)", district: "Bangalore Rural", area: "Nelamangala / West", lat: 12.9467, lng: 77.3958, aliases: ["Magadi Main Road", "Cholenahalli"] },

  // 4. Hosakote Taluk (East)
  { id: "hosakote-town", name: "Hosakote Town & Toll Gate", district: "Bangalore Rural", area: "Hosakote Taluk", lat: 13.0706, lng: 77.7981, aliases: ["Old Madras Road Toll", "Hosakote Lake", "NH 75"] },
  { id: "budigere-cross", name: "Budigere Cross (OMR Junction)", district: "Bangalore Rural", area: "Hosakote Taluk", lat: 13.0722, lng: 77.7472, aliases: ["Airport Alternate Route", "Mandur Gate"] },
  { id: "sulibele", name: "Sulibele Town", district: "Bangalore Rural", area: "Hosakote Taluk", lat: 13.1517, lng: 77.8428, aliases: ["Sulibele Bus Stand", "Devanahalli Link"] },
  { id: "hosakote-industrial", name: "Hosakote Industrial Area", district: "Bangalore Rural", area: "Hosakote Taluk", lat: 13.0890, lng: 77.8210, aliases: ["Pillagumpa", "Auto Cluster"] },
  { id: "anondahalli", name: "Anondahalli / Malur Border", district: "Bangalore Rural", area: "Hosakote Taluk", lat: 13.0112, lng: 77.8934, aliases: ["Malur Highway", "Tirupati Road"] },
];

export const BANGALORE_ROADS: BangaloreRoad[] = [
  // Major Highways & Arterials
  { id: "orr", name: "Outer Ring Road (Silk Board to Hebbal)", corridor: "Peripheral Arterial (ORR)", district: "Bangalore Urban", lat: 12.9405, lng: 77.6850 },
  { id: "orr-west", name: "Outer Ring Road (Hebbal to Mysore Road)", corridor: "Ring Expressway", district: "Bangalore Urban", lat: 13.0010, lng: 77.5300 },
  { id: "nice-road", name: "NICE Peripheral Ring Road Expressway", corridor: "Toll Expressway", district: "Both Districts", lat: 12.8710, lng: 77.5120 },
  { id: "airport-road-nh44", name: "Bellary Road / Airport Expressway (NH 44)", corridor: "KIAL Highway (NH 44)", district: "Both Districts", lat: 13.1450, lng: 77.6200 },
  { id: "hosur-road", name: "Hosur Road (Silk Board to Attibele NH 44)", corridor: "National Highway (NH 44)", district: "Bangalore Urban", lat: 12.8600, lng: 77.6550 },
  { id: "tumkur-road", name: "Tumkur Road (Yeshwanthpur to Nelamangala NH 48)", corridor: "National Highway (NH 48)", district: "Both Districts", lat: 13.0600, lng: 77.4500 },
  { id: "mysore-road", name: "Mysore Road (Sirsi Circle to Kengeri NH 275)", corridor: "National Highway (NH 275)", district: "Bangalore Urban", lat: 12.9300, lng: 77.5050 },
  { id: "omr", name: "Old Madras Road (Ulsoor to Hosakote NH 75)", corridor: "National Highway (NH 75)", district: "Both Districts", lat: 13.0300, lng: 77.7400 },
  { id: "bannerghatta-rd", name: "Bannerghatta Main Road (Dairy Circle to Anekal)", corridor: "Arterial Corridor (SH 87)", district: "Bangalore Urban", lat: 12.8950, lng: 77.5970 },
  { id: "sarjapur-rd", name: "Sarjapur Main Road (Koramangala to Sarjapur Town)", corridor: "Arterial Corridor", district: "Bangalore Urban", lat: 12.9150, lng: 77.6800 },
  { id: "kanakapura-rd", name: "Kanakapura Road (Banashankari to Harohalli NH 948)", corridor: "National Highway (NH 948)", district: "Bangalore Urban", lat: 12.8800, lng: 77.5450 },
  { id: "magadi-rd", name: "Magadi Main Road (Majestic to Tavarekere)", corridor: "State Highway (SH 85)", district: "Both Districts", lat: 12.9750, lng: 77.4700 },

  // Urban Core & East Roads
  { id: "indiranagar-100ft-rd", name: "100 Feet Road (Indiranagar)", corridor: "Commercial Arterial", district: "Bangalore Urban", lat: 12.9719, lng: 77.6412 },
  { id: "indiranagar-12th-main", name: "12th Main Road (Indiranagar)", corridor: "Café & Shopping Corridor", district: "Bangalore Urban", lat: 12.9710, lng: 77.6440 },
  { id: "indiranagar-cmh-rd", name: "CMH Road (Chinmaya Mission Hospital Road)", corridor: "Metro Corridor", district: "Bangalore Urban", lat: 12.9785, lng: 77.6390 },
  { id: "koramangala-80ft-rd", name: "80 Feet Road (Koramangala 4th Block)", corridor: "Food & Transit Street", district: "Bangalore Urban", lat: 12.9360, lng: 77.6270 },
  { id: "koramangala-100ft-rd", name: "100 Feet Road / Intermediate Ring Road (Koramangala)", corridor: "Connector Arterial", district: "Bangalore Urban", lat: 12.9450, lng: 77.6320 },
  { id: "old-airport-rd", name: "Old Airport Road (Trinity to Marathahalli)", corridor: "HAL Corridor", district: "Bangalore Urban", lat: 12.9600, lng: 77.6600 },
  { id: "itpl-main-rd", name: "ITPL Main Road (Whitefield)", corridor: "Tech Park Arterial", district: "Bangalore Urban", lat: 12.9855, lng: 77.7289 },
  { id: "whitefield-main-rd", name: "Whitefield Main Road (Hope Farm to Varthur)", corridor: "East Suburban Arterial", district: "Bangalore Urban", lat: 12.9720, lng: 77.7450 },
  { id: "varthur-rd", name: "Varthur Road (Marathahalli to Gunjur)", corridor: "East Corridor", district: "Bangalore Urban", lat: 12.9480, lng: 77.7250 },
  { id: "kundalahalli-rd", name: "Kundalahalli Main Road / Graphite India", corridor: "IT Corridor", district: "Bangalore Urban", lat: 12.9700, lng: 77.7120 },
  { id: "budigere-rd", name: "Budigere Road (Budigere Cross to KIAL Airport)", corridor: "Airport Link Road", district: "Bangalore Rural", lat: 13.1300, lng: 77.7300 },

  // South & Tech Roads
  { id: "hsr-27th-main", name: "27th Main Road (HSR Layout)", corridor: "Sector 1 Commercial Spine", district: "Bangalore Urban", lat: 12.9120, lng: 77.6490 },
  { id: "hsr-19th-main", name: "19th Main Road (HSR Layout)", corridor: "Residential & Tech Spine", district: "Bangalore Urban", lat: 12.9150, lng: 77.6450 },
  { id: "btm-100ft-rd", name: "100 Feet Road (BTM Layout 2nd Stage)", corridor: "Ring Road Spine", district: "Bangalore Urban", lat: 12.9160, lng: 77.6080 },
  { id: "jp-nagar-24th-main", name: "24th Main Road (JP Nagar 5th Phase)", corridor: "South Suburb Spine", district: "Bangalore Urban", lat: 12.9050, lng: 77.5890 },
  { id: "jayanagar-9th-main", name: "9th Main Road (Jayanagar 3rd & 4th Block)", corridor: "Heritage Commercial Street", district: "Bangalore Urban", lat: 12.9320, lng: 77.5810 },
  { id: "jayanagar-south-end", name: "South End Road (Jayanagar to Basavanagudi)", corridor: "South Arterial", district: "Bangalore Urban", lat: 12.9380, lng: 77.5780 },
  { id: "ecity-elevated", name: "Electronic City Elevated Tollway Expressway", corridor: "Elevated Expressway", district: "Bangalore Urban", lat: 12.8800, lng: 77.6450 },
  { id: "haralur-rd", name: "Haralur Road (Off ORR & Sarjapur Road)", corridor: "Tech Residential Link", district: "Bangalore Urban", lat: 12.9060, lng: 77.6650 },
  { id: "kasavanahalli-rd", name: "Kasavanahalli Main Road", corridor: "Off-Sarjapur Spine", district: "Bangalore Urban", lat: 12.9010, lng: 77.6740 },
  { id: "anekal-chandapura-rd", name: "Anekal - Chandapura Main Road", corridor: "Industrial Arterial", district: "Bangalore Urban", lat: 12.7500, lng: 77.7000 },
  { id: "jigani-bommasandra-rd", name: "Jigani - Bommasandra Link Road", corridor: "Industrial Corridor", district: "Bangalore Urban", lat: 12.8000, lng: 77.6600 },

  // North & North-West Roads
  { id: "new-bel-rd", name: "New BEL Road (Sadashivanagar to MS Ramaiah)", corridor: "North Commercial Arterial", district: "Bangalore Urban", lat: 13.0300, lng: 77.5700 },
  { id: "vidyaranyapura-main", name: "Vidyaranyapura Main Road (Thindlu to BEL)", corridor: "Suburban Spine", district: "Bangalore Urban", lat: 13.0750, lng: 77.5600 },
  { id: "yelahanka-major-sandeep", name: "Major Sandeep Unnikrishnan Road (Yelahanka New Town)", corridor: "North Arterial Spine", district: "Bangalore Urban", lat: 13.1020, lng: 77.5880 },
  { id: "hennur-bagalur-rd", name: "Hennur - Bagalur Main Road", corridor: "Airport Eastern Arterial", district: "Both Districts", lat: 13.0700, lng: 77.6450 },
  { id: "thanisandra-main-rd", name: "Thanisandra Main Road (Nagawara to Reva University)", corridor: "Tech Residential Corridor", district: "Bangalore Urban", lat: 13.0600, lng: 77.6300 },
  { id: "sampige-rd", name: "Sampige Road (Malleshwaram)", corridor: "North Core Heritage Street", district: "Bangalore Urban", lat: 12.9990, lng: 77.5710 },
  { id: "margosa-rd", name: "Margosa Road (Malleshwaram)", corridor: "North Core Arterial", district: "Bangalore Urban", lat: 12.9970, lng: 77.5680 },
  { id: "dr-rajkumar-rd", name: "Dr. Rajkumar Road (Rajajinagar to Yeshwanthpur)", corridor: "West Arterial Spine", district: "Bangalore Urban", lat: 13.0030, lng: 77.5550 },
  { id: "west-of-chord-rd", name: "West of Chord Road (Mahalakshmi Layout to Vijayanagar)", corridor: "West Express Ring", district: "Bangalore Urban", lat: 12.9900, lng: 77.5450 },

  // Bangalore Rural Highways & Key Roads
  { id: "sh9-doddaballapura-sh", name: "SH 9 Highway (Yelahanka to Doddaballapura)", corridor: "State Highway 9", district: "Both Districts", lat: 13.2300, lng: 77.5500 },
  { id: "sh74-devanahalli-doddaballapur", name: "SH 74 (Devanahalli - Doddaballapura Highway)", corridor: "Rural District Link SH 74", district: "Bangalore Rural", lat: 13.2700, lng: 77.6300 },
  { id: "doddaballapura-dobbaspet", name: "Doddaballapura - Dobbaspet Highway", corridor: "Industrial Arterial", district: "Bangalore Rural", lat: 13.2700, lng: 77.3800 },
  { id: "nelamangala-doddaballapur", name: "Nelamangala - Doddaballapura Road", corridor: "Rural Connector", district: "Bangalore Rural", lat: 13.1800, lng: 77.4600 },
  { id: "nelamangala-shivagange", name: "Nelamangala - Dobbaspet - Shivagange Road", corridor: "Heritage Rural Corridor", district: "Bangalore Rural", lat: 13.2000, lng: 77.2600 },
  { id: "hosakote-whitefield", name: "Hosakote - Kadugodi - Whitefield Road", corridor: "East Industrial Link", district: "Both Districts", lat: 13.0400, lng: 77.7800 },
  { id: "hosakote-chintamani", name: "Hosakote - Chintamani Highway (SH 82)", corridor: "State Highway 82", district: "Bangalore Rural", lat: 13.1200, lng: 77.8500 },
  { id: "hosakote-malur", name: "Hosakote - Malur Road", corridor: "Industrial Arterial", district: "Bangalore Rural", lat: 13.0300, lng: 77.8500 },
  { id: "devanahalli-vijayapura", name: "Devanahalli - Vijayapura - Sulibele Road", corridor: "Rural Ring Connector", district: "Bangalore Rural", lat: 13.2200, lng: 77.7800 },
  { id: "solur-kudumalakunte-nh", name: "NH 75 Corridor (Nelamangala to Solur / Kunigal)", corridor: "National Highway 75", district: "Bangalore Rural", lat: 13.0800, lng: 77.2600 },
  { id: "bull-temple-rd", name: "Bull Temple Road (Basavanagudi)", corridor: "Heritage South", district: "Bangalore Urban", lat: 12.9430, lng: 77.5670 },
  { id: "mg-road-core", name: "Mahatma Gandhi (MG) Road", corridor: "Downtown Central", district: "Bangalore Urban", lat: 12.9750, lng: 77.6050 },
  { id: "cunningham-rd", name: "Cunningham Road (Vasanth Nagar)", corridor: "Central Downtown", district: "Bangalore Urban", lat: 12.9880, lng: 77.5960 },
  { id: "residency-rd", name: "Residency Road (Field Marshal KM Cariappa Rd)", corridor: "Central Arterial", district: "Bangalore Urban", lat: 12.9710, lng: 77.6020 },
  { id: "richmond-rd", name: "Richmond Road (General KS Thimayya Rd)", corridor: "Central Arterial", district: "Bangalore Urban", lat: 12.9660, lng: 77.6040 },
];
