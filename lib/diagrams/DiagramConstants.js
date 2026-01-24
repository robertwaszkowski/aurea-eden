export const DiagramDimensions = {
    DISTANCE_BETWEEN_ELEMENTS: 48
};

export const ExtrusionParameters = {
    steps: 2,
    depth: .6,
    bevelEnabled: true,
    bevelThickness: .2,
    bevelSize: .4,
    bevelOffset: 0,
    bevelSegments: 4
};

export const Themes = {
    LIGHT: {
        BACKGROUND: 0xffffff,
        ELEMENT_STROKE: 0x006699,
        ELEMENT_TEXT: 0x006699,
        CONNECTOR: 0x006699,
        VALUE_BAR_OPACITY: 0.5,
        SEMANTIC: {
            'task': 0x006699,
            'event': 0x006699,
            'start-event': 0x006699,
            'end-event': 0x006699,
            'gateway': 0x006699,
            'my-task': 0xffd700,
            'other-task': 0xc0c0c0
        }
    },
    DARK: {
        BACKGROUND: 0x121212,        // Deep dark grey
        ELEMENT_STROKE: 0x00aaff,    // Electric blue fallback
        ELEMENT_TEXT: 0xffffff,      // Pure white for max contrast
        CONNECTOR: 0x888888,         // Muted grey
        VALUE_BAR_OPACITY: 0.7,
        SEMANTIC: {
            'task': 0x00aaff,      // Electric blue
            'event': 0x00aaff,
            'start-event': 0x55ff55, // Vibrant Green
            'end-event': 0xff5555, // Red for end events
            'gateway': 0xffaa00,    // Orange for gateways
            'my-task': 0xffea00,    // Neon Gold
            'other-task': 0xffffff   // Vibrant White/Silver
        }
    }
};

export const Colors = {
    ELEMENT_FILL: 0x00ff00, // TODO
    ELEMENT_STROKE: Themes.LIGHT.ELEMENT_STROKE,
    ELEMENT_TEXT: Themes.LIGHT.ELEMENT_TEXT,
    ELEMENT_SELECTED_FILL: 0xff0000, // TODO
    ELEMENT_SELECTED_STROKE: 0x000000, // TODO
    ELEMENT_SELECTED_TEXT: 0x000000 // TODO
};
