/**
 * Globe Configuration Module
 * Initializes and configures the Globe.gl instance
 */
import { isTransPacificRoute } from './connections.js';

// Global arc opacity multiplier for fade-in animation
export let arcOpacityMultiplier = 0.001;

export function setArcOpacityMultiplier(value) {
    arcOpacityMultiplier = value;
}

/**
 * Helper function to convert hex to rgba
 */
function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get color based on count - DEFAULT COLORS (when no category is active)
 */
export function getPointColor(count, categoryColor = null) {
    // If a category is active, use its color
    if (categoryColor) {
        return categoryColor;
    }
    
    // Default color scheme based on count
    if (count >= 50) return '#DAFF87'; // High count - Bright Green
    if (count >= 10) return '#86F5AF'; // Medium count - Medium Green
    return '#4A9B5E'; // Low count - Dark Green
}

/**
 * Get point size based on count
 */
export function getPointSize(count) {
    if (count >= 50) return 0.8;
    if (count >= 10) return 0.5;
    return 0.3;
}

/**
 * Get arc color based on connection strength
 */
export function getArcColor(connection) {
    const avgCount = (connection.startCount + connection.endCount) / 2;
    const baseOpacity = Math.min(0.3, avgCount / 200);
    const opacity = baseOpacity * arcOpacityMultiplier;
    
    // If a category color is present, use it
    if (connection.categoryColor) {
        return [
            hexToRgba(connection.categoryColor, opacity),
            hexToRgba(connection.categoryColor, opacity * 1.5)
        ];
    }
    
    // Default color scheme based on count
    if (avgCount >= 50) return [`rgba(218, 255, 135, ${opacity})`, `rgba(218, 255, 135, ${opacity * 1.5})`];
    if (avgCount >= 20) return [`rgba(134, 245, 175, ${opacity})`, `rgba(134, 245, 175, ${opacity * 1.5})`];
    return [`rgba(74, 155, 94, ${opacity})`, `rgba(74, 155, 94, ${opacity * 1.5})`];
}

/**
 * Initialize the globe
 */
export function initializeGlobe(container) {
    const globe = new Globe(container)
        .globeImageUrl('https://upload.wikimedia.org/wikipedia/commons/b/b3/Solarsystemscope_texture_8k_earth_nightmap.jpg')
        .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
        .pointOfView({ lat: 20, lng: 0, altitude: 2.5 })
        
        // Points configuration - START WITH EMPTY DATA (will animate in later)
        .pointsData([])
        .pointLat(d => d.coordinates.lat)
        .pointLng(d => d.coordinates.lng)
        .pointColor(d => getPointColor(d.count, d.categoryColor))
        .pointAltitude(d => getPointSize(d.count) * 0.2)
        .pointRadius(d => getPointSize(d.count) * 0.8)
        .pointResolution(6) // REDUCIDO: de 8 a 6 para mejor performance
        .pointLabel(d => null)
        .pointsMerge(false)
        .pointsTransitionDuration(1500)
        
        // Arcs configuration - START WITH EMPTY DATA (will animate in later)
        .arcsData([])
        .arcStartLat(d => d.startLat)
        .arcStartLng(d => d.startLng)
        .arcEndLat(d => d.endLat)
        .arcEndLng(d => d.endLng)
        .arcColor(d => getArcColor(d))
        .arcAltitude(d => {
            const distance = d.distance;
            const isTransPacific = isTransPacificRoute(d.startLng, d.endLng, d.startLat, d.endLat);
            if (isTransPacific) return 0.3;
            if (distance > 10000) return 0.4;
            if (distance > 5000) return 0.25;
            if (distance > 2000) return 0.15;
            return 0.08;
        })
        .arcCurveResolution(24) // REDUCIDO: de 32 a 24 para mejor performance
        .arcCircularResolution(2) // REDUCIDO: de 3 a 2 para mejor performance
        .arcStroke(0.1)
        .arcDashLength(0.25)
        .arcDashGap(1)
        .arcDashInitialGap(() => Math.random())
        .arcDashAnimateTime(0)
        .arcsTransitionDuration(1500)
        .enablePointerInteraction(true);
    
    // Add atmospheric effects
    globe.atmosphereAltitude(0.25);
    globe.atmosphereColor('lightskyblue');
    
    // Auto-rotate the globe slowly
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.125;
    
    // Performance optimizations para animaciones suaves
    controls.enableDamping = false; // Inicialmente deshabilitado (se activa en airplane mode)
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 101; // Prevenir zoom muy cercano
    controls.maxDistance = 500; // Prevenir zoom muy lejano
    
    return globe;
}
