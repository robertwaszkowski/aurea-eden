import { version } from '../../package.json';
import * as THREE from 'three';
import { Tween, Easing } from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import { Element } from '../elements/Element.js';
import { Connector } from '../connectors/Connector.js';
import { StraightDottedConnectorShape } from '../shapes/connector/StraightDottedConnectorShape.js';
import { RoundedCornerOrthogonalConnectorShape } from '../shapes/connector/RoundedCornerOrthogonalConnectorShape.js';
import { ValueBarShape } from '../shapes/bar/ValueBarShape.js';
import { getColorForValue, createRoundedBarSlotShape } from '../shapes/bar/ValueBarUtils.js';
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
         * Array of pending connections by ID, processed during arrange().
         * @type {Array<Object>}
         */
        this.pendingConnections = [];

        /**
         * Map tracking which connectors are attached to which elements.
         * Key: Element ID, Value: Set of Connector objects.
         * @type {Map<string, Set<Object3D>>}
         */
        this.elementConnectors = new Map();

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

    /**
     * Resolves 'auto' ports dynamically based on current diagram geometry, then spreads
     * connections that share the same exit or entry cardinal port on an element
     * across the port sub-family (NNW / N / NNE, etc.) to prevent collinear connector segments.
     */
    _spreadPendingConnections() {
        if (!this.pendingConnections || this.pendingConnections.length === 0) return;

        const FAMILIES = {
            N: ['NNW', 'N', 'NNE'],
            S: ['SSW', 'S', 'SSE'],
            E: ['NEE', 'E', 'SEE'],
            W: ['NWW', 'W', 'SWW'],
        };

        const pick = (family, k) => {
            if (k <= 1) return [family[1]];
            if (k === 2) return [family[0], family[2]];
            if (k === 3) return [...family];
            return Array.from({ length: k }, (_, i) => family[i % family.length]);
        };

        // 1. Temporarily resolve 'auto' ports geometrically
        for (const conn of this.pendingConnections) {
            const src = this.getElementById(conn.sourceId);
            const tgt = this.getElementById(conn.targetId);
            if (src && tgt) {
                // Use the static Element.resolvePorts to find out exactly where 'auto' will land
                const resolved = Element.resolvePorts(src, tgt, conn.sourcePort, conn.targetPort);
                conn._tempSrcPort = resolved.sourcePort;
                conn._tempTgtPort = resolved.targetPort;
            }
        }

        // 2. Group by Element ID and derived cardinal Port
        const portGroups = new Map();

        for (const conn of this.pendingConnections) {
            if (!conn._tempSrcPort || !conn._tempTgtPort) continue;

            // Check source side
            if (FAMILIES[conn._tempSrcPort]) {
                const srcKey = `${conn.sourceId}::${conn._tempSrcPort}`;
                if (!portGroups.has(srcKey)) portGroups.set(srcKey, []);
                portGroups.get(srcKey).push({ conn, type: 'src' });
            }

            // Check target side
            if (FAMILIES[conn._tempTgtPort]) {
                const tgtKey = `${conn.targetId}::${conn._tempTgtPort}`;
                if (!portGroups.has(tgtKey)) portGroups.set(tgtKey, []);
                portGroups.get(tgtKey).push({ conn, type: 'tgt' });
            }
        }

        // 3. Spread grouped connections systematically
        for (const [key, group] of portGroups) {
            if (group.length <= 1) continue;

            const cardinalPort = key.split('::')[1];
            const ports = pick(FAMILIES[cardinalPort], group.length);

            group.forEach((item, i) => {
                if (item.type === 'src') {
                    // Update the actual port definition before drawing
                    item.conn.sourcePort = ports[i];
                } else {
                    item.conn.targetPort = ports[i];
                }
            });
        }

        // 4. Cleanup temporary prediction values
        for (const conn of this.pendingConnections) {
            delete conn._tempSrcPort;
            delete conn._tempTgtPort;
        }
    }

    arrange() {
        this._spreadPendingConnections();


        // Process any deferred ID-based connections
        if (this.pendingConnections.length > 0) {
            const remaining = [];
            this.pendingConnections.forEach(conn => {
                const src = this.getElementById(conn.sourceId);
                const tgt = this.getElementById(conn.targetId);
                if (src && tgt) {
                    src.connectTo(conn.targetId, conn.sourcePort, conn.targetPort, conn.label, conn.type);
                } else {
                    remaining.push(conn);
                }
            });
            this.pendingConnections = remaining;
        }

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

        // ── Reconcile connector points ────────────────────────────────────────
        // All elements have now been translated to their final centered positions.
        // For connectors that link two elements, we undo the position translation
        // applied above and recompute the geometry from the live element positions
        // instead. This avoids a double-offset: the updated geometry already
        // incorporates the element translation, so connector.position must be
        // restored to its pre-translate state (typically origin).
        this.connectors.forEach(connector => {
            if (connector.sourceElement && connector.targetElement) {
                connector.position.sub(translation);
                connector.updateMatrixWorld(true);
                connector.update();
            }
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
                // Collect ALL bar meshes for this element (may be multiple)
                const barInfos = el.valueBars.filter(b => !b.isSpriteLabel);
                // Collect ALL sprite labels (may be multiple for 2-bar hybrid)
                const spriteInfos = el.valueBars.filter(b => b.isSpriteLabel);

                if (barInfos.length > 0) {
                    barsToAnimate.push({
                        barElements: barInfos.map(b => b.element),
                        spriteLabels: spriteInfos.map(b => b.element)
                    });
                }
            }
        });

        if (barsToAnimate.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        let animatedComponentsCount = 0;
        // Each element contributes: 1 (bars sink) + 2 per sprite label (fall complete + bounce/fade complete).
        // The "hang" is a delay() on the fall tween, not a separate completion stage.
        const totalComponents = barsToAnimate.reduce((sum, info) => sum + 1 + info.spriteLabels.length * 2, 0);

        barsToAnimate.forEach(info => {
            const { barElements, spriteLabels } = info;

            // Stage 1: All bar meshes for this element sink simultaneously
            const barState = { progress: 1 };
            const barTween = new Tween(barState)
                .to({ progress: 0 }, 800)
                .easing(Easing.Quartic.In)
                .onUpdate(() => {
                    barElements.forEach(barElement => {
                        barElement.scale.z = barState.progress;
                    });
                })
                .onComplete(() => {
                    // Remove all bar meshes for this element
                    barElements.forEach(barElement => {
                        this.scene.remove(barElement);
                        const idx = this.elements.indexOf(barElement);
                        if (idx !== -1) {
                            this.elements.splice(idx, 1);
                        }
                        if (barElement.dispose) barElement.dispose();
                    });

                    animatedComponentsCount++;
                    if (spriteLabels.length === 0) {
                        if (animatedComponentsCount >= totalComponents && onComplete) onComplete();
                        return;
                    }

                    // Stages 2 & 3: Each sprite label falls, crashes and bounces independently
                    spriteLabels.forEach(spriteLabel => {
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
                    });
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
        // Collect elements that have the new parameters.bars data model.
        // Also support the legacy parameters.value fallback for backward compat.
        const elementsWithBars = this.elements.filter(el => {
            if (!el.parameters) return false;
            if (el.parameters.bars && el.parameters.bars.length > 0) return true;
            // Legacy: single number via parameters.value (no bars array)
            if (el.parameters.value !== undefined && !el.parameters.bars) return true;
            return false;
        });

        if (elementsWithBars.length === 0) return;

        // Normalize each element's bars to the canonical form
        elementsWithBars.forEach(el => {
            if (!el.parameters.bars) {
                // Legacy single-value upgrade
                el.parameters.bars = [{ heightValue: el.parameters.value, colorValue: el.parameters.value, colorsInverted: false }];
            }
        });

        // Determine the maximum number of bar slots across all elements
        const maxSlots = Math.max(...elementsWithBars.map(el => el.parameters.bars.length));

        // Per-slot normalization: for each slot index, collect all colorValues across elements
        const slotColorRanges = [];
        for (let slotIdx = 0; slotIdx < maxSlots; slotIdx++) {
            const colorValues = elementsWithBars
                .filter(el => slotIdx < el.parameters.bars.length)
                .map(el => el.parameters.bars[slotIdx].colorValue);
            slotColorRanges.push({
                min: Math.min(...colorValues),
                max: Math.max(...colorValues)
            });
        }

        this.analysisTweens = [];
        const isDark = this.theme === 'DARK';
        const bubbleBg = isDark ? 'rgba(10, 12, 16, 0.96)' : 'rgba(20, 22, 26, 0.92)';

        elementsWithBars.forEach(element => {
            const bars = element.parameters.bars;
            const totalBars = bars.length;
            const elementSize = element.getSize();

            // Track the tallest bar on this element (to position the sprite label)
            let maxBarHeight = 0;

            bars.forEach((barDef, barIndex) => {
                const { heightValue, colorValue, colorsInverted } = barDef;
                const { min: slotMin, max: slotMax } = slotColorRanges[barIndex];

                // Bar height: normalized 0-100 relative to the slot's max height
                const barHeight = (slotMax === 0) ? 0 : (heightValue / slotMax) * 100;
                if (barHeight > maxBarHeight) maxBarHeight = barHeight;

                // Bar color: per-slot normalized, with inversion support
                const rawColor = getColorForValue(colorValue, slotMin, slotMax, colorsInverted);
                const barColor = isDark ? new THREE.Color(0x00ffff) : rawColor;

                // Full element shape for single bar; rounded bar-slot shape for multi-bar.
                // The rounded slot shape preserves outer element corners while splitting the footprint.
                const slotShape = (totalBars === 1)
                    ? element.shape.getOuterShape()
                    : createRoundedBarSlotShape(elementSize.x, elementSize.y, barIndex, totalBars);

                const barShape = new ValueBarShape(slotShape, barHeight, barColor, this.theme);
                const barElement = new Element(`${element.elementId}_bar_${barIndex}`, barShape);
                barElement.themable = false;
                // Store per-bar metadata for theming updates
                barElement.userData.barIndex = barIndex;
                barElement.userData.barDef = barDef;
                barElement.userData.slotMin = slotMin;
                barElement.userData.slotMax = slotMax;

                this.addElement(barElement).positionAt(element.getPosition());
                element.valueBars.push({ element: barElement, positionOffset: new THREE.Vector3(0, 0, 0) });

                // Animate this bar rising
                barElement.scale.z = 0;
                const animationState = { progress: 0 };
                const tween = new Tween(animationState)
                    .to({ progress: 1 }, 1500)
                    .easing(Easing.Quartic.Out)
                    .onUpdate(() => {
                        barElement.scale.z = animationState.progress;
                    })
                    .start();
                this.analysisTweens.push(tween);
            });

            // --- Sprite Label(s): hybrid strategy ---
            // 1–2 bars → one badge per bar, centered above its column
            // 3+ bars  → one combined badge centered over the element (all values joined by " · ")
            const taskType = element.userData.taskType;

            // Calculate a floor Z so the badge never overlaps the element's own text labels
            let minZ = 0;
            if (element.texts && element.texts.length > 0) {
                element.texts.forEach(t => {
                    const labelTop = t.element.position.z + 10;
                    if (labelTop > minZ) minZ = labelTop;
                });
                minZ += 15;
            }

            if (totalBars <= 2) {
                // ── Individual badges: one per bar ──────────────────────────────────
                bars.forEach((barDef, barIndex) => {
                    const { min: sMin, max: sMax } = slotColorRanges[barIndex];
                    const barColor = getColorForValue(barDef.colorValue, sMin, sMax, barDef.colorsInverted);
                    const hsl = {};
                    barColor.getHSL(hsl);
                    barColor.setHSL(hsl.h, hsl.s, 0.6);

                    // X center of this bar's column (local coords centered at 0)
                    const slotWidth = elementSize.x / totalBars;
                    const colCenterX = -elementSize.x / 2 + barIndex * slotWidth + slotWidth / 2;

                    // Z offset positions badge just above this bar's top
                    const thisBarHeight = (sMax === 0) ? 0 : (barDef.heightValue / sMax) * 100;
                    const textOffsetZ = thisBarHeight + 12;
                    const textOffset = new THREE.Vector3(colCenterX, 0, Math.max(textOffsetZ, minZ));

                    const spriteLabel = element.addSpriteLabel('00', textOffset, {
                        taskType: barIndex === 0 ? taskType : null, // star only on first bar
                        color: barColor.getStyle(),
                        bgColor: bubbleBg,
                        borderColor: null,
                        borderRadius: 12
                    });
                    spriteLabel.position.z = Math.max(5, minZ);
                    spriteLabel.userData.barIndex = barIndex; // for theme re-coloring

                    // Count-up animation for this bar
                    const animState = { progress: 0 };
                    const labelTween = new Tween(animState)
                        .to({ progress: 1 }, 1500)
                        .easing(Easing.Quartic.Out)
                        .onUpdate(() => {
                            const p = animState.progress;
                            const barTopZ = (thisBarHeight * p) + 12;
                            spriteLabel.position.z = Math.max(barTopZ, minZ);

                            const currentValue = Math.round(barDef.heightValue * p);
                            const animColor = getColorForValue(barDef.colorValue * p, sMin, sMax, barDef.colorsInverted);
                            const animHsl = {};
                            animColor.getHSL(animHsl);
                            animColor.setHSL(animHsl.h, animHsl.s, 0.6);
                            element.updateSpriteLabel(spriteLabel, currentValue.toString(), animColor.getStyle());
                        })
                        .start();
                    this.analysisTweens.push(labelTween);
                });

            } else {
                // ── Combined badge: one for all bars, centered over the element ────
                const firstBarDef = bars[0];
                const { min: s0Min, max: s0Max } = slotColorRanges[0];
                const dataColor = getColorForValue(firstBarDef.colorValue, s0Min, s0Max, firstBarDef.colorsInverted);
                const hsl = {};
                dataColor.getHSL(hsl);
                dataColor.setHSL(hsl.h, hsl.s, 0.6);

                const textOffsetZ = maxBarHeight + 12;
                const textOffset = new THREE.Vector3(0, 0, Math.max(textOffsetZ, minZ));

                // Initial combined text (all zeros)
                const placeholder = bars.map(() => '00').join(' · ');
                const spriteLabel = element.addSpriteLabel(placeholder, textOffset, {
                    taskType,
                    color: dataColor.getStyle(),
                    bgColor: bubbleBg,
                    borderColor: null,
                    borderRadius: 12
                });
                spriteLabel.position.z = Math.max(5, minZ);

                // Animate all counters simultaneously
                const animState = { progress: 0 };
                const labelTween = new Tween(animState)
                    .to({ progress: 1 }, 1500)
                    .easing(Easing.Quartic.Out)
                    .onUpdate(() => {
                        const p = animState.progress;
                        const barTopZ = (maxBarHeight * p) + 12;
                        spriteLabel.position.z = Math.max(barTopZ, minZ);

                        const combinedText = bars
                            .map(bd => Math.round(bd.heightValue * p).toString())
                            .join(' · ');

                        // Color tracks the first bar as usual
                        const animColor = getColorForValue(firstBarDef.colorValue * p, s0Min, s0Max, firstBarDef.colorsInverted);
                        const animHsl = {};
                        animColor.getHSL(animHsl);
                        animColor.setHSL(animHsl.h, animHsl.s, 0.6);
                        element.updateSpriteLabel(spriteLabel, combinedText, animColor.getStyle());
                    })
                    .start();
                this.analysisTweens.push(labelTween);
            }
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

        const elementsWithBars = this.elements.filter(el => el.parameters && el.parameters.bars && el.parameters.bars.length > 0);

        elementsWithBars.forEach(el => {
            if (!el.valueBars || el.valueBars.length === 0) return;

            el.valueBars.forEach(barInfo => {
                const obj = barInfo.element;

                if (barInfo.isSpriteLabel) {
                    // Re-color the sprite label.
                    // If it has a barIndex tag (individual badge), use that bar's color;
                    // otherwise fall back to the first bar (combined badge).
                    const bIdx = (obj.userData.barIndex !== undefined) ? obj.userData.barIndex : 0;
                    const barDef = el.parameters.bars[bIdx];
                    const { min: sMin, max: sMax } = (() => {
                        // recompute range for this slot (same logic as _initAnalyzeBars)
                        const colorValues = el.parameters.bars
                            .filter((_, i) => i === bIdx)
                            .map(b => b.colorValue);
                        // collect all elements' colorValues for this slot to get proper range
                        // simplified: use 0 to barDef.colorValue as fallback
                        return { min: obj.userData.slotMin || 0, max: obj.userData.slotMax || barDef.colorValue || 1 };
                    })();
                    const dataColorLabel = getColorForValue(barDef.colorValue, sMin, sMax, barDef.colorsInverted);
                    const hsl = {};
                    dataColorLabel.getHSL(hsl);
                    dataColorLabel.setHSL(hsl.h, hsl.s, 0.6);

                    obj.userData.parameters.bgColor = isDark ? 'rgba(10, 12, 16, 0.96)' : 'rgba(20, 22, 26, 0.92)';
                    obj.userData.parameters.borderColor = null;
                    el.updateSpriteLabel(obj, obj.userData.text, dataColorLabel.getStyle());

                } else if (obj.material) {
                    // Re-color bar mesh using its stored barDef metadata
                    const barDef = obj.userData.barDef;
                    const slotMin = obj.userData.slotMin || 0;
                    const slotMax = obj.userData.slotMax || (barDef ? barDef.colorValue : 1) || 1;
                    const rawColor = barDef
                        ? getColorForValue(barDef.colorValue, slotMin, slotMax, barDef.colorsInverted)
                        : new THREE.Color(0x00ff00);
                    const barColor = isDark ? unifiedColor : rawColor;

                    obj.material.color.set(barColor);
                    if (obj.material.emissive) {
                        obj.material.emissive.set(barColor);
                    }
                    obj.material.opacity = themeConfig.VALUE_BAR_OPACITY;
                    obj.material.emissiveIntensity = isDark ? 0.6 : 0;
                }
            });
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

                    // Snap camera to a clean top-down position so the Perspective→Ortho
                    // handoff doesn't inherit any residual Y-tilt from the ANALYZE angle.
                    const snapTarget = this.controls.target.clone();
                    const snapRadius = this.camera.position.distanceTo(snapTarget);
                    this.camera.position.set(snapTarget.x, snapTarget.y, snapTarget.z + snapRadius);
                    this.camera.lookAt(snapTarget);
                    this.controls.update();

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

        // Track connection for reactive updates
        if (connector.sourceElement) {
            this._trackElementConnector(connector.sourceElement.elementId, connector);
        }
        if (connector.targetElement) {
            this._trackElementConnector(connector.targetElement.elementId, connector);
        }

        // Apply current theme to new connector
        this.applyThemeToConnector(connector);

        // --- Anchor Point Merge Logic ---
        // If the source or target is an anchor, check if it's fully connected (1 in, 1 out)
        if (connector.sourceElement?.semanticType === 'anchor') {
            this._checkAndResolveAnchorPoint(connector.sourceElement);
        }
        if (connector.targetElement?.semanticType === 'anchor') {
            this._checkAndResolveAnchorPoint(connector.targetElement);
        }

        // Apply current theme to new connector
        this.applyThemeToConnector(connector);

        return connector;
    }

    /**
     * Checks if an AnchorPoint has exactly 1 incoming and 1 outgoing connector.
     * If so, merges them into a single connector passing through the anchor's coordinate,
     * and deletes the physical anchor element from the diagram.
     * @private
     */
    _checkAndResolveAnchorPoint(anchorElement) {
        // Collect all connectors attached to this anchor
        const attached = Array.from(this.elementConnectors.get(anchorElement.elementId) || []);

        // We only care if there are exactly 2 connectors total
        if (attached.length !== 2) return;

        const incoming = attached.find(c => c.targetElement === anchorElement);
        const outgoing = attached.find(c => c.sourceElement === anchorElement);

        // It must have exactly 1 coming IN and 1 going OUT
        if (!incoming || !outgoing) return;

        // 1. Create a merged connector
        const mergedId = `${incoming.elementId}_merged_${outgoing.elementId}`;
        const mergedConnector = new Connector(
            mergedId,
            incoming.type === 'association'
                ? new StraightDottedConnectorShape()
                : new RoundedCornerOrthogonalConnectorShape(),
            incoming.sourceElement,
            outgoing.targetElement,
            incoming.sourcePosition, // keep original source port
            outgoing.targetPosition, // keep original target port
            incoming.label || outgoing.label, // preserve label if any
            incoming.type,
            { waypoints: [{ x: anchorElement.position.x, y: anchorElement.position.y }] } // Force the anchor coord!
        );

        mergedConnector.setDiagram(this);

        // 2. Remove the old connectors and the Anchor element from the diagram
        this._removeConnector(incoming);
        this._removeConnector(outgoing);
        this._removeElement(anchorElement);

        // 3. Add the new merged connector
        this.addConnector(mergedConnector);

        // Force an immediate update so the points array is generated using the new waypoint
        mergedConnector.update();
    }

    /**
     * Helper to safely remove an element and clean up its references
     * @private
     */
    _removeElement(element) {
        this.scene.remove(element);
        this.elements = this.elements.filter(e => e !== element);
        this.elementsMap = this.elementsMap || new Map();
        this.elementsMap.delete(element.elementId);
        this.elementConnectors.delete(element.elementId);
    }

    /**
     * Helper to safely remove a connector and clean up its references
     * @private
     */
    _removeConnector(connector) {
        this.scene.remove(connector);
        this.connectors = this.connectors.filter(c => c !== connector);

        if (connector.sourceElement) {
            const set = this.elementConnectors.get(connector.sourceElement.elementId);
            if (set) set.delete(connector);
        }
        if (connector.targetElement) {
            const set = this.elementConnectors.get(connector.targetElement.elementId);
            if (set) set.delete(connector);
        }
    }

    /**
     * @private
     */
    _trackElementConnector(elementId, connector) {
        if (!this.elementConnectors.has(elementId)) {
            this.elementConnectors.set(elementId, new Set());
        }
        this.elementConnectors.get(elementId).add(connector);
    }

    /**
     * Notifies the diagram that an element has changed its position.
     * Triggers updates for all attached connectors.
     * @param {Element} element - The element that moved
     */
    notifyElementMoved(element) {
        const affected = this.elementConnectors.get(element.elementId);
        if (affected) {
            affected.forEach(connector => {
                if (typeof connector.update === 'function') {
                    connector.update();
                }
            });
        }
    }

    /**
     * Records a connection request between two elements by their IDs.
     * The actual connector is created during the next arrange() call,
     * allowing for ID-based connections even if elements are not yet added.
     *
     * @param {string} sourceId - ID of the source element.
     * @param {string} targetId - ID of the target element.
     * @param {string} [sourcePort='auto'] - Port on the source.
     * @param {string} [targetPort='auto'] - Port on the target.
     * @param {string} [label=null] - Optional label.
     * @param {string} [type='sequence'] - Connector type.
     */
    connect(sourceId, targetId, sourcePort = 'auto', targetPort = 'auto', label = null, type = 'sequence') {
        this.pendingConnections.push({ sourceId, targetId, sourcePort, targetPort, label, type });
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
        this.elementConnectors.clear();
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
