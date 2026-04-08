/**
 * Main Application Entry Point
 * Coordinates all modules and initializes the application
 */
import Globe from 'https://cdn.jsdelivr.net/npm/globe.gl/+esm';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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

// Make THREE and Globe available globally
window.THREE = THREE;
window.Globe = Globe;

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
    // If already active, deactivate and return
    if (isTimezoneViewActive) {
        deactivateTimezoneView();
        return;
    }
    
    // If hemisphere or languages view is active, deactivate them first
    // Don't keep dark overlay - let it fade out and fade in again for visual feedback
    if (isHemisphereViewActive) {
        deactivateHemisphereView(false); // Remove dark overlay
    }
    if (isLanguagesViewActive) {
        deactivateLanguagesView(false); // Remove dark overlay
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
 * @param {boolean} keepDarkOverlay - If true, don't remove the dark overlay (for transitioning between views)
 */
function deactivateTimezoneView(keepDarkOverlay = false) {
    const overlay = document.getElementById('timezoneOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('timezoneToggle');
    
    // Cancel all pending timeouts
    pendingTimezoneTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingTimezoneTimeouts = [];
    
    isTimezoneViewActive = false;
    window.isTimezoneViewActive = false;
    
    // Only remove dark overlay if not transitioning to another view
    if (!keepDarkOverlay) {
        globeDarkOverlay.classList.remove('active');
    }
    
    // Immediately hide overlay and clear content
    overlay.style.display = 'none';
    overlay.classList.remove('fade-in', 'fade-out');
    
    // Clear the radial chart
    const container = document.getElementById('radialChartOverlay');
    if (container) {
        container.innerHTML = '';
    }
    
    // Only restore globe state if NOT transitioning to another overlay view
    if (!keepDarkOverlay) {
        // Restore camera position
        if (originalCameraPosition) {
            myGlobe.pointOfView(originalCameraPosition, 1000);
        }
        
        // Resume auto-rotation
        myGlobe.controls().autoRotate = true;
        
        // Restore points and arcs
        updateVisualization();
    }
    
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
    
    // If already active, deactivate and return
    if (isHemisphereViewActive) {
        deactivateHemisphereView();
        return;
    }
    
    // If timezone or languages view is active, deactivate them first
    // Don't keep dark overlay - let it fade out and fade in again for visual feedback
    if (isTimezoneViewActive) {
        deactivateTimezoneView(false); // Remove dark overlay
    }
    if (isLanguagesViewActive) {
        deactivateLanguagesView(false); // Remove dark overlay
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
 * @param {boolean} keepDarkOverlay - If true, don't remove the dark overlay (for transitioning between views)
 */
function deactivateHemisphereView(keepDarkOverlay = false) {
    const overlay = document.getElementById('hemisphereOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('hemisphereToggle');
    
    console.log('Deactivating hemisphere view...', { keepDarkOverlay });
    
    // Cancel all pending timeouts
    pendingHemisphereTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingHemisphereTimeouts = [];
    
    isHemisphereViewActive = false;
    window.isHemisphereViewActive = false;
    
    // Only remove dark overlay if not transitioning to another view
    if (!keepDarkOverlay) {
        globeDarkOverlay.classList.remove('active');
    }
    
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
    
    // Only restore globe state if NOT transitioning to another overlay view
    if (!keepDarkOverlay) {
        // Restore camera position
        if (originalCameraPosition) {
            myGlobe.pointOfView(originalCameraPosition, 1000);
        }
        
        // Resume auto-rotation
        myGlobe.controls().autoRotate = true;
        
        // Restore points and arcs
        updateVisualization();
    }
    
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
    
    // If already active, deactivate and return
    if (isLanguagesViewActive) {
        deactivateLanguagesView();
        return;
    }
    
    // If timezone or hemisphere view is active, deactivate them first
    // Don't keep dark overlay - let it fade out and fade in again for visual feedback
    if (isTimezoneViewActive) {
        deactivateTimezoneView(false); // Remove dark overlay
    }
    if (isHemisphereViewActive) {
        deactivateHemisphereView(false); // Remove dark overlay
    }
    
    const overlay = document.getElementById('languagesOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('languagesToggle');
    
    if (!overlay || !globeDarkOverlay || !toggleBtn) {
        console.error('Missing DOM elements for languages view');
        return;
    }
    
    // Activate state
    isLanguagesViewActive = true;
    window.isLanguagesViewActive = true;
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
 * @param {boolean} keepDarkOverlay - If true, don't remove the dark overlay (for transitioning between views)
 */
function deactivateLanguagesView(keepDarkOverlay = false) {
    const overlay = document.getElementById('languagesOverlay');
    const globeDarkOverlay = document.getElementById('globeDarkOverlay');
    const toggleBtn = document.getElementById('languagesToggle');
    
    console.log('Deactivating languages view...', { keepDarkOverlay });
    
    // Cancel all pending timeouts
    pendingLanguagesTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingLanguagesTimeouts = [];
    
    isLanguagesViewActive = false;
    window.isLanguagesViewActive = false;
    
    // If keeping dark overlay (transitioning to another view), skip collapse animation and hide immediately
    if (keepDarkOverlay) {
        // Just hide the overlay immediately without animation
        overlay.style.display = 'none';
        overlay.classList.remove('fade-in', 'fade-out');
        
        // Clear the sunburst chart
        const container = document.getElementById('languagesChartOverlay');
        if (container) {
            container.innerHTML = '';
        }
        
        // Update button style
        toggleBtn.classList.remove('active');
        toggleBtn.style.background = '';
        toggleBtn.style.borderColor = '';
        
        console.log('Languages view deactivated (quick transition)');
        return;
    }
    
    // Full collapse animation when not transitioning to another view
    // Animate out the sunburst arcs - collapse toward center (reverse of entry)
    const container = document.getElementById('languagesChartOverlay');
    if (container) {
        const svg = container.querySelector('svg');
        if (svg) {
            const arcs = svg.querySelectorAll('.sunburst-arc');
            const labels = svg.querySelectorAll('.arc-label');
            const centerText = svg.querySelector('.center-text');
            
            // Fade out labels first
            labels.forEach((label, i) => {
                label.style.transition = 'opacity 0.2s ease-out';
                label.style.opacity = '0';
            });
            
            // Collapse arcs from outer to inner using D3 transitions
            // Depth 3 (countries) first, then depth 2 (languages), then depth 1 (English)
            arcs.forEach((arc) => {
                const depth = arc.getAttribute('data-depth') || arc.__data__?.depth || 1;
                const depthNum = parseInt(depth);
                
                // Outer rings collapse first (depth 3 -> 2 -> 1)
                const baseDelay = (3 - depthNum) * 150;
                // Add small variation based on arc position
                const arcData = arc.__data__;
                const positionOffset = arcData ? (arcData.x0 / (2 * Math.PI)) * 100 : 0;
                const delay = baseDelay + positionOffset;
                
                setTimeout(() => {
                    // Use D3 to animate the arc collapsing
                    if (arcData) {
                        const innerR = depthNum === 1 ? 80 : 
                                       depthNum === 2 ? 80 + 45 : 
                                       80 + 45 + 70;
                        
                        d3.select(arc)
                            .transition()
                            .duration(400)
                            .ease(d3.easeCubicIn)
                            .attrTween("d", function() {
                                const currentOuterR = depthNum === 1 ? 80 + 45 : 
                                                      depthNum === 2 ? 80 + 45 + 70 : 
                                                      80 + 45 + 70 + 60;
                                const interpolateRadius = d3.interpolate(currentOuterR, innerR);
                                return function(t) {
                                    return d3.arc()
                                        .startAngle(arcData.x0)
                                        .endAngle(arcData.x1)
                                        .innerRadius(innerR)
                                        .outerRadius(interpolateRadius(t))
                                        .padAngle(0.001)
                                        .cornerRadius(1)(arcData);
                                };
                            })
                            .style("opacity", 0);
                    } else {
                        // Fallback for arcs without data
                        arc.style.transition = 'opacity 0.3s ease-out';
                        arc.style.opacity = '0';
                    }
                }, delay);
            });
            
            // Finally fade out center
            if (centerText) {
                setTimeout(() => {
                    centerText.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                    centerText.style.opacity = '0';
                    centerText.style.transform = 'scale(0.9)';
                }, 500);
            }
        }
    }
    
    // Start fading dark overlay after arcs start collapsing
    setTimeout(() => {
        globeDarkOverlay.classList.remove('active');
    }, 300);
    
    // Add fade-out class for overlay animation
    overlay.classList.remove('fade-in');
    overlay.classList.add('fade-out');
    
    // Wait for animations to complete before hiding
    setTimeout(() => {
        // Clear the sunburst chart
        if (container) {
            container.innerHTML = '';
        }
        
        // Hide overlay
        overlay.style.display = 'none';
        overlay.classList.remove('fade-out');
    }, 900);
    
    // Restore camera position
    if (originalCameraPosition) {
        myGlobe.pointOfView(originalCameraPosition, 1000);
    }
    
    // Resume auto-rotation
    myGlobe.controls().autoRotate = true;
    
    // Restore points and arcs after animation
    setTimeout(() => {
        updateVisualization();
    }, 500);
    
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
 * Configure renderer and lighting for emissive GLB materials
 */
function configureGlobeRendering(globe) {
    if (!globe) return;

    const renderer = globe.renderer();
    const scene = globe.scene();
    if (!renderer || !scene) return;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.physicallyCorrectLights = true;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.1).texture;
    scene.environment = env;
    pmrem.dispose();

    if (!scene.getObjectByName('astronautHemiLight')) {
        const hemi = new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.35);
        hemi.name = 'astronautHemiLight';
        scene.add(hemi);
    }

    if (!scene.getObjectByName('astronautAmbientLight')) {
        const ambient = new THREE.AmbientLight(0xffffff, 0.25);
        ambient.name = 'astronautAmbientLight';
        scene.add(ambient);
    }

    if (!scene.getObjectByName('astronautKeyLight')) {
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        keyLight.position.set(3, 5, 6);
        keyLight.name = 'astronautKeyLight';
        scene.add(keyLight);
    }

    if (!scene.getObjectByName('astronautFillLight')) {
        const fillLight = new THREE.PointLight(0x7ecbff, 0.6, 15, 2);
        fillLight.position.set(-2, 1, 3);
        fillLight.name = 'astronautFillLight';
        scene.add(fillLight);
    }

    const globeMaterial = typeof globe.globeMaterial === 'function' ? globe.globeMaterial() : null;
    if (globeMaterial) {
        globeMaterial.emissive = new THREE.Color(0x111111);
        globeMaterial.emissiveIntensity = 0.6;
        globeMaterial.needsUpdate = true;
    }
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
    configureGlobeRendering(myGlobe);
    
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
