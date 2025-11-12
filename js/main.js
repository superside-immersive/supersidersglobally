/**
 * Main Application Entry Point
 * Coordinates all modules and initializes the application
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { countryData } from './data/countries.js';
import { categories } from './data/categories.js';
import { generateConnections } from './globe/connections.js';
import { initializeGlobe, getPointSize } from './globe/config.js';
import { initializeOrbitersLoop, addOrbitingAstronaut, clearOrbiters } from './astronauts/astronauts.js';
import { initializeLoadingSequence } from './animations/animations.js';
import { initializeTooltip, showTooltip, hideTooltipDelayed } from './ui/tooltip.js';
import {
    initializeEnabledCountries,
    enabledCountries,
    getActiveCategory,
    toggleCountryPanel,
    initializeUI,
    showCountryInfo,
    hideCountryInfo,
    populateCategoryList,
    populateCountryList,
    selectAllCountries,
    deselectAllCountries,
    updateInfoPanel
} from './ui/ui.js';

// Make THREE available globally
window.THREE = THREE;

// Initialize the globe variable
let myGlobe;
let connections;

/**
 * Update visualization with smooth transitions
 */
function updateVisualization() {
    const activeCategory = getActiveCategory();
    const enabledCountryData = countryData.filter(country => enabledCountries.has(country.name));
    
    // Add category color to country data if a category is active
    const enrichedCountryData = enabledCountryData.map(country => ({
        ...country,
        categoryColor: activeCategory && categories[activeCategory] ? categories[activeCategory].color : null
    }));
    
    connections = generateConnections(countryData, enabledCountries, activeCategory);
    
    // SMOOTH FADE OUT: Primero vaciar los datos para que desaparezcan suavemente
    myGlobe.pointsData([]);
    myGlobe.arcsData([]);
    
    // SMOOTH FADE IN: Después de un pequeño delay, mostrar los nuevos datos
    setTimeout(() => {
        myGlobe.pointsData(enrichedCountryData);
        myGlobe.arcsData(connections);
    }, 600); // Esperar a que termine la transición de desaparición
    
    updateInfoPanel(countryData);
    
    console.log(`Updated visualization: ${enabledCountryData.length} countries, activeCategory: ${getActiveCategory()}`);
    
    // Handle astronaut orbiters
    setTimeout(() => {
        try {
            clearOrbiters(myGlobe);

            if (getActiveCategory() === 'lone_wolf') {
                const loneWolfCountries = enabledCountryData.filter(c => c.count === 1);
                console.log('Lone wolf mode active! Found', loneWolfCountries.length, 'lone wolf countries');
                
                loneWolfCountries.forEach(c => {
                    console.log('Attempting to add astronaut for:', c.name);
                    addOrbitingAstronaut(c, myGlobe, THREE, getPointSize);
                });
                
                console.log('Total astronauts in scene:', loneWolfCountries.length);
            }
        } catch (e) {
            console.error('Error managing astronaut orbiters:', e, e.stack);
        }
    }, 700); // Esperar a que aparezcan los nuevos puntos
}

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Supersiders Globally application...');
    
    // Initialize enabled countries
    initializeEnabledCountries(countryData);
    
    // Initialize the globe
    myGlobe = initializeGlobe(document.getElementById('globeViz'));
    
    // Generate initial connections
    connections = generateConnections(countryData, enabledCountries, getActiveCategory());
    
    // Initialize astronaut system
    initializeOrbitersLoop();
    
    // Initialize tooltip
    initializeTooltip();
    
    // Initialize UI
    initializeUI();
    populateCategoryList(countryData, myGlobe, updateVisualization);
    populateCountryList(countryData, myGlobe, updateVisualization);
    updateInfoPanel(countryData);
    
    // Setup globe interactions
    setupGlobeInteractions();
    
    // Start loading sequence
    initializeLoadingSequence(myGlobe, countryData, connections);
    
    // Regenerate connections periodically
    setInterval(() => {
        if (enabledCountries.size > 0) {
            connections = generateConnections(countryData, enabledCountries, getActiveCategory());
            myGlobe.arcsData(connections);
            console.log('Connections regenerated automatically');
        }
    }, 8000);
    
    console.log('Application initialized successfully');
}

/**
 * Setup globe interactions (hover, click)
 */
function setupGlobeInteractions() {
    // Point hover interaction
    myGlobe.onPointHover((point, prevPoint) => {
        if (point && point.name) {
            showTooltip(point);
        } else {
            hideTooltipDelayed();
        }
    });
    
    // Point click interaction
    myGlobe.onPointClick((point, event) => {
        console.log('Clicked country:', point.name, 'Count:', point.count);
        showCountryInfo(point);
        myGlobe.pointOfView({
            lat: point.coordinates.lat,
            lng: point.coordinates.lng,
            altitude: 1.5
        }, 1000);
    });
    
    // Arc click interaction
    myGlobe.onArcClick((arc, event) => {
        console.log('Clicked connection:', arc.startCountry, '↔', arc.endCountry);
        const midLat = (arc.startLat + arc.endLat) / 2;
        const midLng = (arc.startLng + arc.endLng) / 2;
        myGlobe.pointOfView({
            lat: midLat,
            lng: midLng,
            altitude: 2.0
        }, 1000);
    });
}

/**
 * Make functions global for onclick handlers
 */
window.selectAllCountries = () => selectAllCountries(countryData, myGlobe, updateVisualization);
window.deselectAllCountries = () => deselectAllCountries(countryData, myGlobe, updateVisualization);
window.updateVisualization = updateVisualization;
window.toggleCountryPanel = toggleCountryPanel;
window.hideCountryInfo = hideCountryInfo;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
