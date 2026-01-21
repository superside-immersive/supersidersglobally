/**
 * Astronaut Orbiters Module
 * Manages astronaut models orbiting around lone wolf country cylinders
 */
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Map to keep track of orbiters per country name
export const astronautOrbiters = new Map();

/**
 * Create astronaut template using THREE.js
 */
export function createAstronautTemplate(THREE) {
    console.log('Creating astronaut template...');
    
    if (!THREE) {
        console.error('THREE not available!');
        return null;
    }

    const group = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, metalness: 0.3, roughness: 0.7 });
    const visorMat = new THREE.MeshStandardMaterial({ 
        color: 0x1A5F7A, 
        metalness: 0.9, 
        roughness: 0.1, 
        transparent: true, 
        opacity: 0.6 
    });

    // Simple helmet - OPTIMIZADO: reducido de 8x8 a 4x4 segmentos
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.5, 4, 4), whiteMat);
    helmet.position.y = 0.6;
    group.add(helmet);

    // Visor (slightly inset) - OPTIMIZADO: reducido de 8x8 a 4x4 segmentos
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.45, 4, 4), visorMat);
    visor.position.set(0, 0.6, 0.15);
    group.add(visor);

    // Tiny body - OPTIMIZADO: reducido de 6 a 4 segmentos
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 4), whiteMat);
    body.position.y = -0.3;
    group.add(body);

    // Tiny backpack
    const pack = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.5, 0.15), 
        new THREE.MeshStandardMaterial({ color: 0xFF6B35 })
    );
    pack.position.set(0, -0.1, -0.2);
    group.add(pack);

    group.scale.set(1.5, 1.5, 1.5);

    console.log('Astronaut template created:', group);
    return group;
}

const ASTRONAUT_GLB_URL = 'Mini2.glb';
let astronautTemplatePromise = null;
let cachedAstronautTemplate = null;

function enhanceMaterials(root) {
    if (!root) return;
    root.traverse(node => {
        if (node.isMesh && node.material) {
            const m = node.material;
            if (m.emissive) {
                m.emissiveIntensity = Math.max(m.emissiveIntensity || 1, 1.35);
            }
            m.toneMapped = true;
            m.needsUpdate = true;
        }
    });
}

function loadAstronautTemplate(THREE) {
    if (cachedAstronautTemplate) {
        return Promise.resolve(cachedAstronautTemplate);
    }

    if (!astronautTemplatePromise) {
        astronautTemplatePromise = new Promise(resolve => {
            const loader = new GLTFLoader();
            loader.load(
                ASTRONAUT_GLB_URL,
                (gltf) => {
                    const model = gltf.scene || gltf.scenes?.[0];
                    if (!model) {
                        console.warn('Mini2.glb has no scene, using fallback astronaut');
                        cachedAstronautTemplate = createAstronautTemplate(THREE);
                        resolve(cachedAstronautTemplate);
                        return;
                    }
                    enhanceMaterials(model);
                    model.position.set(0, 0, 0);
                    model.scale.setScalar(1.0);
                    cachedAstronautTemplate = model;
                    resolve(model);
                },
                undefined,
                (err) => {
                    console.error('Error loading Mini2.glb, using fallback astronaut', err);
                    cachedAstronautTemplate = createAstronautTemplate(THREE);
                    resolve(cachedAstronautTemplate);
                }
            );
        });
    }

    return astronautTemplatePromise;
}

/**
 * Add an orbiting astronaut for a country
 */
