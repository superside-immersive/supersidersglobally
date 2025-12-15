/**
 * Gráfico de Esfera - Distribución Hemisférica
 * Visualización Chart.js de la distribución Norte/Sur
 */

import { hemisphereData } from '../data/viz2-data.js';

/**
 * Inicializa el gráfico de esfera en el canvas especificado
 * @param {string} canvasId - ID del canvas
 */
export function initSphereChart(canvasId = 'sphereChart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas #${canvasId} no encontrado`);
        return;
    }

    // Set canvas resolution to match container size
    const size = canvasId === 'sphereChartOverlay' ? 500 : 320; // Larger size for overlay
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    
    // Determinar el nombre de la variable según el canvasId
    const chartVarName = canvasId === 'sphereChartOverlay' ? 'mySphereChartOverlay' : 'mySphereChart';
    
    // Destruir gráfico previo si existe
    if (window[chartVarName]) {
        window[chartVarName].destroy();
    }

    // Crear nuevo gráfico con Chart.js
    window[chartVarName] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Norte', 'Sur'],
            datasets: [{
                data: [hemisphereData.norte, hemisphereData.sur],
                backgroundColor: [
                    'rgba(161, 212, 255, 0.5)',  // Norte - opacidad media
                    'rgba(216, 255, 133, 0.5)'   // Sur - opacidad media
                ],
                hoverBackgroundColor: [
                    'rgba(161, 212, 255, 0.85)',  // Norte hover - más opaco
                    'rgba(216, 255, 133, 0.85)'   // Sur hover - más opaco
                ],
                borderWidth: 0,
                hoverOffset: 0
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            rotation: -90, // Alineado con ecuador - división horizontal
            circumference: 360,
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: { 
                    enabled: false 
                }
            },
            onHover: (event, activeElements, chart) => {
                const northLabel = document.getElementById('northLabel') || document.getElementById('northLabelOverlay');
                const southLabel = document.getElementById('southLabel') || document.getElementById('southLabelOverlay');
                
                if (activeElements && activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const dataset = chart.data.datasets[0];
                    
                    if (index === 0) {
                        // Norte hover - norte brillante, sur atenuado
                        dataset.backgroundColor = [
                            'rgba(161, 212, 255, 0.85)',
                            'rgba(216, 255, 133, 0.3)'
                        ];
                        if (northLabel) northLabel.classList.add('visible');
                        if (southLabel) southLabel.classList.remove('visible');
                    } else {
                        // Sur hover - sur brillante, norte atenuado
                        dataset.backgroundColor = [
                            'rgba(161, 212, 255, 0.3)',
                            'rgba(216, 255, 133, 0.85)'
                        ];
                        if (southLabel) southLabel.classList.add('visible');
                        if (northLabel) northLabel.classList.remove('visible');
                    }
                } else {
                    // Sin hover - ambos con opacidad media
                    dataset.backgroundColor = [
                        'rgba(161, 212, 255, 0.5)',
                        'rgba(216, 255, 133, 0.5)'
                    ];
                    if (northLabel) northLabel.classList.remove('visible');
                    if (southLabel) southLabel.classList.remove('visible');
                }
                chart.update('none'); // Update sin animación
            }
        }
    });

    console.log(`Sphere chart initialized with id: ${chartVarName}`);
    return window[chartVarName];
}

/**
 * Actualiza los datos del gráfico de esfera
 * @param {number} norte - Número de personas en el hemisferio norte
 * @param {number} sur - Número de personas en el hemisferio sur
 */
export function updateSphereData(norte, sur) {
    if (!window.mySphereChart) {
        console.error('El gráfico de esfera no está inicializado');
        return;
    }

    window.mySphereChart.data.datasets[0].data = [norte, sur];
    window.mySphereChart.update();
}

/**
 * Destruye el gráfico de esfera
 */
export function destroySphereChart() {
    if (window.mySphereChart) {
        window.mySphereChart.destroy();
        window.mySphereChart = null;
    }
}
