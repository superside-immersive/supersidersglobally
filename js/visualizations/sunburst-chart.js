/**
 * Sunburst Chart - Languages Visualization
 * Inspired by Kerry Rodden's Sequences Sunburst
 * Shows hierarchical language distribution with English at center
 */

import { countryData } from '../data/countries.js';
import { buildLanguageHierarchy, getLanguageColor, languageColors } from '../data/languages.js';

let currentRoot = null;
let currentSvg = null;
let currentArc = null;
let currentRadius = 0;

/**
 * Initialize the sunburst chart
 * @param {string} containerId - ID of the container DOM element
 */
export function initSunburstChart(containerId = 'languagesChartOverlay') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} not found`);
        return;
    }

    // Clear previous content
    container.innerHTML = '';

    // Configuration
    const width = 800;
    const height = 800;
    currentRadius = Math.min(width, height) / 2 - 10;
    
    // Ring configuration - wider rings for better text fit
    const centerRadius = 80;
    const englishRingWidth = 50;
    const languageRingWidth = 90;
    const countryRingWidth = 65;

    // Build hierarchical data
    const hierarchyData = buildLanguageHierarchy(countryData);
    
    // Create root hierarchy with custom value calculation
    // Use square root to give smaller languages more visual space
    currentRoot = d3.hierarchy(hierarchyData)
        .sum(d => d.children ? 0 : Math.sqrt(d.value) * 10)
        .sort((a, b) => b.value - a.value);

    // Create partition layout
    const partition = d3.partition()
        .size([2 * Math.PI, currentRadius])
        .padding(0.005); // Small padding between segments

    partition(currentRoot);

    // Create SVG
    currentSvg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%")
        .style("max-width", `${width}px`)
        .style("max-height", `${height}px`);

    const g = currentSvg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Custom arc generator with fixed ring widths
    // Depth 0: LANGUAGES (center)
    // Depth 1: English (first ring)
    // Depth 2: Other languages (second ring)
    // Depth 3: Countries (third ring)
    currentArc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => {
            if (d.depth === 0) return 0;
            if (d.depth === 1) return centerRadius;
            if (d.depth === 2) return centerRadius + englishRingWidth;
            return centerRadius + englishRingWidth + languageRingWidth;
        })
        .outerRadius(d => {
            if (d.depth === 0) return centerRadius;
            if (d.depth === 1) return centerRadius + englishRingWidth;
            if (d.depth === 2) return centerRadius + englishRingWidth + languageRingWidth;
            return centerRadius + englishRingWidth + languageRingWidth + countryRingWidth;
        })
        .padAngle(0.001)
        .cornerRadius(1);

    // Center text group
    const centerGroup = g.append("g")
        .attr("class", "center-text")
        .style("pointer-events", "none");

    // Center circle background
    centerGroup.append("circle")
        .attr("r", centerRadius - 2)
        .attr("fill", "rgba(0, 0, 0, 0.95)")
        .attr("stroke", "#86F5AF")
        .attr("stroke-width", 2);

    // Center text - "LANGUAGES" label
    centerGroup.append("text")
        .attr("class", "center-language")
        .attr("text-anchor", "middle")
        .attr("dy", "-1.2em")
        .style("font-size", "14px")
        .style("font-weight", "800")
        .style("fill", "#86F5AF")
        .style("letter-spacing", "2px")
        .text("LANGUAGES");

    // Center text - count
    const totalSupersiders = countryData.reduce((sum, c) => sum + c.count, 0);
    centerGroup.append("text")
        .attr("class", "center-count")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .style("font-size", "28px")
        .style("font-weight", "900")
        .style("fill", "#DAFF87")
        .text(totalSupersiders);

    // Center text - label
    centerGroup.append("text")
        .attr("class", "center-label")
        .attr("text-anchor", "middle")
        .attr("dy", "2.4em")
        .style("font-size", "9px")
        .style("font-weight", "600")
        .style("fill", "rgba(134, 245, 175, 0.7)")
        .style("text-transform", "uppercase")
        .style("letter-spacing", "1px")
        .text("SUPERSIDERS");

    // Filter to only show descendants (not the root English node)
    const descendants = currentRoot.descendants().filter(d => d.depth > 0);

    // Fix English ring to be full circle (depth 1)
    descendants.forEach(d => {
        if (d.depth === 1) {
            // English ring should span full circle
            d.x0 = 0;
            d.x1 = 2 * Math.PI;
        }
    });

    // Ensure minimum arc size for visibility - important for single-person languages
    const minArcAngle = 0.04; // Minimum angle in radians (~2.3 degrees)

    descendants.forEach(d => {
        if (d.depth > 1) { // Skip English ring
            const arcAngle = d.x1 - d.x0;
            if (arcAngle < minArcAngle) {
                // Expand small arcs
                const expansion = (minArcAngle - arcAngle) / 2;
                d.x0 = Math.max(0, d.x0 - expansion);
                d.x1 = Math.min(2 * Math.PI, d.x1 + expansion);
            }
        }
    });

    // Create arc generator that can be scaled for animation
    // We'll create a custom arc for collapsed state (inner radius = outer radius)
    function createCollapsedArc(d) {
        const innerR = currentArc.innerRadius()(d);
        return d3.arc()
            .startAngle(d.x0)
            .endAngle(d.x1)
            .innerRadius(innerR)
            .outerRadius(innerR) // Collapsed: outer = inner
            .padAngle(0.001)
            .cornerRadius(1)(d);
    }

    // Create paths with animation - start collapsed (zero width)
    const paths = g.selectAll("path.sunburst-arc")
        .data(descendants)
        .enter()
        .append("path")
        .attr("class", d => `sunburst-arc depth-${d.depth}`)
        .attr("data-depth", d => d.depth)
        .attr("d", d => createCollapsedArc(d)) // Start collapsed
        .style("fill", d => getArcColor(d))
        .style("stroke", "#000")
        .style("stroke-width", "0.5px")
        .style("cursor", "pointer")
        .style("opacity", 0);

    // Animate arcs expanding from center with staggered timing per section
    paths.transition()
        .delay((d, i) => {
            // Base delay by depth (ring level)
            const depthDelay = d.depth * 250;
            // Add small random offset for each section in same ring (0-100ms)
            const sectionOffset = (d.x0 / (2 * Math.PI)) * 150;
            return 150 + depthDelay + sectionOffset;
        })
        .duration(500)
        .ease(d3.easeCubicOut)
        .attrTween("d", function(d) {
            const innerR = currentArc.innerRadius()(d);
            const outerR = currentArc.outerRadius()(d);
            const interpolateRadius = d3.interpolate(innerR, outerR);
            return function(t) {
                return d3.arc()
                    .startAngle(d.x0)
                    .endAngle(d.x1)
                    .innerRadius(innerR)
                    .outerRadius(interpolateRadius(t))
                    .padAngle(0.001)
                    .cornerRadius(1)(d);
            };
        })
        .style("opacity", 1);

    // Hover interactions with debounce to prevent jumping between arcs
    let hoverTimeout = null;
    paths.on("mouseenter", function(event, d) {
            // Clear any pending timeout
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
            }
            
            // Highlight the hovered arc and its ancestors
            const ancestors = d.ancestors().reverse();
            
            paths.style("opacity", node => {
                return ancestors.includes(node) || node.ancestors().includes(d) ? 1 : 0.3;
            });

            // Update center text
            updateCenterText(centerGroup, d);
        })
        .on("mouseleave", function() {
            // Add small delay before resetting to prevent jumping
            hoverTimeout = setTimeout(() => {
                // Reset all arcs
                paths.style("opacity", 1);

                // Reset center text
                resetCenterText(centerGroup, totalSupersiders);
            }, 50);
        });

    // Add labels for English ring (depth 1) and major languages (depth 2)
    // Don't show labels for English-native countries (hideLabel: true)
    const labels = g.selectAll("text.arc-label")
        .data(descendants.filter(d => {
            if (d.depth === 1) return true; // Always show English
            if (d.depth === 2) {
                // Skip if it's an English-native country (has hideLabel flag)
                if (d.data.hideLabel) return false;
                // Only show larger language arcs
                return (d.x1 - d.x0) > 0.15;
            }
            return false;
        }))
        .enter()
        .append("text")
        .attr("class", "arc-label")
        .attr("transform", d => {
            // For English ring (depth 1), position on the left side (at 270 degrees / 3π/2)
            if (d.depth === 1) {
                const angle = Math.PI * 1.5; // 270 degrees = left side
                const radius = centerRadius + englishRingWidth / 2;
                const x = radius * Math.sin(angle);
                const y = -radius * Math.cos(angle);
                return `translate(${x},${y}) rotate(0)`;
            }
            // Other languages - keep original positioning
            const angle = (d.x0 + d.x1) / 2;
            const radius = centerRadius + englishRingWidth + languageRingWidth / 2;
            const x = radius * Math.sin(angle);
            const y = -radius * Math.cos(angle);
            const rotation = (angle * 180 / Math.PI) - 90;
            // Flip text on left side
            const flip = angle > Math.PI ? 180 : 0;
            return `translate(${x},${y}) rotate(${rotation + flip})`;
        })
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", d => d.depth === 1 ? "11px" : "12px")
        .style("font-weight", "800")
        .style("fill", "#FFF")
        .style("text-shadow", "none")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .text(d => d.data.name);

    // Animate labels
    labels.transition()
        .delay((d, i) => 1000 + i * 50)
        .duration(400)
        .style("opacity", 1);
}

/**
 * Get color for an arc based on depth and data
 */
function getArcColor(d) {
    // Depth 0: LANGUAGES center (not rendered)
    if (d.depth === 0) {
        return "transparent";
    }
    
    // Depth 1: English ring - Superside green
    if (d.depth === 1) {
        return "#86F5AF";
    }
    
    // Depth 2: Could be other languages OR English-native countries
    if (d.depth === 2) {
        // Check if this is an English-native country (no children = it's a country)
        if (d.data.isEnglishNative || !d.children || d.children.length === 0) {
            // English-native country - darker green
            const englishColor = d3.color("#86F5AF");
            return englishColor.darker(0.8).toString();
        }
        // Other language - use language color
        return getLanguageColor(d.data.name);
    }
    
    // Depth 3: Countries - use parent language color much darker for better contrast
    if (d.depth === 3) {
        const parentColor = d3.color(getLanguageColor(d.parent.data.name));
        return parentColor.darker(1.2).toString();
    }
    
    return "#86F5AF";
}

/**
 * Update center text on hover
 */
function updateCenterText(centerGroup, d) {
    // Import flag function
    import('../data/country-flags.js').then(module => {
        const getCountryFlag = module.getCountryFlag;
        
        // Get actual people count from original data
        let actualCount;
        let label1, label2, flag;
        let labelColor;
        
        if (d.depth === 1) {
            // English ring
            label1 = "ENGLISH";
            actualCount = d.data.totalPeople || 837;
            label2 = "EVERYONE";
            labelColor = "#86F5AF"; // Superside green for English
            flag = null;
        } else if (d.depth === 2) {
            // Check if this is an English-native country or another language
            if (d.data.isEnglishNative || !d.children || d.children.length === 0) {
                // English-native country
                label1 = "ENGLISH";
                actualCount = d.data.value;
                label2 = d.data.name;
                labelColor = "#86F5AF";
                flag = getCountryFlag(d.data.name);
            } else {
                // Other language
                label1 = d.data.name.toUpperCase();
                actualCount = d.data.totalPeople || d.data.value;
                label2 = "SPEAKERS";
                labelColor = getLanguageColor(d.data.name);
                flag = null;
            }
        } else if (d.depth === 3) {
            // Countries of other languages
            label1 = d.parent.data.name.toUpperCase();
            actualCount = d.data.value;
            label2 = d.data.name;
            labelColor = getLanguageColor(d.parent.data.name);
            flag = getCountryFlag(d.data.name);
        }

        centerGroup.select(".center-language")
            .text(label1)
            .style("fill", labelColor);

        centerGroup.select(".center-count")
            .text(actualCount);

        // Update label with country name and flag below it
        const labelEl = centerGroup.select(".center-label");
        if (flag) {
            // Country name
            labelEl.text(label2);
            
            // Remove any existing flag
            centerGroup.selectAll(".center-flag").remove();
            
            // Add flag emoji below
            centerGroup.append("text")
                .attr("class", "center-flag")
                .attr("text-anchor", "middle")
                .attr("dy", "4em")
                .style("font-size", "32px")
                .style("pointer-events", "none")
                .text(flag);
        } else {
            labelEl.text(label2);
            // Remove flag if it exists
            centerGroup.selectAll(".center-flag").remove();
        }
    });
}

/**
 * Reset center text
 */
function resetCenterText(centerGroup, totalSupersiders) {
    centerGroup.select(".center-language")
        .text("LANGUAGES")
        .style("fill", "#86F5AF");

    centerGroup.select(".center-count")
        .text(totalSupersiders);

    centerGroup.select(".center-label")
        .text("SUPERSIDERS");
    
    // Remove any flag
    centerGroup.selectAll(".center-flag").remove();
}

/**
 * Destroy the sunburst chart
 */
export function destroySunburstChart(containerId = 'languagesChartOverlay') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
    currentRoot = null;
    currentSvg = null;
    currentArc = null;
}
