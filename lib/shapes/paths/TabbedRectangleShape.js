import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { TabbedRectangleDimensions } from './BasicShapeConstants.js';

class TabbedRectangleShape extends Shape {
    constructor(
        mainWidth = TabbedRectangleDimensions.MAIN_WIDTH,
        mainHeight = TabbedRectangleDimensions.MAIN_HEIGHT,
        tabWidth = TabbedRectangleDimensions.TAB_WIDTH,
        tabHeight = TabbedRectangleDimensions.TAB_HEIGHT,
        tabIndentX = TabbedRectangleDimensions.TAB_INDENT_X,
        lineWidth = TabbedRectangleDimensions.LINE_WIDTH
    ) {
        super(mainWidth, mainHeight, lineWidth);
        this.tabWidth = tabWidth;
        this.tabHeight = tabHeight;
        this.tabIndentX = tabIndentX;
        this.name = 'TabbedRectangleShape';
    }

    get2DPaths() {
        const mainWidth = this.width;
        const mainHeight = this.height;
        const tabWidth = this.tabWidth;
        const tabHeight = this.tabHeight;
        const tabIndentX = this.tabIndentX;
        const geometricLineWidthForHole = this.lineWidth;

        // Helper to create the outer silhouette
        const _createOuterTabbedPath = (_mainW, _mainH, _tabW, _tabH, _tabIndent) => {
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
        };

        const { path: mainPath, 
                actualTabWidth, 
                actualTabHeight, 
                actualTabIndent 
              } = _createOuterTabbedPath(mainWidth, mainHeight, tabWidth, tabHeight, tabIndentX);

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
        return [mainPath];
    }

    updateDimensions(
        newMainWidth, newMainHeight, 
        newTabWidth, newTabHeight, newTabIndentX, 
        newLineWidth
    ) {
        if (newTabWidth !== undefined) this.tabWidth = newTabWidth;
        if (newTabHeight !== undefined) this.tabHeight = newTabHeight;
        if (newTabIndentX !== undefined) this.tabIndentX = newTabIndentX;

        super.updateDimensions(newMainWidth, newMainHeight, newLineWidth);
    }
}

export { TabbedRectangleShape };
