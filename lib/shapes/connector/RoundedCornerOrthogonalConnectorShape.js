import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { ConnectorDimensions } from './ConnectorConstants.js';

class RoundedCornerOrthogonalConnectorShape extends Shape {
    constructor(connectorPoints) {
        const outerRadius = ConnectorDimensions.CONNECTOR_OUTER_RADIUS;
        const innerRadius = ConnectorDimensions.CONNECTOR_INNER_RADIUS;
        const lineWidth = ConnectorDimensions.CONNECTOR_LINE_WIDTH;
        const arrowheadWidth = ConnectorDimensions.CONNECTOR_ARROWHEAD_WIDTH;
        const arrowheadLength = ConnectorDimensions.CONNECTOR_ARROWHEAD_LENGTH;
        const width = lineWidth / 2;
        const color = Colors.ELEMENT_STROKE;
        const extrudeSettings = ExtrusionParameters;

        var connectorShape = new THREE.Shape();

        // draw the end of the first segment
        if (connectorPoints[0].y == connectorPoints[1].y
            && connectorPoints[0].x < connectorPoints[1].x) { // horizontal segment right
            connectorShape.moveTo(connectorPoints[0].x, connectorPoints[0].y + width);
            connectorShape.lineTo(connectorPoints[0].x, connectorPoints[0].y - width);
        }
        if (connectorPoints[0].y == connectorPoints[1].y
            && connectorPoints[0].x > connectorPoints[1].x) { // horizontal segment left
            connectorShape.moveTo(connectorPoints[0].x, connectorPoints[0].y - width);
            connectorShape.lineTo(connectorPoints[0].x, connectorPoints[0].y + width);
        }
        if (connectorPoints[0].x == connectorPoints[1].x
            && connectorPoints[0].y < connectorPoints[1].y) { // vertical segment up
            connectorShape.moveTo(connectorPoints[0].x - width, connectorPoints[0].y);
            connectorShape.lineTo(connectorPoints[0].x + width, connectorPoints[0].y);
        }
        if (connectorPoints[0].x == connectorPoints[1].x
            && connectorPoints[0].y > connectorPoints[1].y) { // vertical segment down
            connectorShape.moveTo(connectorPoints[0].x + width, connectorPoints[0].y);
            connectorShape.lineTo(connectorPoints[0].x - width, connectorPoints[0].y);
        }
        // draw all segments forward
        for (var i = 1; i < connectorPoints.length - 1; i++) {
            if (connectorPoints[i - 1].y == connectorPoints[i].y) { // horizontal
                if (connectorPoints[i - 1].x < connectorPoints[i].x) { // right
                    if (connectorPoints[i].y < connectorPoints[i + 1].y) { // right up
                        connectorShape.lineTo(connectorPoints[i].x + width - outerRadius, connectorPoints[i].y - width);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x + width, connectorPoints[i].y - width,
                            connectorPoints[i].x + width, connectorPoints[i].y - width + outerRadius);

                    } else { // right down
                        connectorShape.lineTo(connectorPoints[i].x - width - innerRadius, connectorPoints[i].y - width);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x - width, connectorPoints[i].y - width,
                            connectorPoints[i].x - width, connectorPoints[i].y - width - innerRadius);
                    }
                } else { // left
                    if (connectorPoints[i].y < connectorPoints[i + 1].y) { // left up
                        connectorShape.lineTo(connectorPoints[i].x + width + innerRadius, connectorPoints[i].y + width);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x + width, connectorPoints[i].y + width,
                            connectorPoints[i].x + width, connectorPoints[i].y + width + innerRadius);
                    } else { // left down
                        connectorShape.lineTo(connectorPoints[i].x - width + outerRadius, connectorPoints[i].y + width);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x - width, connectorPoints[i].y - width,
                            connectorPoints[i].x - width, connectorPoints[i].y + width - outerRadius);
                    }
                }
            }
            if (connectorPoints[i - 1].x == connectorPoints[i].x) { // vertical
                if (connectorPoints[i - 1].y < connectorPoints[i].y) { // up
                    if (connectorPoints[i].x < connectorPoints[i + 1].x) { // up right
                        connectorShape.lineTo(connectorPoints[i].x + width, connectorPoints[i].y - width - innerRadius);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x + width, connectorPoints[i].y - width,
                            connectorPoints[i].x + width + innerRadius, connectorPoints[i].y - width);
                    } else { // up left
                        connectorShape.lineTo(connectorPoints[i].x + width, connectorPoints[i].y + width - outerRadius);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x + width, connectorPoints[i].y + width,
                            connectorPoints[i].x + width - outerRadius, connectorPoints[i].y + width);
                    }
                } else { // down
                    if (connectorPoints[i].x < connectorPoints[i + 1].x) { // down right
                        connectorShape.lineTo(connectorPoints[i].x - width, connectorPoints[i].y - width + outerRadius);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x - width, connectorPoints[i].y - width,
                            connectorPoints[i].x - width + outerRadius, connectorPoints[i].y - width);
                    } else { // down left
                        connectorShape.lineTo(connectorPoints[i].x - width, connectorPoints[i].y + width + innerRadius);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x - width, connectorPoints[i].y + width,
                            connectorPoints[i].x - width - innerRadius, connectorPoints[i].y + width);
                    }
                }
            }
        }

        // draw the last segment
        if (connectorPoints[connectorPoints.length - 2].y
            == connectorPoints[connectorPoints.length - 1].y
            && connectorPoints[connectorPoints.length - 2].x
            < connectorPoints[connectorPoints.length - 1].x) { // horizontal segment right
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x - arrowheadLength,
                connectorPoints[connectorPoints.length - 1].y - width);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x - arrowheadLength,
                connectorPoints[connectorPoints.length - 1].y - arrowheadWidth);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x,
                connectorPoints[connectorPoints.length - 1].y);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x - arrowheadLength,
                connectorPoints[connectorPoints.length - 1].y + arrowheadWidth);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x - arrowheadLength,
                connectorPoints[connectorPoints.length - 1].y + width);
        }
        if (connectorPoints[connectorPoints.length - 2].y
            == connectorPoints[connectorPoints.length - 1].y
            && connectorPoints[connectorPoints.length - 2].x
            > connectorPoints[connectorPoints.length - 1].x) { // horizontal segment left
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x + arrowheadLength,
                connectorPoints[connectorPoints.length - 1].y + width);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x + arrowheadLength,
                connectorPoints[connectorPoints.length - 1].y + arrowheadWidth);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x,
                connectorPoints[connectorPoints.length - 1].y);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x + arrowheadLength,
                connectorPoints[connectorPoints.length - 1].y - arrowheadWidth);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x + arrowheadLength,
                connectorPoints[connectorPoints.length - 1].y - width);
        }
        if (connectorPoints[connectorPoints.length - 2].x
            == connectorPoints[connectorPoints.length - 1].x
            && connectorPoints[connectorPoints.length - 2].y
            < connectorPoints[connectorPoints.length - 1].y) { // vertical segment up
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x + width,
                connectorPoints[connectorPoints.length - 1].y - arrowheadLength);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x + arrowheadWidth,
                connectorPoints[connectorPoints.length - 1].y - arrowheadLength);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x,
                connectorPoints[connectorPoints.length - 1].y);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x - arrowheadWidth,
                connectorPoints[connectorPoints.length - 1].y - arrowheadLength);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x - width,
                connectorPoints[connectorPoints.length - 1].y - arrowheadLength);
        }
        if (connectorPoints[connectorPoints.length - 2].x
            == connectorPoints[connectorPoints.length - 1].x
            && connectorPoints[connectorPoints.length - 2].y
            > connectorPoints[connectorPoints.length - 1].y) { // vertical segment down
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x - width,
                connectorPoints[connectorPoints.length - 1].y + (arrowheadLength * 32/35)); // TODO: Explain why arrow down is shorter 35-32
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x - arrowheadWidth,
                connectorPoints[connectorPoints.length - 1].y + (arrowheadLength * 32/35));
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x,
                connectorPoints[connectorPoints.length - 1].y);
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x + arrowheadWidth,
                connectorPoints[connectorPoints.length - 1].y + (arrowheadLength * 32/35));
            connectorShape.lineTo(connectorPoints[connectorPoints.length - 1].x + width,
                connectorPoints[connectorPoints.length - 1].y + (arrowheadLength * 32/35));
        }

        // draw all segments backward
        for (var i = connectorPoints.length - 2; i > 0; i--) {
            if (connectorPoints[i + 1].y == connectorPoints[i].y) { // horizontal
                if (connectorPoints[i + 1].x < connectorPoints[i].x) { // right
                    if (connectorPoints[i].y < connectorPoints[i - 1].y) { // right up
                        connectorShape.lineTo(connectorPoints[i].x + width - innerRadius, connectorPoints[i].y - width);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x + width, connectorPoints[i].y - width,
                            connectorPoints[i].x + width, connectorPoints[i].y - width + innerRadius);
                    } else { // right down
                        connectorShape.lineTo(connectorPoints[i].x - width - innerRadius, connectorPoints[i].y - width);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x - width, connectorPoints[i].y - width,
                            connectorPoints[i].x - width, connectorPoints[i].y - width - innerRadius);
                    }
                } else { // left
                    if (connectorPoints[i].y < connectorPoints[i - 1].y) { // left up
                        connectorShape.lineTo(connectorPoints[i].x + width + innerRadius, connectorPoints[i].y + width);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x + width, connectorPoints[i].y + width,
                            connectorPoints[i].x + width, connectorPoints[i].y + width + innerRadius);
                    } else { // left down
                        connectorShape.lineTo(connectorPoints[i].x - width + outerRadius, connectorPoints[i].y + width);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x - width, connectorPoints[i].y + width,
                            connectorPoints[i].x - width, connectorPoints[i].y + width - outerRadius);
                    }
                }
            }
            if (connectorPoints[i + 1].x == connectorPoints[i].x) { // vertical
                if (connectorPoints[i + 1].y < connectorPoints[i].y) { // up
                    if (connectorPoints[i].x < connectorPoints[i - 1].x) { // up right
                        connectorShape.lineTo(connectorPoints[i].x + width, connectorPoints[i].y - width - innerRadius);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x + width, connectorPoints[i].y - width,
                            connectorPoints[i].x + width + innerRadius, connectorPoints[i].y - width);
                    } else { // up left
                        connectorShape.lineTo(connectorPoints[i].x + width, connectorPoints[i].y + width - outerRadius);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x + width, connectorPoints[i].y + width,
                            connectorPoints[i].x + width - outerRadius, connectorPoints[i].y + width);
                    }
                } else { // down
                    if (connectorPoints[i].x < connectorPoints[i - 1].x) { // down right
                        connectorShape.lineTo(connectorPoints[i].x - width, connectorPoints[i].y - width + outerRadius);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x - width, connectorPoints[i].y - width,
                            connectorPoints[i].x - width + outerRadius, connectorPoints[i].y - width);
                    } else { // down left
                        connectorShape.lineTo(connectorPoints[i].x - width, connectorPoints[i].y + width + innerRadius);
                        connectorShape.quadraticCurveTo(connectorPoints[i].x - width, connectorPoints[i].y + width,
                            connectorPoints[i].x - width - innerRadius, connectorPoints[i].y + width);
                    }
                }
            }
        }

        // The last segment
        if (connectorPoints[0].y == connectorPoints[1].y
            && connectorPoints[0].x < connectorPoints[1].x) { // horizontal segment right
            connectorShape.lineTo(connectorPoints[0].x, connectorPoints[0].y + width);
        }
        if (connectorPoints[0].y == connectorPoints[1].y
            && connectorPoints[0].x > connectorPoints[1].x) { // horizontal segment left
            connectorShape.lineTo(connectorPoints[0].x, connectorPoints[0].y - width);
        }
        if (connectorPoints[0].x == connectorPoints[1].x
            && connectorPoints[0].y < connectorPoints[1].y) { // vertical segment up
            connectorShape.lineTo(connectorPoints[0].x - width, connectorPoints[0].y);
        }
        if (connectorPoints[0].x == connectorPoints[1].x
            && connectorPoints[0].y > connectorPoints[1].y) { // vertical segment down
            connectorShape.lineTo(connectorPoints[0].x + width, connectorPoints[0].y);
        }

        var connectorGeometry = new THREE.ExtrudeGeometry(connectorShape, extrudeSettings);

        // Construct the shape
        super(connectorGeometry, new DiagramEditMaterial(color));
    }
}

export { RoundedCornerOrthogonalConnectorShape };