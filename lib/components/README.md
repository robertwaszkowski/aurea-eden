# AureaEdenBpmnDiagram

`AureaEdenBpmnDiagram` is a Vue 3 wrapper component for the Aurea Eden BPMN visualization library. It provides a seamless way to integrate 3D BPMN diagrams into your Vue applications, featuring multiple display modes and automated data visualization.

## Installation

If you haven't already, install the library from npm:

```bash
npm install aurea-eden
```

## Usage

To use the component, import it from the package and provide the `bpmnXml` prop.

> [!TIP]
> If you are using Vite, you can import `.bpmn` files as raw strings using the `?raw` suffix.

```vue
<template>
  <div class="diagram-wrapper">
    <AureaEdenBpmnDiagram 
      :bpmnXml="myBpmnXml"
      :values="elementValues"
      mode="ANALYZE"
      :helpers="false"
    />
  </div>
</template>

<script setup>
import { AureaEdenBpmnDiagram } from 'aurea-eden';
import myBpmnXml from './diagram.bpmn?raw';

const elementValues = {
  'Task_1': 85,
  'Task_2': 42
};
</script>

<style scoped>
.diagram-wrapper {
  width: 100%;
  height: 600px;
}
</style>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `bpmnXml` | `String` | `''` | The BPMN 2.0 XML string to parse and display. |
| `values` | `Object` | `{}` | Key-value pairs where keys are element IDs and values are numerical metrics. Used in `ANALYZE` mode. |
| `mode` | `String` | `'VIEW'` | The display mode. Options: `'VIEW'`, `'ANALYZE'`, `'EDIT'`. |
| `helpers` | `Boolean` | `false` | If `true`, displays Three.js development helpers (axes, grid). |

## Methods (Exposed)

These methods can be called on the component reference:

- `reset()`: Resets the camera and view to the default state.
- `clear()`: Removes all elements and connectors from the diagram.
- `import(file)`: Loads a `.bpmn` file from a standard File object.
- `export()`: Triggers a download of the diagram data in JSON format.
- `diagramInstance`: Access to the underlying `BpmnDiagram` class for advanced programmatic control.

## Viewing Modes

### VIEW
The standard mode for diagram inspection. It provides a top-down, 2D-like orthographic view suitable for process walkthroughs.

### ANALYZE
Rotates the diagram to a perspective view and generates 3D "Value Bars" on top of elements specified in the `values` prop. The height and color of these bars are calculated relative to the maximum value provided in the set.

### EDIT (TBD)
Enables element manipulation and diagram construction features.
