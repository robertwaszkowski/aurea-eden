export const RectangleDimensions = {
    HORIZONTAL_SIZE: 100,
    VERTICAL_SIZE: 80,
    CORNER_RADIUS: 10,
    FOLD_SIZE: 15, // The length of the edge of the "folded" part of the corner
    LINE_WIDTH: 1,
    TEXT_SIZE: 8,
    TEXT_ELEVATION: 3
};

export const TabbedRectangleDimensions = {
    MAIN_WIDTH: 120,   // Width of the main rectangular body
    MAIN_HEIGHT: 80,   // Height of the main rectangular body
    TAB_WIDTH: 40,     // Width of the tab
    TAB_HEIGHT: 20,    // Additional height the tab projects upwards from the main rectangle's top
    TAB_INDENT_X: 0,  // How far from the main rectangle's left edge the tab begins
    LINE_WIDTH: 1,
};

export const CircleDimensions = {
    RADIUS: 18,
    LINE_WIDTH_THIN: .4,
    LINE_WIDTH_NORMAL: 1,
    LINE_WIDTH_THICK: 2.4
};

export const EllipseDimensions = {
    RADIUS_X: 50,
    RADIUS_Y: 30,
    LINE_WIDTH: 1,
    CURVE_SEGMENTS: 32
};

export const DiamondDimensions = {
    DIAGONAL: 48,
    LINE_WIDTH: 1
};

export const TriangleDimensions = {
    SIZE: 50,
    LINE_WIDTH: 1
};

export const StarDimensions = {
    OUTER_RADIUS: 30,
    INNER_RADIUS: 15,
    NUM_POINTS: 5,     // Default to a 5-point star
    LINE_WIDTH: 1,
    CURVE_SEGMENTS: 12 // For ExtrudeGeometry's processing of the path
};

