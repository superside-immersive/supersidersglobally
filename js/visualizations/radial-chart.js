/**
 * Gráfico Radial - Cronómetro Ponderado 24h
 * Visualización D3.js del flujo de trabajo global
 */

import { radialData, regionColors, radialConfig, markers } from '../data/viz2-data.js';

/**
 * Inicializa el gráfico radial en el contenedor especificado
 * @param {string} containerId - ID del contenedor DOM
 */
export function initRadialChart(containerId = 'radialChart') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Contenedor #${containerId} no encontrado`);
        return;
    }

    // Configuración
    const { width, height, margin: configMargin, innerRadius, gap, minThickness, maxThickness, usaZoneStart, usaZoneEnd } = radialConfig;
    // Aumentamos el margen para asegurar que el texto "GOES TO SLEEP" se lea completo
    const margin = configMargin + 80; 
    const radius = Math.min(width, height) / 2 - margin;
    const availableTrackWidth = radius - innerRadius - 40;

    // Limpiar contenedor previo
    d3.select(`#${containerId}`).selectAll("*").remove();

    // Crear SVG
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("max-width", `${width}px`)
        .style("max-height", `${height}px`)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Escala de ángulos (0-24 horas -> 0-360°)
    const angleScale = d3.scaleLinear()
        .domain([0, 24])
        .range([0, 2 * Math.PI]);

    // Crear tooltip flotante
    const tooltip = createTooltip();

    // ============ SECUENCIA DE ANIMACIÓN ============
    // Paso 1: Hub central aparece primero (0ms)
    renderHub(svg, innerRadius);
    
    // Paso 2: Después del hub, aparece el resto (delays internos)
    // Los delays en cada función controlan el orden:
    // - Clock axes: 600ms
    // - USA Zone: 800ms  
    // - Tracks: 1000ms+
    // - Markers: 1600ms+
    
    renderClockAxes(svg, angleScale, innerRadius, radius);
    renderUSAZone(svg, angleScale, innerRadius, radius, usaZoneStart, usaZoneEnd);
    renderTracks(svg, angleScale, innerRadius, availableTrackWidth, gap, minThickness, maxThickness, 
                 usaZoneStart, usaZoneEnd, tooltip);
    renderMarkers(svg, angleScale, radius);
}

/**
 * Renderiza la zona USA extendida (8-20h)
 */
function renderUSAZone(svg, angleScale, innerRadius, radius, startHour, endHour) {
    const startAngle = angleScale(startHour);
    const endAngle = angleScale(endHour);
    
    const usaZoneArc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(radius + 20);

    // Arc tween que se expande desde startAngle hacia endAngle
    const usaZoneArcTween = function() {
        return function(t) {
            const currentEnd = startAngle + (endAngle - startAngle) * t;
            return d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(radius + 20)
                .startAngle(startAngle)
                .endAngle(currentEnd)();
        };
    };
    
    const finalPath = usaZoneArc({ startAngle: startAngle, endAngle: endAngle });

    svg.append("path")
        .attr("d", finalPath)
        .attr("fill", "#A1D4FF")
        .attr("fill-opacity", 0)
        .attr("stroke", "none")
        .style("pointer-events", "none")
        .transition()
        .delay(800)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("fill-opacity", 0.08);

    // Líneas de inicio y fin con animación
    [startHour, endHour].forEach((hour, idx) => {
        const angle = angleScale(hour) - Math.PI / 2;
        const x2 = (radius + 20) * Math.cos(angle);
        const y2 = (radius + 20) * Math.sin(angle);
        const x1 = innerRadius * Math.cos(angle);
        const y1 = innerRadius * Math.sin(angle);
        
        svg.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x1)  // Start from same point
            .attr("y2", y1)
            .attr("stroke", "#A1D4FF")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4")
            .attr("stroke-opacity", 0)
            .transition()
            .delay(1000 + idx * 200)
            .duration(600)
            .ease(d3.easeCubicOut)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke-opacity", 0.6)
            .style("filter", "drop-shadow(0 0 2px #A1D4FF)");
    });
}

/**
 * Renderiza los marcadores de tiempo con animación
 */
