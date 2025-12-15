/**
 * Country Flag Emojis
 * Maps country names to their flag emojis
 */

export const countryFlags = {
    "South Africa": "🇿🇦",
    "Brazil": "🇧🇷",
    "Argentina": "🇦🇷",
    "Colombia": "🇨🇴",
    "Spain": "🇪🇸",
    "Mexico": "🇲🇽",
    "USA": "🇺🇸",
    "Portugal": "🇵🇹",
    "Canada": "🇨🇦",
    "Costa Rica": "🇨🇷",
    "United Kingdom": "🇬🇧",
    "Uruguay": "🇺🇾",
    "Germany": "🇩🇪",
    "Peru": "🇵🇪",
    "Poland": "🇵🇱",
    "Italy": "🇮🇹",
    "Philippines": "🇵🇭",
    "Romania": "🇷🇴",
    "Ecuador": "🇪🇨",
    "El Salvador": "🇸🇻",
    "Indonesia": "🇮🇩",
    "Norway": "🇳🇴",
    "Panama": "🇵🇦",
    "Serbia": "🇷🇸",
    "Dominican Republic": "🇩🇴",
    "Greece": "🇬🇷",
    "Hungary": "🇭🇺",
    "India": "🇮🇳",
    "Netherlands": "🇳🇱",
    "United Arab Emirates": "🇦🇪",
    "Bosnia & Herzegovina": "🇧🇦",
    "Egypt": "🇪🇬",
    "France": "🇫🇷",
    "Venezuela": "🇻🇪",
    "Armenia": "🇦🇲",
    "Chile": "🇨🇱",
    "Guatemala": "🇬🇹",
    "Malaysia": "🇲🇾",
    "Nicaragua": "🇳🇮",
    "North Macedonia": "🇲🇰",
    "Ukraine": "🇺🇦",
    "Australia": "🇦🇺",
    "Latvia": "🇱🇻",
    "Libya": "🇱🇾",
    "Lithuania": "🇱🇹",
    "Turkey": "🇹🇷",
    "Bulgaria": "🇧🇬",
    "Croatia": "🇭🇷",
    "Cyprus": "🇨🇾",
    "Denmark": "🇩🇰",
    "Georgia": "🇬🇪",
    "Ghana": "🇬🇭",
    "Guyana": "🇬🇾",
    "Honduras": "🇭🇳",
    "Ireland": "🇮🇪",
    "Jordan": "🇯🇴",
    "Kenya": "🇰🇪",
    "Lebanon": "🇱🇧",
    "Martinique": "🇲🇶",
    "Mauritius": "🇲🇺",
    "Morocco": "🇲🇦",
    "New Zealand": "🇳🇿",
    "Nigeria": "🇳🇬",
    "Palestine": "🇵🇸",
    "Paraguay": "🇵🇾",
    "Russian Federation": "🇷🇺",
    "Slovenia": "🇸🇮",
    "Sweden": "🇸🇪",
    "Thailand": "🇹🇭",
    "Tunisia": "🇹🇳"
};

/**
 * Get flag emoji for a country
 * @param {string} countryName - Name of the country
 * @returns {string} Flag emoji or empty string if not found
 */
export function getCountryFlag(countryName) {
    return countryFlags[countryName] || "🏳️";
}
