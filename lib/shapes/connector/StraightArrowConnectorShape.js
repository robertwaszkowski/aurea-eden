import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { ConnectorDimensions } from './ConnectorConstants.js';

/**
 * StraightArrowConnectorShape
 *
 * Draws a filled straight line from connectorPoints[0] to the last point,
 * with a true rotating arrowhead at the target end.
 *
 * The shape is built analytically in 2D:
 *   - direction vector  d = normalize(target - source)
 *   - perpendicular     p = (-d.y, d.x)   (rotated 90° CCW)
 *   - line body: a thin rectangle from source to (target - d * arrowheadLength)
 *   - arrowhead: a triangle at (target), base centred on the arrowBase point
 *
 * All vertices are computed in world space, so the extrusion is always correct
 * regardless of the angle between the two points.
 */
class StraightArrowConnectorShape extends Shape {
    constructor(connectorPoints) {
        if (!connectorPoints || connectorPoints.length < 2) {
            console.error('StraightArrowConnectorShape requires at least 2 points.');
            super(new THREE.BufferGeometry(), new DiagramEditMaterial(Colors.ELEMENT_STROKE));
            return;
        }

        const hw = ConnectorDimensions.CONNECTOR_LINE_WIDTH / 2;   // half line width
        const aw = ConnectorDimensions.CONNECTOR_ARROWHEAD_WIDTH;   // half-width of arrowhead base
        const al = ConnectorDimensions.CONNECTOR_ARROWHEAD_LENGTH;  // length of arrowhead

        const src = connectorPoints[0];
        const tgt = connectorPoints[connectorPoints.length - 1];

        // Direction from source to target
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len < 1e-6) {
            // Degenerate: zero-length connector — draw nothing meaningful
            super(new THREE.BufferGeometry(), new DiagramEditMaterial(Colors.ELEMENT_STROKE));
            return;
        }

        // Unit direction and perpendicular
        const dxN = dx / len;   // normalised d.x
        const dyN = dy / len;   // normalised d.y
        const pxN = -dyN;       // perpendicular (rotated 90° CCW)
        const pyN = dxN;

        // Arrow base centre point (where the line body ends and the head begins)
        const abx = tgt.x - dxN * al;
        const aby = tgt.y - dyN * al;

        // ── Build the combined outline (line body + arrowhead) as one THREE.Shape ──
        //
        // Winding (CCW when viewed from +Z so extrusion faces forward):
        //
        //   A ─── C ── E (tip = tgt)
        //   |     |   / \
        //   B ─── D ──   ──
        //
        // A = src + p*hw
        // B = src - p*hw
        // D = arrowBase - p*hw  ← narrow side
        // C = arrowBase + p*hw
        // E = tip (tgt)
        // wide left  = arrowBase + p*aw
        // wide right = arrowBase - p*aw

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

        const geometry = new THREE.ExtrudeGeometry(shape, ExtrusionParameters);
        super(geometry, new DiagramEditMaterial(Colors.ELEMENT_STROKE));
        this.name = 'StraightArrowConnectorShape';
    }
}

export { StraightArrowConnectorShape };
