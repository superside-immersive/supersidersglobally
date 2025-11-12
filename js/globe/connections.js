/**
 * Connection Generation Module
 * Handles generation of arc connections between countries
 */
import { categories } from '../data/categories.js';

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Detect if a route should go across the Pacific
 */
export function isTransPacificRoute(startLng, endLng, startLat, endLat) {
    const isLatinAmerica = (lng) => lng >= -120 && lng <= -30;
    const isAsia = (lng) => lng >= 95 && lng <= 180;
    const isOceania = (lng) => lng >= 110 && lng <= 180 && endLat >= -50 && endLat <= -10;
    
    const fromLatAm = isLatinAmerica(startLng);
    const toAsiaPacific = isAsia(endLng) || isOceania(endLng);
    const fromAsiaPacific = isAsia(startLng) || isOceania(startLng);
    const toLatAm = isLatinAmerica(endLng);
    
    return (fromLatAm && toAsiaPacific) || (fromAsiaPacific && toLatAm);
}

/**
 * Generate connections between countries
 */
export function generateConnections(countryData, enabledCountriesSet, activeCategory) {
    const connections = [];
    
    // Filter countries to only enabled ones
    const activeCountries = countryData.filter(country => enabledCountriesSet.has(country.name));
    
    // Check if we're in Lone Wolf mode
    const isLoneWolfMode = activeCategory === 'lone_wolf';
    
    // Ensure every country gets at least one connection
    const countryConnections = new Map();
    activeCountries.forEach(country => countryConnections.set(country.name, 0));
    
    // Connect ALL enabled countries to each other with varying probability
    for (let i = 0; i < activeCountries.length; i++) {
        for (let j = i + 1; j < activeCountries.length; j++) {
            const country1 = activeCountries[i];
            const country2 = activeCountries[j];
            
            const distance = calculateDistance(
                country1.coordinates.lat, country1.coordinates.lng,
                country2.coordinates.lat, country2.coordinates.lng
            );
            
            // Create multiple seeds for more variety in connections
            const seed1 = (country1.name + country2.name).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const seed2 = (country2.name + country1.name).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const seed3 = Math.abs(country1.coordinates.lat * country2.coordinates.lng);
            const combinedSeed = (seed1 + seed2 + seed3) % 10000;
            
            const pseudoRandom = Math.sin(combinedSeed * 0.001) * 10000;
            const randomValue = Math.abs(pseudoRandom - Math.floor(pseudoRandom));
            
            // ULTRA OPTIMIZED: Minimal connections for performance
            let probability = 0.01; // REDUCED 75% from original 0.04
            
            // Special handling for Lone Wolf mode or lone wolf countries
            if (isLoneWolfMode || (country1.count === 1 || country2.count === 1)) {
                // Give lone wolves better chances to connect
                probability = 0.05; // REDUCED 75% from original 0.15
                
                // Boost probability if either country has no connections yet
                if (countryConnections.get(country1.name) === 0 || countryConnections.get(country2.name) === 0) {
                    probability = 0.10; // REDUCED 75% from original 0.30
                }
            } else {
                // Varied probability for non-lone wolves
                const countFactor = Math.min((country1.count + country2.count) / 400, 0.03); // REDUCED 75%
                const distanceFactor = Math.max(0.01, 1 - (distance / 18000)); // REDUCED 75%
                const randomFactor = Math.random() * 0.02; // REDUCED 75%
                
                probability = 0.01 + countFactor + (distanceFactor * 0.015) + randomFactor; // REDUCED 75%
                
                // Boost for countries with few connections
                if (countryConnections.get(country1.name) < 2 || countryConnections.get(country2.name) < 2) {
                    probability += 0.03; // REDUCED 75% from original 0.10
                }
                
                // Ensure probability stays within bounds
                probability = Math.min(Math.max(probability, 0.01), 0.08); // REDUCED 75%
            }
            
            // Add time-based variation for more dynamic connections
            const timeVariation = Math.sin(Date.now() * 0.0001 + combinedSeed) * 0.01; // REDUCED 75%
            probability += timeVariation;
            
            const shouldConnect = randomValue < probability;
            
            if (shouldConnect) {
                // Check if this should be a trans-Pacific route
                const isTransPacific = isTransPacificRoute(
                    country1.coordinates.lng, country2.coordinates.lng, 
                    country1.coordinates.lat, country2.coordinates.lat
                );
                
                let startLng = country1.coordinates.lng;
                let endLng = country2.coordinates.lng;
                
                // Force trans-Pacific routes to go across the Pacific
                if (isTransPacific) {
                    // If crossing from Americas to Asia, ensure we go the Pacific way
                    if (startLng < 0 && endLng > 0) {
                        // From Americas (negative lng) to Asia (positive lng) - go east across Pacific
                        if (Math.abs(endLng - startLng) > 180) {
                            startLng = startLng < -150 ? startLng : startLng - 360;
                        }
                    } else if (startLng > 0 && endLng < 0) {
                        // From Asia (positive lng) to Americas (negative lng) - go west across Pacific
                        if (Math.abs(startLng - endLng) > 180) {
                            endLng = endLng < -150 ? endLng : endLng - 360;
                        }
                    }
                }
                
                connections.push({
                    startLat: country1.coordinates.lat,
                    startLng: startLng,
                    endLat: country2.coordinates.lat,
                    endLng: endLng,
                    startCountry: country1.name,
                    endCountry: country2.name,
                    startCount: country1.count,
                    endCount: country2.count,
                    distance: distance,
                    category: activeCategory,
                    categoryColor: activeCategory && categories[activeCategory] ? categories[activeCategory].color : null
                });
                
                // Track connections for each country
                countryConnections.set(country1.name, countryConnections.get(country1.name) + 1);
                countryConnections.set(country2.name, countryConnections.get(country2.name) + 1);
            }
        }
    }
    
    // Ensure isolated countries (especially lone wolves) get at least one connection
    const isolatedCountries = activeCountries.filter(country => countryConnections.get(country.name) === 0);
    isolatedCountries.forEach(isolatedCountry => {
        // Find a random partner for isolated countries
        const potentialPartners = activeCountries.filter(country => country.name !== isolatedCountry.name);
        if (potentialPartners.length > 0) {
            const randomIndex = Math.floor(Math.random() * potentialPartners.length);
            const partner = potentialPartners[randomIndex];
            
            connections.push({
                startLat: isolatedCountry.coordinates.lat,
                startLng: isolatedCountry.coordinates.lng,
                endLat: partner.coordinates.lat,
                endLng: partner.coordinates.lng,
                startCountry: isolatedCountry.name,
                endCountry: partner.name,
                startCount: isolatedCountry.count,
                endCount: partner.count,
                distance: calculateDistance(
                    isolatedCountry.coordinates.lat, isolatedCountry.coordinates.lng,
                    partner.coordinates.lat, partner.coordinates.lng
                ),
                category: activeCategory,
                categoryColor: activeCategory && categories[activeCategory] ? categories[activeCategory].color : null
            });
        }
    });
    
    console.log(`Generated ${connections.length} connections for ${activeCountries.length} countries`);
    console.log(`Isolated countries that got forced connections: ${isolatedCountries.length}`);
    return connections;
}
