/**
 * Language Data
 * Maps countries to their official languages (primary and secondary)
 * All Supersiders speak English as a common language
 */

// Language mapping by country - only primary official language
export const countryLanguages = {
    "South Africa": ["English"],
    "Brazil": ["Portuguese"],
    "Argentina": ["Spanish"],
    "Colombia": ["Spanish"],
    "Spain": ["Spanish"],
    "Mexico": ["Spanish"],
    "United States of America (USA)": ["English"],
    "Portugal": ["Portuguese"],
    "Canada": ["English"],
    "Costa Rica": ["Spanish"],
    "United Kingdom": ["English"],
    "Uruguay": ["Spanish"],
    "Germany": ["German"],
    "Peru": ["Spanish"],
    "Poland": ["Polish"],
    "Italy": ["Italian"],
    "Philippines": ["Filipino"],
    "Romania": ["Romanian"],
    "Ecuador": ["Spanish"],
    "El Salvador": ["Spanish"],
    "Indonesia": ["Indonesian"],
    "Norway": ["Norwegian"],
    "Panama": ["Spanish"],
    "Serbia": ["Serbian"],
    "Dominican Republic": ["Spanish"],
    "Greece": ["Greek"],
    "Hungary": ["Hungarian"],
    "India": ["Hindi"],
    "Netherlands": ["Dutch"],
    "United Arab Emirates": ["Arabic"],
    "Bosnia & Herzegovina": ["Bosnian"],
    "Egypt": ["Arabic"],
    "France": ["French"],
    "Venezuela": ["Spanish"],
    "Armenia": ["Armenian"],
    "Chile": ["Spanish"],
    "Guatemala": ["Spanish"],
    "Malaysia": ["Malay"],
    "Nicaragua": ["Spanish"],
    "North Macedonia": ["Macedonian"],
    "Ukraine": ["Ukrainian"],
    "Australia": ["English"],
    "Latvia": ["Latvian"],
    "Libya": ["Arabic"],
    "Lithuania": ["Lithuanian"],
    "Turkey": ["Turkish"],
    "Bulgaria": ["Bulgarian"],
    "Croatia": ["Croatian"],
    "Cyprus": ["Greek"],
    "Denmark": ["Danish"],
    "Georgia": ["Georgian"],
    "Ghana": ["English"],
    "Guyana": ["English"],
    "Honduras": ["Spanish"],
    "Ireland": ["English"],
    "Jordan": ["Arabic"],
    "Kenya": ["Swahili"],
    "Lebanon": ["Arabic"],
    "Martinique": ["French"],
    "Mauritius": ["English"],
    "Morocco": ["Arabic"],
    "New Zealand": ["English"],
    "Nigeria": ["English"],
    "Palestine": ["Arabic"],
    "Paraguay": ["Spanish"],
    "Russian Federation": ["Russian"],
    "Slovenia": ["Slovenian"],
    "Sweden": ["Swedish"],
    "Thailand": ["Thai"],
    "Tunisia": ["Arabic"]
};

// All unique languages sorted
export const allLanguages = [...new Set(
    Object.values(countryLanguages).flat()
)].sort();

/**
 * Get languages for a country (always includes English since all Supersiders speak it)
 */
export function getCountryLanguages(countryName) {
    const languages = countryLanguages[countryName] || [];
    // English is always spoken by all supersiders
    if (!languages.includes("English")) {
        return ["English", ...languages];
    }
    return languages;
}

/**
 * Build hierarchical data structure for sunburst visualization
 * Structure: LANGUAGES (center) -> English (first ring) -> Other Languages (subsequent rings)
 */
