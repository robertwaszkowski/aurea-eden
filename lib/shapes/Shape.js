import * as THREE from 'three';

class Shape {
    constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;

        this.width = this.getSize().x;
        this.height = this.getSize().y;
    }

    getSize() {
        // Get the size of the geometry
        var size = new THREE.Vector3();
        this.geometry.computeBoundingBox();
        this.geometry.boundingBox.getSize(size);

        return size;
    }

}

export { Shape };