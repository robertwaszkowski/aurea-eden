# BPMN to Fluent API Conversion Algorithm

This document provides a highly detailed, phase-by-phase and step-by-step breakdown of the `BpmnToFluentConverter` and `BpmnDiagram` layout engines. It covers the mathematical models, heuristic rules, and specific Aurea EDEN API features used to transition raw BPMN 2.0 XML graph data into natively drawn, perfectly aligned geometric vector graphics.

---

## 1. Core Principles & Aurea EDEN API Features

Unlike standard BPMN modelers which rely on static `bpmndi:BPMNShape` absolute `[X, Y]` coordinates, the converter discards all XML visual data and dynamically recalculates the exact topology using pure graph theory and declarative **Aurea EDEN** positioning methods.

### Aurea EDEN Geometric API Features Utilized:
- **Sequential Primitives**: `.positionRightOf(anchor)`, `.positionLeftOf(anchor)`, `.positionDownOf(anchor)`, `.positionUpOf(anchor)`. These resolve coordinates to place a shape adjacent to an anchor, respecting `DiagramDimensions.DISTANCE_BETWEEN_ELEMENTS`.
- **Compositional Primitives (Cross-Axis)**: 
  - `.alignXWith(anchor)` / `.alignYWith(anchor)`: Locks the X or Y center to perfectly match a target element without moving the perpendicular axis.
  - `.shiftDownOf(anchor)` / `.shiftUpOf(anchor)`: Translates an element along the Y-axis by exactly its combined height plus uniform padding, without disrupting the X-axis alignment.
- **Port-Based Routing**: `.connect(sourceId, targetId, sourcePort, targetPort)`. Defines precise orthogonal entry/exit faces via cardinality (`'N'`, `'S'`, `'E'`, `'W'`, or `'auto'`).
- **Waypoints Interpolation**: Extracts the internal geometric waypoint computation from `Connector.determinePoints()` to snap logical arrays directly to orthogonal 20-unit grids (`Math.round()`).
- **Hidden Render Graph**: `.hide()`. Elements can be processed mathematically and topologically but excluded from the final drawn canvas.
- **Dynamic Branch Marking**: `.branchType='primary'|'parallel'|'iterative'`. Custom node tagging allows the post-placement engine to identify overlapping priority.

---

## 2. Phase-by-Phase Execution Algorithm

The conversion process is divided into logical phases, transforming raw XML strings to a topological graph, mapping an execution baseline, resolving branches to lanes, hooking orthogonal vectors, and performing physical overlap sweeping.

### Phase 1: Parsing and Graph Construction
1. **XML Ingestion**: The standard DOMParser reads the BPMN string. It identifies core node types (`startEvent`, `task`, `exclusiveGateway`, `endEvent`) regardless of XML namespace prefixes.
2. **Adjacency Mapping**: Sequence flows are evaluated to populate `elements` (Map) and `adjacencyList` (Map of node -> outgoing edges). No geometry is calculated yet; this is a purely abstract mathematical graph.
3. **Primary Path Extraction (BFS)**: Uses Breadth-First Search from the `StartEvent` evaluating all possible paths. The *longest* path leading to a standard `EndEvent` (excluding `TerminateEndEvent`) is classified as the **Primary Path** (or "Happy Path").

### Phase 2: Cycle Detection and Back-Edge Mathematics
Traditional reachability checks fail on nested loops. The engine uses a mathematical **Depth-First Search (DFS) Back-Edge Classifier**.
1. **Trunk Prioritization**: The `adjacencyList` is sorted so that nodes belonging to the `Primary Path` are traversed first. This forces the DFS Tree trunk to represent forward progress.
2. **Recursive Stack Tracking**: The DFS algorithm maintains a `visited` set and an `active Stack` set. 
3. **Loop Rule**: If a sequence flow edge points to a node *currently in the active DFS stack*, that edge is mathematically proven to be a **Back-Edge** (iterative loop). All nested branches inside global loops are safely preserved as forward paths.

### Phase 3: Stage 1 - The Baseline Spine
The Primary Path is explicitly mapped as the foundational horizontal structure of the diagram.
1. The first node (StartEvent) is placed at `[0, 0]` natively.
2. Iterating sequentially through the `Primary Path` array, each subsequent element is appended using `Aurea EDEN`'s `.positionRightOf(previousNode)`.
3. The geometric math places the left edge of `Node B` at `Node A.right + padding`. Over the entire pass, this guarantees a perfect mathematical X-axis positive progression along the `Y=0` baseline.

