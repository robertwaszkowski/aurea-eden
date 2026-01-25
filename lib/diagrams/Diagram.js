import { version } from '../../package.json';
import * as THREE from 'three';
import { Tween, Easing } from '@tweenjs/tween.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js';
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
        this.mode = options.mode || 'VIEW';

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
        this.enablePerspectiveCamera();
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

    enablePerspectiveCamera() {
        // Perspective Camera Setup
        const aspectRatio = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 2000);
        this.camera.position.set(0, 0, 500);
        this.camera.updateProjectionMatrix();

        if (this.controls) {
            this.controls.object = this.camera;
            this.controls.reset();
            this.controls.enableRotate = true; // Enable rotation for 3D view
        }
    }

    enableOrthographicCamera() {
        // Orthographic Camera Setup (Paper-like view)
        const aspectRatio = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 1000; // Calibrated to scene scale
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspectRatio / -2,
            frustumSize * aspectRatio / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            2000
        );
        this.camera.position.set(0, 0, 1000); // High Z to ensure visibility
        this.camera.updateProjectionMatrix();

        if (this.controls) {
            this.controls.object = this.camera;
            this.controls.reset();
            this.controls.enableRotate = false; // Disable rotation for 2D paper view
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

        console.log('initRenderer', this.container, this.renderer.domElement);
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
        // this.controlsAnalyze = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controlsAnalyze.enableDamping = true;
        // this.controlsAnalyze.dampingFactor = 0.25;
        // this.controlsAnalyze.screenSpacePanning = false;
        // this.controlsAnalyze.minPolarAngle = Math.PI / 2;
        // this.controlsAnalyze.maxPolarAngle = Math.PI;
        // this.controlsAnalyze.enabled = false;
        // this.controlsAnalyze.saveState();

        // this.controlsViewEdit = new MapControls(this.camera, this.renderer.domElement);
        // this.controlsViewEdit.enableDamping = true;
        // this.controlsViewEdit.dampingFactor = 0.25;
        // this.controlsViewEdit.screenSpacePanning = true;
        // this.controlsViewEdit.maxPolarAngle = Math.PI / 2;
        // this.controlsViewEdit.enabled = true;
        // this.controlsViewEdit.saveState();

        // this.controls = new ArcballControls(this.camera, this.renderer.domElement, this.scene);
        this.controls = new MapControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = false; // Disabled as per user request
        this.controls.dampingFactor = 0.1;
        this.controls.screenSpacePanning = true;
        this.controls.zoomToCursor = true;
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
        this.hideHelpers();
        this.controls.reset();
        this.setMode('VIEW');
        this.fitScreen();
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

        // Helper function to check if an object's position is valid
        const isValidPosition = (obj) => {
            return isFinite(obj.position.x) && isFinite(obj.position.y) && isFinite(obj.position.z);
        };

        // Expand box by all valid elements
        this.elements.forEach(element => {
            if (isValidPosition(element)) {
                // Ensure geometry is valid before expanding
                if (element.geometry) {
                    element.geometry.computeBoundingBox();
                    if (element.geometry.boundingBox &&
                        isFinite(element.geometry.boundingBox.min.x) &&
                        isFinite(element.geometry.boundingBox.max.x)) {
                        box.expandByObject(element);
                    }
                }
            } else {
                console.warn('Element has invalid position, excluding from bounds:', element);
            }
        });

        // Expand box by all valid connectors
        this.connectors.forEach(connector => {
            if (isValidPosition(connector)) {
                box.expandByObject(connector);
            } else {
                console.warn('Connector has invalid position, excluding from bounds:', connector);
            }
        });

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
        });

        this.connectors.forEach(connector => {
            connector.position.add(translation);
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
     */
    fitScreen() {
        const box = this.getDiagramBounds();
        if (box.isEmpty() || !isFinite(box.min.x)) return;

        const center = box.getCenter(new THREE.Vector3());
        const width = this.container.clientWidth || 1;
        const height = this.container.clientHeight || 1;
        const aspect = width / height;
        const margin = 1.1; // 10% margin

        // Ensure the camera is looking at the center before we calculate distances
        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        } else {
            this.camera.lookAt(center);
        }

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
            this.camera.position.copy(center).add(direction.multiplyScalar(finalDistance));
            this.camera.lookAt(center);

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

            this.camera.left = -viewWidth / 2;
            this.camera.right = viewWidth / 2;
            this.camera.top = viewHeight / 2;
            this.camera.bottom = -viewHeight / 2;

            // Position orthographic camera high enough to see everything (distance doesn't affect scale)
            this.camera.position.set(center.x, center.y, 1000);
            this.camera.lookAt(center);
        }

        this.camera.updateProjectionMatrix();

        if (this.controls) {
            this.controls.update();
            this.controls.saveState();
        }

        this.initialCameraPosition = this.camera.position.clone();
        this.initialTarget = (this.controls ? this.controls.target : center).clone();
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
            controlsTargetZ: this.controls.target.z
        };
        const to = {
            cameraPositionX: this.initialCameraPosition.x,
            cameraPositionY: this.initialCameraPosition.y,
            cameraPositionZ: this.initialCameraPosition.z,
            controlsTargetX: this.initialTarget.x,
            controlsTargetY: this.initialTarget.y,
            controlsTargetZ: this.initialTarget.z
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
            })
            .onComplete(function () {
                // controls.update();
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
    rotate(targetAngle, onCompleteCallback) {  // in degrees (e.g. 60)
        // The method centers the diagram and rotates it around the Y axis by a specified angle.
        if (!this.initialCameraPosition || !this.initialTarget) {
            console.warn('Initial camera position or target is not defined.');
            return;
        }

        const radius = this.initialCameraPosition.distanceTo(this.initialTarget);

        const from = {
            cameraPositionX: this.camera.position.x,
            cameraPositionY: this.camera.position.y,
            cameraPositionZ: this.camera.position.z,
            controlsTargetX: this.controls.target.x,
            controlsTargetY: this.controls.target.y,
            controlsTargetZ: this.controls.target.z
        };

        // Convert target angle to radians and calculate new positions
        const targetAngleRad = THREE.MathUtils.degToRad(targetAngle);
        const to = {
            cameraPositionX: this.initialCameraPosition.x,
            cameraPositionY: radius * Math.sin(targetAngleRad),
            cameraPositionZ: radius * Math.cos(targetAngleRad),
            controlsTargetX: this.initialTarget.x,
            controlsTargetY: this.initialTarget.y,
            controlsTargetZ: this.initialTarget.z
        };

        console.log('rotate() -> from:', from);
        console.log('rotate() -> to:', to);

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

        // 1. Identify all elements to remove (bars and their associated texts)
        const elementsToRemove = new Set();

        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (element.shape instanceof ValueBarShape) {
                elementsToRemove.add(element);

                // Also mark associated texts for removal
                if (element.texts && element.texts.length > 0) {
                    element.texts.forEach(textInfo => {
                        elementsToRemove.add(textInfo.element);
                    });
                }
            }
        }

        // 2. Remove them from the scene and the main elements array
        elementsToRemove.forEach(element => {
            if (element.parent) {
                element.parent.remove(element);
            }
            this.scene.remove(element);
        });

        this.elements = this.elements.filter(el => !elementsToRemove.has(el));

        // 3. Clear valueBars references from all remaining elements
        this.elements.forEach(element => {
            if (element.valueBars) {
                element.valueBars = [];
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
        const unifiedColor = new THREE.Color(0x00ffff);

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
                    const barElement = barInfo.element;
                    if (barElement.material) {
                        barElement.material.color.set(barColor);
                    }

                    if (barElement.texts) {
                        barElement.texts.forEach(t => {
                            const textColor = (themeConfig.SEMANTIC_TEXT && themeConfig.SEMANTIC_TEXT[el.semanticType])
                                || themeConfig.ELEMENT_TEXT;

                            const labelColor = isDark ? dataColor : textColor;
                            t.element.updateTextContent(t.element.textContent || "", labelColor);
                        });
                    }
                });
            }
        });
    }

    /**
     * Sets the mode of the diagram and adjusts its state accordingly.
     *
     * @param {string} mode - The mode to set. Possible values are:
     *   - 'EDIT': Sets the diagram to edit mode and resets rotation.
     *   - 'VIEW': Sets the diagram to view mode and resets rotation.
     *   - 'ANALYZE': Sets the diagram to analyze mode, rotates it to -60 degrees, 
     *                and adds value bars.
     *   - Any other value will log a warning about an unknown mode.
     */
    setMode(mode) {
        this.removeValueBars();
        this.mode = mode;

        // Reset all text positions and rotations first
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
            // Ensure badges are visible when resetting to VIEW/EDIT
            if (element.badges && element.badges.length > 0) {
                element.badges.forEach(badgeInfo => {
                    badgeInfo.element.visible = true;
                });
            }
        });

        switch (mode) {
            case 'VIEW':
                this.enableOrthographicCamera();
                this.controls.minAzimuthAngle = -Infinity;
                this.controls.maxAzimuthAngle = Infinity;
                this.rotate(0);
                this.fitScreen();
                break;
            case 'EDIT':
                this.enablePerspectiveCamera();
                this.controls.minAzimuthAngle = -Infinity;
                this.controls.maxAzimuthAngle = Infinity;
                this.rotate(0);
                this.fitScreen();
                break;
            case 'ANALYZE':
                this.enablePerspectiveCamera();
                // Lock horizontal rotation (only vertical tilt allowed)
                this.controls.minAzimuthAngle = 0;
                this.controls.maxAzimuthAngle = 0;

                // First fit to get correct perspective distance
                this.fitScreen();

                this.rotate(-65, () => {

                    // Adjust text positions for ANALYZE mode
                    this.elements.forEach(element => {
                        if (element.texts && element.texts.length > 0) {
                            element.texts.forEach(textInfo => {
                                const textElement = textInfo.element;
                                // Adjust text positions for ANALYZE mode
                                if (textInfo.faceCamera) {
                                    // Calculate the absolute center of the host element
                                    // Force text to X/Y center of the host element
                                    // In this system, element.position is usually the center
                                    const elementPos = element.position;

                                    const zLift = textElement.getSize().z * 0.7;
                                    textElement.position.set(
                                        elementPos.x,
                                        elementPos.y,
                                        elementPos.z + zLift + 20
                                    );

                                    // Re-apply rotation to face camera
                                    textElement.quaternion.copy(this.camera.quaternion);
                                }

                                // Ensure text is crisp and always on top of transparent bars
                                textElement.renderOrder = 100;
                                if (textElement.material) {
                                    textElement.material.depthTest = false;
                                }
                            });
                        }

                        // Hide 3D badges in ANALYZE mode
                        if (element.badges && element.badges.length > 0) {
                            element.badges.forEach(badgeInfo => {
                                badgeInfo.element.visible = false;
                            });
                        }
                    });

                    const elementsWithValue = this.elements.filter(el => el.parameters && el.parameters.value !== undefined);
                    if (elementsWithValue.length === 0) {
                        return;
                    }

                    const values = elementsWithValue.map(el => el.parameters.value);
                    const dataMax = Math.max(...values);
                    const dataMin = Math.min(...values);

                    console.log(`[Diagram.js] Coloring Range | Min: ${dataMin}, Max: ${dataMax}`);

                    this.analysisTweens = [];

                    elementsWithValue.forEach(element => {
                        const originalValue = element.parameters.value;

                        // 1. Calculate height based on a 0-max range to preserve visual proportions.
                        const normalizedHeight = (dataMax === 0) ? 0 : (originalValue / dataMax);
                        const barHeight = normalizedHeight * 100;

                        const color = getColorForValue(originalValue, dataMin, dataMax);
                        const isDark = this.theme === 'DARK';
                        const themeConfig = Themes[this.theme];

                        // Data-driven bar coloring in all themes
                        const barColor = color;

                        // Data-driven labels ONLY in Dark Mode
                        const labelColor = isDark ? color : themeConfig.ELEMENT_TEXT;

                        // 3. Create the bar with the correct height and color.
                        const barShape = new ValueBarShape(element.shape.getOuterShape(), barHeight, barColor, this.theme);
                        const barElement = new Element(element.elementId + '_bar', barShape);
                        barElement.themable = false; // Prevent theme overrides from destroying data-driven color

                        this.addElement(barElement).positionAt(element.getPosition());
                        element.valueBars.push({ element: barElement, positionOffset: new THREE.Vector3(0, 0, 0) });

                        // Add text to the bar
                        const textOffsetZ = barHeight + 5;
                        const textOffset = new THREE.Vector3(0, 0, textOffsetZ); // 5 is a small offset

                        let suffix = "";
                        if (element.userData.taskType === 'my') {
                            suffix = " *";
                        } else if (element.userData.taskType === 'other') {
                            suffix = " •"; // Bullet (Solid)
                        } else if (element.badges && element.badges.length > 0) {
                            // Fallback if badges exist but no type set (legacy support)
                            suffix = " *";
                        }

                        // Initial Text with '0' (centered) - set faceCamera: true
                        // In DARK mode, we start with the calculated label color
                        const initialLabelColor = isDark ? getColorForValue(0, dataMin, dataMax) : themeConfig.ELEMENT_TEXT;
                        barElement.addWrappedText("0" + suffix, textOffset, 12, 'center', null, null, 'center', true, initialLabelColor);
                        const textInfo = barElement.texts[barElement.texts.length - 1]; // The last added text is the one we want
                        const textElement = textInfo.element;

                        // Ensure bar labels are always on top and crisp
                        textElement.renderOrder = 101;
                        if (textElement.material) {
                            textElement.material.depthTest = false;
                        }

                        // Calculate minimum Z height to avoid overlap with main element labels
                        let minZ = 0;
                        if (element.texts && element.texts.length > 0) {
                            element.texts.forEach(t => {
                                // Assuming text is roughly centered at position.z
                                // Add buffer (approx half text height + margin)
                                const labelTop = t.element.position.z + 10;
                                if (labelTop > minZ) minZ = labelTop;
                            });
                            minZ += 20; // Extra safety margin
                        }

                        // Initialize Animation State
                        const startZ = Math.max(0 + 5, minZ); // Start at valid min
                        barElement.scale.z = 0; // Start flat
                        textElement.position.z = startZ;

                        const animationState = { progress: 0 };

                        const tween = new Tween(animationState)
                            .to({ progress: 1 }, 5000) // 5 seconds duration
                            .easing(Easing.Quartic.Out)
                            .onUpdate(() => {
                                const p = animationState.progress;

                                // Animate Bar Height
                                barElement.scale.z = p;

                                // Animate Text Position
                                // Ensure text is always at least minZ height, or on top of bar if bar is taller
                                const barTopTextZ = (barHeight * p) + 5;
                                textElement.position.z = Math.max(barTopTextZ, minZ);

                                // Animate Text Value (Rise)
                                const currentValue = Math.round(originalValue * p);
                                const currentLabelColor = isDark ? getColorForValue(currentValue, dataMin, dataMax) : themeConfig.ELEMENT_TEXT;

                                // Update Geometry via Element method
                                textElement.updateTextContent(currentValue.toString() + suffix, currentLabelColor);
                            })
                            .start();

                        this.analysisTweens.push(tween);
                    });
                });
                break;
            default:
                console.warn(`Unknown mode: ${mode}`);
        }
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
