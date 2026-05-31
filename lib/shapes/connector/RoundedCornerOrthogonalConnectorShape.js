import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { ConnectorDimensions } from './ConnectorConstants.js';

class RoundedCornerOrthogonalConnectorShape extends Shape {
    constructor(connectorPoints) {
        super(1, 1, 1, {
            points: connectorPoints || [],
            name: 'RoundedCornerOrthogonalConnectorShape'
        });
    }

    get2DPaths() {
        if (!this.points || this.points.length < 2) return null;

        const outerRadius = ConnectorDimensions.CONNECTOR_OUTER_RADIUS;
        const innerRadius = ConnectorDimensions.CONNECTOR_INNER_RADIUS;
        const lineWidth = ConnectorDimensions.CONNECTOR_LINE_WIDTH;
        const arrowheadWidth = ConnectorDimensions.CONNECTOR_ARROWHEAD_WIDTH;
        const arrowheadLength = ConnectorDimensions.CONNECTOR_ARROWHEAD_LENGTH;
        const width = lineWidth / 2;

        // Calculate total path length to detect degenerate (zero-distance) connections
        let pathLength = 0;
        for (let i = 1; i < this.points.length; i++) {
            pathLength += Math.sqrt(
                Math.pow(this.points[i].x - this.points[i-1].x, 2) + 
                Math.pow(this.points[i].y - this.points[i-1].y, 2)
            );
        }

        if (pathLength < 1e-3) return null;

        var connectorShape = new THREE.Shape();

        // draw the end of the first segment
        if (this.points[0].y == this.points[1].y
            && this.points[0].x < this.points[1].x) { // horizontal segment right
            connectorShape.moveTo(this.points[0].x, this.points[0].y + width);
            connectorShape.lineTo(this.points[0].x, this.points[0].y - width);
        }
        if (this.points[0].y == this.points[1].y
            && this.points[0].x > this.points[1].x) { // horizontal segment left
            connectorShape.moveTo(this.points[0].x, this.points[0].y - width);
            connectorShape.lineTo(this.points[0].x, this.points[0].y + width);
        }
        if (this.points[0].x == this.points[1].x
            && this.points[0].y < this.points[1].y) { // vertical segment up
            connectorShape.moveTo(this.points[0].x - width, this.points[0].y);
            connectorShape.lineTo(this.points[0].x + width, this.points[0].y);
        }
        if (this.points[0].x == this.points[1].x
            && this.points[0].y > this.points[1].y) { // vertical segment down
            connectorShape.moveTo(this.points[0].x + width, this.points[0].y);
            connectorShape.lineTo(this.points[0].x - width, this.points[0].y);
        }
        // draw all segments forward
        for (var i = 1; i < this.points.length - 1; i++) {
            const prevLen = Math.sqrt(Math.pow(this.points[i].x - this.points[i - 1].x, 2) + Math.pow(this.points[i].y - this.points[i - 1].y, 2));
            const nextLen = Math.sqrt(Math.pow(this.points[i + 1].x - this.points[i].x, 2) + Math.pow(this.points[i + 1].y - this.points[i].y, 2));
            const maxRadius = Math.min(prevLen / 2, nextLen / 2);

            const currentOuter = Math.min(outerRadius, maxRadius);
            const currentInner = Math.max(0, currentOuter - lineWidth);

            if (this.points[i - 1].y == this.points[i].y) { // horizontal
                if (this.points[i - 1].x < this.points[i].x) { // right
                    if (this.points[i].y < this.points[i + 1].y) { // right up
                        connectorShape.lineTo(this.points[i].x + width - currentOuter, this.points[i].y - width);
                        if (currentOuter > 0) connectorShape.quadraticCurveTo(this.points[i].x + width, this.points[i].y - width,
                            this.points[i].x + width, this.points[i].y - width + currentOuter);

                    } else { // right down
                        connectorShape.lineTo(this.points[i].x - width - currentInner, this.points[i].y - width);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x - width, this.points[i].y - width,
                            this.points[i].x - width, this.points[i].y - width - currentInner);
                    }
                } else { // left
                    if (this.points[i].y < this.points[i + 1].y) { // left up
                        connectorShape.lineTo(this.points[i].x + width + currentInner, this.points[i].y + width);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x + width, this.points[i].y + width,
                            this.points[i].x + width, this.points[i].y + width + currentInner);
                    } else { // left down
                        connectorShape.lineTo(this.points[i].x - width + currentOuter, this.points[i].y + width);
                        if (currentOuter > 0) connectorShape.quadraticCurveTo(this.points[i].x - width, this.points[i].y - width,
                            this.points[i].x - width, this.points[i].y + width - currentOuter);
                    }
                }
            }
            if (this.points[i - 1].x == this.points[i].x) { // vertical
                if (this.points[i - 1].y < this.points[i].y) { // up
                    if (this.points[i].x < this.points[i + 1].x) { // up right
                        connectorShape.lineTo(this.points[i].x + width, this.points[i].y - width - currentInner);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x + width, this.points[i].y - width,
                            this.points[i].x + width + currentInner, this.points[i].y - width);
                    } else { // up left
                        connectorShape.lineTo(this.points[i].x + width, this.points[i].y + width - currentOuter);
                        if (currentOuter > 0) connectorShape.quadraticCurveTo(this.points[i].x + width, this.points[i].y + width,
                            this.points[i].x + width - currentOuter, this.points[i].y + width);
                    }
                } else { // down
                    if (this.points[i].x < this.points[i + 1].x) { // down right
                        connectorShape.lineTo(this.points[i].x - width, this.points[i].y - width + currentOuter);
                        if (currentOuter > 0) connectorShape.quadraticCurveTo(this.points[i].x - width, this.points[i].y - width,
                            this.points[i].x - width + currentOuter, this.points[i].y - width);
                    } else { // down left
                        connectorShape.lineTo(this.points[i].x - width, this.points[i].y + width + currentInner);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x - width, this.points[i].y + width,
                            this.points[i].x - width - currentInner, this.points[i].y + width);
                    }
                }
            }
        }

        // draw the last segment
        if (this.points[this.points.length - 2].y
            == this.points[this.points.length - 1].y
            && this.points[this.points.length - 2].x
            < this.points[this.points.length - 1].x) { // horizontal segment right
            connectorShape.lineTo(this.points[this.points.length - 1].x - arrowheadLength,
                this.points[this.points.length - 1].y - width);
            connectorShape.lineTo(this.points[this.points.length - 1].x - arrowheadLength,
                this.points[this.points.length - 1].y - arrowheadWidth);
            connectorShape.lineTo(this.points[this.points.length - 1].x,
                this.points[this.points.length - 1].y);
            connectorShape.lineTo(this.points[this.points.length - 1].x - arrowheadLength,
                this.points[this.points.length - 1].y + arrowheadWidth);
            connectorShape.lineTo(this.points[this.points.length - 1].x - arrowheadLength,
                this.points[this.points.length - 1].y + width);
        }
        if (this.points[this.points.length - 2].y
            == this.points[this.points.length - 1].y
            && this.points[this.points.length - 2].x
            > this.points[this.points.length - 1].x) { // horizontal segment left
            connectorShape.lineTo(this.points[this.points.length - 1].x + arrowheadLength,
                this.points[this.points.length - 1].y + width);
            connectorShape.lineTo(this.points[this.points.length - 1].x + arrowheadLength,
                this.points[this.points.length - 1].y + arrowheadWidth);
            connectorShape.lineTo(this.points[this.points.length - 1].x,
                this.points[this.points.length - 1].y);
            connectorShape.lineTo(this.points[this.points.length - 1].x + arrowheadLength,
                this.points[this.points.length - 1].y - arrowheadWidth);
            connectorShape.lineTo(this.points[this.points.length - 1].x + arrowheadLength,
                this.points[this.points.length - 1].y - width);
        }
        if (this.points[this.points.length - 2].x
            == this.points[this.points.length - 1].x
            && this.points[this.points.length - 2].y
            < this.points[this.points.length - 1].y) { // vertical segment up
            connectorShape.lineTo(this.points[this.points.length - 1].x + width,
                this.points[this.points.length - 1].y - arrowheadLength);
            connectorShape.lineTo(this.points[this.points.length - 1].x + arrowheadWidth,
                this.points[this.points.length - 1].y - arrowheadLength);
            connectorShape.lineTo(this.points[this.points.length - 1].x,
                this.points[this.points.length - 1].y);
            connectorShape.lineTo(this.points[this.points.length - 1].x - arrowheadWidth,
                this.points[this.points.length - 1].y - arrowheadLength);
            connectorShape.lineTo(this.points[this.points.length - 1].x - width,
                this.points[this.points.length - 1].y - arrowheadLength);
        }
        if (this.points[this.points.length - 2].x
            == this.points[this.points.length - 1].x
            && this.points[this.points.length - 2].y
            > this.points[this.points.length - 1].y) { // vertical segment down
            connectorShape.lineTo(this.points[this.points.length - 1].x - width,
                this.points[this.points.length - 1].y + (arrowheadLength * 32 / 35)); // TODO: Explain why arrow down is shorter 35-32
            connectorShape.lineTo(this.points[this.points.length - 1].x - arrowheadWidth,
                this.points[this.points.length - 1].y + (arrowheadLength * 32 / 35));
            connectorShape.lineTo(this.points[this.points.length - 1].x,
                this.points[this.points.length - 1].y);
            connectorShape.lineTo(this.points[this.points.length - 1].x + arrowheadWidth,
                this.points[this.points.length - 1].y + (arrowheadLength * 32 / 35));
            connectorShape.lineTo(this.points[this.points.length - 1].x + width,
                this.points[this.points.length - 1].y + (arrowheadLength * 32 / 35));
        }

        // draw all segments backward
        for (var i = this.points.length - 2; i > 0; i--) {
            const prevLen = Math.sqrt(Math.pow(this.points[i].x - this.points[i + 1].x, 2) + Math.pow(this.points[i].y - this.points[i + 1].y, 2));
            const nextLen = Math.sqrt(Math.pow(this.points[i - 1].x - this.points[i].x, 2) + Math.pow(this.points[i - 1].y - this.points[i].y, 2));
            const maxRadius = Math.min(prevLen / 2, nextLen / 2);

            const currentOuter = Math.min(outerRadius, maxRadius);
            const currentInner = Math.max(0, currentOuter - lineWidth);

            if (this.points[i + 1].y == this.points[i].y) { // horizontal
                if (this.points[i + 1].x < this.points[i].x) { // right
                    if (this.points[i].y < this.points[i - 1].y) { // right up
                        connectorShape.lineTo(this.points[i].x + width - currentInner, this.points[i].y - width);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x + width, this.points[i].y - width,
                            this.points[i].x + width, this.points[i].y - width + currentInner);
                    } else { // right down
                        connectorShape.lineTo(this.points[i].x - width - currentInner, this.points[i].y - width);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x - width, this.points[i].y - width,
                            this.points[i].x - width, this.points[i].y - width - currentInner);
                    }
                } else { // left
                    if (this.points[i].y < this.points[i - 1].y) { // left up
                        connectorShape.lineTo(this.points[i].x + width + currentInner, this.points[i].y + width);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x + width, this.points[i].y + width,
                            this.points[i].x + width, this.points[i].y + width + currentInner);
                    } else { // left down
                        connectorShape.lineTo(this.points[i].x - width + currentOuter, this.points[i].y + width);
                        if (currentOuter > 0) connectorShape.quadraticCurveTo(this.points[i].x - width, this.points[i].y + width,
                            this.points[i].x - width, this.points[i].y + width - currentOuter);
                    }
                }
            }
            if (this.points[i + 1].x == this.points[i].x) { // vertical
                if (this.points[i + 1].y < this.points[i].y) { // up
                    if (this.points[i].x < this.points[i - 1].x) { // up right
                        connectorShape.lineTo(this.points[i].x + width, this.points[i].y - width - currentInner);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x + width, this.points[i].y - width,
                            this.points[i].x + width + currentInner, this.points[i].y - width);
                    } else { // up left
                        connectorShape.lineTo(this.points[i].x + width, this.points[i].y + width - currentOuter);
                        if (currentOuter > 0) connectorShape.quadraticCurveTo(this.points[i].x + width, this.points[i].y + width,
                            this.points[i].x + width - currentOuter, this.points[i].y + width);
                    }
                } else { // down
                    if (this.points[i].x < this.points[i - 1].x) { // down right
                        connectorShape.lineTo(this.points[i].x - width, this.points[i].y - width + currentOuter);
                        if (currentOuter > 0) connectorShape.quadraticCurveTo(this.points[i].x - width, this.points[i].y - width,
                            this.points[i].x - width + currentOuter, this.points[i].y - width);
                    } else { // down left
                        connectorShape.lineTo(this.points[i].x - width, this.points[i].y + width + currentInner);
                        if (currentInner > 0) connectorShape.quadraticCurveTo(this.points[i].x - width, this.points[i].y + width,
                            this.points[i].x - width - currentInner, this.points[i].y + width);
                    }
                }
            }
        }

        // The last segment
        if (this.points[0].y == this.points[1].y
            && this.points[0].x < this.points[1].x) { // horizontal segment right
            connectorShape.lineTo(this.points[0].x, this.points[0].y + width);
        }
        if (this.points[0].y == this.points[1].y
            && this.points[0].x > this.points[1].x) { // horizontal segment left
            connectorShape.lineTo(this.points[0].x, this.points[0].y - width);
        }
        if (this.points[0].x == this.points[1].x
            && this.points[0].y < this.points[1].y) { // vertical segment up
            connectorShape.lineTo(this.points[0].x - width, this.points[0].y);
        }
        if (this.points[0].x == this.points[1].x
            && this.points[0].y > this.points[1].y) { // vertical segment down
            connectorShape.lineTo(this.points[0].x + width, this.points[0].y);
        }

        return connectorShape;
    }
}

export { RoundedCornerOrthogonalConnectorShape };