### Phase 4: Stage 2 - Branch Discovery
Nodes omitted from the baseline belong to secondary pathways.
1. **Branch Sweeping**: Iterates through unprocessed elements. If an element has an incoming sequence flow from an already processed node (an anchor), a new `Branch` object is initiated.
2. **Trace Branch**: Traces forward recursively following sequence flows until it re-merges into the processed group.
3. **Classification**: 
   - Uses the DFS `back-edges` lookup table. If the traced subgraph strictly flows backward in the topology, it is marked as an **Iterative Branch**.
   - If it flows outward and merges structurally further down the X-axis, it is marked as a **Parallel Branch**.
   - **Shortcut Detection**: Edges that bypass nodes entirely along the baseline are injected with an invisible `bpmn:AnchorPoint`. The sequence flow is split into two physical connectors merging at the anchor, defining an empty **Shortcut Branch**.

### Phase 5: Stage 3 - Optimal Sorting and Multi-Lane Assignment
To prevent parallel branches from printing over each other in the Y-axis, an allocation grid allocates lanes mathematically.
1. **Span Math**: Each branch derives a `span = abs(mergeColumnIndex - startColumnIndex)`. 
2. **Sorting Rule**: Branches are processed ascending by `span`. Smaller, tightly nested branches are allocated first to keep them physically closer to the trunk.
3. **Overlap Algorithm (Column-Range)**:
   - For a given lane `L` (starting at `lane=1`), the system checks if the new branch's logical X-axis span `[branchStart, branchMerge]` intersects with any branch already assigned to lane `L`.
   - **Intersection Math**: Two spans overlap if `Math.max(start1, start2) <= Math.min(end1, end2)`. Note: `<= ` enforces strict segregation even if two branches share a perfect single gateway coordinate to ensure routing margins.
   - If an overlap is detected, `lane++`. This loop terminates when an empty vertical slot is found.
4. **Lane-Aware Positioning**:
   - The first node (head) of the branch evaluates its Lane `L`.
   - **Parallel Branch**: `element.alignXWith(anchor).shiftDownOf(laneAnchor)`. The shape's specific Y offset is pushed logarithmically downward correlating to the overlap count in the X-column.
   - **Iterative Branch**: `element.alignXWith(anchor).shiftUpOf(laneAnchor)`. Iterations loop backwards across the top (Negative Y quadrant) of the baseline.
   - Subsequent branch nodes simply call `.positionRightOf(previous)` or `.positionLeftOf(previous)`, filling the length of the horizontal lane perfectly parallel to the baseline.

### Phase 6: Stage 4 - Target Routing and Connector Ports
Once layout coordinates are locked, the topological edge vectors must be mapped statically to prevent the line-router from inventing intersecting diagonal paths.
1. **Cardinal Routing Gateway Mathematical Rules**: 
   - **Rule 1 (Terminators)**: If `target` is End/Terminate -> Port `N` (up).
   - **Rule 2 (Iterations)**: If the edge is a DFS `Back-Edge` or the target is an Iterative Branch Head -> Port `N` (up).
   - **Rule 3 (Primary Path)**: If traversing forward to the main critical path -> Port `E` (Right).
   - **Rule 4 (Parallel Branch)**: Diverging parallel forward flow -> Port `S` (Down).
2. **Port Spreading Algorithm**:
   - If > 1 flow enters identical port faces (e.g., three arrows merging into the West side of a Gateway), they overlap in a collinear line.
   - The port spreader grabs actual `[X, Y]` geometric origins for the arrows.
   - Using comparative math against the target `[X, Y]`:
     - If origin `Y < target Y` -> Placed in `bucketNegative` (sorted by closest).
     - If origin `Y > target Y` -> Placed in `bucketPositive` (sorted by closest).
   - The spreader maps 3 lines into specific edge fractions (e.g., `WNW`, `W`, `WSW`). The Negative bucket takes the northern offsets; the Positive bucket maps to the southern offsets ensuring zero crossing lines at the boundary edge.

### Phase 7: Post-Layout Physics and Overlap Resolution
BPMN Diagrams trigger an internal physical "anti-overlap" sweep invoked dynamically from `BpmnDiagram.js`.
1. **AABB Interference Math**: Uses `Element.getBoundingClientRect()` representing standard box geometry data points `(x, y, width, height)`. Intersection is proven if:
   - `rect1.right > rect2.left && rect1.left < rect2.right && rect1.bottom > rect2.top && rect1.top < rect2.bottom`
2. **Heuristic Priority Pushing**:
   - If overlap is detected, an Aurea EDEN `.translate(dx, dy)` operation is mathematically injected to separate conflicting node bounds dynamically by evaluating graph roles.
   - e.g., Resolving overlapping tasks checks the `branchType`. Parallel tasks always yield to primary tasks, meaning the parallel task physically gets translated outward (`Y + padding`).
3. **Waypoint Precise Snapping**: The geometric intersection bounds (`Connector.determinePoints`) dynamically generate line corners. The exporter strictly translates these arrays with perfect `Math.round()` values. The arbitrary coordinate rounding limits have been removed, creating a 1:1 match natively binding `di:waypoints` straight to orthogonal `SVG` corners exported natively in Aurea EDEN.