function renderMarkers(svg, angleScale, radius) {
    markers.forEach((marker, idx) => {
        const { hour, label, sublabel, time, anchor } = marker;
        const angle = angleScale(hour) - Math.PI / 2;
        // Aumentamos la distancia desde el radio para evitar superposición con los círculos
        const rStart = radius + 45;
        const rEnd = radius + 85;
        const x1 = rStart * Math.cos(angle);
        const y1 = rStart * Math.sin(angle);
        const x2 = rEnd * Math.cos(angle);
        const y2 = rEnd * Math.sin(angle);
        
        const baseDelay = 2000 + idx * 800;  // Antes de las barras de horario
        
        // Línea del marcador - crece hacia afuera
        svg.append("line")
            .attr("x1", x1).attr("y1", y1)
            .attr("x2", x1).attr("y2", y1)  // Start collapsed
            .attr("class", "marker-line")
            .attr("stroke", "#DAFF87")
            .attr("stroke-width", 2)
            .attr("opacity", 0)
            .transition()
            .delay(baseDelay)
            .duration(400)
            .ease(d3.easeCubicOut)
            .attr("x2", x2).attr("y2", y2)
            .attr("opacity", 0.7);
        
        // Punto del marcador
        svg.append("circle")
            .attr("cx", x1).attr("cy", y1)
            .attr("r", 0)
            .attr("fill", "#DAFF87")
            .transition()
            .delay(baseDelay + 100)
            .duration(300)
            .ease(d3.easeElasticOut.amplitude(1).period(0.4))
            .attr("r", 3);

        // Texto del marcador (3 líneas)
        const tx = (rEnd + 5) * Math.cos(angle);
        const ty = (rEnd + 5) * Math.sin(angle);
        
        const group = svg.append("g")
            .attr("transform", `translate(${tx}, ${ty})`)
            .attr("opacity", 0);
        
        // Animar el grupo completo
        group.transition()
            .delay(baseDelay + 200)
            .duration(300)
            .ease(d3.easeCubicOut)
            .attr("opacity", 1);
        
        // Línea 1: Label principal
        group.append("text")
            .attr("class", "marker-text")
            .attr("dy", "0em")
            .attr("text-anchor", anchor)
            .style("fill", "#FFFFFF")
            .style("font-weight", "700")
            .text(label);

        // Línea 2: Sublabel
        group.append("text")
            .attr("class", "marker-text")
            .attr("dy", "1.2em")
            .attr("text-anchor", anchor)
            .style("fill", "#86F5AF")
            .text(sublabel);
        
        // Línea 3: Hora
        group.append("text")
            .attr("class", "marker-subtext")
            .attr("dy", "2.4em")
            .attr("text-anchor", anchor)
            .style("fill", "#DAFF87")
            .text(time);
    });
}

/**
 * Crea tooltip flotante que sigue al mouse
 */
function createTooltip() {
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "radial-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(0, 0, 0, 0.95)")
        .style("border", "2px solid")
        .style("border-radius", "12px")
        .style("padding", "10px 16px")
        .style("font-size", "13px")
        .style("font-weight", "800")
        .style("letter-spacing", "1px")
        .style("text-transform", "uppercase")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.5)")
        .style("z-index", "1000")
        .style("white-space", "nowrap");

    return {
        show: function(event, text, color) {
            tooltip
                .style("opacity", 1)
                .style("border-color", color)
                .style("color", color)
                .html(text)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        },
        move: function(event) {
            tooltip
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px");
        },
        hide: function() {
            tooltip.style("opacity", 0);
        }
    };
}

/**
 * Renderiza los ejes del reloj (0, 6, 12, 18h)
 */
