# BPMN to Fluent API Conversion Algorithm

This document details the step-by-step algorithms, heuristics, and placement rules used by the `BpmnToFluentConverter` engine. The engine is designed to transition raw BPMN 2.0 XML graph data into robust, natively laid out Fluent API chains for the Aurea EDEN framework.

---

## 1. Principles of Geometric Generation

Unlike traditional BPMN XML representations which rely on absolute Cartesian constraints (X, Y) bound to bounding boxes (`bpmndi:BPMNShape`), Aurea EDEN diagrams are generated structurally using relative geometric relationships. 

### Positional API Primitives Tools
Elements are placed into the scene graph relative to existing "anchor" elements. The primary topological anchors are:
- `.positionRightOf(anchor)`: The primary tool for building linear sequences chronologically left-to-right.
- `.positionLeftOf(anchor)`: Used for backward iteration sequences.
- `.positionDownOf(anchor)`: Used to spawn parallel structures or diverge branches beneath the main logical flow.
- `.positionUpOf(anchor)`: Used for structural overrides and upward iteration routing.

**Single-Axis Composable Primitives:**
To support tight multi-lane layouts, the engine relies on single-axis primitive methods. These resolve orthogonal coordinates independently:
- **Structural Alignment:** `.alignXWith(anchor)` and `.alignYWith(anchor)`. These align center points without adjusting the intersecting axis, maintaining true columns and rows.
- **Offset Shifting:** `.shiftRightOf(anchor)`, `.shiftDownOf(anchor)`, etc. These adjust the non-aligned axis outward by a mathematically predefined padding factor (`DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS`), preventing visual overlap without breaking the structural grid.

### Port Resolution and Orthogonal Routing 
Connection geometry evaluates the entry and exit boundaries via Ports (`N`, `S`, `E`, `W`, or `auto`). The `resolvePorts` logic governs edge routing preferences, defaulting to orthogonal 1-elbow L-Curves. Passing parameters such as `('S', 'auto')` forces emission from the South face while dynamically adapting the target approach face to avoid diagonal S-Curves.

---

## 2. Stage 1: The Baseline Spine

BPMN diagrams intrinsically feature complex topological combinations of branching, looping, and parallel executions. Generating dynamic code requires establishing a strong structural **Baseline Spine** that acts as the core horizontal stratum.

The algorithm establishes the baseline via topological graph traversal:
1. **Adjacency Mapping**: The converter parses sequence flows to construct a directed graph.
2. **Critical Path Selection**: Uses DFS pathfinding to identify the "Longest Critical Path" (Happy Path) from Start to End.
3. **Primary Serialization**: Every element on the Baseline is rendered sequentially using `.positionRightOf()`, establishing a true horizontal horizon.
4. **Persistent Connectors**: All sequence flows between baseline elements are immediately drawn.

---

## 3. Stage 2: Branch Discovery and Rendering

Once the horizon is established, the remaining graph vertices are processed as **Branches**.

1. **Discovery**: Recursive tracing of all off-path elements starting from gateways or event triggers.
2. **Categorization**: Branches are identified as *Parallel* (forward) or *Iterative* (backward).
3. **Raw Rendering**: Branch elements are added to the diagram using basic anchor-based positioning (e.g., `.positionDownOf()` or `.positionUpOf()`). This provides a functional but "flat" layout.
4. **Persistent Connectors**: Connectors for branch elements are generated and linked dynamically as they are processed.

---

## 4. Stage 3: Optimal Sorting and Lanes

The final stage organizes the raw branches into a readable, multi-lane structure.

1. **Strategic Sorting**: Branches are sorted by "span length" (shortest first) to minimize lane crossings and optimize space.
2. **Lane Assignment**: A column-range overlap algorithm assigns vertical lane indices to each branch, preventing visual collisions.
3. **Lane-Aware Positioning**: elements are placed using single-axis compositional APIs:
    - `element.alignXWith(anchor).shiftDownOf(occludingNode)`
    - Result: Parallel sequences generate horizontally readable ribbons, flawlessly nesting downwards matching structural origins.
4. **Reactive Connections**: As elements are shifted into their optimal lanes, the reactive connector system automatically updates all paths to maintain perfect connectivity.
