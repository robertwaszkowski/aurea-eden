import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { DiamondDimensions } from './BasicShapeConstants.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';

class DiamondShape extends Shape {
    constructor() {

        const diagonal = DiamondDimensions.DIAGONAL;
        const lineWidth = DiamondDimensions.LINE_WIDTH;
        const color = Colors.ELEMENT_STROKE;
        const extrusionParameters = ExtrusionParameters;
     
        function diamond( ctx, verticalSize, horizontalSize ) {
            const centerX = 0;
            const centerY = 0;
            // (!) Specify your points in counterclockwise winding order.
            ctx.moveTo( centerX - verticalSize / 2, centerY );
            ctx.lineTo( centerX, centerY - verticalSize / 2 );
            ctx.lineTo( centerX + horizontalSize / 2 , centerY);
            ctx.lineTo( centerX, centerY + verticalSize / 2 );
            ctx.lineTo( centerX - horizontalSize / 2, centerY );
        }

        // Prepare gateway mesh 
        var gatewayShape = new THREE.Shape();
        diamond( gatewayShape, diagonal, diagonal);
        const outerShape = gatewayShape.clone(); // Save the outer shape for later use
        var gatewayHole = new THREE.Path();
        diamond( gatewayHole, diagonal - ( lineWidth * Math.sqrt(2) * 2 ), diagonal - ( lineWidth * Math.sqrt(2) * 2 ) );
        gatewayShape.holes.push(gatewayHole);

        var gatewayGeometry = new THREE.ExtrudeGeometry( gatewayShape, extrusionParameters );

        // Construct the shape
        super(gatewayGeometry, new DiagramEditMaterial(color));

        this.outerShape = outerShape;

    }

    getOuterShape() {
        return this.outerShape;
    }
}

export { DiamondShape };








//GATEWAY shape
// function Gateway( diagram, centerX, centerY, lineWidth, type, text ) {

//     var diagonal = 120;

//     this.centerX = centerX;
//     this.centerY = centerY;
//     this.lineWidth = lineWidth;
//     this.verticalSize = diagonal;
//     this.horizontalSize = diagonal;
//     this.selected = false;
//     var decorations = [];
//     this.decorations = decorations;


//     function diamond( ctx, centerX, centerY, verticalSize, horizontalSize ) {
//         // (!) Specify your points in counterclockwise winding order.
//         ctx.moveTo( centerX - Math.round( verticalSize / 2 ), centerY );
//         ctx.lineTo( centerX, centerY - Math.round( verticalSize / 2 ) );
//         ctx.lineTo( centerX + Math.round( horizontalSize / 2 ), centerY);
//         ctx.lineTo( centerX, centerY + Math.round( verticalSize / 2 ) );
//         ctx.lineTo( centerX - Math.round( horizontalSize / 2 ), centerY );
//     }

//     // prepare gateway mesh
//     var gatewayMesh;
//     var gatewayShape = new THREE.Shape();
//     diamond( gatewayShape, centerX, centerY, diagonal, diagonal );
//     var gatewayHole = new THREE.Path();
//     diamond( gatewayHole, centerX, centerY, diagonal - ( lineWidth * Math.sqrt(2) * 2 ),
//                                             diagonal - ( lineWidth * Math.sqrt(2) * 2 ) );
//     gatewayShape.holes.push(gatewayHole);
//     // var gatewayGeometry = new THREE.ShapeGeometry(gatewayShape);

//     var extrudeSettings = {
//         steps: 2,
//         amount: 4,
//         bevelEnabled: true,
//         bevelThickness: .5,
//         bevelSize: 1,
//         bevelSegments: 4
//     };
//     var gatewayGeometry = new THREE.ExtrudeGeometry( gatewayShape, extrudeSettings );

//     gatewayMesh = new THREE.Mesh( gatewayGeometry, elementMaterial );
//     this.mesh = gatewayMesh;

//     // fill gateway with symbol
//     switch (type) {
//         case     CONST_GATEWAY_TYPES.EXCLUSIVE:
//             decorations[ 0 ] = new Text( diagram, centerX, centerY, "X", 50, 0 );
//             console.log("CONST_GATEWAY_TYPES.EXCLUSIVE");
//             break;
//         case     CONST_GATEWAY_TYPES.EVENT_BASED:
//             decorations[ 0 ] = new Text( diagram, centerX - 2, centerY - 27, ".", 70, 0 );
//             console.log("CONST_GATEWAY_TYPES.EVENT_BASED");
//             break;
//         case     CONST_GATEWAY_TYPES.PARALLEL:
//             decorations[ 0 ] = new Text( diagram, centerX - 2, centerY, "+", 70, 0 );
//             console.log("CONST_GATEWAY_TYPES.PARALLEL");
//             break;
//         case     CONST_GATEWAY_TYPES.INCLUSIVE:
//             decorations[ 0 ] = new Text( diagram, centerX - 2, centerY - 27, ".", 70, 0 );
//             console.log("CONST_GATEWAY_TYPES.INCLUSIVE");
//             break;
//         case     CONST_GATEWAY_TYPES.COMPLEX:
//             decorations[ 0 ] = new Text( diagram, centerX - 2, centerY - 27, ".", 70, 0 );
//             console.log("CONST_GATEWAY_TYPES.COMPLEX");
//             break;
//         case     CONST_GATEWAY_TYPES.EXCLUSIVE_EVENT_BASED:
//             decorations[ 0 ] = new Text( diagram, centerX - 2, centerY - 27, ".", 70, 0 );
//             console.log("CONST_GATEWAY_TYPES.EXCLUSIVE_EVENT_BASED");
//             break;
//         case     CONST_GATEWAY_TYPES.PARALLEL_EVENT_BASED:
//             decorations[ 0 ] = new Text( diagram, centerX - 2, centerY - 27, ".", 70, 0 );
//             console.log("CONST_GATEWAY_TYPES.PARALLEL_EVENT_BASED");
//             break;
//     }

//     // add gateway background
//     var backgroundShape = new THREE.Shape();
//     diamond( backgroundShape, centerX, centerY, diagonal, diagonal );
//     decorations[ 1 ] = new Background( backgroundShape, -1 );

//     this.select = function() {
//         this.selected = true;
//         this.mesh.material = selectedMaterial;
//         // select decorations (loop)
// //        for ( i = 0; i < decorations.length; i++ ) {
// //            this.decorations[ i ].mesh.material = selectedMaterial;
// //        }
//     }

//     this.deselect = function() {
//         this.selected = false;
//         this.mesh.material = elementMaterial;
//         //deselect decorations (loop)
// //        for ( i = 0; i < decorations.length; i++ ) {
// //            decorations[ i ].mesh.material = elementMaterial;
// //        }
//     }

//     this.getDecorations = function() {
//         return decorations;
//     }

//     this.showParameter = function( value, color ) {
//     };

//     this.hideParameter = function() {
//     }

// }