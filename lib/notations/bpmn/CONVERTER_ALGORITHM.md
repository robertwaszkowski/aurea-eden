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
   - Rule 3: Y_TOLERANCE (Visual Sequence Chaining off the Main Path)
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

The converter loops over all unplaced elements, finding an already-placed element (anchor) it connects from, and evaluates placement using the following heuristic pipeline:

Yes, we absolutely wrote that logic! Here is exactly how those heuristics analyze the coordinates of the XML to write the fluent API syntax:

### Rule 1: Terminating End Events (The Upward Override)
In the XML, an end-event terminating a branch right off a gateway might just be drawn slightly above the gateway visually. 
However, standard rules only push elements rightwards or downwards. Without overriding this, terminating events would drop below the line, muddying parallel logic flows.

**How it works:**
The code checks `isElementEndEvent && isAnchorGateway`. 
If an `<endEvent>` is explicitly attached direct to a `<gateway>`, it overrides all normal X/Y reading logic and forces `.positionUpOf(gatewayId)`.
*Result: Terminating aborts visually snap to the ceiling above the line, isolating them from parallel forward-progression.*

### Rule 2: Diverging Gateways (Avoiding Under-Gateway placement)
When a gateway splits the flow into two streams, the easiest algorithmic approach would simply be to place the branching element directly underneath the gateway (`.positionDownOf('gatewayId')`).
However, this causes the parallel sequence to be visually "stuck" back where the gate was split, breaking clean columns.

**How it works:**
The code detects if `anchorOutgoing.length === 2`:
1. It looks at the two outgoing targets, and checks which one belongs to the *Longest Primary Path* baseline we generated in Phase 1 (let's call it `mainSuccessorId`).
2. Rather than dropping the branch below the gateway itself, the algorithm dynamically assigns `.positionDownOf(mainSuccessorId)`. 
*Result: The parallel lane structurally aligns exactly below the first step of the main path, ensuring matching columns.*

### Rule 3: `Y_TOLERANCE` (Visual Sequence Chaining off the Main Path)
When the converter builds the primary baseline in Phase 1, it simply writes `.positionRightOf()` infinitely because it's guaranteed to be a single chained path. 
But branches (Phase 2) are tricky. If a downward branch contains three sequential tasks, how does the engine know they should chain left-to-right off of *each other* rather than continuously stacking downwards off the anchor?

**How it works:**
The code calculates standard geometric heuristic using absolute BPMN coordinates: `Math.abs(element.y - anchorEl.y)`.
If a newly discovered element is graphically drawn within `25` pixels on the Y-axis of the anchor it connects to, the algorithm assumes they belong to the same sequence lane visually. 
- `|Δy| <= 25` outputs `.positionRightOf(anchor)` (chains them horizontally).
- `Δy > 25` outputs `.positionDownOf(anchor)` (forces a new lower lane drop).

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
