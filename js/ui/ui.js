/**
 * UI Module
 * Manages UI panels, country selection, and category filtering
 */
import { categories } from '../data/categories.js';
import { generateConnections } from '../globe/connections.js';
import { animateCategorySelection, stopAirplaneFlight } from '../animations/animations.js';
import { clearOrbiters, addOrbitingAstronaut } from '../astronauts/astronauts.js';

// Track which countries are enabled
export let enabledCountries = null;
export let activeCategory = null;

/**
 * Initialize enabled countries
 */
export function initializeEnabledCountries(countryData) {
    enabledCountries = new Set(countryData.map(country => country.name));
}

/**
 * Set active category
 */
export function setActiveCategory(category) {
    activeCategory = category;
}

/**
 * Get active category
 */
export function getActiveCategory() {
    return activeCategory;
}

/**
 * Toggle country panel collapse/expand
 */
export function toggleCountryPanel() {
    const panel = document.getElementById('countryPanel');
    const arrow = document.getElementById('collapseArrow');
    
    panel.classList.toggle('collapsed');
    
    if (panel.classList.contains('collapsed')) {
        arrow.style.transform = 'rotate(-90deg)';
    } else {
        arrow.style.transform = 'rotate(0deg)';
    }
}

/**
 * Initialize UI
 */
export function initializeUI() {
    const arrow = document.getElementById('collapseArrow');
    arrow.style.transform = 'rotate(-90deg)';
}

/**
 * Show country info overlay
 */
export function showCountryInfo(country) {
    const overlay = document.getElementById('countryInfoOverlay');
    const title = document.getElementById('countryInfoTitle');
    const count = document.getElementById('countryInfoCount');
    
    title.textContent = country.name.toUpperCase();
    count.textContent = country.count.toString();
    
    overlay.classList.add('show');
    
    setTimeout(() => {
        hideCountryInfo();
    }, 2000);
}

/**
 * Hide country info overlay
 */
export function hideCountryInfo() {
    const overlay = document.getElementById('countryInfoOverlay');
    overlay.classList.remove('show');
}

/**
 * Populate category list
 */
export function populateCategoryList(countryData, globe, updateVisualizationFn) {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    
    Object.entries(categories).forEach(([categoryId, categoryData]) => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        
        if (activeCategory === categoryId) {
            categoryItem.classList.add('active');
            // Apply the category color to the active item
            categoryItem.style.background = categoryData.color;
            categoryItem.style.borderColor = categoryData.color;
        }
        
        categoryItem.addEventListener('click', (e) => {
            document.querySelectorAll('.category-item').forEach(item => {
                item.classList.remove('active');
                item.style.background = '';
                item.style.borderColor = '';
            });
            
            if (activeCategory === categoryId) {
                // Deselecting the active category - stop airplane flight
                stopAirplaneFlight();
                activeCategory = null;
                
                // Re-enable ALL countries when deselecting
                enabledCountries = new Set(countryData.map(country => country.name));
                
                // Re-enable auto rotation
                globe.controls().autoRotate = true;
            } else {
                activeCategory = categoryId;
                categoryItem.classList.add('active');
                
                // Apply the category color to the selected item
                const categoryColor = categoryData.color;
                categoryItem.style.background = categoryColor;
                categoryItem.style.borderColor = categoryColor;
                
                const validCountries = categoryData.countries.filter(countryName => 
                    countryData.some(country => country.name === countryName)
                );
                enabledCountries = new Set(validCountries);
                
                // This will automatically stop any existing airplane flight
                animateCategorySelection(categoryId, validCountries, globe, countryData);
            }
            
            populateCategoryList(countryData, globe, updateVisualizationFn);
            populateCountryList(countryData, globe, updateVisualizationFn);
            updateVisualizationFn();
        });
        
        const questionSpan = document.createElement('span');
        questionSpan.className = 'category-question';
        questionSpan.textContent = categoryData.question;
        
        const countSpan = document.createElement('span');
        countSpan.className = 'category-count';
        const validCountries = categoryData.countries.filter(countryName => 
            countryData.some(country => country.name === countryName)
        );
        countSpan.textContent = validCountries.length;
        
        categoryItem.appendChild(questionSpan);
        categoryItem.appendChild(countSpan);
        
        categoryList.appendChild(categoryItem);
    });
}

/**
 * Populate country list
 */
export function populateCountryList(countryData, globe, updateVisualizationFn) {
    const countryList = document.getElementById('countryList');
    countryList.innerHTML = '';
    
    const sortedCountries = [...countryData].sort((a, b) => b.count - a.count);
    
    sortedCountries.forEach(country => {
        const countryItem = document.createElement('div');
        countryItem.className = 'country-item';
        
        if (enabledCountries.has(country.name)) {
            countryItem.classList.add('selected');
        }
        
        countryItem.addEventListener('click', (e) => {
            // Stop airplane flight if active
            stopAirplaneFlight();
            
            if (activeCategory) {
                activeCategory = null;
                populateCategoryList(countryData, globe, updateVisualizationFn);
            }
            
            if (enabledCountries.has(country.name)) {
                enabledCountries.delete(country.name);
                countryItem.classList.remove('selected');
            } else {
                enabledCountries.add(country.name);
                countryItem.classList.add('selected');
                
                showCountryInfo(country);
                
                globe.pointOfView({
                    lat: country.coordinates.lat,
                    lng: country.coordinates.lng,
                    altitude: 1.2
                }, 2000);
            }
            
            // Re-enable auto rotation
            globe.controls().autoRotate = true;
            
            updateVisualizationFn();
        });
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'country-name';
        nameSpan.textContent = country.name;
        
        const countSpan = document.createElement('span');
        countSpan.className = 'country-count';
        countSpan.textContent = `(${country.count})`;
        
        countryItem.appendChild(nameSpan);
        countryItem.appendChild(countSpan);
        
        countryList.appendChild(countryItem);
    });
}

/**
 * Select all countries
 */
export function selectAllCountries(countryData, globe, updateVisualizationFn) {
    // Stop airplane flight if active
    stopAirplaneFlight();
    
    activeCategory = null;
    enabledCountries = new Set(countryData.map(country => country.name));
    populateCategoryList(countryData, globe, updateVisualizationFn);
    populateCountryList(countryData, globe, updateVisualizationFn);
    
    // Re-enable auto rotation
    globe.controls().autoRotate = true;
    
    updateVisualizationFn();
}

/**
 * Deselect all countries
 */
export function deselectAllCountries(countryData, globe, updateVisualizationFn) {
    // Stop airplane flight if active
    stopAirplaneFlight();
    
    activeCategory = null;
    enabledCountries = new Set();
    populateCategoryList(countryData, globe, updateVisualizationFn);
    populateCountryList(countryData, globe, updateVisualizationFn);
    
    // Re-enable auto rotation
    globe.controls().autoRotate = true;
    
    updateVisualizationFn();
}

/**
 * Update info panel
 */
export function updateInfoPanel(countryData) {
    const enabledCountryData = countryData.filter(country => enabledCountries.has(country.name));
    document.getElementById('country-count').textContent = enabledCountryData.length;
    document.getElementById('total-count').textContent = 
        enabledCountryData.reduce((sum, country) => sum + country.count, 0);
}
