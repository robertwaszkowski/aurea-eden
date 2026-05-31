import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiamondDimensions } from './BasicShapeConstants.js';

class DiamondShape extends Shape {
    constructor(
        width = DiamondDimensions.DIAGONAL,
        height = DiamondDimensions.DIAGONAL,
        lineWidth = DiamondDimensions.LINE_WIDTH
    ) {
        super(width, height, lineWidth);
        this.name = 'DiamondShape';
    }

    get2DPaths() {
        const width = this.width;
        const height = this.height;

        const diamond = (verticalSize, horizontalSize) => {
            const ctx = new THREE.Shape();
            const centerX = 0;
            const centerY = 0;
            ctx.moveTo(centerX - verticalSize / 2, centerY);
            ctx.lineTo(centerX, centerY - verticalSize / 2);
            ctx.lineTo(centerX + horizontalSize / 2, centerY);
            ctx.lineTo(centerX, centerY + verticalSize / 2);
            ctx.lineTo(centerX - horizontalSize / 2, centerY);
            ctx.closePath();
            return ctx;
        };

        const gatewayShape = diamond(width, height);

        const widthOffset = this.lineWidth * Math.sqrt(2) * 2;
        const heightOffset = this.lineWidth * Math.sqrt(2) * 2;

        if (this.lineWidth > 0 && width > widthOffset && height > heightOffset) {
            const gatewayHole = new THREE.Path();
            gatewayHole.copy(diamond(Math.max(0, width - widthOffset), Math.max(0, height - heightOffset)));
            gatewayShape.holes.push(gatewayHole);
        }

        return [gatewayShape];
    }
}

export { DiamondShape };