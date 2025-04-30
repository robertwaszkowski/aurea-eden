import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { BarMaterial } from '../../materials/BarMaterial.js';
import { ExtrusionParameters, ColorPalette } from './ValueBarConstants.js';

class ValueBarShape extends Shape {
    constructor(shape, height, color) {
        if (!(shape instanceof THREE.Shape)) {
            throw new TypeError('shape must be an instance of THREE.Shape');
        }

        // Use color if provided, otherwise pick a random color from the palette
        const barColor = color !== undefined ? color : ColorPalette[Math.floor(Math.random() * ColorPalette.length)];
        // Use height if provided, otherwise pick a random height
        const barHeight = height !== undefined ? height : Math.floor(Math.random() * 10) + 1;
        // Extrusion parameters
        const extrusionParameters = { ...ExtrusionParameters, depth: barHeight };

        var barGeometry = new THREE.ExtrudeGeometry( shape, extrusionParameters );

        // Construct the shape
        super(barGeometry, new BarMaterial(barColor));

        // this.barHeight = barHeight;
    }

    // draw(ctx, x, y, width) {
    //     ctx.fillRect(x, y - this.barHeight, width, this.barHeight);
    // }
}

class ValueBarChart {
    constructor(bars) {
        this.bars = bars;
    }

    draw(ctx, x, y, barWidth, barSpacing) {
        this.bars.forEach((bar, index) => {
            const barShape = new ValueBarShape(bar.height);
            barShape.draw(ctx, x + index * (barWidth + barSpacing), y, barWidth);
        });
    }
}

export { ValueBarShape, ValueBarChart };

// Example usage:
// const canvas = document.getElementById('myCanvas');
// const ctx = canvas.getContext('2d');
// const bars = [{ height: 100 }, { height: 150 }, { height: 200 }];
// const barChart = new BarChart(bars);
// barChart.draw(ctx, 10, 300, 50, 10);
