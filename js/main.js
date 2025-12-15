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
import { initializeLoadingSequence, stopAirplaneFlight } from './animations/animations.js';
import { initializeTooltip, showTooltip, hideTooltipDelayed } from './ui/tooltip.js';
import {
    initializeEnabledCountries,
    enabledCountries,
    getActiveCategory,
    setActiveCategory,
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
import { initRadialChart } from './visualizations/radial-chart.js';

// Make THREE available globally
window.THREE = THREE;

// Initialize the globe variable
let myGlobe;
let connections;
let isTimezoneViewActive = false;
let isHemisphereViewActive = false;
let isLanguagesViewActive = false;
let originalCameraPosition = null;

// Track pending timeouts to cancel them if needed
let pendingTimezoneTimeouts = [];
let pendingHemisphereTimeouts = [];
let pendingLanguagesTimeouts = [];

// Make view state globally accessible
window.isTimezoneViewActive = false;
window.isHemisphereViewActive = false;
window.isLanguagesViewActive = false;

// Forward declare deactivate functions (will be assigned after definition)
window.deactivateTimezoneView = null;
window.deactivateHemisphereView = null;
window.deactivateLanguagesView = null;

/**
 * Toggle timezone visualization overlay
 */
function toggleTimezoneView() {
    // If hemisphere or languages view is active, deactivate them first
    if (isHemisphereViewActive) {
        deactivateHemisphereView();
    }
    if (isLanguagesViewActive) {
        deactivateLanguagesView();
    }
    
    const overlay = document.getElementById('timezoneOverlay');
    const globeViz = document.getElementById('globeViz');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('timezoneToggle');
    
    isTimezoneViewActive = !isTimezoneViewActive;
    window.isTimezoneViewActive = isTimezoneViewActive;
    
    // Deactivate all categories when timezone view is activated
    if (isTimezoneViewActive && getActiveCategory()) {
        stopAirplaneFlight();
        setActiveCategory(null);
        initializeEnabledCountries(countryData);
        populateCategoryList(countryData, myGlobe, updateVisualization);
        populateCountryList(countryData, myGlobe, updateVisualization);
    }
    
    // Update category list to clear any active state
    document.querySelectorAll('.category-item').forEach(item => {
        if (!item.classList.contains('viz-toggle')) {
            item.classList.remove('active');
            item.style.background = '';
            item.style.borderColor = '';
        }
    });
    
    if (isTimezoneViewActive) {
        // Mark timezone toggle as active
        toggleBtn.classList.add('active');
        toggleBtn.style.background = '#86F5AF';
        toggleBtn.style.borderColor = '#86F5AF';
        
        // Hide points and arcs
        myGlobe.pointsData([]);
        myGlobe.arcsData([]);
        
        // Save original camera position
        const pov = myGlobe.pointOfView();
        originalCameraPosition = pov;
        
        // Step 1: Center camera on USA (approximately center of USA)
        myGlobe.pointOfView({
            lat: 39.8,   // Center of USA latitude
            lng: -98.5,  // Center of USA longitude
            altitude: 2.0
        }, 1200);
        
        // Stop auto-rotation
        myGlobe.controls().autoRotate = false;
        
        // Step 2: After centering on USA, show overlay and initialize hub first
        const timeout1 = setTimeout(() => {
            overlay.style.display = 'flex';
            overlay.classList.add('fade-in');
            
            // Initialize radial chart (hub appears first, then rest)
            const timeout2 = setTimeout(() => {
                initRadialChart('radialChartOverlay');
            }, 100);
            pendingTimezoneTimeouts.push(timeout2);
        }, 1200);
        pendingTimezoneTimeouts.push(timeout1);
        
        // Step 3: Fade in dark overlay after hub appears
        const timeout3 = setTimeout(() => {
            globeDarkOverlay.classList.add('active');
        }, 1600);
        pendingTimezoneTimeouts.push(timeout3);
        
        // Button styling already handled above with classList.add('active')
        
    } else {
        // Deactivate timezone view
        deactivateTimezoneView();
    }
}

/**
 * Deactivate timezone view (helper function)
 */
function deactivateTimezoneView() {
    const overlay = document.getElementById('timezoneOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('timezoneToggle');
    
    // Cancel all pending timeouts
    pendingTimezoneTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingTimezoneTimeouts = [];
    
    isTimezoneViewActive = false;
    window.isTimezoneViewActive = false;
    
    // Immediately remove dark overlay (no animation when switching)
    globeDarkOverlay.classList.remove('active');
    
    // Immediately hide overlay and clear content
    overlay.style.display = 'none';
    overlay.classList.remove('fade-in', 'fade-out');
    
    // Clear the radial chart
    const container = document.getElementById('radialChartOverlay');
    if (container) {
        container.innerHTML = '';
    }
    
    // Restore camera position
    if (originalCameraPosition) {
        myGlobe.pointOfView(originalCameraPosition, 1000);
    }
    
    // Resume auto-rotation
    myGlobe.controls().autoRotate = true;
    
    // Restore points and arcs
    updateVisualization();
    
    // Update button style
    toggleBtn.classList.remove('active');
    toggleBtn.style.background = '';
    toggleBtn.style.borderColor = '';
}
// Expose to window for external access
window.deactivateTimezoneView = deactivateTimezoneView;

/**
 * Toggle hemisphere distribution overlay
 */
function toggleHemisphereView() {
    console.log('toggleHemisphereView called, current state:', isHemisphereViewActive);
    
    // If timezone or languages view is active, deactivate them first
    if (isTimezoneViewActive) {
        deactivateTimezoneView();
    }
    if (isLanguagesViewActive) {
        deactivateLanguagesView();
    }
    
    const overlay = document.getElementById('hemisphereOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('hemisphereToggle');
    
    if (!overlay || !globeDarkOverlay || !toggleBtn) {
        console.error('Missing DOM elements for hemisphere view');
        return;
    }
    
    // Toggle state
    isHemisphereViewActive = !isHemisphereViewActive;
    window.isHemisphereViewActive = isHemisphereViewActive;
    console.log('New hemisphere state:', isHemisphereViewActive);
    
    // Deactivate all categories when hemisphere view is activated
    if (isHemisphereViewActive && getActiveCategory()) {
        stopAirplaneFlight();
        setActiveCategory(null);
        initializeEnabledCountries(countryData);
        populateCategoryList(countryData, myGlobe, updateVisualization);
        populateCountryList(countryData, myGlobe, updateVisualization);
    }
    
    // Update category list to clear any active state
    document.querySelectorAll('.category-item').forEach(item => {
        if (!item.classList.contains('viz-toggle')) {
            item.classList.remove('active');
            item.style.background = '';
            item.style.borderColor = '';
        }
    });
    
    if (isHemisphereViewActive) {
        // Mark hemisphere toggle as active
        toggleBtn.classList.add('active');
        toggleBtn.style.background = '#86F5AF';
        toggleBtn.style.borderColor = '#86F5AF';
        
        // Hide points and arcs
        myGlobe.pointsData([]);
        myGlobe.arcsData([]);
        
        // Save original camera position
        const pov = myGlobe.pointOfView();
        originalCameraPosition = pov;
        
        // Step 1: Position camera to see equator perfectly horizontal
        // Latitude 0 shows the equator, altitude 2.8 for globe to match sphere size
        myGlobe.pointOfView({
            lat: 0,      // Equator
            lng: 0,      // Prime meridian
            altitude: 2.8
        }, 1200);
        
        // Stop auto-rotation
        myGlobe.controls().autoRotate = false;
        
        // Step 2: After positioning, show overlay
        const timeout1 = setTimeout(() => {
            overlay.style.display = 'flex';
            overlay.classList.add('fade-in');
            
            // Initialize sphere chart dynamically
            import('./visualizations/sphere-chart.js').then(module => {
                const timeout2 = setTimeout(() => {
                    module.initSphereChart('sphereChartOverlay');
                }, 100);
                pendingHemisphereTimeouts.push(timeout2);
            });
        }, 1200);
        pendingHemisphereTimeouts.push(timeout1);
        
        // Step 3: Fade in dark overlay
        const timeout3 = setTimeout(() => {
            globeDarkOverlay.classList.add('active');
        }, 1600);
        pendingHemisphereTimeouts.push(timeout3);
        
        // Button styling already handled above with classList.add('active')
        
    } else {
        // Deactivate hemisphere view
        deactivateHemisphereView();
    }
}

/**
 * Deactivate hemisphere view (helper function)
 */
function deactivateHemisphereView() {
    const overlay = document.getElementById('hemisphereOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('hemisphereToggle');
    
    console.log('Deactivating hemisphere view...');
    
    // Cancel all pending timeouts
    pendingHemisphereTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingHemisphereTimeouts = [];
    
    isHemisphereViewActive = false;
    window.isHemisphereViewActive = false;
    
    // Immediately remove dark overlay (no animation when switching)
    globeDarkOverlay.classList.remove('active');
    
    // Destroy Chart.js instance before removing container
    try {
        if (window.mySphereChartOverlay) {
            window.mySphereChartOverlay.destroy();
            window.mySphereChartOverlay = null;
            console.log('Hemisphere chart destroyed successfully');
        }
    } catch (e) {
        console.error('Error destroying hemisphere chart:', e);
        window.mySphereChartOverlay = null;
    }
    
    // Immediately hide overlay
    overlay.style.display = 'none';
    overlay.classList.remove('fade-in', 'fade-out');
    
    // Recreate canvas element to fully reset
    try {
        const wrapper = document.querySelector('.hemisphere-sphere-wrapper');
        if (wrapper) {
            const oldCanvas = document.getElementById('sphereChartOverlay');
            if (oldCanvas) {
                const newCanvas = document.createElement('canvas');
                newCanvas.id = 'sphereChartOverlay';
                oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
                console.log('Canvas recreated for next use');
            }
        }
    } catch (e) {
        console.error('Error recreating canvas:', e);
    }
    
    // Restore camera position
    if (originalCameraPosition) {
        myGlobe.pointOfView(originalCameraPosition, 1000);
    }
    
    // Resume auto-rotation
    myGlobe.controls().autoRotate = true;
    
    // Restore points and arcs
    updateVisualization();
    
    // Update button style
    toggleBtn.classList.remove('active');
    toggleBtn.style.background = '';
    toggleBtn.style.borderColor = '';
    
    console.log('Hemisphere view deactivated successfully');
}
// Expose to window for external access
window.deactivateHemisphereView = deactivateHemisphereView;

/**
 * Toggle languages sunburst visualization overlay
 */
function toggleLanguagesView() {
    console.log('toggleLanguagesView called, current state:', isLanguagesViewActive);
    
    // If timezone or hemisphere view is active, deactivate them first
    if (isTimezoneViewActive) {
        deactivateTimezoneView();
    }
    if (isHemisphereViewActive) {
        deactivateHemisphereView();
    }
    
    const overlay = document.getElementById('languagesOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('languagesToggle');
    
    if (!overlay || !globeDarkOverlay || !toggleBtn) {
        console.error('Missing DOM elements for languages view');
        return;
    }
    
    // Toggle state
    isLanguagesViewActive = !isLanguagesViewActive;
    window.isLanguagesViewActive = isLanguagesViewActive;
    console.log('New languages state:', isLanguagesViewActive);
    
    // Deactivate all categories when languages view is activated
    if (isLanguagesViewActive && getActiveCategory()) {
        stopAirplaneFlight();
        setActiveCategory(null);
        initializeEnabledCountries(countryData);
        populateCategoryList(countryData, myGlobe, updateVisualization);
        populateCountryList(countryData, myGlobe, updateVisualization);
    }
    
    // Update category list to clear any active state
    document.querySelectorAll('.category-item').forEach(item => {
        if (!item.classList.contains('viz-toggle')) {
            item.classList.remove('active');
            item.style.background = '';
            item.style.borderColor = '';
        }
    });
    
    if (isLanguagesViewActive) {
        // Mark languages toggle as active
        toggleBtn.classList.add('active');
        toggleBtn.style.background = '#86F5AF';
        toggleBtn.style.borderColor = '#86F5AF';
        
        // Hide points and arcs
        myGlobe.pointsData([]);
        myGlobe.arcsData([]);
        
        // Save original camera position
        const pov = myGlobe.pointOfView();
        originalCameraPosition = pov;
        
        // Step 1: Position camera centered
        myGlobe.pointOfView({
            lat: 20,
            lng: 0,
            altitude: 2.5
        }, 1200);
        
        // Stop auto-rotation
        myGlobe.controls().autoRotate = false;
        
        // Step 2: After positioning, show overlay
        const timeout1 = setTimeout(() => {
            overlay.style.display = 'flex';
            overlay.classList.add('fade-in');
            
            // Initialize sunburst chart dynamically
            import('./visualizations/sunburst-chart.js').then(module => {
                const timeout2 = setTimeout(() => {
                    module.initSunburstChart('languagesChartOverlay');
                }, 100);
                pendingLanguagesTimeouts.push(timeout2);
            });
        }, 1200);
        pendingLanguagesTimeouts.push(timeout1);
        
        // Step 3: Fade in dark overlay
        const timeout3 = setTimeout(() => {
            globeDarkOverlay.classList.add('active');
        }, 1600);
        pendingLanguagesTimeouts.push(timeout3);
        
    } else {
        // Deactivate languages view
        deactivateLanguagesView();
    }
}

/**
 * Deactivate languages view (helper function)
 */
function deactivateLanguagesView() {
    const overlay = document.getElementById('languagesOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('languagesToggle');
    
    console.log('Deactivating languages view...');
    
    // Cancel all pending timeouts
    pendingLanguagesTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingLanguagesTimeouts = [];
    
    isLanguagesViewActive = false;
    window.isLanguagesViewActive = false;
    
    // Immediately remove dark overlay
    globeDarkOverlay.classList.remove('active');
    
    // Clear the sunburst chart
    const container = document.getElementById('languagesChartOverlay');
    if (container) {
        container.innerHTML = '';
    }
    
    // Immediately hide overlay
    overlay.style.display = 'none';
    overlay.classList.remove('fade-in', 'fade-out');
    
    // Restore camera position
    if (originalCameraPosition) {
        myGlobe.pointOfView(originalCameraPosition, 1000);
    }
    
    // Resume auto-rotation
    myGlobe.controls().autoRotate = true;
    
    // Restore points and arcs
    updateVisualization();
    
    // Update button style
    toggleBtn.classList.remove('active');
    toggleBtn.style.background = '';
    toggleBtn.style.borderColor = '';
    
    console.log('Languages view deactivated successfully');
}
// Expose to window for external access
window.deactivateLanguagesView = deactivateLanguagesView;

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
    }, 300); // OPTIMIZADO: reducido de 600ms (transiciones ahora son 800ms)
    
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
    
    // Setup timezone toggle button
    const timezoneToggle = document.getElementById('timezoneToggle');
    if (timezoneToggle) {
        timezoneToggle.addEventListener('click', toggleTimezoneView);
    }
    
    // Setup hemisphere toggle button
    const hemisphereToggle = document.getElementById('hemisphereToggle');
    if (hemisphereToggle) {
        hemisphereToggle.addEventListener('click', toggleHemisphereView);
    }
    
    // Setup languages toggle button
    const languagesToggle = document.getElementById('languagesToggle');
    if (languagesToggle) {
        languagesToggle.addEventListener('click', toggleLanguagesView);
    }
    
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
