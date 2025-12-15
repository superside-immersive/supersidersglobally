/**
 * Tooltip Module
 * Manages custom tooltip display and positioning
 */

import { getCountryFlag } from '../data/country-flags.js';

let currentMouseX = 0;
let currentMouseY = 0;
let tooltipTimeout = null;

/**
 * Show tooltip immediately
 */
export function showTooltipImmediate() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
}

/**
 * Hide tooltip with delay
 */
export function hideTooltipDelayed() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    tooltipTimeout = setTimeout(() => {
        const tooltip = document.getElementById('customTooltip');
        tooltip.classList.remove('show');
        tooltip.style.display = 'none';
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        console.log('Tooltip hidden after delay');
    }, 1000);
}

/**
 * Show tooltip for a country point
 */
export function showTooltip(point) {
    const tooltip = document.getElementById('customTooltip');
    console.log('SHOWING tooltip for:', point.name);
    
    showTooltipImmediate();
    
    // Force show tooltip with all necessary styles
    tooltip.style.display = 'block';
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '99999';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.background = 'rgba(26, 48, 47, 0.98)';
    tooltip.style.border = '2px solid #86F5AF';
    tooltip.style.borderRadius = '8px';
    tooltip.style.padding = '12px 16px';
    tooltip.style.color = 'white';
    
    // Update tooltip content
    const nameEl = document.getElementById('tooltipName');
    const countEl = document.getElementById('tooltipCount');
    const coordsEl = document.getElementById('tooltipCoords');
    
    // Get flag emoji for this country
    const flag = getCountryFlag(point.name);
    
    if (nameEl) {
        // Country name on first line
        nameEl.innerHTML = point.name.toUpperCase();
        // Add flag below in a new line with larger size
        if (flag) {
            nameEl.innerHTML += `<br><span style="font-size: 32px; line-height: 1.2;">${flag}</span>`;
        }
    }
    if (countEl) countEl.textContent = `${point.count} SUPERSIDERS`;
    if (coordsEl) coordsEl.textContent = `Lat: ${point.coordinates.lat.toFixed(2)}°, Lng: ${point.coordinates.lng.toFixed(2)}°`;
    
    // Position tooltip
    positionTooltip(tooltip);
    
    tooltip.classList.add('show');
}

/**
 * Position tooltip following mouse
 */
function positionTooltip(tooltip) {
    const offsetX = 25;
    const offsetY = -40;
    let x = currentMouseX + offsetX;
    let y = currentMouseY + offsetY;
    
    // Keep within bounds
    if (x + 300 > window.innerWidth) x = currentMouseX - 300 - offsetX;
    if (y < 0) y = currentMouseY + offsetX;
    
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.style.transform = 'none';
}

/**
 * Update mouse position
 */
export function updateMousePosition(e) {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
    
    const tooltip = document.getElementById('customTooltip');
    if (tooltip && tooltip.classList.contains('show')) {
        positionTooltip(tooltip);
    }
}

/**
 * Initialize tooltip event listeners
 */
export function initializeTooltip() {
    document.addEventListener('mousemove', updateMousePosition);
}
