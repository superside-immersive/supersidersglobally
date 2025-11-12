/**
 * Animation Module
 * Handles camera animations, loading sequences, and airplane flight
 */
import { setArcOpacityMultiplier, getArcColor } from '../globe/config.js';

// Airplane flight animation control
let airplaneFlightInterval = null;
let userInteractionListeners = null;

/**
 * Stop airplane flight animation
 */
export function stopAirplaneFlight() {
    if (airplaneFlightInterval) {
        if (typeof airplaneFlightInterval.cancel === 'function') {
            airplaneFlightInterval.cancel();
        } else {
            clearInterval(airplaneFlightInterval);
        }
        airplaneFlightInterval = null;
    }
    
    // Remove user interaction listeners
    if (userInteractionListeners) {
        userInteractionListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        userInteractionListeners = null;
    }
}

/**
 * Animate category selection with airplane flight for lone wolf
 */
export function animateCategorySelection(categoryId, countryNames, globe, countryData) {
    console.log('Category selected:', categoryId, 'with countries:', countryNames);
    
    // Stop any existing airplane flight animation with smooth transition
    const wasFlying = airplaneFlightInterval !== null;
    stopAirplaneFlight();
    
    // Special airplane flight animation for lone wolf mode
    if (categoryId === 'lone_wolf') {
        console.log('Starting airplane flight animation around the world!');
        
        // CRITICAL: Optimizaciones de performance para vuelo suave
        const controls = globe.controls();
        controls.autoRotate = false;
        controls.enableDamping = true; // Habilitar damping para suavidad
        controls.dampingFactor = 0.05; // Factor de amortiguación
        
        console.log('AutoRotate DISABLED, Damping ENABLED for airplane mode');
        
        // Si estábamos en otra categoría, hacer transición suave primero
        if (!wasFlying) {
            const currentPOV = globe.pointOfView();
            
            // IMPORTANTE: Iniciar el vuelo INMEDIATAMENTE pero desde la posición actual
            // Esto evita el salto
            startAirplaneFlight(globe, countryData, currentPOV);
        } else {
            // Si ya estábamos volando, reiniciar directamente
            startAirplaneFlight(globe, countryData);
        }
        return;
    }
    
    // CRITICAL: Reactivar autoRotate al salir del modo avión
    console.log('Re-enabling AutoRotate');
    globe.controls().autoRotate = true;
    
    // Define region views for each category
    const regionViews = {
        'latin_america': {
            lat: -15,
            lng: -60,
            altitude: 2.2
        },
        'europe': {
            lat: 54,
            lng: 15,
            altitude: 1.8
        },
        'africa': {
            lat: 0,
            lng: 20,
            altitude: 2.0
        }
    };
    
    const targetView = regionViews[categoryId];
    if (targetView) {
        console.log(`Smoothly transitioning to ${categoryId} region:`, targetView);
        
        // Si veníamos del modo avión, transición más suave
        if (wasFlying) {
            // Transición directa a la región sin pasos intermedios
            globe.pointOfView(targetView, 2500);
        } else {
            // Transición directa con duración más larga para suavidad
            globe.pointOfView(targetView, 2500);
        }
    }
}

/**
 * Simulate an airplane flying around the world
 */
