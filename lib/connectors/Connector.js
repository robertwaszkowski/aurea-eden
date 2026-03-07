import * as THREE from 'three';
import { RoundedCornerOrthogonalConnectorShape } from '../shapes/connector/RoundedCornerOrthogonalConnectorShape.js';
import { Element } from '../elements/Element.js';
import { CircleShape } from '../shapes/paths/CircleShape.js';
import { DiagramDimensions } from '../diagrams/DiagramConstants.js';

class Connector extends THREE.Mesh {
    constructor(elementId,
        shape = new RoundedCornerOrthogonalConnectorShape(),
        sourceElement = null,
        targetElement = null,
        sourcePosition = 'auto',
        targetPosition = 'auto',
        label = null,
        type = 'sequence',
        properties = {}) {
        super(shape.geometry, shape.material);
        this.elementId = elementId;
        this.sourceElement = sourceElement;
        this.targetElement = targetElement;
        this.sourcePosition = sourcePosition;
        this.targetPosition = targetPosition;
        this.label = label;
        this.type = type;
        this.properties = properties;

        // Extract points from shape if provided, or expect them to be set later
        this.points = shape.points || [];
        this.labelElement = null; // Store reference to assigned label
    }

    setDiagram(diagram) {
        this.diagram = diagram;
        if (this.labelElement) {
            this.diagram.addElement(this.labelElement);
        }
    }

    /**
     * Recalculates the connector path and updates its geometry.
     * Triggered when source or target elements move.
     */
    update() {
        if (!this.sourceElement || !this.targetElement) return;

        // Use the static points determination logic
        const points = Connector.determinePoints(
            this.sourceElement,
            this.targetElement,
            this.sourcePosition,
            this.targetPosition
        );

        this.points = points;

        // Re-generate geometry
        let newShape;
        if (this.type === 'association') {
            // We need to import StraightDottedConnectorShape here or solve the circular dependency
            // For now, assume most are sequence flows in this context
            // TODO: Handle other types if necessary
        } else {
            newShape = new RoundedCornerOrthogonalConnectorShape(points);
        }

        if (newShape) {
            if (this.geometry) this.geometry.dispose();
            this.geometry = newShape.geometry;
        }

        // Update label position if the label element already exists
        if (this.label && this.labelElement) {
            this._updateLabelPosition();
        }
        // If a label was requested (setLabel was called) but failed because points
        // were empty at the time (e.g. deferred pending connections in arrange()),
        // retry creating the label now that points are available.
        else if (this.label && !this.labelElement && this.points.length >= 2) {
            this.setLabel(this.label);
        }
    }

    /**
     * Internal helper to update label anchor position without re-creating the Element.
     */
    _updateLabelPosition() {
        if (!this.labelElement || this.points.length < 2) return;

        // Calculate the longest segment of the connector to place the label
        let longestSegment = { p1: this.points[0], p2: this.points[1], length: 0 };
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            if (dist > longestSegment.length) {
                longestSegment = { p1, p2, length: dist };
            }
        }

        const midX = (longestSegment.p1.x + longestSegment.p2.x) / 2;
        const midY = (longestSegment.p1.y + longestSegment.p2.y) / 2;

        const isVertical = Math.abs(longestSegment.p1.x - longestSegment.p2.x) < 0.01;
        let finalOffsetX = 0;
        let finalOffsetY = 0;

        if (isVertical) {
            finalOffsetX = 15;
            finalOffsetY = 5;
        } else {
            // Standard offset from setLabel
            finalOffsetY = 20;
        }

