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

## 2. Phase 1: The Baseline Spine

BPMN diagrams intrinsically feature complex topological combinations of branching, looping, and parallel executions. Generating dynamic code requires establishing a strong structural "Baseline Spine" that acts as the core horizontal stratum; all additional logical derivations will spawn above or below this line.

The algorithm establishes the baseline via topological graph traversal:
1. **Adjacency Mapping**: The converter parses `bpmn:sequenceFlow` definitions to construct a directed graph matrix connecting sources to targets.
2. **Depth First Search (DFS) Pathfinding**: The `_findPrimaryPath` capability evaluates traversal beginning at all cluster root entry points (Start Events).
3. **Weighting the Critical Path**: Upon diverging edge identification (gateways), the algorithm recursively cascades through all sub-paths yielding a global maximum span coordinate. To mitigate prioritizing early exceptions or abort loops, paths terminating cleanly at a `<bpmn:endEvent>` are granted significant priority heuristics. 
4. **Baseline Serialization**: Every element verified residing on the Longest Critical Path is serialized sequentially down the line, uniformly chaining relative rightwards positioning (`.positionRightOf()`) to define a true horizontal horizon across the rendering plane.

---

## 3. Phase 2: Placement of Branches and Sub-Paths

Once the horizontal horizon is established, the remaining graph vertices are topologically spawned relative to the baseline via a **Two-Pass Pipeline**.

### Pass A: Topology Detection & Multi-Lane Assignment
The engine calculates required vertical offsets mathematically before generating any geometry. 
1. **Continuous Trace Detection:** The engine identifies connecting flow edges departing previously initialized baseline components leading to unprocessed nodes. It traces forward continuously until intersecting a graph split, merge, or terminus.
2. **Forward vs. Backward Resolution:** A Breadth-First Search (BFS) reachability evaluation determines if a path eventually graphs back to its anchor node. Paths evaluating `true` are labelled **Iterative Branches**; paths evaluating `false` are **Parallel Branches**.
3. **Column Span Calculation:** Every branch calculates a virtual logical footprint representing its width over the X-Axis relative to the Baseline Spine index array (`[startCol, mergeCol]`). The total bounding size defined as `Span = abs(mergeCol - startCol) + 1`.
4. **Branch Priority Sorting:** The accumulated array of branches is sorted computationally ascending. Nodes bearing the shortest span length are placed at sequence index 0, guaranteeing tighter short loops resolve prior to massive boundary-spanning execution traces.
5. **Vertical Overlap Occlusion:** The system iterates over the sorted array and cycles integer `lane` levels. If a sequence intersects the calculated `[startCol, mergeCol]` arrays of any occupant already registered to the current lane, it pushes structurally downward into the subsequent tier. Sequentially segmented branches occupying wholly disparate column matrices can efficiently cohabitate identical lanes to minimize vertical bloat.

### Pass B: Geometry Rule Processing
Evaluating the populated Lane allocations, layout construction code natively generates.

**Rule 1: Sequence Anchoring (Forward Shift)**
- **Lane 0 (The Immediate Sub-Lane):** Forward branches occupying the shallowest structural slot drop natively beneath the baseline path counterpart intersecting parallel column zero (`.positionDownOf(primaryAnchor)`).
- **Lane N > 0 (The Stacked Lanes):** Deep nesting incorporates the single-axis compositional APIs. The origin aligns perpendicularly with the splitting logic layer, but shifts vertically beyond the specific object previously generating the occlusion warning. 
`element.alignXWith(primaryAnchor).shiftDownOf(occludingNodeAnchor)`
*Result: Parallel sequences generate horizontally readable ribbons, flawlessly nesting downwards matching structural origins.*

**Rule 2: Iterations (The Ceiling Route)**
Backward looping operates matching Phase B Rule 1 algorithms mirrored vertically. Lane 0 resides `.positionUpOf()`, ascending into deeper bounding `.alignXWith(anchor).shiftUpOf(occludingNodeAnchor)` envelopes.

**Rule 3: Internal Flow Progression**
Following successful topological origin anchoring (index 0), all trailing branch components connect progressively.
- **Parallel Lanes:** Propagate linearly (`.positionRightOf()`).
- **Iterative Lanes:** Propagate retroactively (`.positionLeftOf()`) to demonstrate returning graph traversals visually to the viewer.

**Rule 4: Immediate Abortion (Ceiling Override)**
If an atomic `<bpmn:endEvent>` attaches adjacently departing a `<bpmn:gateway>`, Standard lane allocations are overridden and `.positionUpOf()` translates the abortion isolated above the parallel logic ribbons.

---

## 4. Phase 3: Global Connectors and Topology Ports

Post-geometry initialization, logic triggers Phase 3 Edge Connectors (`element.connectTo()`). Given single 1-1 constraints, targets default natively `auto`, `auto`. 

Diverging edge topology (Gateways) utilizes structural coordinate derivation logic (`_sourcePort`) to mitigate crossed or occluded boundary edges based on absolute graph vectors.

**Heuristic Matrix for Divergent Outbounds:**
1. **Return Trips and Backward Paths**: Cycles tracking geometrically "behind" the source egress via the top boundary face (`N`).
2. **Terminal Routing**: Vector projections intersecting Terminating aborts (Phase 2, Rule 4) egress natively via tracking ceiling limits (`N`).
3. **Primary Baseline Executions**: Sequences routing over the calculated Phase 1 Spine transit the chronological forward face (`E`).
4. **Secondary Branch Execution**: Unassigned sequences transition vertically sub-path constraints natively traversing the lower threshold limit (`S`).