function startAirplaneFlight(globe, countryData, startPOV = null) {
    const loneWolfCountries = countryData.filter(c => c.count === 1);
    
    if (loneWolfCountries.length === 0) {
        console.log('No lone wolf countries found');
        return;
    }
    
    // Obtener posición inicial
    const initialPOV = startPOV || globe.pointOfView();
    let angle = initialPOV.lng || 0;
    let currentLat = initialPOV.lat || 20;
    
    // Optimizaciones de performance
    const rotationSpeed = 0.18; // 40% más lento que el original (0.3 * 0.6 = 0.18)
    const initialAltitude = 1.3;
    const targetLatVariation = 25;
    
    // Pre-calcular constantes
    const PI_180 = Math.PI / 180;
    const ANGLE_FACTOR_LAT = 0.5;
    
    // Transición gradual al patrón de vuelo
    let transitionProgress = 0;
    const transitionDuration = 90; // Más frames para transición más suave
    
    console.log(`Starting airplane flight - sobrevolando ${loneWolfCountries.length} lone wolf countries...`);
    console.log(`Initial zoom set to altitude: ${initialAltitude}`);
    console.log(`User can zoom in/out freely during flight`);
    
    // IMPORTANTE: Hacer la transición inicial ANTES de empezar el vuelo
    globe.pointOfView({
        lat: currentLat,
        lng: angle,
        altitude: initialAltitude
    }, 1500); // Transición más rápida (1.5s)
    
    // Variables para requestAnimationFrame
    let animationFrameId = null;
    let lastTimestamp = null;
    
    // Función de animación usando requestAnimationFrame (60fps suave)
    function animate(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        // Normalizar el deltaTime para mantener velocidad consistente
        // Target: 60fps = ~16.67ms per frame
        const normalizedDelta = Math.min(deltaTime / 16.67, 2); // Cap para evitar saltos grandes
        
        // Incrementar ángulo de rotación (ajustado por deltaTime)
        angle += rotationSpeed * normalizedDelta;
        
        // La cámara rota alrededor del globo (cambiando longitud)
        const lng = angle % 360;
        
        // Pre-calcular ángulo en radianes
        const angleRad = angle * PI_180;
        
        // Calcular latitud objetivo con patrón sinusoidal suave
        const targetLat = Math.sin(angleRad * ANGLE_FACTOR_LAT) * targetLatVariation;
        
        // Interpolación ultra suave con easing progresivo
        let lerpFactor;
        if (transitionProgress < transitionDuration) {
            transitionProgress += normalizedDelta;
            const easeProgress = Math.min(transitionProgress / transitionDuration, 1);
            // Easing suave (smoothstep mejorado)
            const easedProgress = easeProgress * easeProgress * (3 - 2 * easeProgress);
            
            // Factor de interpolación progresivo
            lerpFactor = easedProgress * 0.15;
        } else {
            // Ya en patrón de vuelo normal - interpolación suave continua
            lerpFactor = 0.12; // Aumentado de 0.1 para más respuesta
        }
        
        // Aplicar lerp con factor calculado
        currentLat += (targetLat - currentLat) * lerpFactor;
        
        // IMPORTANTE: Obtener la altitud actual del usuario (con cache para performance)
        const currentPOV = globe.pointOfView();
        const userAltitude = currentPOV.altitude;
        
        // Actualizar punto de vista sin transición (0ms) para movimiento fluido
        globe.pointOfView({
            lat: currentLat,
            lng: lng,
            altitude: userAltitude
        }, 0);
        
        // Continuar la animación
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // ESPERAR a que termine la transición inicial antes de empezar el vuelo
    setTimeout(() => {
        // Iniciar animación con requestAnimationFrame
        animationFrameId = requestAnimationFrame(animate);
        
        // Guardar el ID para poder cancelar después
        airplaneFlightInterval = {
            cancel: () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            }
        };
        
        // Detectar interacción del usuario para detener la animación
        setupUserInteractionDetection(globe);
    }, 1600); // Esperar un poco más que la transición
}

/**
 * Setup user interaction detection to stop airplane flight
 */
function setupUserInteractionDetection(globe) {
    const controls = globe.controls();
    userInteractionListeners = [];
    
    // Detectar cuando el usuario empieza a mover la cámara
    const onInteractionStart = () => {
        console.log('User interaction detected - stopping airplane flight');
        stopAirplaneFlight();
        
        // Re-enable auto rotation after user stops interacting
        controls.autoRotate = true;
    };
    
    // Eventos de mouse
    const canvas = globe.renderer().domElement;
    
    // Mouse down inicia interacción
    canvas.addEventListener('mousedown', onInteractionStart);
    userInteractionListeners.push({ element: canvas, event: 'mousedown', handler: onInteractionStart });
    
    // Touch start para dispositivos móviles
    canvas.addEventListener('touchstart', onInteractionStart);
    userInteractionListeners.push({ element: canvas, event: 'touchstart', handler: onInteractionStart });
    
    // Wheel para detectar zoom
    canvas.addEventListener('wheel', onInteractionStart);
    userInteractionListeners.push({ element: canvas, event: 'wheel', handler: onInteractionStart });
}

/**
 * Easing function for smooth animation
 */
function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Initialize loading sequence
 * OPTIMIZADO: La animación CSS del logo corre COMPLETAMENTE INDEPENDIENTE
 * del globe loading para prevenir trabas
 */
