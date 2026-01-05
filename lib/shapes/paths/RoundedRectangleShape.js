import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { RectangleDimensions } from './BasicShapeConstants.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';

class RoundedRectangleShape extends Shape {
    constructor(horizontalSize = RectangleDimensions.HORIZONTAL_SIZE, 
                verticalSize = RectangleDimensions.VERTICAL_SIZE, 
                cornerRadius = RectangleDimensions.CORNER_RADIUS, 
                lineWidth = RectangleDimensions.LINE_WIDTH) {

        // Calculate the outer and inner radius of the rounded rectangle based on the corner radius and line width
        const outerRadius = cornerRadius;
        const innerRadius = cornerRadius - lineWidth;
        const color = Colors.ELEMENT_STROKE;
        const extrusionParameters = ExtrusionParameters;

        function roundedRect( ctx, width, height, radius ) {
            const centerX = 0;
            const centerY = 0;
            var x = centerX - ( width / 2 );
            var y = centerY - ( height / 2 );
            ctx.moveTo( x + radius, y );
            ctx.lineTo( x + width - radius, y );
            ctx.quadraticCurveTo( x + width, y, x + width, y + radius );
            ctx.lineTo( x + width, y + height - radius );
            ctx.quadraticCurveTo( x + width, y + height, x + width - radius, y + height );
            ctx.lineTo( x + radius, y + height );
            ctx.quadraticCurveTo( x, y + height, x, y + height - radius );
            ctx.lineTo( x, y + radius );
            ctx.quadraticCurveTo( x, y, x + radius, y );
        }

        var activityShape = new THREE.Shape();
        roundedRect(activityShape, horizontalSize, verticalSize, outerRadius);
        const outerShape = activityShape.clone(); // Create a deep copy of the outer shape to save it for later use without holes
        var activityHole = new THREE.Path();
        roundedRect(activityHole, horizontalSize - (2 * lineWidth), verticalSize - (2 * lineWidth), innerRadius);
        activityShape.holes.push(activityHole);

        var activityGeometry = new THREE.ExtrudeGeometry(activityShape, extrusionParameters);

        // Construct the shape
        super(activityGeometry, new DiagramEditMaterial(color));

        this.outerShape = outerShape;

    }

    getOuterShape() {
        return this.outerShape;
    }
}

export { RoundedRectangleShape };




// import * as TWEEN from '@tweenjs/tween.js';
// import * as THREE from '../../../../../../../../home/robert/.cache/typescript/5.7/node_modules/@types/three';
// import { elementMaterial, Text, Background, Bar, selectedMaterial } from '../../bpmnElements';

// //ACTIVITY shape
// function Activity( diagram, centerX, centerY, lineWidth, text ) {

//     this.centerX = centerX;
//     this.centerY = centerY;
//     this.lineWidth = lineWidth;
//     this.text = text;
//     var decorations = [];
//     this.decorations = decorations;

//     var horizontalSize = 350;
//     var verticalSize = 200;
//     var outerRadius = 27;
//     var innerRadius = 21;

//     this.selected = false;


//     function roundedRect( ctx, centerX, centerY, width, height, radius ) {
//         var x = Math.round( centerX - ( width / 2 ) );
//         var y = Math.round( centerY - ( height / 2 ) );
//         ctx.moveTo( x + radius, y );
//         ctx.lineTo( x + width - radius, y );
//         ctx.quadraticCurveTo( x + width, y, x + width, y + radius );
//         ctx.lineTo( x + width, y + height - radius );
//         ctx.quadraticCurveTo( x + width, y + height, x + width - radius, y + height );
//         ctx.lineTo( x + radius, y + height );
//         ctx.quadraticCurveTo( x, y + height, x, y + height - radius );
//         ctx.lineTo( x, y + radius );
//         ctx.quadraticCurveTo( x, y, x + radius, y );
//     }

//     var activityMesh;

//     // prepare activity mesh
//     var activityShape = new THREE.Shape();
//     roundedRect( activityShape, centerX, centerY, horizontalSize, verticalSize, outerRadius );
//     var activityHole = new THREE.Path();
//     roundedRect( activityHole, centerX, centerY, horizontalSize - ( 2 * lineWidth ), verticalSize - ( 2 * lineWidth ), innerRadius );
//     activityShape.holes.push( activityHole );
//     // var activityGeometry = new THREE.ShapeGeometry( activityShape );

//     var extrudeSettings = {
//         steps: 2,
//         amount: 4,
//         bevelEnabled: true,
//         bevelThickness: .5,
//         bevelSize: 1,
//         bevelSegments: 4
//     };
//     var activityGeometry = new THREE.ExtrudeGeometry( activityShape, extrudeSettings );

//     activityMesh = new THREE.Mesh ( activityGeometry, elementMaterial );

//     this.mesh = activityMesh;

//     // add activity name (text)
//     decorations[ 0 ] = new Text( diagram, centerX, centerY, text, 30, 0 );

//     // add activity background
//     var backgroundShape = new THREE.Shape();
//     roundedRect( backgroundShape, centerX, centerY, horizontalSize, verticalSize, outerRadius );
//     decorations[ 1 ] = new Background( backgroundShape, -1 );

//     // add activity bar
//     var barShape = new THREE.Shape();
//     roundedRect( barShape, centerX, centerY, horizontalSize, verticalSize, outerRadius );
//     decorations[ 2 ] = new Bar( barShape );


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
//         activityMesh.material = elementMaterial;
//         //deselect decorations
// //        for ( i = 0; i < decorations.length; i++ ) {
// //            decorations[ i ].mesh.material = elementMaterial;
// //        }
//     }

//     this.getDecorations = function() {
//         return decorations;
//     }

//     this.showParameter = function( value, color ) {

//         decorations[ 2 ].mesh.scale.z = 0;
//         decorations[ 2 ].mesh.visible = true;
//         decorations[ 2 ].mesh.material.color.set( color );

//         //animate bars
//         var from = { scale: 0 };
//         var to = { scale: value/100 };
//         var tween = new TWEEN.Tween( from )
//             .to ( to, 500 )
//             .onUpdate( function () {
//                 decorations[ 2 ].mesh.scale.z = from.scale;
//             } )
//             .start();

//     };

//     this.hideParameter = function() {
//         this.decorations[ 2 ].mesh.visible = false;
//     }

// }