        this.labelElement.positionAt({ x: midX + finalOffsetX, y: midY + finalOffsetY, z: 2 });
    }

    /**
     * Natively assigns a text label to the connector by automatically calculating the optimal midpoint.
     * @param {string} text - The label text to display
     * @param {number} [offsetY=20] - Vertical offset from the longest line segment
     */
    setLabel(text, offsetY = 20) {
        if (!this.diagram) {
            console.warn("Connector.setLabel called before diagram was set. The label will be added when setDiagram is called.");
        }

        // Safety guard: need at least 2 points to calculate a segment midpoint.
        // If points aren't available yet (e.g. connector was just created as a deferred
        // pending connection in arrange()), silently store the label text and return.
        // Connector.update() will call setLabel again once points have been computed.
        if (!this.points || this.points.length < 2) {
            this.label = text; // ensure update() retry can find the text
            return this;
        }

        // Calculate the longest segment of the connector to place the label
        let longestSegment = { p1: this.points[0], p2: this.points[1], length: 0 };
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            if (dist > longestSegment.length) {
                longestSegment = { p1, p2, length: dist };
            }
        }

        const midX = (longestSegment.p1.x + longestSegment.p2.x) / 2;
        const midY = (longestSegment.p1.y + longestSegment.p2.y) / 2;

        const anchorGeo = new CircleShape(1, 1);
        this.labelElement = new Element(`${this.elementId}-label`, anchorGeo);
        this.labelElement.semanticType = 'flow';
        this.labelElement.themable = true;

        if (this.diagram) {
            this.diagram.addElement(this.labelElement);
        }

        const isVertical = Math.abs(longestSegment.p1.x - longestSegment.p2.x) < 0.01;

        let wrapWidth;
        let finalOffsetX = 0;
        let finalOffsetY = 0;

        if (isVertical) {
            // Text flows horizontally, so we don't constrain width based on the vertical segment length.
            // Give it a safe static width to prevent overflowing adjacent objects
            wrapWidth = 100;
            // Shift the text horizontally to the right so it doesn't straddle the vertical line
            finalOffsetX = 15;
            // Center the text vertically relative to the midpoint
            finalOffsetY = 5;
        } else {
            // For horizontal segments, constrain text to the segment length so it doesn't overhang
            wrapWidth = Math.max(60, Math.min(longestSegment.length * 0.9, 150));
            // Shift the text vertically so it rests above the line
            finalOffsetY = offsetY; // Default is +20 
        }

        this.labelElement.positionAt({ x: midX + finalOffsetX, y: midY + finalOffsetY, z: 2 });
        this.labelElement.visible = false; // Hide the anchor mesh itself

        // Attach text to the invisible anchor
        this.labelElement.addWrappedText(text, new THREE.Vector3(0, 0, 3), 7, 'center', wrapWidth, 0, 'top');

        return this;
    }

    static determinePoints(sourceElement, targetElement, sourcePosition, targetPosition) {
        let waypoints = [];

        const sourcePoint = sourceElement.getPointPosition(sourcePosition);
        const targetPoint = targetElement.getPointPosition(targetPosition);

        // Helper to get raw direction from position string (e.g. 'E', 'top-left' -> 'N')
        const getDir = (pos) => {
            if (!pos) return null;
            if (pos.startsWith('E')) return 'E';
            if (pos.startsWith('W')) return 'W';
            if (pos.startsWith('N') || pos.startsWith('top')) return 'N';
            if (pos.startsWith('S') || pos.startsWith('bottom')) return 'S';
            return null;
        };

        const srcDir = getDir(sourcePosition);
        const tgtDir = getDir(targetPosition);

        // Define a safe fallback distance for C-curves and routing around elements
        const safeMargin = DiagramDimensions.SAFE_MARGIN;

        // If either direction is missing, fallback to simple L-curve
        if (!srcDir || !tgtDir) {
            if (sourcePoint.x !== targetPoint.x && sourcePoint.y !== targetPoint.y) {
                if (srcDir === 'W' || srcDir === 'E') waypoints.push({ x: targetPoint.x, y: sourcePoint.y });
                else if (srcDir === 'N' || srcDir === 'S') waypoints.push({ x: sourcePoint.x, y: targetPoint.y });
                else waypoints.push({ x: targetPoint.x, y: sourcePoint.y }); // Default fallback
            }
            return [sourcePoint, ...waypoints, targetPoint];
        }

        const isHorizontal = (dir) => dir === 'E' || dir === 'W';
        const isVertical = (dir) => dir === 'N' || dir === 'S';

        if (isHorizontal(srcDir) && isHorizontal(tgtDir)) {
            if (srcDir !== tgtDir) {
                // Opposite Faces (East to West or West to East) -> S-Curve (2 elbows)
                const isNaturallyOrdered = (srcDir === 'E' && sourcePoint.x < targetPoint.x) || (srcDir === 'W' && sourcePoint.x > targetPoint.x);
                if (isNaturallyOrdered) {
                    if (Math.abs(sourcePoint.y - targetPoint.y) > 0.1) {
                        const midX = (sourcePoint.x + targetPoint.x) / 2;
                        waypoints.push({ x: midX, y: sourcePoint.y });
                        waypoints.push({ x: midX, y: targetPoint.y });
                    }
                } else {
                    // U-Curve (4 elbows) via bounding box avoidance
                    const topEdgeY = Math.max(
                        sourceElement.position.y + sourceElement.getSize().y / 2,
                        targetElement.position.y + targetElement.getSize().y / 2
                    );
                    const avoidY = topEdgeY + safeMargin;
                    const margin1 = sourcePoint.x + (srcDir === 'E' ? safeMargin : -safeMargin);
                    const margin2 = targetPoint.x + (tgtDir === 'E' ? safeMargin : -safeMargin);

                    waypoints.push({ x: margin1, y: sourcePoint.y });
                    waypoints.push({ x: margin1, y: avoidY });
                    waypoints.push({ x: margin2, y: avoidY });
                    waypoints.push({ x: margin2, y: targetPoint.y });
                }
            } else {
                // Same Faces (East to East or West to West) -> C-Curve (2 elbows)
                // When connecting identical faces, we must route the connector outwards.
                // To avoid cutting through the elements if they are staggered, we must project to the *furthest* edge.
                let marginX;
                if (srcDir === 'E') {
                    // Go further East than the rightmost element
                    marginX = Math.max(sourcePoint.x, targetPoint.x) + safeMargin;
                } else {
                    // Go further West than the leftmost element
                    marginX = Math.min(sourcePoint.x, targetPoint.x) - safeMargin;
                }
                waypoints.push({ x: marginX, y: sourcePoint.y });
                waypoints.push({ x: marginX, y: targetPoint.y });
            }
        }
        else if (isVertical(srcDir) && isVertical(tgtDir)) {
            if (srcDir !== tgtDir) {
                // Opposite Faces (North to South or South to North) -> S-Curve (2 elbows)
                // In THREE.js ++Y is North (Up), --Y is South (Down)
                const isNaturallyOrdered = (srcDir === 'N' && sourcePoint.y < targetPoint.y) || (srcDir === 'S' && sourcePoint.y > targetPoint.y);
                if (isNaturallyOrdered) {
                    if (Math.abs(sourcePoint.x - targetPoint.x) > 0.1) {
                        const midY = (sourcePoint.y + targetPoint.y) / 2;
                        waypoints.push({ x: sourcePoint.x, y: midY });
                        waypoints.push({ x: targetPoint.x, y: midY });
                    }
                } else {
                    // U-Curve (4 elbows) via bounding box avoidance
                    const rightEdgeX = Math.max(
                        sourceElement.position.x + sourceElement.getSize().x / 2,
                        targetElement.position.x + targetElement.getSize().x / 2
                    );
                    const avoidX = rightEdgeX + safeMargin;
                    const margin1 = sourcePoint.y + (srcDir === 'N' ? safeMargin : -safeMargin);
                    const margin2 = targetPoint.y + (tgtDir === 'N' ? safeMargin : -safeMargin);

                    waypoints.push({ x: sourcePoint.x, y: margin1 });
                    waypoints.push({ x: avoidX, y: margin1 });
                    waypoints.push({ x: avoidX, y: margin2 });
                    waypoints.push({ x: targetPoint.x, y: margin2 });
                }
            } else {
                // Same Faces (North to North or South to South) -> C-Curve (2 elbows)
                let marginY;
                if (srcDir === 'N') {
                    // Go further North (Up/Higher +Y) than the highest element
                    marginY = Math.max(sourcePoint.y, targetPoint.y) + safeMargin;
                } else {
                    // Go further South (Down/Lower -Y) than the lowest element
                    marginY = Math.min(sourcePoint.y, targetPoint.y) - safeMargin;
                }
                waypoints.push({ x: sourcePoint.x, y: marginY });
                waypoints.push({ x: targetPoint.x, y: marginY });
            }
        }
        else {
            // Orthogonal Faces (e.g., East to North, West to South, etc.)
            const dx = targetPoint.x - sourcePoint.x;
            const dy = targetPoint.y - sourcePoint.y;

            // Check if we can use a simple 1-elbow L-curve.
            // A simple L-curve is valid ONLY if it arrives at the target face from the correct direction.
            // Directional rules for sequence flows:
            // - E: Enter from right (moving left) <- Impossible for L-curve starting E or W
            // - W: Enter from left (moving right)  <- Impossible for L-curve starting E or W
            // - N: Enter from top (moving down)    <- Impossible for L-curve starting N or S
            // - S: Enter from bottom (moving up)   <- Impossible for L-curve starting N or S

            // This means an L-curve is ONLY possible between a Horizontal start and a Vertical end (or vice versa)
            // AND the target must be positioned such that the natural corner doesn't go "through" the target box.

            let canUseSimpleL = false;
            // If starting Horizontal (E/W), the last segment is Vertical. So it must enter a N or S port.
            if (srcDir === 'E' && dx >= 0) {
                if (tgtDir === 'S' && dy >= 0) canUseSimpleL = true; // Right then Up into South
                if (tgtDir === 'N' && dy <= 0) canUseSimpleL = true; // Right then Down into North
            }
            if (srcDir === 'W' && dx <= 0) {
                if (tgtDir === 'S' && dy >= 0) canUseSimpleL = true; // Left then Up into South
                if (tgtDir === 'N' && dy <= 0) canUseSimpleL = true; // Left then Down into North
            }
            // If starting Vertical (N/S), the last segment is Horizontal. So it must enter an E or W port.
            if (srcDir === 'N' && dy >= 0) {
                if (tgtDir === 'W' && dx >= 0) canUseSimpleL = true; // Up then Right into West
                if (tgtDir === 'E' && dx <= 0) canUseSimpleL = true; // Up then Left into East
            }
            if (srcDir === 'S' && dy <= 0) {
                if (tgtDir === 'W' && dx >= 0) canUseSimpleL = true; // Down then Right into West
                if (tgtDir === 'E' && dx <= 0) canUseSimpleL = true; // Down then Left into East
            }

            if (canUseSimpleL) {
                // 1 elbow (L-curve)
                if (isHorizontal(srcDir)) waypoints.push({ x: targetPoint.x, y: sourcePoint.y });
                else waypoints.push({ x: sourcePoint.x, y: targetPoint.y });
            } else {
                // Complex orthogonal routing (3 elbows / 4 segments)
                // This ensures we loop around and enter the port from the correct exterior side.
                if (isHorizontal(srcDir)) {
                    // Start Horizontally (E/W), must enter Vertically (N/S)
                    const marginX = sourcePoint.x + (srcDir === 'E' ? safeMargin : -safeMargin);
                    const marginY = targetPoint.y + (tgtDir === 'N' ? safeMargin : -safeMargin);
                    waypoints.push({ x: marginX, y: sourcePoint.y });
                    waypoints.push({ x: marginX, y: marginY });
                    waypoints.push({ x: targetPoint.x, y: marginY });
                } else {
                    // Start Vertically (N/S), must enter Horizontally (E/W)
                    const marginY = sourcePoint.y + (srcDir === 'N' ? safeMargin : -safeMargin);
                    const marginX = targetPoint.x + (tgtDir === 'E' ? safeMargin : -safeMargin);
                    waypoints.push({ x: sourcePoint.x, y: marginY });
                    waypoints.push({ x: marginX, y: marginY });
                    waypoints.push({ x: marginX, y: targetPoint.y });
                }
            }
        }
        // Ensure points are strictly orthogonal. If not, fallback.
        const rawPoints = [sourcePoint, ...waypoints, targetPoint];
        if (rawPoints.length <= 2) return rawPoints;

        // -----------------------------------------
        // CLEANUP: Filter collinear points
        // RoundedCornerOrthogonalConnectorShape builds a rounded corner at EVERY interior waypoint.
        // Therefore, any collinear "pass-through" points will cause rendering bugs (wobbles, broken geometry).
        // We must ensure the final array only contains points where a 90-degree turn actually happens.
        // -----------------------------------------
        const filteredPoints = [rawPoints[0]]; // Always keep source

        for (let i = 1; i < rawPoints.length - 1; i++) {
            const prev = rawPoints[i - 1];
            const curr = rawPoints[i];
            const next = rawPoints[i + 1];

            const collinearH = (Math.abs(prev.y - curr.y) < 0.1 && Math.abs(curr.y - next.y) < 0.1);
            const collinearV = (Math.abs(prev.x - curr.x) < 0.1 && Math.abs(curr.x - next.x) < 0.1);

            // If the point is NOT collinear with its neighbours, it's a true corner. Keep it.
            if (!collinearH && !collinearV) {
                // Also skip duplicate consecutive points just in case
                if (Math.abs(curr.x - prev.x) > 0.1 || Math.abs(curr.y - prev.y) > 0.1) {
                    filteredPoints.push(curr);
                }
            }
        }

        // Ensure the last target point isn't accidentally removed
        const lastFiltered = filteredPoints[filteredPoints.length - 1];
        if (Math.abs(lastFiltered.x - targetPoint.x) > 0.1 || Math.abs(lastFiltered.y - targetPoint.y) > 0.1) {
            filteredPoints.push(targetPoint);
        }

        return filteredPoints;
    }

}

export { Connector };