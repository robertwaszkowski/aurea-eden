# Scientific Reports Article: Strategic Roadmap & Execution Plan

This document outlines the strategy for the publication of our research on BPMN layout algorithms in **Scientific Reports** (Nature Portfolio). It serves as a comprehensive reference for the core methodology, contribution, and the subsequent steps required for submission.

---

## 1. Core Objective
The primary goal is to formalize and validate a novel layout engine that natively addresses the unique aesthetic and structural challenges of **BPMN 2.0 Diagrams**—specifically **orthogonality**, **complex cyclic loops**, and **discrete port assignment**—without the spatial bloat found in traditional graph-drawing paradigms.

---

## 2. Research Problem & Innovation
### The Research Gap
*   **Sugiyama Framework**: Causes spatial bloat due to "dummy nodes" when handling backward-flowing cycles.
*   **Grid-Based Layouts**: Suffer from "cell expansion," creating redundant white space.
*   **Missing BPMNDI**: Text-to-BPMN systems (and LLMs) output semantic logic but lack the visual coordinates (BPMNDI) required for rendering.

### Our Solution
A **7-Phase Execution Engine** that explicitly decouples **Topological Constraint Discovery** from **Physical Geometric Compilation**. This ensures tight, overlap-free, and legible business logic visualizations.

---

## 3. The Seven-Phase Execution Engine

### Phase 1: Formal XML Parsing & Graph Sub-Mapping
*   **Action**: Ingest BPMN DOM and strip existing DI data.
*   **Logic**: Construct a pure directed graph $G = (V, E)$. Isolate the **Baseline Spine** (the longest unbroken path from Start to End) to dictate the primary left-to-right reading flow.

### Phase 2: DFS Back-Edge Classification (Cycle Detection)
*   **Method**: Implement a 3-state (White/Gray/Black) **Depth-First Search**.
*   **Outcome**: Isolate "Back-Edges" (loops) to handle them as $North$-facing overhead returns, preventing infinite recursion in layout logic.

### Phase 3: Baseline Spine Establishment
*   **Action**: Lock the primary path nodes at $Y=0$.
*   **Benefit**: Establishes a rigid, predictable anchor for the entire diagram.

### Phase 4: Declarative DOM Topologies
*   **Logic**: Transition from absolute Cartesian positioning to relative "Proxy" positioning. Branches are registered as divergent paths from the primary spine.

### Phase 5: Multi-Lane Interval Scheduling
*   **Math**: Solve as an **Interval Graph Coloring Problem**.
*   **Function**: Calculate the $X$-axis shadow of parallel branches. If they overlap, shift them into independent $L$ layers (Lanes) to prevent horizontal collisions.

### Phase 6: Sub-Cardinal Port Spreading
*   **Innovation**: Prevent "Connector Masking" (overlapping lines).
*   **Logic**: If multiple edges converge on the same target port, they are distributed across the face (N, S, E, W) using fractional offsets (e.g., offsets from $-0.9$ to $0.1$).

### Phase 7: Continuous Dynamic AABB Translation
*   **Action**: Final physical collision pass.
*   **Function**: Use **Axis-Aligned Bounding Box (AABB)** intersections to detect if large text labels bleed into neighbor elements, injecting $\Delta Y$ shifts to ensure total visual harmony.

---

## 4. Empirical Benchmarking Methodology
To prove theoretical superiority, we will execute a high-throughput comparative study:
*   **Dataset**: $N = 10,000$ procedurally generated BPMN diagrams with varying loop density ($0\%–30\%$).
*   **Competitors**:
    *   **Sugiyama** (Hierarchical).
    *   **Tamassia** (Minimum-Cost Flow Orthogonal).
    *   **Grid-Based** (Standard Spanning).
*   **Metrics**:
    *   **Area Footprint**: Total pixels consumed.
    *   **Edge Bends**: Frequency of right-angle transitions.
    *   **Edge Crossings**: Count of intersecting sequence flows.
    *   **Execution Velocity**: Latency of the layout calculation.

---

## 5. Roadmap to Completion
1.  **[x] Polish Manuscript**: Finalize the LaTeX source for the introduction and State of the Art.
2.  **[ ] Execute Benchmarking**: Run the procedural generator and collect metric data.
3.  **[ ] Generate Visualizations**: Export high-resolution comparison plots (Sugiyama vs. Ours).
4.  **[ ] Final Review**: Audit against Scientific Reports submission guidelines.
5.  **[ ] Submission**: Upload to the Nature Portfolio portal.

---
> [!TIP]
> This strategy ensures that the article focuses not just on "making it look good," but on the **mathematical efficiency** and **cognitive load reduction** backed by empirical data.
