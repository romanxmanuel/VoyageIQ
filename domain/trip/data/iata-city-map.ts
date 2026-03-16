// Static city-name → IATA airport code mapping
// Covers seeded destinations + ~150 common global destinations
// For cities not in this map, fall back to Amadeus Airport Search API

const CITY_TO_IATA: Record<string, string> = {
  // Philippines
  'manila': 'MNL', 'metro manila': 'MNL', 'ncr': 'MNL',
  'boracay': 'MPH', 'el nido': 'ENI', 'palawan': 'PPS', 'puerto princesa': 'PPS',
  'bohol': 'TAG', 'tagbilaran': 'TAG', 'siargao': 'IAO',
  'cebu': 'CEB', 'mactan': 'CEB', 'cebu city': 'CEB',
  'davao': 'DVO', 'davao city': 'DVO',
  'sorsogon': 'LGP', 'sorsogon city': 'LGP', 'legazpi': 'LGP', 'donsol': 'LGP',
  'naga': 'WNP', 'naga city': 'WNP', 'camarines sur': 'WNP',
  'iloilo': 'ILO', 'bacolod': 'BCD', 'cagayan de oro': 'CGY',
  'zamboanga': 'ZAM', 'clark': 'CRK', 'angeles': 'CRK',
  // Japan
  'tokyo': 'HND', 'osaka': 'KIX', 'kyoto': 'ITM',
  'sapporo': 'CTS', 'fukuoka': 'FUK', 'nagoya': 'NGO',
  // USA
  'orlando': 'MCO', 'new york': 'JFK', 'nyc': 'JFK',
  'los angeles': 'LAX', 'la': 'LAX', 'san francisco': 'SFO',
  'chicago': 'ORD', 'miami': 'MIA', 'las vegas': 'LAS',
  'honolulu': 'HNL', 'waikiki': 'HNL', 'hawaii': 'HNL',
  'seattle': 'SEA', 'boston': 'BOS', 'atlanta': 'ATL',
  'dallas': 'DFW', 'houston': 'IAH', 'denver': 'DEN',
  'phoenix': 'PHX', 'portland': 'PDX', 'san diego': 'SAN',
  // Europe
  'paris': 'CDG', 'london': 'LHR', 'barcelona': 'BCN',
  'madrid': 'MAD', 'rome': 'FCO', 'milan': 'MXP',
  'amsterdam': 'AMS', 'berlin': 'BER', 'lisbon': 'LIS',
  'porto': 'OPO', 'athens': 'ATH', 'zurich': 'ZRH',
  'vienna': 'VIE', 'prague': 'PRG', 'budapest': 'BUD',
  'istanbul': 'IST', 'dubrovnik': 'DBV', 'split': 'SPU',
  'brussels': 'BRU', 'copenhagen': 'CPH', 'stockholm': 'ARN',
  'oslo': 'OSL', 'helsinki': 'HEL', 'warsaw': 'WAW',
  'munich': 'MUC', 'frankfurt': 'FRA',
  'nice': 'NCE', 'venice': 'VCE', 'florence': 'FLR',
  // Southeast Asia
  'bangkok': 'BKK', 'bali': 'DPS', 'denpasar': 'DPS',
  'singapore': 'SIN', 'kuala lumpur': 'KUL', 'kl': 'KUL',
  'ho chi minh': 'SGN', 'saigon': 'SGN', 'hanoi': 'HAN',
  'da nang': 'DAD', 'phuket': 'HKT', 'chiang mai': 'CNX',
  'siem reap': 'REP', 'phnom penh': 'PNH', 'yangon': 'RGN',
  'jakarta': 'CGK', 'lombok': 'LOP', 'flores': 'ENE',
  'langkawi': 'LGK', 'penang': 'PEN', 'kota kinabalu': 'BKI',
  // East Asia
  'hong kong': 'HKG', 'taipei': 'TPE', 'taichung': 'RMQ',
  'seoul': 'ICN', 'busan': 'PUS',
  'shanghai': 'PVG', 'beijing': 'PEK', 'guangzhou': 'CAN',
  // South Asia & Middle East
  'dubai': 'DXB', 'abu dhabi': 'AUH', 'doha': 'DOH',
  'delhi': 'DEL', 'new delhi': 'DEL', 'mumbai': 'BOM',
  'colombo': 'CMB', 'maldives': 'MLE', 'male': 'MLE',
  'kathmandu': 'KTM', 'amman': 'AMM', 'beirut': 'BEY',
  // Americas
  'cancun': 'CUN', 'mexico city': 'MEX', 'guadalajara': 'GDL',
  'bogota': 'BOG', 'lima': 'LIM', 'quito': 'UIO',
  'buenos aires': 'EZE', 'rio de janeiro': 'GIG', 'rio': 'GIG',
  'sao paulo': 'GRU', 'santiago': 'SCL', 'medellin': 'MDE',
  'toronto': 'YYZ', 'vancouver': 'YVR', 'montreal': 'YUL',
  'havana': 'HAV', 'san jose': 'SJO',
  // Africa & Oceania
  'sydney': 'SYD', 'melbourne': 'MEL', 'brisbane': 'BNE',
  'auckland': 'AKL', 'queenstown': 'ZQN',
  'johannesburg': 'JNB', 'cape town': 'CPT',
  'nairobi': 'NBO', 'cairo': 'CAI', 'casablanca': 'CMN',
  'marrakech': 'RAK', 'tunis': 'TUN', 'accra': 'ACC',
}

export function resolveIataCode(cityName: string): string | null {
  return CITY_TO_IATA[cityName.toLowerCase().trim()] ?? null
}