function renderClockAxes(svg, angleScale, innerRadius, radius) {
    const hours = [0, 6, 12, 18];
    hours.forEach((h, idx) => {
        const angle = angleScale(h) - Math.PI / 2;
        const r = radius + 15;
        const x1 = innerRadius * Math.cos(angle);
        const y1 = innerRadius * Math.sin(angle);
        const x2 = radius * Math.cos(angle);
        const y2 = radius * Math.sin(angle);
        
        // Línea del eje - crece desde el centro hacia afuera
        svg.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x1)  // Start collapsed
            .attr("y2", y1)
            .attr("stroke", "#4A9B5E")
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0)
            .transition()
            .delay(600 + idx * 80)
            .duration(500)
            .ease(d3.easeCubicOut)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke-opacity", 1);
        
        // Etiqueta de hora - fade in con delay
        svg.append("text")
            .attr("x", (r + 10) * Math.cos(angle))
            .attr("y", (r + 10) * Math.sin(angle))
            .attr("dy", "0.35em")
            .attr("class", "clock-label")
            .attr("opacity", 0)
            .text(h + "h")
            .transition()
            .delay(900 + idx * 80)
            .duration(300)
            .ease(d3.easeCubicOut)
            .attr("opacity", 1);
    });
}

/**
 * Renderiza las pistas (tracks) de cada región con animación
 */
