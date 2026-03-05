# BPMN to Fluent API Conversion Algorithm

This document details the step-by-step algorithms, heuristics, and placement rules used by the `BpmnToFluentConverter` engine to transition raw BPMN XML models into robust, natively laid out Fluent API chains for the Aurea EDEN framework.

## Algorithm Steps Summary
1. **Phase 1: The "Longest Path" Baseline**
   - Adjacency Mapping
   - Pathfinding
   - Weighting the "Happy Path"
   - Baseline Serialization
2. **Phase 2: Placement of Branches and Off-Path Elements**
   - Rule 1: Terminating End Events (The Upward Override)
   - Rule 2: Diverging Gateways (Avoiding Under-Gateway placement)
   - Rule 3: Topology-Based Flow Chaining (Forward vs Backward Flow)
3. **Phase 3: Global Connectors and Gateway Port Rules**
   - Dealing with Gateway Ambiguity (`_sourcePort`):
     - Return Trips and Backward Paths
     - Targeting End Events
     - Primary Baseline Paths
     - Secondary Branches

## 1. Principles of Connectors and Positioning

Unlike XML which relies on absolute Cartesian (X, Y) coordinates, Aurea EDEN diagrams are generated structurally using relative geometric relationships. These relationships dictate not only where an element sits, but how the arrows (Sequence Flows) travel between them. 

### Geometric Anchors
Elements are placed into the scene relative to existing "anchor" elements. The primary topological anchors are:
- `.positionRightOf(elementId)`: The primary tool for building linear sequences left-to-right.
- `.positionDownOf(elementId)`: Used to spawn parallel lanes or branch paths vertically below the baseline.
- `.positionUpOf(elementId)`: Used for explicit structural overrides, typically terminating events.

### Port Resolution and Orthogonal Routing 
Connections require evaluating the entry and exit boundaries of elements via Ports (`N`orth, `S`outh, `E`ast, `W`est) or using structural deduction (`auto`). 
The `Element.resolvePorts` engine governs connector routing:
- **Explicit vs Auto**: Providing `('S', 'auto')` informs the system to force an exit out the bottom face, and dynamically evaluate the safest entry face on the target.
- **Orthogonal Preference**: The engine prefers generating orthogonal 1-elbow L-Curves. If two `auto` ports are connecting elements that are diagonally offset (e.g. from top-left to bottom-right), rather than strictly matching opposite faces (`E` to `W`) which generates 2-elbow S-Curves, the `resolvePorts` engine natively pairs orthogonal faces (e.g. `E` to `N`) to produce a single, clean 90-degree corner.

---

## 2. Phase 1: The "Longest Path" Baseline

BPMN diagrams often feature complex spidery webs of branches, loops, and parallel paths. Generating relative code cleanly requires establishing a structural "spine" or baseline that dictates the core horizontal layout, with all other branches flowing above or below it.

The algorithm establishes this through graph traversal:
1. **Adjacency Mapping**: The converter reads all graphical `<seqFlow>` edges and constructs a topological graph mapping sources to targets.
2. **Pathfinding**: Using Depth First Search (DFS), the `_findPrimaryPath` method traverses start clusters.
3. **Weighting the "Happy Path"**: When divergence occurs (a gateway), the algorithm recursively evaluates all sub-paths evaluating total distance. To prevent routing into early aborts, loops, or error states, the algorithm grants massive priority weighting to any route that ultimately terminates at a standard `<endEvent>`. 
4. **Baseline Serialization**: Every element discovered on this Longest Path is then serialized sequentially, uniformly chaining `.positionRightOf()` the previous step to establish a perfect, straight horizontal baseline across the page.

---

## 3. Phase 2: Placement of Branches and Off-Path Elements

Once the primary path is placed, the remaining elements (branches, error handlers, sub-processes) must be topologically spawned relative to the baseline.

Phase 2 abandons raw coordinates entirely and operates in a **two-pass architectural model**: 
1. **Pass A: Branch Detection & Lane Assignment** (Calculates the vertical offsets)
2. **Pass B: Geometry Generation** (Writes the layout code)

### Pass A: Branch Detection & Lane Assignment

The converter first loops over all unplaced elements, searching for any sequence flow that connects from an already-processed element (the anchor) to an unprocessed element (the branch start).
When it finds one, it traces the entire continuous sub-path (`_traceBranch`) until it hits a merge, split, or end.

