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

---

## 5. Pure Graph Topology and Cycle Detection

Aurea EDEN evaluates BPMN graphs via strict topological logic, completely ignoring any explicit (`BPMNShape`) positional data stored in the XML. By relying purely on nodes and edges, the converter adapts intelligently to structurally sound logic regardless of the visual layout applied by the user in the modeler canvas.

### The Problem of Loops (Global Cycles vs Iterations)
A common problem in automated layout generation is correctly identifying a backward loop (iteration). Simple graph reachability checks (`BFS` looking for the source node) fail in complex BPMN diagrams. 
For instance, if a diagram has a large global loop at the very end leading back to the beginning, every forward branch inside that loop can "technically" reach previous gateway nodes. Relying on simple reachability would misclassify every forward branch as a backward iteration.

### Depth-First Search (DFS) Back-Edge Classifier
To mathematically prove whether an edge is a true "backward" iteration vs. a normal forward branch, the algorithm employs a **DFS Back-Edge Classifier**:
1. It builds a recursive DFS tree spanning the process graph.
2. It prioritizes visiting nodes along the pre-identified "Primary Path" first, forming a solid central "Trunk" of the logic tree.
3. Any sequence flow that points back to a node currently in the `Active Recursive Stack` (an active ancestor in the DFS tree) is definitively flagged as a mathematical **Back-Edge**.

*Result: Forward side-branches flowing inside global cycles are correctly parsed as 'forward', while only logic truly circling back over itself is flagged as an iteration.*

---

## 6. Mathematical Gateway Routing & Port Selection

Once the topological role of each branch is proven by the DFS analysis, the `BpmnToFluentConverter` establishes the precise exiting `Port` for every sequence flow leaving a Branching Node (like an Exclusive Gateway). The rules applied are entirely topological and executed strictly in order:

### Rule 1: Terminating Exits
- If the target node is an `EndEvent` or a `TerminateEndEvent`, the flow is routed out of the **North (N)** port. 
- *Why:* End events are cleanly separated and raised off the primary workflow baseline.

### Rule 2: Topologically Backward Iterations
- If the specific sequence flow matches a mathematically proven **Back-Edge**, it is an iteration traversing backward across the diagram.
- **Backward Branch Roots (`backwardBranchRoots`)**: Sometimes a backward loop starts with a small intermediate task (e.g. "Fix Application") before the actual structural back-edge appears. If an entire multi-node branch sequence strictly resolves to a back-edge, the algorithm flags the first node of that branch as a _Branch Root_.
- Any gateway connector exiting into a Back-Edge *or* a `Backward Branch Root` is routed out of the **North (N)** port.
- *Why:* The N port gracefully forces the arrow to arc above the baseline sequence toward earlier points in the topological timeline.

### Rule 3: Forward and Parallel Side-Branches
- If the flow doesn't hit a terminator or loop backward, it must be moving forward.
- **Single Forward Edge:** If there's only one forward path (e.g. after stripping out back-edges above), route out of the **East (E)** port to continue the linear flow.
- **Primary Forward Edge:** If there are multiple forward branches, identify which one represents the topological "Primary Path" (the longest happy path). The primary branch gets the **East (E)** port to maintain the central baseline horizon.
- **Secondary Forward Edges:** All secondary or parallel forward branches get routed out of the **South (S)** port. 
- *Why:* The S port pushes alternative forward logic linearly *downwards* into new horizontal lanes beneath the main timeline horizon, fulfilling the lane algorithm's structure.
- **Fallback Rule:** In tiebreaker scenarios where multiple non-primary forward branches diverge, the algorithm uses deterministic alphabetical ID sorting to predictably drop all but the first node downward (S-port).