export function buildLanguageHierarchy(countryData) {
    // Languages to exclude (rarely used regional/indigenous languages)
    const excludedLanguages = [
        "Quechua", "Aymara", "Guaraní", "Berber", "Basque", "Galician", "Catalan",
        "Frisian", "Welsh", "Scottish Gaelic", "Irish", "Zulu", "Xhosa", "Māori",
        "Mauritian Creole", "Albanian", "Macedonian", "Georgian", "Armenian"
    ];
    
    // First, calculate total people per language
    const languageStats = {};
    
    countryData.forEach(country => {
        const languages = getCountryLanguages(country.name)
            .filter(lang => !excludedLanguages.includes(lang));
        languages.forEach(lang => {
            if (!languageStats[lang]) {
                languageStats[lang] = {
                    name: lang,
                    totalPeople: 0,
                    countries: []
                };
            }
            languageStats[lang].totalPeople += country.count;
            languageStats[lang].countries.push({
                name: country.name,
                count: country.count
            });
        });
    });
    
    // Total supersiders
    const totalSupersiders = countryData.reduce((sum, c) => sum + c.count, 0);
    
    // Get English stats
    const englishStats = languageStats["English"];
    
    // Get other major languages (excluding English)
    const otherLanguages = Object.values(languageStats)
        .filter(lang => lang.name !== "English")
        .sort((a, b) => b.totalPeople - a.totalPeople);
    
    // Build hierarchy: LANGUAGES (center) -> English (ring 1) -> Other Languages (ring 2+)
    return {
        name: "LANGUAGES",
        value: 0, // Center has no value
        totalPeople: totalSupersiders,
        children: [
            {
                name: "English",
                totalPeople: englishStats.totalPeople,
                value: englishStats.totalPeople,
                children: otherLanguages.map(lang => ({
                    name: lang.name,
                    totalPeople: lang.totalPeople,
                    value: lang.totalPeople,
                    children: lang.countries.map(c => ({
                        name: c.name,
                        value: c.count
                    }))
                }))
            }
        ]
    };
}

// Color palette for languages - using bright distinctive colors
export const languageColors = {
    "English": "#86F5AF",      // Mint (center)
    "Spanish": "#FF9595",      // Coral
    "Portuguese": "#D8FF85",   // Spark yellow-green  
    "French": "#A1D4FF",       // Sky blue
    "Arabic": "#FFB86C",       // Orange
    "German": "#FF79C6",       // Pink
    "Italian": "#8BE9FD",      // Cyan
    "Dutch": "#BD93F9",        // Purple
    "Polish": "#FFD700",       // Gold
    "Russian": "#F1FA8C",      // Yellow
    "Ukrainian": "#50FA7B",    // Green
    "Turkish": "#FF5555",      // Red
    "Greek": "#6272A4",        // Blue-gray
    "Hungarian": "#44475A",    // Dark blue-gray
    "Romanian": "#FF6E6E",     // Light red
    "Serbian": "#69FF94",      // Light green
    "Croatian": "#E6E6FA",     // Lavender
    "Bosnian": "#DDA0DD",      // Plum
    "Bulgarian": "#98FB98",    // Pale green
    "Slovenian": "#87CEEB",    // Sky blue
    "Czech": "#FFA07A",        // Light salmon
    "Slovak": "#20B2AA",       // Light sea green
    "Lithuanian": "#9370DB",   // Medium purple
    "Latvian": "#3CB371",      // Medium sea green
    "Norwegian": "#4169E1",    // Royal blue
    "Swedish": "#FFDAB9",      // Peach
    "Danish": "#DC143C",       // Crimson
    "Filipino": "#00CED1",     // Dark turquoise
    "Indonesian": "#FF8C00",   // Dark orange
    "Malay": "#9932CC",        // Dark orchid
    "Hindi": "#FF4500",        // Orange red
    "Thai": "#2E8B57",         // Sea green
    "Mandarin": "#B22222",     // Firebrick
    "Tamil": "#8B008B",        // Dark magenta
    "Swahili": "#556B2F",      // Dark olive green
    "Afrikaans": "#8FBC8F",    // Dark sea green
    "Zulu": "#483D8B",         // Dark slate blue
    "Xhosa": "#2F4F4F",        // Dark slate gray
    "Welsh": "#CD853F",        // Peru
    "Scottish Gaelic": "#708090", // Slate gray
    "Irish": "#228B22",        // Forest green
    "Catalan": "#DAA520",      // Goldenrod
    "Basque": "#B8860B",       // Dark goldenrod
    "Galician": "#BC8F8F",     // Rosy brown
    "Quechua": "#CD5C5C",      // Indian red
    "Aymara": "#F4A460",       // Sandy brown
    "Guaraní": "#D2691E",      // Chocolate
    "Berber": "#8B4513",       // Saddle brown
    "Frisian": "#A0522D",      // Sienna
    "Albanian": "#C71585",     // Medium violet red
    "Macedonian": "#DB7093",   // Pale violet red
    "Armenian": "#FF1493",     // Deep pink
    "Georgian": "#00FA9A",     // Medium spring green
    "Māori": "#7FFF00",        // Chartreuse
    "Mauritian Creole": "#7FFFD4" // Aquamarine
};

// Get color for a language
export function getLanguageColor(language) {
    return languageColors[language] || "#86F5AF";
}
