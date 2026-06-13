import { updateVibeScore } from './watchTimeTracking';

export const CONTINENTS = {
  asia: [
    "IN","PK","BD","LK",
    "NP","JP","KR","CN",
    "ID","MY","TH","VN",
    "PH","SG","MM","KH",
    "LA","TW","HK","MO",
    "MN","KZ","UZ","TM",
    "KG","TJ","AF","IR",
    "IQ","SA","AE","QA",
    "KW","BH","OM","YE",
    "JO","LB","SY","IL",
    "TR","AZ","GE","AM"
  ],
  europe: [
    "GB","FR","DE","IT",
    "ES","PT","NL","BE",
    "CH","AT","SE","NO",
    "DK","FI","PL","CZ",
    "HU","RO","BG","GR",
    "UA","RU","BY","MD",
    "HR","RS","SI","SK",
    "EE","LV","LT","IE",
    "IS","LU","MT","CY"
  ],
  americas: [
    "US","CA","MX","BR",
    "AR","CO","CL","PE",
    "VE","EC","BO","PY",
    "UY","GY","SR","GT",
    "BZ","HN","SV","NI",
    "CR","PA","CU","DO",
    "HT","JM","TT","BB"
  ],
  africa: [
    "NG","ZA","KE","ET",
    "GH","TZ","UG","EG",
    "MA","DZ","TN","LY",
    "SD","SO","CD","AO",
    "MZ","MG","CM","CI",
    "SN","ZM","ZW","ML",
    "BF","MW","NE","TD"
  ],
  oceania: [
    "AU","NZ","PG","FJ",
    "SB","VU","WS","TO",
    "KI","FM","MH","PW"
  ]
};

export const isSameContinent = (country1: string, country2: string) => {
  for (const continent of Object.values(CONTINENTS)) {
    if (continent.includes(country1) && continent.includes(country2)) {
      return true;
    }
  }
  return false;
};

export const getUserRegion = () => {
  const ipData = JSON.parse(localStorage.getItem("skrimchat_ip_lang") || "null");

  if (!ipData || ipData.error) {
    return {
      country: null,
      region: null,
      city: null
    };
  }

  return {
    country: ipData.country,
    // e.g. "IN"
    countryName: ipData.countryName,
    // e.g. "India"
    region: ipData.region,
    // e.g. "Andhra Pradesh"
    city: ipData.city
    // e.g. "Hyderabad"
  };
};

export const calculateRegionalScore = (vibe: any) => {
  const userRegion = getUserRegion();

  if (!userRegion.country || !vibe.creatorCountry) {
    return 0; // No data = no boost
  }

  let score = 0;

  // Same city:
  if (vibe.creatorCity && userRegion.city && vibe.creatorCity.toLowerCase() === userRegion.city.toLowerCase()) {
    score = 20; // Strongest boost
  }
  // Same region/state:
  else if (vibe.creatorRegion && userRegion.region && vibe.creatorRegion.toLowerCase() === userRegion.region.toLowerCase()) {
    score = 15;
  }
  // Same country:
  else if (vibe.creatorCountry === userRegion.country) {
    score = 10;
  }
  // Same continent:
  else if (isSameContinent(vibe.creatorCountry, userRegion.country)) {
    score = 3;
  }

  return score;
};

export const applyRegionalScores = (allVibes: any[]) => {
  allVibes.forEach(vibe => {
    const score = calculateRegionalScore(vibe);
    updateVibeScore(vibe.id, "regional", score);
  });
};
