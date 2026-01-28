import { version } from '../../package.json';
import * as THREE from 'three';
import { Tween, Easing } from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import { Element } from '../elements/Element.js';
import { ValueBarShape } from '../shapes/bar/ValueBarShape.js';
import { getColorForValue } from '../shapes/bar/ValueBarUtils.js';
import { Themes } from './DiagramConstants.js';


/**
 * Represents a 3D diagram using THREE.js.
 */
class Diagram {

    /**
     * Creates a new Diagram instance.
     * @param {HTMLElement} container - The HTML container element for the diagram.
     * @param {Object} [options={}] - Configuration options for the diagram.
     * @param {string} [options.theme='LIGHT'] - Initial theme for the diagram ('LIGHT' or 'DARK').
     */
    constructor(container, options = {}) {

        /**
         * The version of the aurea-eden library.
         * @type {string}
         */
        this.version = version;
        console.log(`Aurea EDEN library initialized v${this.version}`);

        // init Diagram features

        /**
         * Current theme of the diagram. Defaults to 'LIGHT'.
         * @type {string}
         */
        this.theme = options.theme || 'LIGHT';

        /**
         * Array of elements in the diagram.
         * @type {Array<Object3D>}
         */
        this.elements = [];

        /**
         * Array of connectors in the diagram.
         * @type {Array<Object3D>}
         */
        this.connectors = [];

        /**
         * Current mode of the diagram. Modes: 'EDIT', 'VIEW', 'ANALYZE'.
         * @type {string}
         */
        this.mode = options.mode || 'VIEW'; // 'VIEW', 'EDIT', 'ANALYZE'
        this.isTransitioning = false;
        /**
         * Whether helpers (axes, grid, etc.) are visible.
         * @type {boolean}
         */
        this.helpers = false;

        /**
         * Whether badges should be animated globally.
         * @type {boolean}
         */
        this.animateBadges = true;

        // init THREE.js features

        /**
         * The HTML container element for the diagram.
         * @type {HTMLElement}
         */
        this.container = container;

        this.initScene();
        this.initCamera();
        this.setHelpers(); // Optionally set helpers
        this.initRenderer();
        this.initLighting();
        this.initControls();
        this.addEventListeners();
        this.fitScreen(); // Establish initial camera state

        // Apply initial mode if it's not default VIEW (which is already set by above init calls)
        if (this.mode !== 'VIEW') {
            this.setMode(this.mode);
        }

        this.animate();
    }

    /**
     * Initializes the THREE.js scene.
     */
    initScene() {
        this.scene = new THREE.Scene();
        const themeConfig = Themes[this.theme] || Themes.LIGHT;
        this.scene.background = new THREE.Color(themeConfig.BACKGROUND);
    }

    /**
     * Initializes the camera with a perspective projection.
     */
    initCamera() {
        if (this.mode === 'VIEW') {
            this.enableOrthographicCamera();
        } else {
            this.enablePerspectiveCamera();
        }
    }

    // initCamera() { // Orthographic
    //     // const aspectRatio = this.container.clientWidth / window.innerHeight;
    //     const aspectRatio = window.innerWidth / window.innerHeight;
    //     const frustumSize = 100;
    //     this.camera = new THREE.OrthographicCamera(
    //         frustumSize * aspectRatio / -2, 
    //         frustumSize * aspectRatio / 2, 
    //         frustumSize / 2, 
    //         frustumSize / -2, 
    //         0.1, 
    //         1000
    //     );
    //     this.camera.position.set(0, 0, 50);
    // }

    enablePerspectiveCamera(sourceCamera) {
        // If we already have a perspective camera and no handoff from a DIFFERENT type is needed, keep it.
        if (this.camera && this.camera.isPerspectiveCamera && (!sourceCamera || sourceCamera === this.camera)) {
            if (this.controls) {
                this.controls.enableRotate = true;
                this.controls.update();
            }
            return;
        }

        const width = this.container.clientWidth || 1;
        const height = this.container.clientHeight || 1;
        const aspectRatio = width / height;
        const fov = 75;

        this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 2000);

        if (sourceCamera) {
            this.camera.position.copy(sourceCamera.position);
            this.camera.quaternion.copy(sourceCamera.quaternion);

            if (sourceCamera.isOrthographicCamera && this.controls) {
                // SEAMLESS HANDOFF (Ortho -> Perspective)
                const viewHeight = (sourceCamera.top - sourceCamera.bottom) / sourceCamera.zoom;
                const fovRad = THREE.MathUtils.degToRad(fov);
                const distance = viewHeight / (2 * Math.tan(fovRad / 2));

                const direction = new THREE.Vector3().subVectors(sourceCamera.position, this.controls.target).normalize();
                this.camera.position.copy(this.controls.target).addScaledVector(direction, distance);
                this.camera.lookAt(this.controls.target);
            }
        } else {
            this.camera.position.set(0, 0, 500);
        }

        this.camera.updateProjectionMatrix();