function renderTracks(svg, angleScale, innerRadius, availableTrackWidth, gap, minThickness, maxThickness,
                     usaZoneStart, usaZoneEnd, tooltip) {
    let currentInnerR = innerRadius + 10;
    const totalPeople = radialData.reduce((acc, d) => acc + d.count, 0);
    const totalGapSpace = gap * (radialData.length - 1);
    const netAvailableSpace = availableTrackWidth - totalGapSpace;

    // Helper para crear arc tween que dibuja el círculo de fondo progresivamente (como dibujando)
    function circleDrawTween(innerR, outerR) {
        return function(t) {
            const currentEnd = 2 * Math.PI * t;
            return d3.arc()
                .innerRadius(innerR)
                .outerRadius(outerR)
                .startAngle(0)
                .endAngle(currentEnd)();
        };
    }

    // Helper para crear arc tween que se expande desde startAngle hacia endAngle
    function arcExpandTween(innerR, outerR, startAngle, endAngle) {
        // Usamos cornerRadius constante para evitar cambios de forma durante la transición
        // Esto asegura que la barra no parezca "más grande" (por esquinas agudas) mientras crece
        const arcGenerator = d3.arc()
            .innerRadius(innerR)
            .outerRadius(outerR)
            .cornerRadius(6);
            
        return function(t) {
            const currentEnd = startAngle + (endAngle - startAngle) * t;
            return arcGenerator({
                startAngle: startAngle,
                endAngle: currentEnd
            });
        };
    }

    radialData.forEach((d, i) => {
        // Calcular grosor de la pista basado en el conteo
        let thickness = (d.count / totalPeople) * netAvailableSpace * 1.5;
        if (thickness < minThickness) thickness = minThickness;
        if (thickness > maxThickness) thickness = maxThickness;
        
        const outerR = currentInnerR + thickness;
        const baseColor = regionColors[d.region];
        const trackArc = d3.arc()
            .innerRadius(currentInnerR)
            .outerRadius(outerR)
            .cornerRadius(6);
        
        const shiftStart = d.start;
        const shiftEnd = d.end;
        
        // Ajustar endAngle si cruza la medianoche para asegurar dirección horaria
        let effectiveShiftEnd = shiftEnd;
        if (shiftEnd < shiftStart) {
            effectiveShiftEnd += 24;
        }
        
        const startAngle = angleScale(shiftStart);
        const endAngle = angleScale(effectiveShiftEnd);
        
        let syncStart = Math.max(shiftStart, usaZoneStart);
        let syncEnd = Math.min(effectiveShiftEnd, usaZoneEnd);
        const syncStartAngle = angleScale(syncStart);
        const syncEndAngle = angleScale(syncEnd);
        
        const groupClass = `group-${d.name}`;
        
        // --- TIEMPOS DE ANIMACIÓN ---
        // 1. Contornos (círculos verdes): Aparecen temprano junto con los ejes
        const bgDelay = 1000 + i * 150; 
        
        // 2. Barras de horario: Aparecen MUCHO después, una por una y lento
        // Esperamos a que todo lo demás esté listo (aprox 3500ms)
        // Luego damos 1.2s a cada una para que se note bien
        const barDelay = 4000 + i * 1200;
        
        // Calcular el perímetro total (exterior + interior) para el stroke-dasharray
        const totalPerimeter = 2 * Math.PI * outerR + 2 * Math.PI * currentInnerR;
        
        // Fondo de pista - círculo completo que se "dibuja" con stroke-dasharray
        const bgArcFinal = d3.arc()
            .innerRadius(currentInnerR)
            .outerRadius(outerR)
            .startAngle(0)
            .endAngle(2 * Math.PI);
        
        // Crear el path con la forma final desde el inicio (SOLO RELLENO, SIN STROKE)
        const bgPath = svg.append("path")
            .attr("d", bgArcFinal())
            .attr("fill", "rgba(74, 155, 94, 0.05)")
            .attr("fill-opacity", 0)
            .attr("stroke", "none"); // Quitamos el stroke del arco completo
        
        // Animar relleno de fondo
        bgPath.transition()
            .delay(bgDelay + 300)
            .duration(800)
            .attr("fill-opacity", 1);

        // DIBUJAR SOLO UNA LÍNEA DE CONTORNO (Círculo interior)
        // Esto simplifica la visualización evitando dobles líneas
        const gridLinePerimeter = 2 * Math.PI * currentInnerR;
        
        svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", currentInnerR)
            .attr("fill", "none")
            .attr("stroke", "#4A9B5E")
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0)
            .attr("stroke-dasharray", gridLinePerimeter)
            .attr("stroke-dashoffset", gridLinePerimeter)
            .transition()
            .delay(bgDelay)
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-dashoffset", 0);

        // Si es el último elemento, dibujamos también el círculo exterior para cerrar
        if (i === radialData.length - 1) {
            const outerPerimeter = 2 * Math.PI * outerR;
            svg.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", outerR)
                .attr("fill", "none")
                .attr("stroke", "#4A9B5E")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0)
                .attr("stroke-dasharray", outerPerimeter)
                .attr("stroke-dashoffset", outerPerimeter)
                .transition()
                .delay(bgDelay + 150)
                .duration(800)
                .ease(d3.easeCubicOut)
                .attr("stroke-opacity", 0.6)
                .attr("stroke-dashoffset", 0);
        }

        // Segmento asíncrono (turno completo) - aparece con fade in LENTO
        const asyncFinalPath = trackArc({ startAngle: startAngle, endAngle: endAngle });
        
        svg.append("path")
            .attr("d", asyncFinalPath)
            .attr("fill", baseColor)
            .attr("fill-opacity", 0)
            .attr("stroke", "none")
            .attr("class", `track-segment ${groupClass}`)
            .attr("data-original-color", baseColor)
            .on("mouseover", function(event) { handleHover(event, d, baseColor, groupClass, false); })
            .on("mousemove", function(event) { handleMove(event); })
            .on("mouseout", function(event) { handleOut(event, d, groupClass, false); })
            .transition()
            .delay(barDelay)
            .duration(800) // Fade in suave
            .ease(d3.easeCubicOut)
            .attr("fill-opacity", 0.5)
            .on("end", function() {
                // Efecto de parpadeo (blinking) para llamar la atención
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("fill-opacity", 0.2)
                    .transition()
                    .duration(150)
                    .attr("fill-opacity", 0.7)
                    .transition()
                    .duration(300)
                    .attr("fill-opacity", 0.5); // Volver a normal
            });

        // Segmento síncrono (overlap con USA) - aparece con fade in
        if (syncStart < syncEnd) {
            const syncFinalPath = trackArc({ startAngle: syncStartAngle, endAngle: syncEndAngle });
            
            svg.append("path")
                .attr("d", syncFinalPath)
                .attr("fill", baseColor)
                .attr("fill-opacity", 0)
                .attr("filter", `drop-shadow(0 0 4px ${baseColor})`)
                .attr("class", `track-segment ${groupClass}`)
                .attr("data-original-color", baseColor)
                .on("mouseover", function(event) { handleHover(event, d, baseColor, groupClass, true); })
                .on("mousemove", function(event) { handleMove(event); })
                .on("mouseout", function(event) { handleOut(event, d, groupClass, true); })
                .transition()
                .delay(barDelay + 200) // Un poco después de la base
                .duration(600)
                .ease(d3.easeCubicOut)
                .attr("fill-opacity", 0.85)
                .on("end", function() {
                    // Blinking también en la parte brillante
                    d3.select(this)
                        .transition()
                        .duration(150)
                        .attr("fill-opacity", 0.4)
                        .transition()
                        .duration(150)
                        .attr("fill-opacity", 0.85);
                });
            
            // Overlay brillante
            svg.append("path")
                .attr("d", syncFinalPath)
                .attr("fill", "white")
                .attr("fill-opacity", 0)
                .style("pointer-events", "none")
                .transition()
                .delay(barDelay + 400)
                .duration(400)
                .ease(d3.easeCubicOut)
                .attr("fill-opacity", 0.3);
        }
        
        // Etiquetas de región - POSICIONADAS EN EL CENTRO DEL ARCO
        const midRadius = currentInnerR + (thickness / 2);
        
        // Calcular el ángulo del centro del arco
        const midAngle = (startAngle + endAngle) / 2 - Math.PI / 2;
        const labelX = midRadius * Math.cos(midAngle);
        const labelY = midRadius * Math.sin(midAngle);
        
        // Calcular rotación para que el texto siga la curva
        let textRotation = (midAngle * 180 / Math.PI) + 90;
        // Ajustar para que el texto siempre se lea de izquierda a derecha
        if (textRotation > 90 && textRotation < 270) {
            textRotation += 180;
        }
        
        // Grupo para label y count
        const labelGroup = svg.append("g")
            .attr("transform", `translate(${labelX}, ${labelY}) rotate(${textRotation})`)
            .attr("opacity", 0);
        
        // Fondo para mejor legibilidad del texto
        labelGroup.append("rect")
            .attr("x", -35)
            .attr("y", -12)
            .attr("width", 70)
            .attr("height", 24)
            .attr("rx", 4)
            .attr("fill", "#000000")
            .attr("fill-opacity", 0.8);
        
        // Nombre de región
        labelGroup.append("text")
            .attr("x", 0)
            .attr("y", 5)
            .attr("class", "track-label")
            .style("fill", "#FFFFFF")
            .style("font-size", "14px")
            .style("font-weight", "900")
            .style("text-anchor", "middle")
            .style("text-shadow", `0 0 8px ${baseColor}, 0 0 4px #000000`)
            .text(d.name);
        
        // Animar el grupo
        labelGroup.transition()
            .delay(barDelay + 500)
            .duration(400)
            .ease(d3.easeCubicOut)
            .attr("opacity", 1);
        
        // Tooltip de conteo (en hover, no visible por defecto)
        // Posicionado también en el centro del arco
        const countGroup = svg.append("g")
            .attr("class", `count-display ${groupClass}-count`)
            .attr("transform", `translate(${labelX}, ${labelY}) rotate(${textRotation})`)
            .attr("opacity", 0);
        
        countGroup.append("rect")
            .attr("x", -25)
            .attr("y", 10)
            .attr("width", 50)
            .attr("height", 18)
            .attr("rx", 4)
            .attr("class", "track-count-bg");
            
        countGroup.append("text")
            .attr("x", 0)
            .attr("y", 24)
            .attr("text-anchor", "middle")
            .attr("class", "track-count-text")
            .text(`${d.count}`);

        currentInnerR = outerR + gap;
    });

    // Manejadores de eventos
    function handleHover(event, d, color, groupClass, isSyncZone) {
        // Only dim segments from OTHER groups
        d3.selectAll(".track-segment").each(function() {
            const segment = d3.select(this);
            if (!segment.classed(groupClass)) {
                segment.classed("dimmed", true);
            }
        });
        d3.select(`.${groupClass}-count`).style("opacity", 1);
        
        // Add diagonal stripe overlay ONLY to hovered segment
        const hoveredElement = d3.select(event.target);
        
        // Create SVG defs if needed
        let defs = svg.select("defs");
        if (defs.empty()) {
            defs = svg.append("defs");
        }
        
        const patternId = `diagonal-pattern-${groupClass}-${isSyncZone ? 'sync' : 'async'}`;
        
        // Remove existing pattern
        defs.select(`#${patternId}`).remove();
        
        // Create pattern with FIXED dimensions for consistency
        const pattern = defs.append("pattern")
            .attr("id", patternId)
            .attr("width", 20)
            .attr("height", 20)
            .attr("patternUnits", "userSpaceOnUse")
            .attr("patternTransform", "rotate(-55)");
        
        // Base color rectangle with FULL OPACITY
        pattern.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", color)
            .attr("opacity", 1);
        
        // Create animated BLACK diagonal stripes - ALL SAME WIDTH
        // Line 1
        pattern.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 20)
            .attr("stroke", "#000000")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-linecap", "square");
        
        // Line 2
        pattern.append("line")
            .attr("x1", 10)
            .attr("y1", 0)
            .attr("x2", 10)
            .attr("y2", 20)
            .attr("stroke", "#000000")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-linecap", "square");
        
        // Apply pattern with FULL OPACITY
        hoveredElement
            .transition()
            .duration(150)
            .attr("fill-opacity", 1)
            .style("fill", `url(#${patternId})`)
            .style("filter", "none");
        
        // Animate pattern movement
        let offset = 0;
        const animateStripes = setInterval(() => {
            offset = (offset + 0.5) % 20;
            pattern.attr("patternTransform", `rotate(-55) translate(${offset}, 0)`);
        }, 30);
        
        // Store animation ID for cleanup
        hoveredElement.node().__stripeAnimation = animateStripes;
        
        // Determinar mensaje según zona
        let message;
        if (isSyncZone) {
            message = d.syncMsg;
        } else {
            message = d.asyncMsg;
        }
        
        tooltip.show(event, message, color);
    }

    function handleMove(event) {
        tooltip.move(event);
    }

    function handleOut(event, d, groupClass, isSyncZone) {
        const hoveredElement = d3.select(event.target);
        
        // Stop stripe animation
        const animId = hoveredElement.node().__stripeAnimation;
        if (animId) {
            clearInterval(animId);
            delete hoveredElement.node().__stripeAnimation;
        }
        
        // Restore original fill and opacity
        const originalColor = hoveredElement.attr("data-original-color");
        const originalOpacity = isSyncZone ? 0.85 : 0.5;
        
        hoveredElement
            .transition()
            .duration(250)
            .attr("fill-opacity", originalOpacity)
            .style("fill", originalColor)
            .style("filter", "none");
        
        // Clean up pattern from defs
        const patternId = `diagonal-pattern-${groupClass}-${isSyncZone ? 'sync' : 'async'}`;
        svg.select(`#${patternId}`).remove();
        
        // Remove dimming
        d3.selectAll(".track-segment").classed("dimmed", false);
        d3.selectAll(".count-display").style("opacity", 0);
        tooltip.hide();
    }
}