export function addOrbitingAstronaut(country, globe, THREE, getPointSize) {
    console.log('Adding orbiting astronaut for:', country.name);
    
    if (!globe || !country || !country.name) {
        console.warn('Missing globe or country:', { globe, country });
        return;
    }

    if (astronautOrbiters.has(country.name)) {
        console.log('Astronaut already exists for:', country.name);
        return;
    }

    if (!THREE) {
        console.error('THREE not available for astronaut creation!');
        return;
    }

    // Determine globe radius
    let R = 100;
    try {
        if (typeof globe.globeRadius === 'function') R = globe.globeRadius();
        else if (typeof globe.getGlobeRadius === 'function') R = globe.getGlobeRadius();
    } catch (e) {
        console.warn('Could not get globe radius, using default 100');
    }

    // Calculate cylinder dimensions
    const altFrac = getPointSize(country.count) * 0.2;
    const cylinderHeight = R * altFrac;
    const midCylinderRadius = R + (cylinderHeight / 2);
    
    console.log('Country:', country.name, 'R:', R, 'altFrac:', altFrac, 
                'cylinderHeight:', cylinderHeight, 'midRadius:', midCylinderRadius);

    const lat = country.coordinates.lat;
    const lng = country.coordinates.lng;
    
    // Calculate the surface normal vector
    const phi = lat * Math.PI / 180;
    const theta = lng * Math.PI / 180;
    
    const normalX = Math.cos(phi) * Math.sin(theta);
    const normalY = Math.sin(phi);
    const normalZ = Math.cos(phi) * Math.cos(theta);
    
    const normal = new THREE.Vector3(normalX, normalY, normalZ);
    const cylinderMidPos = normal.clone().multiplyScalar(midCylinderRadius);
    
    // Create pivot at the cylinder's CENTER
    const pivot = new THREE.Object3D();
    pivot.position.copy(cylinderMidPos);
    pivot.lookAt(0, 0, 0);
    pivot.rotateX(-Math.PI / 2);
    
    // Create astronaut container (model loads async)
    const astronaut = new THREE.Group();
    
    // Position astronaut to orbit around the cylinder
    const orbitRadius = 2.5;
    astronaut.position.set(0, 0, orbitRadius);

    pivot.add(astronaut);

    // Add pivot to scene
    const scene = globe.scene();
    if (!scene) {
        console.error('Could not access globe scene');
        return;
    }
    scene.add(pivot);

    console.log('Astronaut added to scene at position:', pivot.position, 'for country:', country.name);

    // Store
    astronautOrbiters.set(country.name, { 
        pivot, 
        astronaut, 
        orbitRadius, 
        speed: 1.0 + Math.random() * 0.5,
        country: country.name,
        normal: normal
    });

    // Load GLB model and attach when ready
    loadAstronautTemplate(THREE).then(template => {
        if (!template || !astronaut) return;
        const model = SkeletonUtils.clone(template);
        model.position.set(0, 0, 0);
        model.scale.setScalar(1.0);
        astronaut.add(model);
    });
}

/**
 * Remove all current orbiters
 */
export function clearOrbiters(globe) {
    console.log('Clearing', astronautOrbiters.size, 'orbiters');
    const scene = globe.scene();
    astronautOrbiters.forEach(({ pivot, country }) => {
        if (scene && pivot) {
            scene.remove(pivot);
            console.log('Removed astronaut for:', country);
        }
    });
    astronautOrbiters.clear();
}

/**
 * Update / animate orbiters
 */
export function updateOrbiters() {
    if (astronautOrbiters.size === 0) return;
    
    const time = Date.now() * 0.001;
    astronautOrbiters.forEach((data, name) => {
        const { pivot, astronaut, speed } = data;
        if (pivot && astronaut) {
            pivot.rotation.y = time * speed;
            astronaut.position.y = Math.sin(time * 3 * speed) * 0.3;
        }
    });
}

/**
 * Initialize orbiter animation loop - OPTIMIZADO: throttled a ~30fps
 */
let lastOrbitUpdate = 0;
export function initializeOrbitersLoop() {
    (function orbitersLoop() {
        const now = Date.now();
        // Throttle to ~30fps (33ms between updates) para ahorrar CPU
        if (now - lastOrbitUpdate >= 33) {
            updateOrbiters();
            lastOrbitUpdate = now;
        }
        requestAnimationFrame(orbitersLoop);
    })();
    console.log('Astronaut orbiter system initialized (throttled 30fps)');
}
