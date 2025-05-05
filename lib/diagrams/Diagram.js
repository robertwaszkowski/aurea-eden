import * as THREE from 'three';
import { Tween, Easing } from '@tweenjs/tween.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js'; 

/**
 * Represents a 3D diagram using THREE.js.
 */
class Diagram {

    /**
     * Creates a new Diagram instance.
     * @param {HTMLElement} container - The HTML container element for the diagram.
     */
    constructor(container) {

        // init Diagram features

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
        this.mode = 'VIEW';

        /**
         * Whether helpers (axes, grid, etc.) are visible.
         * @type {boolean}
         */
        this.helpers = false;

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
        this.animate();
        console.log('THREE', THREE);
        console.log(this);
    }

    /**
     * Initializes the THREE.js scene.
     */
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xf0f0f0 );
    }

    /**
     * Initializes the camera with a perspective projection.
     */
    initCamera() { // Perspective
        // const aspectRatio = this.container.clientWidth / window.innerHeight;
        const aspectRatio = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 2000);
        this.camera.position.set(0, 0, 500);
        this.camera.updateProjectionMatrix();
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
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // TODO: Ustawić na pełny ekran dla konkretnego kontenera.
        // this.renderer.setSize(this.container.clientWidth, this.container.innerHeight);
        // codepen at https://codepen.io/snakeo/pen/XWOoGPL
        document.body.appendChild(this.renderer.domElement);
        // TODO: Ustawić diagram w konkretnym kontenerze.
        // this.container.appendChild(this.renderer.domElement);
        console.log('initRenderer', this.container, this.renderer.domElement)
    }
 
    /**
     * Initializes the lighting for the scene.
     */
    initLighting() {
        const ambientLight = new THREE.AmbientLight(0xCCCCCC, 4);
        this.scene.add(ambientLight);
 
        const directionalLight1 = new THREE.DirectionalLight(0xFFFFFF, 1);
        directionalLight1.position.set(1, 3, 1).normalize();
        this.scene.add(directionalLight1);
 
        // Adding a second directional light
        const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1);
        directionalLight2.position.set(-1, -1, -1).normalize();
        this.scene.add(directionalLight2);

        // Add spot light
        this.spotLight = new THREE.PointLight(0xffffff);
        this.spotLight.position.set(0, -2500, 30);
        this.scene.add(this.spotLight);

        this.spotLightDirection = 1;
        this.spotLightPosX = -2500;
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
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.screenSpacePanning = true;
        this.controls.zoomToCursor = true;
        this.controls.saveState();

    }
 
    /**
     * Adds event listeners for window resize and other interactions.
     */
    addEventListeners() {
        // Add event listener for window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        // Add event listener for mouse events
        // this.renderer.domElement.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);
        // this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        // this.renderer.domElement.addEventListener('mouseup', this.onDocumentMouseUp.bind(this), false);
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
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Animates the scene and updates controls.
     */
    animate() {
        if (this.tween) this.tween.update();
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        // Animate spot light
        if (this.spotLightPosX > 2500) {
            this.spotLightDirection = -1;
            this.spotLightPosX = 2500;
        }
        if (this.spotLightPosX < -2500) {
            this.spotLightDirection = 1;
            this.spotLightPosX = -2500;
        }
        this.spotLightPosX += 30 * this.spotLightDirection;
        this.spotLight.position.set(this.spotLightPosX, -1000, 250);

        // Show camera helpers
        // calculate and display the vector values on screen
        // this copies the camera's unit vector direction to cameraDirection
        this.camera.getWorldDirection(this.cameraDirection);
        // scale the unit vector up to get a more intuitive value
        this.cameraDirection.set(this.cameraDirection.x * 100, this.cameraDirection.y * 100, this.cameraDirection.z * 100);
        // update the onscreen spans with the camera's position and lookAt vectors
        this.camPositionSpan.innerHTML = `Position: (${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})`;
        this.camLookAtSpan.innerHTML = `LookAt: (${(this.camera.position.x + this.cameraDirection.x).toFixed(1)}, ${(this.camera.position.y + this.cameraDirection.y).toFixed(1)}, ${(this.camera.position.z + this.cameraDirection.z).toFixed(1)})`;
    }

    reset() {
        this.hideHelpers();
        this.controls.reset();
        this.setMode('VIEW');
        this.fitScreen();
    }

    rotate(targetAngle) {  // in degrees (e.g. 60)
        const from = {
            cameraPositionX: this.camera.position.x,
            cameraPositionY: this.camera.position.y,
            cameraPositionZ: this.camera.position.z,
            controlsTargetX: this.controls.target.x,
            controlsTargetY: this.controls.target.y,
            controlsTargetZ: this.controls.target.z
        };

        // Calculate the new y position based on the target angle
        const targetAngleRad = THREE.MathUtils.degToRad(targetAngle);
        const to = {
            cameraPositionX: this.controls.position0.x, //from.x,
            cameraPositionY: this.controls.position0.z * Math.sin(targetAngleRad),
            cameraPositionZ: this.controls.position0.z, //from.z
            controlsTargetX: 0,
            controlsTargetY: 0,
            controlsTargetZ: 0
        };

        const camera = this.camera;
        const controls = this.controls;

        this.tween = new Tween(from)
            .to(to, 1200)
            .easing(Easing.Quartic.Out)
            .onUpdate(function () {
                camera.position.set(from.cameraPositionX, from.cameraPositionY, from.cameraPositionZ);
                controls.target.set(from.controlsTargetX, from.controlsTargetY, from.controlsTargetZ);
           })
            .onComplete(function () {
                // console.log('rotate.camera', targetAngle, this.camera.position, this.camera.rotation);
            })
            .start();
    }


    // ================================================================
    //   Diagram arrangement
    // ================================================================

    center() {
        // 
        // The method calculates the center of the diagram and moves all elements to center the diagram at {0, 0, 0}.
        // It also calculates the camera Z position to place the camera above the center.
        // Finally, it updates the controls target and updates the controls.
        if (this.scene.children.length === 0) {
            console.warn('Scene is empty. Cannot calculate center.');
            return;
        }
        const box = new THREE.Box3().setFromObject(this.scene);
        const center = box.getCenter(new THREE.Vector3());
            // Translate all elements to center the diagram at {0, 0, 0}
        const translation = new THREE.Vector3(-center.x, -center.y, -center.z);
        const from = { x: 0, y: 0, z: 0 };
        const to = { x: translation.x, y: translation.y, z: translation.z };
        this.scene.children.forEach(child => {
            if (child instanceof THREE.Object3D) {
                child.position.add(translation);
            }
        });
    }

    fitScreen() {
        // The method ensures all the elements are visible.
        // Calculate the camera Z position
        const box = new THREE.Box3().setFromObject(this.scene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180); // convert FOV to radians
        const cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));
        this.camera.position.set(0, 0, cameraZ); // Place camera above the center
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.updateProjectionMatrix();
        this.controls.saveState(); // Save the state of controls. This can later be recovered with .reset.
    }

    // ================================================================
    //   Diagram modes
    // ================================================================

    /**
     * Removes all elements of type 'BarShape' from the diagram.
     * Iterates through the `elements` array in reverse order to safely remove
     * elements without affecting the iteration process. For each matching element,
     * it removes the element from its parent and also removes it from the `elements` array.
     */
    removeValueBars() {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (element.type === 'BarShape') {
                element.parent.remove(element);
                this.elements.splice(i, 1);
            }
        }
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

        switch (mode) {
            case 'EDIT':
            case 'VIEW':
                this.rotate(0);
                break;
            case 'ANALYZE':
                this.rotate(-60);
                this.addValueBars();
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
        // this.renderer.render(this.scene, this.camera);
        element.setDiagram(this);
        return element;
    }

    /**
     * Removes an element from the diagram by its ID.
     * @param {string} elementId - The ID of the element to remove.
     */
    removeElement(elementId) {
        this.elements = this.elements.filter(el => el.id !== elementId);
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
        return connector;
    }

    // ================================================================
    //   Clear diagram
    // ================================================================

    /**
     * Clears all elements and connectors from the diagram.
     */
    clear() {
        this.elements = [];
        this.connectors = [];
        this.scene.children = this.scene.children.filter(child => child instanceof THREE.AmbientLight);
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