/**
 * Renderiza el círculo central (hub) con animación
 */
function renderHub(svg, innerRadius) {
    // Círculo central - crece desde radio 0
    svg.append("circle")
        .attr("r", 0)
        .attr("fill", "#000000")
        .attr("stroke", "#A1D4FF")
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 0)
        .style("filter", "drop-shadow(0 0 8px rgba(161, 212, 255, 0.5))")
        .transition()
        .delay(0)
        .duration(800)
        .ease(d3.easeElasticOut.amplitude(1).period(0.5))
        .attr("r", innerRadius - 5)
        .attr("stroke-opacity", 1);

    // Texto USA TIMEZONE - fade in
    svg.append("text")
        .attr("y", -8)
        .attr("class", "hub-label")
        .attr("opacity", 0)
        .style("fill", "#A1D4FF")
        .text("USA")
        .transition()
        .delay(400)
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1);
    
    // Texto WORK HOURS - fade in
    svg.append("text")
        .attr("y", 12)
        .attr("class", "hub-sublabel")
        .attr("opacity", 0)
        .style("fill", "#A1D4FF")
        .text("WORK HOURS")
        .transition()
        .delay(550)
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1);
    
    // Texto 8AM - 8PM ET
    svg.append("text")
        .attr("y", 28)
        .attr("class", "hub-time")
        .attr("opacity", 0)
        .style("fill", "#4A9B5E")
        .style("font-size", "9px")
        .style("font-weight", "600")
        .style("text-anchor", "middle")
        .text("8AM - 8PM ET")
        .transition()
        .delay(650)
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1);
}