**1. Forward vs Backward Identification:**
The engine performs a BFS reachability check to see if walking forward from the end of the newly discovered branch can ever loop back to its *source anchor*. 
- **Parallel Branches:** If it does *not* loop back, it is a forward sequence.
- **Iterative Branches:** If the graph *does* loop back, it is an upward/backward sequence.

**2. Vertical Multi-Lane Assignment:**
To prevent parallel branches from overlapping each other (e.g., three tasks all trying to spawn directly completely under a gateway), the algorithm dynamically assigns each branch to a collision-free horizontal "Lane".
- It calculates the branch's **Column Range (`[startCol, mergeCol]`)** by finding where the branch spawns on the primary baseline, and where it ultimately merges back in.
- The algorithm cycles through vertical `lane` integer indices, checking for overlaps against other branches already assigned to that lane.
- If two branches exist in totally separate column spans (e.g. one at the start of the diagram, one at the end), they are safely assigned to the same shallow Lane 0. 
- If their columns overlap, the new branch is pushed down to Lane 1, Lane 2, etc.

### Pass B: Placement Rules and Geometry Generation

With all branches securely assigned to collision-free lanes, the algorithm generates the layout using the composable single-axis API (`.alignXWith()`, `.alignYWith()`, `.shiftDownOf()`, etc.) built into `Element.js`.

**Rule 1: Terminating End Events (The Upward Override)**
If an `<endEvent>` is explicitly attached direct to a `<gateway>`, it overrides all normal lane logic and forces `.positionUpOf(gatewayId)`. 
*Result: Terminating aborts visually snap to the ceiling above the line, isolating them from parallel forward-progression.*

**Rule 2: Diverging Parallel Branches (Lane Shifting)**
When spawning a forward branch:
- **Lane 0 (The Shallow Lane):** The branch starts directly beneath the main path successor using `.positionDownOf(mainPathNode)`.
- **Lane N > 0 (Deep Lanes):** The branch geometry must start exactly below its target, but pushed further down geometrically explicitly beneath the branch that caused the overlap. The code combines X and Y rules: `.alignXWith(mainPathNode).shiftDownOf(overlappingBranchNode)`.
*Result: Parallel sequences stack tightly beneath one another in clearly readable unbroken rows, but perfectly aligned to the column of the gateway they split from.*

**Rule 3: Iterative Branches (Ceiling Routing)**
Backward loops operate identically to Rule 2, but mirrored vertically. Lane 0 sits directly above the anchor using `.positionUpOf()`, and deeper overlapping iteration envelopes use `.alignXWith(anchor).shiftUpOf(overlappingBranchNode)`.

**Rule 4: Flow Chaining (Subsequent Nodes)**
For all subsequent nodes inside a branch (i.e. node index > 0), the placement chains continuously off the previous node.
- **Parallel Lanes** build left-to-right (`.positionRightOf()`).
- **Iterative Lanes** build right-to-left (`.positionLeftOf()`) to visually indicate the cycle traveling backward to the start.

---

## 4. Phase 3: Global Connectors and Gateway Port Rules

With all shapes placed, Phase 3 writes the sequence flows. For standard linear tasks (1-in, 1-out), connecting is trivial via `.connectTo(target, 'auto', 'auto')`. Gateways require specialized logic.

### Dealing with Gateway Ambiguity (`_sourcePort`)
Gateways split flows geometrically. Emitting dual `auto` ports from a gateway can cause overlapping or crossed wires based on bounding box proximity. To enforce a clean layout, the `_sourcePort` function structurally analyzes where the connection is heading to assign an explicit exit face.

**Heuristic Rules for Gateway Exits:**
1. **Return Trips and Backward Paths**: If a cycle is detected (the target is structurally "behind" the gateway) indicating a loop, it departs via the top face (`'N'`).
2. **Targeting End Events**: Routing toward a Terminating event (placed upward via Phase 2) also naturally routes via the top face (`'N'`). 
3. **Primary Baseline Paths**: If the flow continues along the calculated 'Longest Path' spine, it exits out the standard front face (`'E'`).
4. **Secondary Branches**: Non-primary, forward-moving branches implicitly exit vertically down (`'S'`) into the parallel lane.

The target port of the receiving element remains `'auto'`. The Aurea EDEN `resolvePorts` engine utilizes this (`'S'`,  `'auto'`) signature to naturally calculate 1-elbow L-Curves, routing cleanly up or rightwards into the target shape without collision.
