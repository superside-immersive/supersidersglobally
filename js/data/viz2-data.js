/**
 * Datos de Visualización Global Superside
 * Configuración de regiones, colores y datos para gráficos
 */

// Colores por región
export const regionColors = {
    "APAC": "#8DFDBA",      // Menta
    "EMEA": "#FF9595",      // Rosa Coral
    "LATAM": "#D8FF85",     // Amarillo-Verde Brillante
    "USA": "#A1D4FF"        // Azul Cielo
};

// Datos del gráfico radial (cronómetro ponderado)
export const radialData = [
    { 
        name: "EMEA", 
        count: 346, 
        start: 2, 
        end: 13, 
        region: "EMEA",
        syncMsg: "RELAY POWER", 
        asyncMsg: "6 HOURS AHEAD OF USA",
        preWorkHours: 6
    },      
    { 
        name: "LATAM", 
        count: 402, 
        start: 7, 
        end: 19, 
        region: "LATAM",
        syncMsg: "FULL USA SYNC", 
        asyncMsg: "1 HOUR HEAD START",
        preWorkHours: 1
    },    
    { 
        name: "USA", 
        count: 61, 
        start: 8, 
        end: 20, 
        region: "USA",
        syncMsg: "CENTRAL CORE", 
        asyncMsg: "AFTERNOON SHIFT",
        preWorkHours: 0
    },
    { 
        name: "APAC", 
        count: 27, 
        start: 0, 
        end: 10, 
        region: "APAC",
        syncMsg: "FUTURE SHIFT", 
        asyncMsg: "8 HOURS AHEAD OF USA",
        preWorkHours: 8
    }
];

// Datos del gráfico de esfera (hemisferios)
// ==============================================================================
// CRITICAL: HEMISPHERE DATA - DO NOT MODIFY WITHOUT UPDATING ALL REFERENCES
// ==============================================================================
// North: 456 supersiders = 54.5% of total (456/837)
// South: 381 supersiders = 45.5% of total (381/837)
// Total: 837 supersiders
//
// These percentages are calculated dynamically in sphere-chart.js
// If you change these numbers, the percentages will update automatically
// But you MUST also update the HTML labels in:
//   - index.html (northLabelOverlay, southLabelOverlay)
//   - viz2.html (northLabel, southLabel)
// ==============================================================================
export const hemisphereData = {
    norte: 456,
    sur: 381,
    colors: {
        norte: '#A1D4FF',  // Azul Cielo
        sur: '#D8FF85'     // Amarillo-Verde
    }
};

// Configuración del gráfico radial
export const radialConfig = {
    width: 800,
    height: 900,
    margin: 60,
    innerRadius: 70,
    gap: 12,
    minThickness: 35,
    maxThickness: 100,
    usaZoneStart: 8,
    usaZoneEnd: 20
};

// Marcadores del gráfico radial
export const markers = [
    {
        hour: 8,
        label: "NEW YORK",
        sublabel: "WAKES UP",
        time: "8:00 AM EST",
        anchor: "start"
    },
    {
        hour: 20,
        label: "LOS ANGELES",
        sublabel: "GOES TO SLEEP",
        time: "8:00 PM EST",
        anchor: "end"
    }
];