        if (this.controls) {
            const oldTarget = this.controls.target.clone();
            this.controls.object = this.camera;
            this.controls.target.copy(oldTarget);
            this.controls.enableRotate = true;
            this.controls.update();
        }
    }

    enableOrthographicCamera(sourceCamera) {
        // If we already have an orthographic camera and no handoff from a DIFFERENT type is needed, keep it.
        if (this.camera && this.camera.isOrthographicCamera && (!sourceCamera || sourceCamera === this.camera)) {
            if (this.controls) {
                this.controls.enableRotate = false;
                this.controls.update();
            }
            return;
        }

        const width = this.container.clientWidth || 1;
        const height = this.container.clientHeight || 1;
        const aspectRatio = width / height;

        let frustumSize = 1000;

        if (sourceCamera && sourceCamera.isPerspectiveCamera && this.controls) {
            // SEAMLESS HANDOFF (Perspective -> Ortho)
            const distance = sourceCamera.position.distanceTo(this.controls.target);
            const fovRad = THREE.MathUtils.degToRad(sourceCamera.fov);
            frustumSize = 2 * distance * Math.tan(fovRad / 2);

            this.camera = new THREE.OrthographicCamera(
                frustumSize * aspectRatio / -2,
                frustumSize * aspectRatio / 2,
                frustumSize / 2,
                frustumSize / -2,
                0.1,
                2000
            );

            this.camera.position.copy(sourceCamera.position);
            this.camera.quaternion.copy(sourceCamera.quaternion);
            this.camera.lookAt(this.controls.target);
        } else {
            this.camera = new THREE.OrthographicCamera(
                frustumSize * aspectRatio / -2,
                frustumSize * aspectRatio / 2,
                frustumSize / 2,
                frustumSize / -2,
                0.1,
                2000
            );
            this.camera.position.set(0, 0, 1000);
        }

        this.camera.updateProjectionMatrix();

        if (this.controls) {
            const oldTarget = this.controls.target.clone();
            this.controls.object = this.camera;
            this.controls.target.copy(oldTarget);
            this.controls.enableRotate = false;
            this.controls.update();
        }
    }

    /**
     * Sets up helpers (axes, grid, etc.) for the scene.
     */
    setHelpers() {
        this.axesHelper = new THREE.AxesHelper(100);
        this.cameraHelper = new THREE.CameraHelper(this.camera);
        const size = 400;
        const divisions = 50;
        this.gridHelper = new THREE.GridHelper(size, divisions);
        // Set camera helper - define cameraDirection and span variables
        this.cameraDirection = new THREE.Vector3()
        this.camPositionSpan = document.querySelector("#position"); // set the spans with the queried HTML DOM elements
        this.camLookAtSpan = document.querySelector("#lookingAt");

        this.helpers = false;
    }

    /**
     * Shows the helpers in the scene.
     */
    showHelpers() {
        if (!this.helpers) {
            this.scene.add(this.axesHelper);
            this.scene.add(this.cameraHelper);
            this.scene.add(this.gridHelper);
            this.helpers = true;
        }
    }

    /**
     * Hides the helpers in the scene.
     */
    hideHelpers() {
        if (this.helpers) {
            this.scene.remove(this.axesHelper);
            this.scene.remove(this.cameraHelper);
            this.scene.remove(this.gridHelper);
            this.helpers = false;
        }
    }

    /**
     * Initializes the renderer and attaches it to the container.
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        // Set size to match the specific container
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

        // Append to the specific container
        this.container.appendChild(this.renderer.domElement);

    }

    /**
     * Initializes the lighting for the scene.
     */
    initLighting() {

        // Main light
        let mainLightColor = 0xffffff; // white
        let mainLightIntensity = 4.0; // twice as bright as default
        let mainLightDistance = 0 // infinite range
        let mainLightDecay = 0 // no falloff
        const mainLight = new THREE.PointLight(mainLightColor, mainLightIntensity, mainLightDistance, mainLightDecay);
        // for diagram size { "x": 580, "y": 209, "z": 3.3 }
        let mainLightPosX = (-1 * (580 / 2)) + ((1 / 3) * 580); // Proportion 1/3 : 2/3
        let mainLightPosY = -1 * 209 * 4; // Below the diagram at the distance of 4 diagram height
        let mainLightPosZ = Math.abs(mainLightPosY); // The elevation is the same as the absolute Y distance
        mainLight.position.set(mainLightPosX, mainLightPosY, mainLightPosZ);
        this.scene.add(mainLight);

        // spot light
        this.spotLight = new THREE.PointLight(0xffffff, 4, 0, 0);
        this.spotLightPosX = 0; // Centered on the X axis. This will be moved in the animete() method.
        this.spotLightPosY = (-1 * 209) - 300; // Below the diagram at the distance of 500 points
        this.spotLightPosZ = 70;
        // this.spotLight.position.set(spotLightPosX, spotLightPosY, spotLightPosZ);
        this.scene.add(this.spotLight);
        this.spotLightDirection = 1;

        // Ambient light to ensure everything is at least partially visible
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    }

    /**
     * Initializes the controls for the camera.
     */
    initControls() {
        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = false; // Disabled as per user request
        this.controls.dampingFactor = 0.1;
        this.controls.screenSpacePanning = true;
        this.controls.zoomToCursor = true;

        // Ensure rotation is disabled for initial VIEW mode
        if (this.mode === 'VIEW') {
            this.controls.enableRotate = false;
        }

        this.controls.saveState();
    }

    /**
     * Adds event listeners for window resize and other interactions.
     */
    addEventListeners() {
        // Bind and store the resize handler so we can remove it later
        this._boundOnWindowResize = this.onWindowResize.bind(this);
        window.addEventListener('resize', this._boundOnWindowResize, false);

        // Also use ResizeObserver for container-level resizing (more robust)
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                // Throttle/Debounce could be added here if needed
                this.onWindowResize();
            });
            this.resizeObserver.observe(this.container);
        }
    }

    // onDocumentMouseDown(event) {
    //     this.isDragging = true;
    //     this.previousMousePosition = { x: event.offsetX, y: event.offsetY };
    // }

    // onDocumentMouseMove(event) {
    //    if (this.isDragging && this.mugGroup) {
    //       const deltaMove = {
    //          x: event.offsetX - this.previousMousePosition.x,
    //          y: event.offsetY - this.previousMousePosition.y
    //       };

    //       let rotateAngleX = this.toRadians(deltaMove.y * 1);
    //       let rotateAngleY = this.toRadians(deltaMove.x * 1);

    //       this.currentRotation = this.currentRotation || { x: 0, y: 0 };
    //       this.currentRotation.x += rotateAngleX;
    //       this.currentRotation.y += rotateAngleY;

    //       const maxRotation = Math.PI / 2;
    //       this.currentRotation.x = Math.min(Math.max(this.currentRotation.x, -maxRotation), maxRotation);

    //       this.pivotGroup.rotation.x = this.currentRotation.x;
    //       this.pivotGroup.rotation.y = this.currentRotation.y;

    //       this.previousMousePosition = { x: event.offsetX, y: event.offsetY };
    //    }
    // }

    // onDocumentMouseUp() {
    //    this.isDragging = false;
    // }

    // toRadians(angle) {
    //    return angle * (Math.PI / 180);
    // }

    /**
     * Handles window resize events to update the camera and renderer.
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        if (width === 0 || height === 0) return;

        const aspect = width / height;

        if (this.camera.isPerspectiveCamera) {
            this.camera.aspect = aspect;
        } else if (this.camera.isOrthographicCamera) {
            // Maintain local zoom/scale by preserving frustum height
            const currentHeight = this.camera.top - this.camera.bottom;
            this.camera.left = -currentHeight * aspect / 2;
            this.camera.right = currentHeight * aspect / 2;
        }

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Animates the scene and updates controls.
     */
    animate() {
        if (this.tween) this.tween.update();
        if (this.analysisTweens) {
            this.analysisTweens.forEach(t => t.update());
        }
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        this.controls.update();

        if (this.mode === 'ANALYZE') {
            this.elements.forEach(element => {
                if (element.texts && element.texts.length > 0) {
                    element.texts.forEach(textInfo => {
                        if (textInfo.faceCamera) {
                            textInfo.element.quaternion.copy(this.camera.quaternion);
                        }
                    });
                }
            });
        }

        // Spin elements with userData.spin = true (e.g. SVG badges)
        this.elements.forEach(element => {
            if (element.badges && element.badges.length > 0) {
                element.badges.forEach(badge => {
                    // Check if global animation is on AND badge is set to spin
                    if (this.animateBadges && badge.element.userData.spin) {
                        badge.element.rotation.y += 0.05;
                    }
                });
            }
        });

        this.renderer.render(this.scene, this.camera);

        // Animate spot light
        if (this.spotLightPosX > 500) {
            this.spotLightDirection = -1;
            this.spotLightPosX = 500;
        }
        if (this.spotLightPosX < -500) {
            this.spotLightDirection = 1;
            this.spotLightPosX = -500;
        }
        this.spotLightPosX += 10 * this.spotLightDirection;
        this.spotLight.position.set(this.spotLightPosX, this.spotLightPosY, this.spotLightPosZ);
    }

    dispose() {
        cancelAnimationFrame(this.animationFrameId);

        // Remove event listeners
        if (this._boundOnWindowResize) {
            window.removeEventListener('resize', this._boundOnWindowResize);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }

        if (this.scene) {
            this.scene.traverse(object => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    } else {
                        // for an array of materials
                        for (const material of object.material) {
                            material.dispose();
                        }
                    }
                }
            });
        }
    }

    reset() {
        if (this.isTransitioning) {
            if (this.tween) this.tween.stop();
            if (this.analysisTweens) {
                this.analysisTweens.forEach(t => t.stop());
            }
            this.isTransitioning = false;
        }

        this.hideHelpers();
        this.removeValueBars();
        this._resetElementStates();

        if (this.mode === 'ANALYZE' || this.camera.isPerspectiveCamera) {
            this.mode = 'VIEW';
            this.enableOrthographicCamera(this.camera);
        }

        // Recalculate optimal fit for current elements before gliding home
        this.fitScreen({ apply: false });

        this.center();
    }


    // ================================================================
    //   Diagram arrangement
    // ================================================================

    /**
     * Calculates the bounding box of the diagram elements and connectors,
     * excluding lights and helpers.
     * @returns {THREE.Box3} The bounding box of the diagram content.
     */
    getDiagramBounds() {
        const box = new THREE.Box3();
        if (this.elements.length === 0 && this.connectors.length === 0) {
            return box;
        }

        // Force a world matrix update before calculating bounds to ensure local->world transforms are current
        this.scene.updateMatrixWorld(true);

        const expandByObject = (obj) => {
            // Skip helpers and invisible branches
            if (!obj.visible || obj.isHelper === true) return;

            // If the object has its own geometry (Mesh, Line, etc.), add its world-space bounds
            if (obj.geometry) {
                if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
                const objBox = obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld);
                if (isFinite(objBox.min.x)) {
                    box.union(objBox);
                }
            }

            // Recurse into children
            if (obj.children && obj.children.length > 0) {
                obj.children.forEach(child => expandByObject(child));
            }
        };

        this.elements.forEach(element => expandByObject(element));
        this.connectors.forEach(connector => expandByObject(connector));

        return box;
    }

    arrange() {
        // 
        // The method calculates the center of the diagram and moves all elements to center the diagram at {0, 0, 0}.
        // It also calculates the camera Z position to place the camera above the center.
        // Finally, it updates the controls target and updates the controls.
        if (this.elements.length === 0 && this.connectors.length === 0) {
            console.warn('Scene is empty (no elements/connectors). Cannot calculate center.');
            return;
        }

        const box = this.getDiagramBounds();
        const center = box.getCenter(new THREE.Vector3());

        // Translate all elements to center the diagram at {0, 0, 0}
        // We only move elements and connectors, leaving lights/camera static relative to world
        const translation = new THREE.Vector3(-center.x, -center.y, -center.z);

        this.elements.forEach(element => {
            element.position.add(translation);
            element.updateMatrixWorld(true);
        });

        this.connectors.forEach(connector => {
            connector.position.add(translation);
            connector.updateMatrixWorld(true);
        });
    }

    /**
     * Calculates the optimal zoom distance for the camera to ensure the entire scene is visible.
     * Note: This primarily returns a distance useful for PerspectiveCamera positioning.
     * 
     * @returns {number} The optimal distance for the camera to fit the scene within the viewport.
     */
    calculateOptimalZoom() {
        const box = this.getDiagramBounds();
        if (box.isEmpty() || !isFinite(box.min.x)) {
            return 500; // Default distance if empty
        }

        const size = box.getSize(new THREE.Vector3());
        const width = this.container.clientWidth || 1;
        const height = this.container.clientHeight || 1;
        const aspect = width / height;

        if (this.camera.isPerspectiveCamera) {
            const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
            const distanceForWidth = (size.x / 2) / (Math.tan(fovRad / 2) * aspect);
            const distanceForHeight = (size.y / 2) / Math.tan(fovRad / 2);
            return Math.max(distanceForWidth, distanceForHeight);
        } else {
            // For Orthographic, distance doesn't affect scale, but we return a safe Z distance
            return 1000;
        }
    }

    /**
     * Adjusts the camera to fit the entire scene within the screen.
     * 
     * This method calculates the required distance or frustum bounds to ensure
     * that all diagram elements and connectors are visible, with a small margin.
     * It handles both Perspective and Orthographic cameras at any orientation.
     * 
     * @param {Object} [options={}] - Options for fitting the screen.
     * @param {boolean} [options.apply=true] - Whether to apply the calculated state to the camera immediately.
     * @returns {Object|null} The calculated target state if apply is false, otherwise null.
     */
    fitScreen(options = { apply: true }) {
        const box = this.getDiagramBounds();
        if (box.isEmpty() || !isFinite(box.min.x)) return;

        const center = box.getCenter(new THREE.Vector3());
        const width = this.container.clientWidth || 1;
        const height = this.container.clientHeight || 1;
        const aspect = width / height;
        const margin = 1.1; // 10% margin

        // Ensure the camera is looking at the center before we calculate distances
        if (options.apply) {
            if (this.controls) {
                this.controls.target.copy(center);
                this.controls.update();
            } else {
                this.camera.lookAt(center);
            }
        }

        const targetState = {
            position: new THREE.Vector3(),
            target: center.clone(),
            ortho: null
        };

        if (this.camera.isPerspectiveCamera) {
            // Robust fit for PerspectiveCamera:
            // Calculate required distance to fit all 8 corners of the bounding box.
            const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
            const tanHalfVfov = Math.tan(fovRad / 2);
            const tanHalfHfov = tanHalfVfov * aspect;

            // Get camera orientation
            const cameraRotation = this.camera.quaternion.clone();
            const invRotation = cameraRotation.clone().invert();

            let maxDistance = 0;
            const corners = [
                new THREE.Vector3(box.min.x, box.min.y, box.min.z),
                new THREE.Vector3(box.min.x, box.min.y, box.max.z),
                new THREE.Vector3(box.min.x, box.max.y, box.min.z),
                new THREE.Vector3(box.min.x, box.max.y, box.max.z),
                new THREE.Vector3(box.max.x, box.min.y, box.min.z),
                new THREE.Vector3(box.max.x, box.min.y, box.max.z),
                new THREE.Vector3(box.max.x, box.max.y, box.min.z),
                new THREE.Vector3(box.max.x, box.max.y, box.max.z)
            ];

            corners.forEach(corner => {
                // Transform corner to camera-local space (relative to the target/center)
                const relCorner = corner.clone().sub(center);
                const localCorner = relCorner.applyQuaternion(invRotation);

                // In camera space: x is right, y is up, z is forward (looking down -Z)
                // Condition: |x| / |z_dist - localZ| <= tan(hFOV/2)
                // distance >= localZ + |x| / tan(hFOV/2)
                const dX = localCorner.z + Math.abs(localCorner.x) / tanHalfHfov;
                const dY = localCorner.z + Math.abs(localCorner.y) / tanHalfVfov;
                maxDistance = Math.max(maxDistance, dX, dY);
            });

            const finalDistance = maxDistance * margin;

            // Position camera back from the center along its current direction
            const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(cameraRotation);
            targetState.position.copy(center).add(direction.multiplyScalar(finalDistance));

            if (options.apply) {
                this.camera.position.copy(targetState.position);
                this.camera.lookAt(center);
            }

        } else if (this.camera.isOrthographicCamera) {
            const size = box.getSize(new THREE.Vector3());
            const requiredWidth = size.x * margin;
            const requiredHeight = size.y * margin;

            let viewWidth, viewHeight;
            if (requiredWidth / requiredHeight > aspect) {
                viewWidth = requiredWidth;
                viewHeight = requiredWidth / aspect;
            } else {
                viewHeight = requiredHeight;
                viewWidth = requiredHeight * aspect;
            }

            targetState.ortho = {
                left: -viewWidth / 2,
                right: viewWidth / 2,
                top: viewHeight / 2,
                bottom: -viewHeight / 2,
                zoom: 1
            };
            targetState.position.set(center.x, center.y, 1000);

            if (options.apply) {
                this.camera.left = targetState.ortho.left;
                this.camera.right = targetState.ortho.right;
                this.camera.top = targetState.ortho.top;
                this.camera.bottom = targetState.ortho.bottom;
                this.camera.zoom = targetState.ortho.zoom;
                this.camera.position.set(center.x, center.y, 1000);
                this.camera.lookAt(center);
            }
        }

        if (options.apply) {
            this.camera.updateProjectionMatrix();

            if (this.controls) {
                this.controls.update();
                this.controls.saveState();
            }
        }

        this.initialCameraPosition = targetState.position.clone();
        this.initialTarget = targetState.target.clone();
        if (targetState.ortho) {
            this.initialOrtho = targetState.ortho;
        }

        return targetState;
    }

    /**
     * Centers the diagram by moving the camera to its initial position and target.
     * This method uses the Tween.js library to animate the camera movement.
     * 
     * Preconditions:
     * - `this.initialCameraPosition` and `this.initialTarget` must be defined.
     * 
     * Behavior:
     * - If the initial camera position or target is not defined, a warning is logged, and the method exits.
     * - Animates the camera's position and the controls' target to their initial states over 1200 milliseconds.
     * - Uses a Quartic easing function for smooth animation.
     * 
     * Dependencies:
     * - Tween.js library for animation.
     * 
     * @returns {void}
     */
    center() {
        // The method centers the diagram by moving the camera to its initial state (as calculated by the fitScreen() method).
        // It also uses the Tween.js library to animate the camera movement.
        if (!this.initialCameraPosition || !this.initialTarget) {
            console.warn('Initial camera position or target is not defined.');
            return;
        }

        const from = {
            cameraPositionX: this.camera.position.x,
            cameraPositionY: this.camera.position.y,
            cameraPositionZ: this.camera.position.z,
            controlsTargetX: this.controls.target.x,
            controlsTargetY: this.controls.target.y,
            controlsTargetZ: this.controls.target.z,
            orthoTop: this.camera.isOrthographicCamera ? this.camera.top : 1000
        };
        const to = {
            cameraPositionX: this.initialCameraPosition.x,
            cameraPositionY: this.initialCameraPosition.y,
            cameraPositionZ: this.initialCameraPosition.z,
            controlsTargetX: this.initialTarget.x,
            controlsTargetY: this.initialTarget.y,
            controlsTargetZ: this.initialTarget.z,
            orthoTop: this.initialOrtho ? this.initialOrtho.top : from.orthoTop
        };

        const camera = this.camera;
        const controls = this.controls;

        this.tween = new Tween(from)
            .to(to, 1200)
            .easing(Easing.Quartic.Out)
            .onUpdate(function () {
                camera.position.set(
                    from.cameraPositionX,
                    from.cameraPositionY,
                    from.cameraPositionZ
                );
                controls.target.set(
                    from.controlsTargetX,
                    from.controlsTargetY,
                    from.controlsTargetZ
                );

                if (camera.isOrthographicCamera) {
                    const aspect = (camera.right - camera.left) / (camera.top - camera.bottom);
                    camera.top = from.orthoTop;
                    camera.bottom = -from.orthoTop;
                    camera.left = -from.orthoTop * aspect;
                    camera.right = from.orthoTop * aspect;
                    camera.updateProjectionMatrix();
                }

                controls.update();
            })
            .onComplete(function () {
                // Final sync and state save
                controls.update();
                controls.saveState();
            })
            .start();
    }

    /**
     * Rotates the diagram around the Y axis by a specified angle in degrees.
     * The method ensures the diagram is centered and calculates the new camera
     * and target positions based on the provided angle.
     *
     * @param {number} targetAngle - The angle in degrees to rotate the diagram (e.g., 60).
     * @param {function} [onCompleteCallback] - Callback function to execute after the rotation animation completes.
     * @returns {void} - Does not return a value.
     * 
     * @throws {Error} Logs a warning if the initial camera position or target is not defined.
     *
     * @example
     * // Rotate the diagram by 60 degrees
     * diagram.rotate(60);
     */
    rotate(targetAngle, onCompleteCallback) {
        if (!this.controls) return;

        // Use CURRENT target and CURRENT distance for relative rotation
        const currentTarget = this.controls.target;
        const radius = this.camera.position.distanceTo(currentTarget);

        const from = {
            cameraPositionX: this.camera.position.x,
            cameraPositionY: this.camera.position.y,
            cameraPositionZ: this.camera.position.z,
            controlsTargetX: currentTarget.x,
            controlsTargetY: currentTarget.y,
            controlsTargetZ: currentTarget.z
        };

        const targetAngleRad = THREE.MathUtils.degToRad(targetAngle);

        // Calculate the new Y and Z relative to the CURRENT target
        // We preserve the X offset (cameraPositionX - currentTarget.x) if any
        const xOffset = from.cameraPositionX - currentTarget.x;
        const to = {
            cameraPositionX: currentTarget.x + xOffset,
            cameraPositionY: currentTarget.y + radius * Math.sin(targetAngleRad),
            cameraPositionZ: currentTarget.z + radius * Math.cos(targetAngleRad),
            controlsTargetX: currentTarget.x,
            controlsTargetY: currentTarget.y,
            controlsTargetZ: currentTarget.z
        };

        const camera = this.camera;
        const controls = this.controls;

        this.tween = new Tween(from)
            .to(to, 1200)
            .easing(Easing.Quartic.Out)
            .onUpdate(function () {
                camera.position.set(from.cameraPositionX, from.cameraPositionY, from.cameraPositionZ);
                controls.target.set(from.controlsTargetX, from.controlsTargetY, from.controlsTargetZ);
                controls.update(); // CRITICAL: Apply the changes to the controls/camera
            })
            .onComplete(function () {
                if (onCompleteCallback) onCompleteCallback();
            })
            .start();
    }

    // ================================================================
    //   Diagram modes
    // ================================================================

    /**
     * Removes all elements of type 'ValueBarShape' from the diagram.
     * Iterates through the `elements` array in reverse order to safely remove
     * elements without affecting the iteration process. For each matching element,
     * it removes the element from its parent (and thus from the scene) and also 
     * removes it from the `elements` array.
     */
    removeValueBars() {
        // Stop any ongoing analysis tweens
        if (this.analysisTweens) {
            this.analysisTweens.forEach(t => t.stop());
            this.analysisTweens = [];
        }

        // 1. Identify all objects to remove (bars and sprite labels)
        const objectsToRemove = new Set();

        this.elements.forEach(element => {
            if (element.valueBars && element.valueBars.length > 0) {
                element.valueBars.forEach(barInfo => {
                    objectsToRemove.add(barInfo.element);
                });
                element.valueBars = [];
            }
        });

        // 2. Identify standalone elements that are ValueBarShapes (backup)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (element.shape instanceof ValueBarShape) {
                objectsToRemove.add(element);
                if (element.texts && element.texts.length > 0) {
                    element.texts.forEach(textInfo => {
                        objectsToRemove.add(textInfo.element);
                    });
                }
            }
        }

        // 3. Remove them from the scene and dispose of resources
        objectsToRemove.forEach(obj => {
            this.scene.remove(obj);

            // Dispose of sprite resources
            if (obj.isSprite && obj.material) {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
            // Note: Element.js currently doesn't have a dispose method, but we check just in case
            if (obj.dispose) obj.dispose();
        });

        // 4. Update elements list
        this.elements = this.elements.filter(el => !objectsToRemove.has(el));
    }

    /**
     * Animates the value bars sinking back into the elements.
     * @param {Function} onComplete - Callback when the animation finishes
     */
    animateValueBarsOut(onComplete) {
        if (!this.analysisTweens || this.analysisTweens.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        // Stop current analysis tweens (they were for rising)
        this.analysisTweens.forEach(t => t.stop());
        this.analysisTweens = [];

        const barsToAnimate = [];
        this.elements.forEach(el => {
            if (el.valueBars && el.valueBars.length > 0) {
                // Find the main bar element and the sprite label
                const barInfo = el.valueBars.find(b => !b.isSpriteLabel);
                const spriteInfo = el.valueBars.find(b => b.isSpriteLabel);

                if (barInfo) {
                    barsToAnimate.push({
                        barElement: barInfo.element,
                        spriteLabel: spriteInfo ? spriteInfo.element : null
                    });
                }
            }
        });

        if (barsToAnimate.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        let animatedComponentsCount = 0;
        const totalComponents = barsToAnimate.length * 3; // Bar sink, Label crash, Label fade

        barsToAnimate.forEach(info => {
            const barElement = info.barElement;
            const spriteLabel = info.spriteLabel;

            // Stage 1: Bar sinks while label stays in air
            const barState = { progress: 1 };
            const barTween = new Tween(barState)
                .to({ progress: 0 }, 800)
                .easing(Easing.Quartic.In)
                .onUpdate(() => {
                    barElement.scale.z = barState.progress;
                })
                .onComplete(() => {
                    // Step 1.5: Immediate Removal of the bar mesh
                    this.scene.remove(barElement);
                    const idx = this.elements.indexOf(barElement);
                    if (idx !== -1) {
                        this.elements.splice(idx, 1);
                    }
                    if (barElement.dispose) barElement.dispose();

                    animatedComponentsCount++;
                    if (!spriteLabel) {
                        animatedComponentsCount += 2; // Skip stage 2 and 3
                        if (animatedComponentsCount >= totalComponents && onComplete) onComplete();
                        return;
                    }

                    // Stage 2: Label crashes down and bounces once
                    const startZ = spriteLabel.position.z;
                    const fallDuration = 600;
                    const bounceDuration = 600;
                    const impactZ = 12;
                    const bounceZ = 60;

                    const fallState = { z: startZ };
                    const fallTween = new Tween(fallState)
                        .to({ z: impactZ }, fallDuration)
                        .delay(200) // The "spectacular hang"
                        .easing(Easing.Quadratic.In) // Accelerate down
                        .onUpdate(() => {
                            spriteLabel.position.z = fallState.z;
                        })
                        .onComplete(() => {
                            animatedComponentsCount++; // Fall complete

                            // Stage 3: Bounce Up and Fade simultaneously
                            const bounceState = { z: impactZ, opacity: 1 };
                            const bounceTween = new Tween(bounceState)
                                .to({ z: bounceZ, opacity: 0 }, bounceDuration)
                                .easing(Easing.Quadratic.Out) // Decelerate upward
                                .onUpdate(() => {
                                    spriteLabel.position.z = bounceState.z;
                                    if (spriteLabel.material) {
                                        spriteLabel.material.opacity = bounceState.opacity;
                                    }
                                })
                                .onComplete(() => {
                                    this.scene.remove(spriteLabel);
                                    if (spriteLabel.material) {
                                        if (spriteLabel.material.map) spriteLabel.material.map.dispose();
                                        spriteLabel.material.dispose();
                                    }

                                    animatedComponentsCount++; // Bounce/Fade complete
                                    if (animatedComponentsCount >= totalComponents && onComplete) onComplete();
                                })
                                .start();

                            this.analysisTweens.push(bounceTween);
                        })
                        .start();

                    this.analysisTweens.push(fallTween);
                })
                .start();

            this.analysisTweens.push(barTween);
        });

        // Also sink all original element labels back to 0
        this.elements.forEach(element => {
            if (element.texts && element.texts.length > 0) {
                element.texts.forEach(textInfo => {
                    const textElement = textInfo.element;
                    const startZ = textElement.position.z;
                    if (startZ === 0) return;

                    const animationState = { progress: 1 };
                    const textTween = new Tween(animationState)
                        .to({ progress: 0 }, 800)
                        .easing(Easing.Quartic.In)
                        .onUpdate(() => {
                            textElement.position.z = startZ * animationState.progress;
                        })
                        .start();
                    this.analysisTweens.push(textTween);
                });
            }
        });
    }

    /**
     * Internal method to initialize and animate the value bars for ANALYZE mode.
     * @private
     */
    _initAnalyzeBars() {
        const elementsWithValue = this.elements.filter(el => el.parameters && el.parameters.value !== undefined);
        if (elementsWithValue.length === 0) {
            return;
        }

        const values = elementsWithValue.map(el => el.parameters.value);
        const dataMax = Math.max(...values);
        const dataMin = Math.min(...values);

        this.analysisTweens = [];

        elementsWithValue.forEach(element => {
            const originalValue = element.parameters.value;

            // 1. Calculate height based on a 0-max range to preserve visual proportions.
            const normalizedHeight = (dataMax === 0) ? 0 : (originalValue / dataMax);
            const barHeight = normalizedHeight * 100;

            const color = getColorForValue(originalValue, dataMin, dataMax);
            const isDark = this.theme === 'DARK';
            const themeConfig = Themes[this.theme];

            // Unified Cyan in Dark Mode, Data-driven in Light Mode
            const barColor = isDark ? new THREE.Color(0x00ffff) : color;


            // 3. Create the bar with the correct height and color.
            const barShape = new ValueBarShape(element.shape.getOuterShape(), barHeight, barColor, this.theme);
            const barElement = new Element(element.elementId + '_bar', barShape);
            barElement.themable = false; // Prevent theme overrides from destroying data-driven color

            this.addElement(barElement).positionAt(element.getPosition());
            element.valueBars.push({ element: barElement, positionOffset: new THREE.Vector3(0, 0, 0) });

            // 4. Create Sprite Label
            // HUD-style bubble system
            const textOffsetZ = barHeight + 12;
            const textOffset = new THREE.Vector3(0, 0, textOffsetZ);
            const taskType = element.userData.taskType;
            const dataColor = getColorForValue(0, dataMin, dataMax);
            const hsl = {};
            dataColor.getHSL(hsl);
            dataColor.setHSL(hsl.h, hsl.s, 0.6); // Vibrant, saturated color
            const labelColor = dataColor.getStyle();

            const bubbleBg = isDark ? 'rgba(10, 12, 16, 0.96)' : 'rgba(20, 22, 26, 0.92)';

            const spriteLabel = element.addSpriteLabel("0", textOffset, {
                taskType: taskType,
                color: labelColor,
                bgColor: bubbleBg,
                borderColor: null,
                borderRadius: 12
            });

            // Calculate minimum Z height to avoid overlap with main element labels
            let minZ = 0;
            if (element.texts && element.texts.length > 0) {
                element.texts.forEach(t => {
                    const labelTop = t.element.position.z + 10;
                    if (labelTop > minZ) minZ = labelTop;
                });
                minZ += 15; // Extra safety margin
            }

            // Initialize Animation State
            const startZ = Math.max(0 + 5, minZ); // Start at valid min
            barElement.scale.z = 0; // Start flat
            spriteLabel.position.z = startZ;

            const animationState = { progress: 0 };

            const tween = new Tween(animationState)
                .to({ progress: 1 }, 1500) // 1.5 seconds duration
                .easing(Easing.Quartic.Out)
                .onUpdate(() => {
                    const p = animationState.progress;

                    // Animate Bar Height
                    barElement.scale.z = p;

                    // Animate Sprite Position
                    const barTopTextZ = (barHeight * p) + 12;
                    spriteLabel.position.z = Math.max(barTopTextZ, minZ);

                    // Animate Label Value
                    const currentValue = Math.round(originalValue * p);
                    const dataColor = getColorForValue(currentValue, dataMin, dataMax);
                    const hsl = {};
                    dataColor.getHSL(hsl);
                    dataColor.setHSL(hsl.h, hsl.s, 0.6); // Vibrant, saturated color

                    element.updateSpriteLabel(spriteLabel, currentValue.toString(), dataColor.getStyle());
                })
                .start();

            this.analysisTweens.push(tween);
        });
    }

    /**
     * Adds value bars to the diagram to visualize the elements' parameters.
     * 
     * This method processes the elements in the diagram, calculates the height
     * of the bars based on their parameter values, and assigns a color to each
     * bar based on a normalized value. The bars are then added to the scene.
     * 
     * @method
     * @memberof Diagram
     * @description
     * - Filters elements to include only those with a defined `parameters.value`.
     * - Calculates the range of parameter values to normalize them.
     * - Assigns a color to each bar using an HSL color scale (green to red).
     * - Calls the `valueBar` method on each element to set the bar's height and color.
     * 
     * @example
     * // Assuming `diagram` is an instance of Diagram with elements having parameters:
     * diagram.addValueBars();
     * 
     * @throws {Error} If no elements with `parameters.value` are found.
     */
    addValueBars() {
        const elements = this.elements.filter(el => el.parameters && el.parameters.value !== undefined);
        if (elements.length === 0) {
            throw new Error('No elements with `parameters.value` found.');
        }
        const max = Math.max(...elements.map(el => el.parameters.value));
        const min = 0;
        const range = max - min;
        elements.forEach((element, i) => {
            const value = element.parameters.value;
            const normalizedValue = (value - min) / range;
            const color = new THREE.Color(`hsl(${(normalizedValue * 120).toString(10)}, 100%, 50%)`);
            element.addValueBar(normalizedValue * 100, color);
        });
    }

    /**
     * Sets the diagram theme and updates all elements.
     * @param {string} themeName - 'LIGHT' or 'DARK'
     */
    setTheme(themeName) {
        if (!Themes[themeName]) return;
        this.theme = themeName;
        const themeConfig = Themes[this.theme];

        // Update background
        if (this.scene) {
            this.scene.background.set(themeConfig.BACKGROUND);
        }

        // Update elements
        this.elements.forEach(el => this.applyThemeToElement(el));

        // Update connectors
        this.connectors.forEach(conn => this.applyThemeToConnector(conn));

        // Update specialized elements for ANALYZE mode if active
        if (this.mode === 'ANALYZE') {
            this._applyAnalyzeModeTheming();
        }
    }

    /**
     * Internal method to apply the current theme to a single element.
     */
    applyThemeToElement(el) {
        if (!el.themable || el.isTextElement) return;

        const themeConfig = Themes[this.theme];
        const strokeColor = (themeConfig.SEMANTIC_STROKE && themeConfig.SEMANTIC_STROKE[el.semanticType])
            || themeConfig.ELEMENT_STROKE;

        if (el.material && el.material.color) {
            el.material.color.set(strokeColor);
            if (el.material.emissive) {
                el.material.emissive.set(strokeColor);
            }
        }

        // Update sub-elements (texts, bars etc)
        // IMPORTANT: Only update text colors if the parent element itself is themable
        if (el.texts && el.themable) {
            el.texts.forEach(t => {
                const textColor = (themeConfig.SEMANTIC_TEXT && themeConfig.SEMANTIC_TEXT[el.semanticType])
                    || themeConfig.ELEMENT_TEXT;

                if (t.element && t.element.material && t.element.material.color) {
                    t.element.material.color.set(textColor);
                    if (t.element.material.emissive) {
                        t.element.material.emissive.set(textColor);
                    }
                }
            });
        }

        // Update lights in attachments if any (e.g. StarShape lights)
        if (el.shape && el.shape.attachment) {
            el.shape.attachment.traverse(obj => {
                if (obj.isPointLight) {
                    obj.color.set(strokeColor);
                }
            });
        }

        if (el.icons) {
            el.icons.forEach(i => {
                if (i.element && i.element.material && i.element.material.color) {
                    i.element.material.color.set(strokeColor);
                    if (i.element.material.emissive) {
                        i.element.material.emissive.set(strokeColor);
                    }
                }
            });
        }
    }

    /**
     * Internal method to apply the current theme to a single connector.
     */
    applyThemeToConnector(conn) {
        const themeConfig = Themes[this.theme];
        if (conn.material && conn.material.color) {
            conn.material.color.set(themeConfig.CONNECTOR);
            if (conn.material.emissive) {
                conn.material.emissive.set(themeConfig.CONNECTOR);
            }
        }
    }

    /**
     * Internal method to re-apply the specialized ANALYZE mode coloring.
     * @private
     */
    _applyAnalyzeModeTheming() {
        const themeConfig = Themes[this.theme];
        const isDark = (this.theme === 'DARK');
        const unifiedColor = new THREE.Color(0x00ffff); // Cyan

        const elementsWithValue = this.elements.filter(el => el.parameters && el.parameters.value !== undefined);
        const values = elementsWithValue.map(el => el.parameters.value);
        const dataMax = values.length > 0 ? Math.max(...values) : 0;
        const dataMin = values.length > 0 ? Math.min(...values) : 0;

        elementsWithValue.forEach(el => {
            if (el.valueBars && el.valueBars.length > 0) {
                const originalValue = el.parameters.value;
                const dataColor = getColorForValue(originalValue, dataMin, dataMax);
                const barColor = isDark ? unifiedColor : dataColor;

                el.valueBars.forEach(barInfo => {
                    const obj = barInfo.element;
                    if (barInfo.isSpriteLabel) {
                        const dataColorLabel = getColorForValue(originalValue, dataMin, dataMax);
                        const hsl = {};
                        dataColorLabel.getHSL(hsl);
                        dataColorLabel.setHSL(hsl.h, hsl.s, 0.6); // Vibrant, saturated color

                        // Enforce unified HUD style with theme-aware background
                        obj.userData.parameters.bgColor = isDark ? 'rgba(10, 12, 16, 0.96)' : 'rgba(20, 22, 26, 0.92)';
                        obj.userData.parameters.borderColor = null;

                        el.updateSpriteLabel(obj, obj.userData.text, dataColorLabel.getStyle());
                    } else if (obj.material) {
                        obj.material.color.set(barColor);
                        if (obj.material.emissive) {
                            obj.material.emissive.set(barColor);
                        }
                        obj.material.opacity = themeConfig.VALUE_BAR_OPACITY;
                        obj.material.emissiveIntensity = isDark ? 0.6 : 0;
                    }
                });
            }
        });
    }

    /**
     * Resets elements to their default (VIEW/EDIT) positions and visibility.
     * @private
     */
    _resetElementStates() {
        this.elements.forEach(element => {
            if (element.texts && element.texts.length > 0) {
                element.texts.forEach(textInfo => {
                    // Reset position
                    const originalPosition = element.getPosition().clone().add(textInfo.positionOffset);
                    textInfo.element.position.copy(originalPosition);
                    // Reset rotation to default (no rotation)
                    textInfo.element.quaternion.set(0, 0, 0, 1);
                    // Reset rendering properties
                    textInfo.element.renderOrder = 0;
                    if (textInfo.element.material) {
                        textInfo.element.material.depthTest = true;
                    }
                });
            }
            // Ensure badges are visible
            if (element.badges && element.badges.length > 0) {
                element.badges.forEach(badgeInfo => {
                    badgeInfo.element.visible = true;
                });
            }
        });
    }

    setMode(mode, onComplete) {
        if (this.mode === mode && !this.isTransitioning && !onComplete) return;

        // If a new mode is requested during transition, we stop current tweens and proceed
        if (this.isTransitioning) {
            if (this.tween) this.tween.stop();
            if (this.analysisTweens) {
                this.analysisTweens.forEach(t => t.stop());
            }
            this.isTransitioning = false;
        }

        // --- Sequence for ANALYZE exit: sink -> remove -> tilt -> show stars ---
        if (this.mode === 'ANALYZE' && (mode === 'VIEW' || mode === 'EDIT')) {
            this.isTransitioning = true;

            // Step 1: Sink bars
            this.animateValueBarsOut(() => {

                // Step 2: Remove bars
                this.removeValueBars();

                // Step 3: Tilt camera back
                this.rotate(0, () => {

                    // Step 4: Show stars and restore elements
                    this._resetElementStates();
                    const oldCamera = this.camera;
                    this.mode = mode;

                    // Sequence for ANALYZE exit JUMP switch with zoom-pop
                    const currentTarget = this.controls.target.clone();
                    let referenceHeight;
                    if (oldCamera.isPerspectiveCamera) {
                        const dist = oldCamera.position.distanceTo(currentTarget);
                        const fovRad = THREE.MathUtils.degToRad(oldCamera.fov);
                        referenceHeight = 2 * dist * Math.tan(fovRad / 2);
                    } else {
                        referenceHeight = (oldCamera.top - oldCamera.bottom) / oldCamera.zoom;
                    }

                    const zoomFactor = 1.02;
                    const jumpDuration = 400;

                    const animationState = { progress: 0 };
                    this.isTransitioning = true;

                    this.tween = new Tween(animationState)
                        .to({ progress: 1 }, jumpDuration)
                        .easing(Easing.Quadratic.InOut)
                        .onUpdate(() => {
                            const pop = Math.sin(animationState.progress * Math.PI);
                            const scale = 1 + (zoomFactor - 1) * pop;
                            const activeHeight = referenceHeight * scale;

                            if (animationState.progress >= 0.5 && this.camera === oldCamera) {
                                if (mode === 'VIEW') {
                                    this.enableOrthographicCamera(oldCamera);
                                } else if (mode === 'EDIT') {
                                    this.enablePerspectiveCamera(oldCamera);
                                }
                            }

                            if (this.camera.isPerspectiveCamera) {
                                const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
                                const dist = activeHeight / (2 * Math.tan(fovRad / 2));
                                const direction = new THREE.Vector3().subVectors(this.camera.position, currentTarget).normalize();
                                this.camera.position.copy(currentTarget).addScaledVector(direction, dist);
                            } else if (this.camera.isOrthographicCamera) {
                                const aspect = (this.container.clientWidth || 1) / (this.container.clientHeight || 1);
                                this.camera.left = -activeHeight * aspect / 2;
                                this.camera.right = activeHeight * aspect / 2;
                                this.camera.top = activeHeight / 2;
                                this.camera.bottom = -activeHeight / 2;
                            }
                            this.camera.updateProjectionMatrix();
                            this.controls.update();
                        })
                        .onComplete(() => {
                            this.isTransitioning = false;
                            this.controls.minAzimuthAngle = -Infinity;
                            this.controls.maxAzimuthAngle = Infinity;
                            if (this.controls) this.controls.saveState();
                            if (onComplete) onComplete();
                        });

                    this.tween.start();
                });
            });
            return;
        }

        // --- Sequence for ANALYZE entry: remove stars -> tilt -> raise bars ---
        if (mode === 'ANALYZE') {
            this.isTransitioning = true;
            this.removeValueBars(); // Clean start

            // Step 1: Remove stars (hide badges)
            this.elements.forEach(element => {
                if (element.badges && element.badges.length > 0) {
                    element.badges.forEach(badgeInfo => {
                        badgeInfo.element.visible = false;
                    });
                }
            });

            const oldCamera = this.camera;

            // Sequence for ANALYZE entry JUMP switch with zoom-pop
            const currentTarget = this.controls.target.clone();
            let referenceHeight;
            if (oldCamera.isPerspectiveCamera) {
                const dist = oldCamera.position.distanceTo(currentTarget);
                const fovRad = THREE.MathUtils.degToRad(oldCamera.fov);
                referenceHeight = 2 * dist * Math.tan(fovRad / 2);
            } else {
                referenceHeight = (oldCamera.top - oldCamera.bottom) / oldCamera.zoom;
            }

            const zoomFactor = 1.02;
            const jumpDuration = 400;

            const animationState = { progress: 0 };

            this.tween = new Tween(animationState)
                .to({ progress: 1 }, jumpDuration)
                .easing(Easing.Quadratic.InOut)
                .onUpdate(() => {
                    const pop = Math.sin(animationState.progress * Math.PI);
                    const scale = 1 + (zoomFactor - 1) * pop;
                    const activeHeight = referenceHeight * scale;

                    if (animationState.progress >= 0.5 && this.camera === oldCamera) {
                        this.enablePerspectiveCamera(oldCamera);
                        this.controls.minAzimuthAngle = 0;
                        this.controls.maxAzimuthAngle = 0;
                    }

                    if (this.camera.isPerspectiveCamera) {
                        const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
                        const dist = activeHeight / (2 * Math.tan(fovRad / 2));
                        const direction = new THREE.Vector3().subVectors(this.camera.position, currentTarget).normalize();
                        this.camera.position.copy(currentTarget).addScaledVector(direction, dist);
                    } else if (this.camera.isOrthographicCamera) {
                        const aspect = (this.container.clientWidth || 1) / (this.container.clientHeight || 1);
                        this.camera.left = -activeHeight * aspect / 2;
                        this.camera.right = activeHeight * aspect / 2;
                        this.camera.top = activeHeight / 2;
                        this.camera.bottom = -activeHeight / 2;
                    }
                    this.camera.updateProjectionMatrix();
                    this.controls.update();
                })
                .onComplete(() => {
                    // Step 2: Tilt camera
                    this.rotate(-65, () => {
                        // Adjust text positions for ANALYZE mode (sequential step 2.5)
                        this.elements.forEach(element => {
                            if (element.texts && element.texts.length > 0) {
                                element.texts.forEach(textInfo => {
                                    const textElement = textInfo.element;
                                    if (textInfo.faceCamera) {
                                        const elementPos = element.position;
                                        const zLift = textElement.getSize().z * 0.7;
                                        textElement.position.set(elementPos.x, elementPos.y, elementPos.z + zLift + 2);
                                        textElement.quaternion.copy(this.camera.quaternion);
                                    }
                                    textElement.renderOrder = 100;
                                    if (textElement.material) {
                                        textElement.material.depthTest = false;
                                    }
                                });
                            }
                        });

                        // Step 3: Raise bars
                        this._initAnalyzeBars();

                        this.mode = 'ANALYZE';
                        this.isTransitioning = false;
                        if (onComplete) onComplete();
                    });
                })
                .start();
            return;
        }

        // Standard VIEW/EDIT switch
        this.removeValueBars();
        this._resetElementStates();
        const oldCamera = this.camera;
        this.mode = mode;

        // --- Sequence for Standard JUMP switch with zoom-pop ---
        const currentTarget = this.controls.target.clone();
        let referenceHeight;
        if (oldCamera.isPerspectiveCamera) {
            const dist = oldCamera.position.distanceTo(currentTarget);
            const fovRad = THREE.MathUtils.degToRad(oldCamera.fov);
            referenceHeight = 2 * dist * Math.tan(fovRad / 2);
        } else {
            referenceHeight = (oldCamera.top - oldCamera.bottom) / oldCamera.zoom;
        }

        const zoomFactor = 1.02; // Pop out by 2%
        const jumpDuration = 400; // Fast pop

        const animationState = { progress: 0 };
        this.isTransitioning = true;

        this.tween = new Tween(animationState)
            .to({ progress: 1 }, jumpDuration)
            .easing(Easing.Quadratic.InOut)
            .onUpdate(() => {
                // Sinusoidal pop: 0 -> 1 -> 0
                const pop = Math.sin(animationState.progress * Math.PI);
                const scale = 1 + (zoomFactor - 1) * pop;
                const activeHeight = referenceHeight * scale;

                // At the peak of the jump (progress ~ 0.5), switch the projection
                if (animationState.progress >= 0.5 && this.camera === oldCamera) {
                    if (mode === 'VIEW') {
                        this.enableOrthographicCamera(oldCamera);
                    } else if (mode === 'EDIT') {
                        this.enablePerspectiveCamera(oldCamera);
                    }
                    this.controls.minAzimuthAngle = -Infinity;
                    this.controls.maxAzimuthAngle = Infinity;
                }

                // Apply zoom-pop to the CURRENT camera (the one enabled at the moment)
                if (this.camera.isPerspectiveCamera) {
                    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
                    const dist = activeHeight / (2 * Math.tan(fovRad / 2));
                    const direction = new THREE.Vector3().subVectors(this.camera.position, currentTarget).normalize();
                    this.camera.position.copy(currentTarget).addScaledVector(direction, dist);
                } else if (this.camera.isOrthographicCamera) {
                    const aspect = (this.container.clientWidth || 1) / (this.container.clientHeight || 1);
                    this.camera.left = -activeHeight * aspect / 2;
                    this.camera.right = activeHeight * aspect / 2;
                    this.camera.top = activeHeight / 2;
                    this.camera.bottom = -activeHeight / 2;
                }
                this.camera.updateProjectionMatrix();
                this.controls.update();
            })
            .onComplete(() => {
                this.isTransitioning = false;
                this.rotate(0, onComplete);
            })
            .start();
    }

    // ================================================================
    //   Diagram elements
    // ================================================================

    /**
     * Adds an element to the diagram.
     * @param {Object3D} element - The element to add.
     * @param {Vector3} [position] - The position to place the element.
     * @returns {Object3D} The added element.
     */
    addElement(element, position) {
        this.elements.push(element);
        this.scene.add(element);
        if (position) element.position.set(position.x, position.y, 0);
        element.setDiagram(this);

        // Apply current theme to new element
        this.applyThemeToElement(element);

        return element;
    }

    /**
     * Removes an element from the diagram by its ID.
     * @param {string} elementId - The ID of the element to remove.
     */
    removeElement(elementId) {
        const element = this.elements.find(el => el.elementId === elementId);
        if (element) {
            this.scene.remove(element);
            this.elements = this.elements.filter(el => el.elementId !== elementId);
        }
    }

    /**
     * Retrieves an element from the `elements` array by its unique `elementId`.
     *
     * @param {string} elementId - The unique identifier of the element to find.
     * @returns {Object|undefined} The element with the matching `elementId`, or `undefined` if not found.
     */
    getElementById(elementId) {
        return this.elements.find(el => el.elementId === elementId);
    }

    /**
     * Retrieves the elements of the diagram.
     *
     * @returns {Array} The array of elements in the diagram.
     */
    getElements() {
        return this.elements;
    }

    // ================================================================
    //   Diagram Connectors
    // ================================================================

    /**
     * Adds a connector to the diagram, registers it with the diagram, 
     * and adds it to the scene for rendering.
     *
     * @param {Object} connector - The connector object to be added to the diagram.
     * @returns {Object} The connector that was added.
     */
    addConnector(connector) {
        this.connectors.push(connector);
        this.scene.add(connector);
        connector.setDiagram(this);

        // Apply current theme to new connector
        this.applyThemeToConnector(connector);

        return connector;
    }

    // ================================================================
    //   Clear diagram
    // ================================================================

    /**
     * Clears all elements and connectors from the diagram.
     */
    clear() {
        if (this.elements.length > 0) {
            this.elements.forEach(element => {
                this.scene.remove(element);
            });
        }
        if (this.connectors.length > 0) {
            this.connectors.forEach(connector => {
                this.scene.remove(connector);
            });
        }
        this.elements = [];
        this.connectors = [];
    }

    // ================================================================
    //   Diagram JSON
    // ================================================================

    toJSON() {
        return JSON.stringify(this.elements);
    }

    fromJSON(json) {
        this.elements = JSON.parse(json);
    }

    // ================================================================
    //   Diagram export and import to/from file
    // ================================================================

    /**
     * Exports the diagram to a JSON file.
     */
    export() {
        const data = JSON.stringify(this.scene.toJSON());
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Placeholder for importing a diagram from a file.
     * This method should be implemented by subclasses.
     * @param {File} file - The file to import.
     * @throws {Error} If the method is not implemented.
     * @returns {Promise<void>}
     */
    import(file) {
        console.error('Import method should be implemented by subclasses.');
    }

}

export { Diagram };
