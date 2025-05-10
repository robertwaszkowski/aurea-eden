# Aurea EDEN

![Aurea EDEN Logo](assets/aurea-eden-logo.jpeg)

A flexible Three.js-based framework for creating custom diagramming notations in 3D, featuring built-in BPMN support while enabling developers to define and extend their own visual languages with parameter-driven transformations.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Core Components](#core-components)
- [Advanced Usage](#advanced-usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install aurea-eden-lib
```

## Quick Start

```javascript
import { BpmnDiagram } from 'aurea-eden-lib';

// Create new diagram
const diagram = new BpmnDiagram(container);

// Add elements
diagram.addStartEvent('e1')
    .addTask('t1')
    .positionRightOf('e1')
    .addWrappedText('Handle Task')
    .connectFrom('e1')
    .setValue(75)
    .addValueBar();

// Arrange and display
diagram.arrange();
diagram.fitScreen();
```

## Features

- **3D Visualization**: Extend 2D notations into 3D space
- **Parameter Visualization**: Show quantitative data through value bars
- **Custom Notations**: Create your own visual languages
- **Interactive Controls**: Pan, zoom, and rotate diagrams
- **Multiple View Modes**: Switch between VIEW and ANALYZE modes
- **Fluid API**: Method chaining for intuitive diagram creation
- **Built-in BPMN Support**: Ready-to-use BPMN elements

## Core Components

### Diagram Class

The main container for all diagram elements:

```javascript
const diagram = new BpmnDiagram(container);
diagram.setMode('ANALYZE');    // Switch to analysis mode
diagram.fitScreen();          // Adjust view
```

### Elements

Available BPMN elements:
- StartEvent
- EndEvent
- Task
- UserTask
- Gateway
- Connector

### Materials

Three material types:
```javascript
import { DiagramMaterial, BarMaterial, EditMaterial } from 'aurea-eden-lib';

// Standard element material
new DiagramMaterial({ 
    color: 0x00ff00,
    shininess: 60 
});

// Value bar material
new BarMaterial({ 
    color: 0xff0000,
    opacity: 0.5 
});
```

## Advanced Usage

### Creating Custom Elements

```javascript
import { DiagramElement, Shape } from 'aurea-eden-lib';

class CustomElement extends DiagramElement {
    constructor(diagram, id) {
        super(diagram, id);
        this.shape = new CustomShape();
        this.add(this.shape);
    }
}
```

### Custom Connectors

```javascript
const waypoints = [
    element1.getNorthPoint(),
    { x: 100, y: 200, z: 0 },
    element2.getSouthPoint()
];

diagram.addFlowConnector('connector1', waypoints);
```

## API Reference

### BpmnDiagram Methods

#### Element Creation
- `addStartEvent(id)`
- `addEndEvent(id)`
- `addTask(id)`
- `addUserTask(id)`
- `addGateway(id)`

#### Element Positioning
- `positionRightOf(elementId)`
- `positionBelow(elementId)`
- `positionUpRightOf(elementId)`
- `positionDownRightOf(elementId)`

#### View Control
- `center()`
- `fitScreen()`
- `rotate(angle)`
- `setMode(mode)`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Dependencies

- Three.js: 3D graphics library
- Tween.js: Animation library

## Author

Robert Waszkowski

---

For more examples and detailed API documentation, visit our [GitHub Wiki](https://github.com/your-repo/aurea-eden/wiki).