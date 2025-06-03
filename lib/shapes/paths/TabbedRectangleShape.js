import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { DiagramEditMaterial } from '../../materials/DiagramEditMaterial.js';
import { ExtrusionParameters, Colors } from '../../diagrams/DiagramConstants.js';
import { TabbedRectangleDimensions } from './BasicShapeConstants.js';

/**
 * Represents a 3D tabbed rectangle shape (like a folder tab),
 * with a hole, created by extruding a 2D path.
 * This version uses two separate holes to maintain the visual integrity
 * of the main rectangle's top line under the tab.
 */
class TabbedRectangleShape extends Shape {
    constructor(
        mainWidth = TabbedRectangleDimensions.MAIN_WIDTH,
        mainHeight = TabbedRectangleDimensions.MAIN_HEIGHT,
        tabWidth = TabbedRectangleDimensions.TAB_WIDTH,
        tabHeight = TabbedRectangleDimensions.TAB_HEIGHT,
        tabIndentX = TabbedRectangleDimensions.TAB_INDENT_X,
        lineWidth = TabbedRectangleDimensions.LINE_WIDTH
    ) {
        const color = Colors.ELEMENT_STROKE;
        const currentExtrusionSettings = ExtrusionParameters;
        const geometricLineWidthForHole = lineWidth; // No bevel compensation, as per prior decision

        // Helper to create the outer silhouette
        function _createOuterTabbedPath(_mainW, _mainH, _tabW, _tabH, _tabIndent) {
            const actualTabIndent = Math.max(0, Math.min(_tabIndent, _mainW - _tabW));
            const actualTabWidth = Math.max(0, Math.min(_tabW, _mainW - actualTabIndent));
            const actualTabHeight = Math.max(0, _tabH);

            const path = new THREE.Shape();
            const mHW = _mainW / 2;
            const mHH = _mainH / 2;
            const tabStartX = -mHW + actualTabIndent;
            const tabEndX = tabStartX + actualTabWidth;

            path.moveTo(-mHW, -mHH); // Bottom-left
            path.lineTo(mHW, -mHH);  // Bottom-right
            path.lineTo(mHW, mHH);   // Top-right of main body

            path.lineTo(tabEndX, mHH); // To right base of tab
            if (actualTabWidth > 0 && actualTabHeight > 0) {
                path.lineTo(tabEndX, mHH + actualTabHeight);   // Up to top-right of tab
                path.lineTo(tabStartX, mHH + actualTabHeight); // Across to top-left of tab
                path.lineTo(tabStartX, mHH);                   // Down to left base of tab
            }
            path.lineTo(-mHW, mHH); // To top-left of main body
            path.closePath();
            return { path, actualTabWidth, actualTabHeight, actualTabIndent };
        }

        const { path: mainPath, 
                actualTabWidth, 
                actualTabHeight, 
                actualTabIndent 
              } = _createOuterTabbedPath(mainWidth, mainHeight, tabWidth, tabHeight, tabIndentX);
        
        const storableOuterShape = mainPath.clone(); // For getOuterShape()

        // --- Create Holes ---
        const holes = [];

        // Hole 1: Main Rectangle Body
        if (geometricLineWidthForHole > 0) {
            const innerMainBodyWidth = mainWidth - 2 * geometricLineWidthForHole;
            const innerMainBodyHeight = mainHeight - 2 * geometricLineWidthForHole;

            if (innerMainBodyWidth > 0 && innerMainBodyHeight > 0) {
                const holeMainBodyPath = new THREE.Path();
                const iMB_HW = innerMainBodyWidth / 2;
                const iMB_HH = innerMainBodyHeight / 2;
                holeMainBodyPath.moveTo(-iMB_HW, -iMB_HH);
                holeMainBodyPath.lineTo(iMB_HW, -iMB_HH);
                holeMainBodyPath.lineTo(iMB_HW, iMB_HH); // Top edge of main body's hole
                holeMainBodyPath.lineTo(-iMB_HW, iMB_HH);
                holeMainBodyPath.closePath();
                holes.push(holeMainBodyPath);
            }
        }

        // Hole 2: Tab's Projected Part
        if (actualTabWidth > 0 && actualTabHeight > 0 && geometricLineWidthForHole > 0) {
            const mHW_outer = mainWidth / 2;
            const mHH_outer = mainHeight / 2;

            // Coordinates for the tab's hole, relative to the shape's origin
            const tabHoleLeftX = -mHW_outer + actualTabIndent + geometricLineWidthForHole;
            const tabHoleRightX = -mHW_outer + actualTabIndent + actualTabWidth - geometricLineWidthForHole;
            
            // Bottom of tab's hole aligns with the TOP SURFACE of the main rectangle's outer edge
            const tabHoleBottomY = mHH_outer; 
            // Top of tab's hole is inset from the tab's outer top edge
            const tabHoleTopY = mHH_outer + actualTabHeight - geometricLineWidthForHole;

            if (tabHoleRightX > tabHoleLeftX && tabHoleTopY > tabHoleBottomY) {
                const holeTabProjectionPath = new THREE.Path();
                holeTabProjectionPath.moveTo(tabHoleLeftX, tabHoleBottomY);
                holeTabProjectionPath.lineTo(tabHoleRightX, tabHoleBottomY);
                holeTabProjectionPath.lineTo(tabHoleRightX, tabHoleTopY);
                holeTabProjectionPath.lineTo(tabHoleLeftX, tabHoleTopY);
                holeTabProjectionPath.closePath();
                holes.push(holeTabProjectionPath);
            }
        }
        
        mainPath.holes = holes; // Assign all collected holes

        const geometry = new THREE.ExtrudeGeometry(mainPath, currentExtrusionSettings);
        const material = new DiagramEditMaterial(color);

        super(geometry, material);

        this.outerShape = storableOuterShape;
        this.shapeMainWidth = mainWidth;
        this.shapeMainHeight = mainHeight;
        this.shapeTabWidth = tabWidth; // Store original requested tabWidth
        this.shapeTabHeight = tabHeight; // Store original requested tabHeight
        this.shapeTabIndentX = tabIndentX; // Store original requested tabIndentX
        this.shapeLineWidth = lineWidth;
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;
        this.name = 'TabbedRectangleShape';
    }

