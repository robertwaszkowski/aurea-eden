import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { CircleDimensions } from './BasicShapeConstants.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';

class CircleShape extends Shape {
    constructor(width, height, lineWidth = CircleDimensions.LINE_WIDTH_NORMAL) {

        let eventRadius = CircleDimensions.RADIUS;
        if (width && height) {
            eventRadius = Math.min(width, height) / 2;
        }

        const color = Colors.ELEMENT_STROKE;
        const extrusionParameters = ExtrusionParameters;

        function circle( ctx, radius ) {
            const centerX = 0;
            const centerY = 0;
            var controlPointDistance = radius * 0.552284749831  // (4/3)*tan(pi/2n) for n=4 points
            ctx.moveTo( centerX, centerY - radius );
            ctx.bezierCurveTo(  centerX + controlPointDistance, centerY - radius,
                                centerX + radius, centerY - controlPointDistance,
                                centerX + radius, centerY );
            ctx.bezierCurveTo(  centerX + radius, centerY + controlPointDistance,
                                centerX + controlPointDistance, centerY + radius,
                                centerX, centerY + radius );
            ctx.bezierCurveTo(  centerX - controlPointDistance, centerY + radius,
                                centerX - radius, centerY + controlPointDistance,
                                centerX - radius, centerY );
            ctx.bezierCurveTo(  centerX - radius, centerY - controlPointDistance,
                                centerX - controlPointDistance, centerY - radius,
                                centerX, centerY - radius );
        }

        // Prepare event mesh
        var eventShape = new THREE.Shape();
        circle( eventShape, eventRadius );
        const outerShape = eventShape.clone(); // Create a deep copy of the outer shape to save it for later use without holes
        var eventHole = new THREE.Path();
        circle( eventHole, eventRadius - lineWidth );
        eventShape.holes.push( eventHole );

        var eventGeometry = new THREE.ExtrudeGeometry( eventShape, extrusionParameters );

        // Construct the shape
        super( eventGeometry, new DiagramEditMaterial( color ) );

        this.outerShape = outerShape;

    }

    getOuterShape() {
        return this.outerShape;
    }
}

export { CircleShape };
