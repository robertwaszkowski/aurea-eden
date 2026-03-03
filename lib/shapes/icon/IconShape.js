import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { IconDimensions } from './IconConstants.js';
import { Colors } from '../../diagrams/DiagramConstants.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { max } from 'three/tsl';

class IconShape extends Shape {

    static getGeometries(svgText, size) {
        let svgLoader = new SVGLoader();
        let data = svgLoader.parse(svgText);

        let iconGeometries = [];
        data.paths.forEach((path) => {
            // // Apply scale transformation to path
            // path.subPaths.forEach(subPath => {
            //     const points = subPath.getPoints();
            //     points.forEach(point => {
            //         point.multiplyScalar(0.01);
            //         // Flip vertically by inverting the y-coordinate
            //         point.y = -point.y;
            //     });
            // });

            // Handle fills
            const fillColor = path.userData.style.fill;
            if (fillColor !== undefined && fillColor !== 'none') {
                const shapes = SVGLoader.createShapes(path);
                shapes.forEach((shape) => {
                    let geometry = new THREE.ShapeGeometry(shape);
                    if (geometry.index !== null) {
                        geometry = geometry.toNonIndexed(); // Ensure geometry is non-indexed
                    }
                    iconGeometries.push(geometry);
                });
            }

            // Handle strokes if needed
            const strokeColor = path.userData.style.stroke;
            if (strokeColor !== undefined && strokeColor !== 'none') {
                path.subPaths.forEach((subPath) => {
                    let geometry = SVGLoader.pointsToStroke(
                        subPath.getPoints(),
                        path.userData.style
                    );
                    if (geometry) {
                        if (geometry.index !== null) {
                            geometry = geometry.toNonIndexed(); // Ensure geometry is non-indexed
                        }
                        iconGeometries.push(geometry);
                    }
                });
            }
        });

        // Merge icon geometries
        const iconGeometry = mergeGeometries(iconGeometries, false); // .center().scale(1, -1, 1);
        // SVG y coordinates are the inverse of normal cartesian, so correct for this using rotation.
        iconGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI));
        // Normalise the size and center point of the icon as different sources have different sizes.
        iconGeometry.computeBoundingBox();
        const boundingBox = iconGeometry.boundingBox;

        let maxDimension = Math.max(boundingBox.max.x - boundingBox.min.x, boundingBox.max.y - boundingBox.min.y);

        // Use exact SVG viewBox dimensions if available!
        // SVGLoader calculates the bounding box of the *drawn path ink*. This destroys any intended padding
        // inside the SVG. By reading viewBox, icons maintain their native relative sizes (e.g. exclusive vs parallel).
        if (data.xml) {
            let viewBoxWidth = 0;
            let viewBoxHeight = 0;
            const viewBoxStr = data.xml.getAttribute('viewBox');
            if (viewBoxStr) {
                const parts = viewBoxStr.split(/[\s,]+/).filter(Boolean);
                if (parts.length === 4) {
                    viewBoxWidth = parseFloat(parts[2]);
                    viewBoxHeight = parseFloat(parts[3]);
                }
            } else if (data.xml.getAttribute('width') && data.xml.getAttribute('height')) {
                viewBoxWidth = parseFloat(data.xml.getAttribute('width'));
                viewBoxHeight = parseFloat(data.xml.getAttribute('height'));
            }
            if (viewBoxWidth > 0 && viewBoxHeight > 0) {
                maxDimension = Math.max(viewBoxWidth, viewBoxHeight);
            }
        }

        const scaleFactor = size / maxDimension;
        // Determine size of icon by bounding sphere.
        iconGeometry.computeBoundingSphere();
        const boundingSphere = iconGeometry.boundingSphere;
        // const scaleFactor = size / boundingSphere.radius;
        // Scale the icon to the desired size
        iconGeometry.scale(scaleFactor, scaleFactor, 1);
        iconGeometry.center();

        return iconGeometry;
    }

    constructor(iconSVG, size = IconDimensions.ICON_SIZE_MEDIUM) {
        const color = Colors.ELEMENT_TEXT;
        const iconGeometry = IconShape.getGeometries(iconSVG, size);
        super(iconGeometry, new DiagramEditMaterial(color));
        this.svgText = iconSVG; // Store exactly which icon was used
    }
}

export { IconShape };