    getOuterShape() { return this.outerShape; }

    updateDimensions(
        newMainWidth, newMainHeight, 
        newTabWidth, newTabHeight, newTabIndentX, 
        newLineWidth, newExtrusionSettingsOverride
    ) {
        const mainWidth = newMainWidth || this.shapeMainWidth;
        const mainHeight = newMainHeight || this.shapeMainHeight;
        const tabWidth = (newTabWidth !== undefined) ? newTabWidth : this.shapeTabWidth;
        const tabHeight = (newTabHeight !== undefined) ? newTabHeight : this.shapeTabHeight;
        const tabIndentX = (newTabIndentX !== undefined) ? newTabIndentX : this.shapeTabIndentX;
        const geometricLineWidthForHole = (newLineWidth !== undefined) ? newLineWidth : this.shapeLineWidth;

        const currentExtrusionSettings = newExtrusionSettingsOverride || (this.geometry.parameters && this.geometry.parameters.options) || ExtrusionParameters;
        
        // Re-define _createOuterTabbedPath locally or ensure it's accessible
        function _createOuterTabbedPath(_mainW, _mainH, _tabW, _tabH, _tabIndent) {
            const actualTabIndent = Math.max(0, Math.min(_tabIndent, _mainW - _tabW));
            const actualTabWidth = Math.max(0, Math.min(_tabW, _mainW - actualTabIndent));
            const actualTabHeight = Math.max(0, _tabH);
            const path = new THREE.Shape();
            const mHW = _mainW / 2;
            const mHH = _mainH / 2;
            const tabStartX = -mHW + actualTabIndent;
            const tabEndX = tabStartX + actualTabWidth;
            path.moveTo(-mHW, -mHH); 
            path.lineTo(mHW, -mHH);  
            path.lineTo(mHW, mHH);   
            path.lineTo(tabEndX, mHH); 
            if (actualTabWidth > 0 && actualTabHeight > 0) {
                path.lineTo(tabEndX, mHH + actualTabHeight);   
                path.lineTo(tabStartX, mHH + actualTabHeight); 
                path.lineTo(tabStartX, mHH);                   
            }
            path.lineTo(-mHW, mHH); 
            path.closePath();
            return { path, actualTabWidth, actualTabHeight, actualTabIndent };
        }

        const { path: mainPath, 
                actualTabWidth, 
                actualTabHeight, 
                actualTabIndent 
              } = _createOuterTabbedPath(mainWidth, mainHeight, tabWidth, tabHeight, tabIndentX);
        
        const storableOuterShape = mainPath.clone();
        const holes = [];

        if (geometricLineWidthForHole > 0) {
            const innerMainBodyWidth = mainWidth - 2 * geometricLineWidthForHole;
            const innerMainBodyHeight = mainHeight - 2 * geometricLineWidthForHole;
            if (innerMainBodyWidth > 0 && innerMainBodyHeight > 0) {
                const holeMainBodyPath = new THREE.Path();
                const iMB_HW = innerMainBodyWidth / 2;
                const iMB_HH = innerMainBodyHeight / 2;
                holeMainBodyPath.moveTo(-iMB_HW, -iMB_HH);
                holeMainBodyPath.lineTo(iMB_HW, -iMB_HH);
                holeMainBodyPath.lineTo(iMB_HW, iMB_HH);
                holeMainBodyPath.lineTo(-iMB_HW, iMB_HH);
                holeMainBodyPath.closePath();
                holes.push(holeMainBodyPath);
            }
        }

        if (actualTabWidth > 0 && actualTabHeight > 0 && geometricLineWidthForHole > 0) {
            const mHW_outer = mainWidth / 2;
            const mHH_outer = mainHeight / 2;
            const tabHoleLeftX = -mHW_outer + actualTabIndent + geometricLineWidthForHole;
            const tabHoleRightX = -mHW_outer + actualTabIndent + actualTabWidth - geometricLineWidthForHole;
            const tabHoleBottomY = mHH_outer; 
            const tabHoleTopY = mHH_outer + actualTabHeight - geometricLineWidthForHole;

            if (tabHoleRightX > tabHoleLeftX && tabHoleTopY > tabHoleBottomY) {
                const holeTabProjectionPath = new THREE.Path();
                holeTabProjectionPath.moveTo(tabHoleLeftX, tabHoleBottomY);
                holeTabProjectionPath.lineTo(tabHoleRightX, tabHoleBottomY);
                holeTabProjectionPath.lineTo(tabHoleRightX, tabHoleTopY);
                holeTabProjectionPath.lineTo(tabHoleLeftX, tabHoleTopY);
                holeTabProjectionPath.closePath();
                holes.push(holeTabProjectionPath);
            }
        }
        mainPath.holes = holes;

        this.outerShape = storableOuterShape;

        if (this.geometry) this.geometry.dispose();
        this.geometry = new THREE.ExtrudeGeometry(mainPath, currentExtrusionSettings);

        this.shapeMainWidth = mainWidth;
        this.shapeMainHeight = mainHeight;
        this.shapeTabWidth = tabWidth;
        this.shapeTabHeight = tabHeight;
        this.shapeTabIndentX = tabIndentX;
        this.shapeLineWidth = geometricLineWidthForHole;
        this.shapeDepth = currentExtrusionSettings.depth || ExtrusionParameters.depth;
    }

    updateColor(newColor) {
        if (this.material && this.material.color && typeof this.material.color.set === 'function') {
             this.material.color.set(newColor);
        } else if (this.material && this.material.uniforms && this.material.uniforms.color) { 
            this.material.uniforms.color.value.set(newColor);
        }
    }
}

export { TabbedRectangleShape };