export function initializeLoadingSequence(globe, countryData, connections) {
    const loadingScreen = document.getElementById('loadingScreen');
    const globeViz = document.getElementById('globeViz');
    
    // CRÍTICO: La animación del logo (2.4s) corre en GPU thread independiente
    // NO esperamos al globe para que la animación sea fluida
    console.log('Logo animation running independently on GPU...');
    
    let globeReady = false;
    
    // Check if globe is ready (scene loaded, renderer initialized)
    // Esto NO bloquea la animación del logo
    const checkGlobeReady = () => {
        try {
            // Verify globe has scene and renderer
            if (globe && globe.scene && globe.scene() && globe.renderer && globe.renderer()) {
                console.log('Globe is ready!');
                globeReady = true;
            } else {
                // Keep checking every 100ms (sin bloquear animación)
                setTimeout(checkGlobeReady, 100);
            }
        } catch (e) {
            // Globe aún no listo, seguir esperando sin interrumpir animación
            setTimeout(checkGlobeReady, 100);
        }
    };
    
    // Start checking globe readiness (asíncrono, no bloqueante)
    setTimeout(checkGlobeReady, 100);
    
    // CRÍTICO: El logo termina a los 0.8s y SE VA CASI INMEDIATAMENTE (0.2s después)
    setTimeout(() => {
        console.log('Logo animation complete (0.8s + 0.2s hold = 1s) - starting fade out');
        
        // Empezar transición INSTANTÁNEAMENTE
        startTransition();
        
        // Globe carga en background
        if (!globeReady) {
            console.log('Globe loading in background...');
            const quickCheck = setInterval(() => {
                if (globeReady) {
                    clearInterval(quickCheck);
                    console.log('Globe ready');
                }
            }, 100);
        }
    }, 1000); // Logo completa a 1s
    
    function startTransition() {
        // SECUENCIA: 1) Fade out logo (0.5s) → 2) Fade in globe (1.5s) → 3) Fade in interfaz (después del globe)
        console.log('Step 1: Fade out loading screen (0.5s)');
        loadingScreen.classList.add('fade-out');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500); // Match CSS animation time (0.5s)

        // Step 2: Fade in globe (empieza inmediatamente con el fade out)
        console.log('Step 2: Fade in globe (1.5s)');
        globeViz.classList.add('fade-in');

        // Step 3: Puntos empiezan DESPUÉS del fade in del globe
        setTimeout(() => {
            console.log('Step 3: Growing points and arcs...');
            const enabledCountries = new Set(countryData.map(country => country.name));
            const enabledCountryData = countryData.filter(country => enabledCountries.has(country.name));

            animatePointsSequential(globe, enabledCountryData, () => {
                animateArcsSequential(globe, connections);
            });
        }, 1500); // Después de que termine el fade in del globe (1.5s)

        // Step 4: UI panels aparecen DESPUÉS del globe (primero termina el fade in del globe a los 1.5s)
        // Luego las UI aparecen con delays adicionales: 2s, 2.2s, 2.4s desde el inicio del fade out
        setTimeout(() => {
            console.log('Step 4: Starting UI fade in animations');
            // Activar las animaciones de la UI
            document.querySelector('.info-panel')?.classList.add('ui-fade-in');
            document.querySelector('.country-panel')?.classList.add('ui-fade-in');
            document.querySelector('.category-panel')?.classList.add('ui-fade-in');
        }, 1600); // Globe termina fade in a los 1.5s, UI empieza a los 1.6s

        // Step 5: Tooltip
        setTimeout(() => {
            const tooltip = document.getElementById('customTooltip');
            tooltip.classList.remove('loading-disabled');
        }, 2000);
    }
}

/**
 * Animate points appearing sequentially
 */
function animatePointsSequential(globe, pointsData, onComplete) {
    const delayBetweenPoints = 15; // milliseconds between each point appearing
    const currentPoints = [];
    
    console.log(`Starting sequential point animation for ${pointsData.length} points...`);
    
    let index = 0;
    const intervalId = setInterval(() => {
        if (index < pointsData.length) {
            currentPoints.push(pointsData[index]);
            globe.pointsData([...currentPoints]);
            index++;
        } else {
            clearInterval(intervalId);
            console.log('All points displayed!');
            if (onComplete) onComplete();
        }
    }, delayBetweenPoints);
}

/**
 * Animate arcs appearing sequentially
 */
function animateArcsSequential(globe, arcsData) {
    const delayBetweenArcs = 20; // milliseconds between each arc appearing
    const currentArcs = [];
    
    console.log(`Starting sequential arc animation for ${arcsData.length} arcs...`);
    
    let index = 0;
    const intervalId = setInterval(() => {
        if (index < arcsData.length) {
            currentArcs.push(arcsData[index]);
            globe.arcsData([...currentArcs]);
            index++;
        } else {
            clearInterval(intervalId);
            console.log('All arcs displayed! Starting fade-in and dash animation...');
            animateArcFadeIn(globe);
        }
    }, delayBetweenArcs);
}

/**
 * Animate arc fade-in
 */
function animateArcFadeIn(globe) {
    const fadeInDuration = 2000;
    const fadeInStart = Date.now();
    
    function animate() {
        const elapsed = Date.now() - fadeInStart;
        const progress = Math.min(elapsed / fadeInDuration, 1);
        
        setArcOpacityMultiplier(progress);
        
        console.log('Arc fade progress:', progress.toFixed(2), 'opacity:', progress.toFixed(2));
        
        globe.arcColor(getArcColor);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            console.log('Arc fade-in complete, starting dash animation...');
            globe.arcDashAnimateTime(3000);
            const currentData = globe.arcsData();
            globe.arcsData([]);
            setTimeout(() => globe.arcsData(currentData), 10);
        }
    }
    
    animate();
}
