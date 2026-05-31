import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { ConnectorDimensions } from './ConnectorConstants.js';

/**
 * StraightArrowConnectorShape
 *
 * Draws a filled straight line from connectorPoints[0] to the last point,
 * with a true rotating arrowhead at the target end.
 */
class StraightArrowConnectorShape extends Shape {
    constructor(connectorPoints) {
        super(1, 1, 1, {
            points: connectorPoints || [],
            name: 'StraightArrowConnectorShape'
        });
    }

    get2DPaths() {
        if (!this.points || this.points.length < 2) return null;

        const hw = ConnectorDimensions.CONNECTOR_LINE_WIDTH / 2;   // half line width
        const aw = ConnectorDimensions.CONNECTOR_ARROWHEAD_WIDTH;   // half-width of arrowhead base
        const al = ConnectorDimensions.CONNECTOR_ARROWHEAD_LENGTH;  // length of arrowhead

        const src = this.points[0];
        const tgt = this.points[this.points.length - 1];

        // Direction from source to target
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len < 1e-6) return null;

        // Unit direction and perpendicular
        const dxN = dx / len;   // normalised d.x
        const dyN = dy / len;   // normalised d.y
        const pxN = -dyN;       // perpendicular (rotated 90° CCW)
        const pyN = dxN;

        // Arrow base centre point (where the line body ends and the head begins)
        const abx = tgt.x - dxN * al;
        const aby = tgt.y - dyN * al;

        const shape = new THREE.Shape();

        // Start at A
        shape.moveTo(src.x + pxN * hw, src.y + pyN * hw);

        // A → C (top of line body, toward arrowBase)
        shape.lineTo(abx + pxN * hw, aby + pyN * hw);

        // C → wide-left corner of arrowhead base
        shape.lineTo(abx + pxN * aw, aby + pyN * aw);

        // wide-left → tip
        shape.lineTo(tgt.x, tgt.y);

        // tip → wide-right corner of arrowhead base
        shape.lineTo(abx - pxN * aw, aby - pyN * aw);

        // D (narrow right of arrowBase, still on arrowBase line)
        shape.lineTo(abx - pxN * hw, aby - pyN * hw);

        // D → B (bottom of line body, back to source)
        shape.lineTo(src.x - pxN * hw, src.y - pyN * hw);

        // B → A (close the line body at source end)
        shape.lineTo(src.x + pxN * hw, src.y + pyN * hw);

        shape.closePath();

        return shape;
    }
}

export { StraightArrowConnectorShape };
