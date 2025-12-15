/**
 * Esfera 3D - Distribución Hemisférica con Three.js
 * Visualización 3D interactiva de la distribución Norte/Sur
 */

import { hemisphereData } from '../data/viz2-data.js';

let scene, camera, renderer, sphere, raycaster, mouse;
let isHovering = false;
let currentHemisphere = null;

/**
 * Inicializa la esfera 3D en el contenedor especificado
 * @param {string} containerId - ID del contenedor
 */
export function initSphere3D(containerId = 'sphere3D') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} not found`);
        return;
    }

    // Setup Scene
    scene = new THREE.Scene();
    
    // Setup Camera
    camera = new THREE.PerspectiveCamera(
        45, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
    );
    camera.position.z = 5;

    // Setup Renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Create Sphere with Two Hemispheres
    createHemisphereSphere();

    // Add Grid Lines
    addGridLines();

    // Raycaster for hover detection
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event Listeners
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onWindowResize);

    // Animation Loop
    animate();
}

/**
 * Create sphere with two colored hemispheres
 */
function createHemisphereSphere() {
    const radius = 1.8;
    const segments = 64;

    // Northern Hemisphere (Blue)
    const northGeometry = new THREE.SphereGeometry(
        radius, 
        segments, 
        segments, 
        0, 
        Math.PI * 2, 
        0, 
        Math.PI / 2
    );
    const northMaterial = new THREE.MeshPhongMaterial({
        color: 0xA1D4FF,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        shininess: 80,
        specular: 0x444444
    });
    const northHemisphere = new THREE.Mesh(northGeometry, northMaterial);
    northHemisphere.userData = { hemisphere: 'north' };

    // Southern Hemisphere (Yellow-Green)
    const southGeometry = new THREE.SphereGeometry(
        radius, 
        segments, 
        segments, 
        0, 
        Math.PI * 2, 
        Math.PI / 2, 
        Math.PI / 2
    );
    const southMaterial = new THREE.MeshPhongMaterial({
        color: 0xD8FF85,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        shininess: 80,
        specular: 0x444444
    });
    const southHemisphere = new THREE.Mesh(southGeometry, southMaterial);
    southHemisphere.userData = { hemisphere: 'south' };

    // Group hemispheres
    sphere = new THREE.Group();
    sphere.add(northHemisphere);
    sphere.add(southHemisphere);
    scene.add(sphere);

    // Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x86F5AF, 0.3);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);
}

/**
 * Add grid lines to sphere
 */
function addGridLines() {
    const radius = 1.82;
    const segments = 32;

    // Meridians
    for (let i = 0; i < 6; i++) {
        const curve = new THREE.EllipseCurve(
            0, 0,
            radius, radius,
            0, 2 * Math.PI,
            false,
            i * Math.PI / 6
        );
        const points = curve.getPoints(segments);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: 0.25 
        });
        const meridian = new THREE.Line(geometry, material);
        meridian.rotation.y = i * Math.PI / 6;
        meridian.rotation.x = Math.PI / 2;
        scene.add(meridian);
    }

    // Parallels (Latitudes)
    const latitudes = [Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4];
    latitudes.forEach(lat => {
        const r = radius * Math.sin(lat);
        const y = radius * Math.cos(lat);
        
        const curve = new THREE.EllipseCurve(
            0, 0, r, r,
            0, 2 * Math.PI,
            false, 0
        );
        const points = curve.getPoints(segments);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const isEquator = Math.abs(lat - Math.PI / 2) < 0.01;
        const material = new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: isEquator ? 0.4 : 0.25,
            linewidth: isEquator ? 2 : 1
        });
        
        const parallel = new THREE.Line(geometry, material);
        parallel.position.y = y;
        parallel.rotation.x = Math.PI / 2;
        scene.add(parallel);
    });
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Gentle rotation
    if (sphere && !isHovering) {
        sphere.rotation.y += 0.002;
    }
    
    renderer.render(scene, camera);
}

/**
 * Mouse move handler for hover detection
 */
function onMouseMove(event) {
    const container = document.getElementById('sphere3D');
    const rect = container.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(sphere.children, true);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        const hemisphere = object.userData.hemisphere;
        
        if (hemisphere !== currentHemisphere) {
            currentHemisphere = hemisphere;
            showLabel(hemisphere);
        }
        
        isHovering = true;
        document.body.style.cursor = 'pointer';
    } else {
        if (isHovering) {
            hideLabels();
            isHovering = false;
            currentHemisphere = null;
        }
        document.body.style.cursor = 'default';
    }
}

/**
 * Mouse leave handler
 */
function onMouseLeave() {
    hideLabels();
    isHovering = false;
    currentHemisphere = null;
    document.body.style.cursor = 'default';
}

/**
 * Show label for hemisphere
 */
function showLabel(hemisphere) {
    const northLabel = document.getElementById('northLabel');
    const southLabel = document.getElementById('southLabel');
    
    if (hemisphere === 'north') {
        northLabel.classList.add('visible');
        southLabel.classList.remove('visible');
    } else {
        southLabel.classList.add('visible');
        northLabel.classList.remove('visible');
    }
}

/**
 * Hide all labels
 */
function hideLabels() {
    const northLabel = document.getElementById('northLabel');
    const southLabel = document.getElementById('southLabel');
    northLabel.classList.remove('visible');
    southLabel.classList.remove('visible');
}

/**
 * Handle window resize
 */
function onWindowResize() {
    const container = document.getElementById('sphere3D');
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Clean up Three.js resources
 */
export function destroySphere3D() {
    if (renderer) {
        renderer.dispose();
        const container = document.getElementById('sphere3D');
        if (container && renderer.domElement) {
            container.removeChild(renderer.domElement);
        }
    }
    window.removeEventListener('resize', onWindowResize);
}
