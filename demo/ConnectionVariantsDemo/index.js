import { BpmnDiagram } from '../../lib/notations/BpmnDiagram.js';

export default function initDemo(container, options = {}) {
    const diagram = new BpmnDiagram(container, options);

    let testCounter = 1;

    // --------------------------------------------------------------------------------
    // Category 1: Straight Lines
    // --------------------------------------------------------------------------------
    diagram.addTextAnnotation('cat-1-title', 'Category 1: Straight Lines\nSimplest routing between aligned ports', 350);

    // 1. Straight (Left -> Right)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf('cat-1-title');

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'E', 'W', `${testCounter}. Straight (L->R)`);

    testCounter++;

    // 2. Straight (Right -> Left)
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'W', 'E', `${testCounter}. Straight (R->L)`);

    testCounter++;

    // 3. Straight (Top -> Down)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`src-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'S', 'N', `${testCounter}. Straight (T->D)`);

    testCounter++;

    // 4. Straight (Bottom -> Up)
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`src-${testCounter - 2}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'N', 'S', `${testCounter}. Straight (B->U)`);

    testCounter++;

    // --------------------------------------------------------------------------------
    // Category 2: L-Curves (1 Elbow)
    // All 8 orthogonal port combinations arranged in a 4-row × 2-col grid
    // Grouped by source direction: Row 1=E, Row 2=W, Row 3=N, Row 4=S
    // --------------------------------------------------------------------------------
    diagram.addTextAnnotation('cat-2-title', 'Category 2: L-Curves (1 Elbow)\n90-degree turns when target port is perpendicular to source port', 350)
        .positionDownOf(`tgt-${testCounter - 2}`);

    // --- Row 1: E->N (left) | E->S (right) ---

    // 5. E->N: src exits East, tgt enters North. src top-left, tgt bottom-right.
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf('cat-2-title');

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'E', 'N', `${testCounter}. L-curve (E->N)`);

    testCounter++;

    // 6. E->S: src exits East, tgt enters South. tgt top-right, src bottom-left.
    // tgt-6 is placed rightOf tgt-5 (right column, same Y level)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionUpRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'E', 'S', `${testCounter}. L-curve (E->S)`);

    testCounter++;

    // --- Row 2: W->S (left) | W->N (right) ---

    // 7. W->S: src exits West, tgt enters South. tgt top-left, src bottom-right.
    // tgt-7 anchors below tgt-5 (left column, returns from rightward drift)
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownLeftOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'W', 'S', `${testCounter}. L-curve (W->S)`);

    testCounter++;

    // 8. W->N: src exits West, tgt enters North. src top-right, tgt bottom-left.
    // src-8 placed rightOf tgt-7 (right column, same Y as tgt-7)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownRightOf(`src-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownLeftOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'W', 'N', `${testCounter}. L-curve (W->N)`);

    testCounter++;

    // --- Row 3: N->W (left) | N->E (right) ---

    // 9. N->W: src exits North, tgt enters West. src bottom-left, tgt top-right.
    // src-9 anchors below tgt-7 (left column)
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`src-${testCounter - 2}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownLeftOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'N', 'W', `${testCounter}. L-curve (N->W)`);

    testCounter++;

    // 10. N->E: src exits North, tgt enters East. tgt top-left, src bottom-right.
    // tgt-10 placed rightOf tgt-9 (right column)
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'N', 'E', `${testCounter}. L-curve (N->E)`);

    testCounter++;

    // --- Row 4: S->W (left) | S->E (right) ---

    // 11. S->W: src exits South, tgt enters West. src top-left, tgt bottom-right.
    // src-11 anchors below src-9 (left column)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`src-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'S', 'W', `${testCounter}. L-curve (S->W)`);

    testCounter++;

    // 12. S->E: src exits South, tgt enters East. src top-right, tgt bottom-left.
    // src-12 placed rightOf tgt-11 (right column)
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionUpRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'S', 'E', `${testCounter}. L-curve (S->E)`);

    testCounter++;

    // --------------------------------------------------------------------------------
    // Category 3: S-Curves (2 Elbows)
    // 8 variants (E->W, W->E, S->N, N->S) × 2 offset directions
    // --------------------------------------------------------------------------------
    diagram.addTextAnnotation('cat-3-title', 'Category 3: S-Curves (2 Elbows)\nOpposite ports with an offset, requiring two 90-degree bends', 350)
        .setPosition(diagram.getElementById(`src-${testCounter - 2}`).position.x,
            diagram.getElementById(`src-${testCounter - 2}`).position.y - 220);

    // --- Row 1: E->W (tgt right of src) ---

    // 13. E->W (tgt down-right)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf('cat-3-title');

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'E', 'W', `${testCounter}. S-curve (E->W down)`);

    testCounter++;

    // 14. E->W (tgt up-right)
    // src placed rightOf tgt-13 (left pair's tgt)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionUpRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'E', 'W', `${testCounter}. S-curve (E->W up)`);

    testCounter++;

    // --- Row 2: W->E (tgt left of src) ---

    // 15. W->E (tgt down-left attached to src up-right)
    // tgt-15 anchors below tgt-13 (left column) to step down a row
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownLeftOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'W', 'E', `${testCounter}. S-curve (W->E down)`);

    testCounter++;

    // 16. W->E (tgt up-left attached to src down-right)
    // tgt-16 rightOf src-15
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`src-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'W', 'E', `${testCounter}. S-curve (W->E up)`);

    testCounter++;

    // --- Row 3: S->N (tgt below src) ---

    // 17. S->N (tgt down-right)
    // src-17 anchors below tgt-15 (left column)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'S', 'N', `${testCounter}. S-curve (S->N right)`);

    testCounter++;

    // 18. S->N (tgt down-left)
    // tgt-18 added first, rightOf tgt-17 (right column)
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionUpRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'S', 'N', `${testCounter}. S-curve (S->N left)`);

    testCounter++;

    // --- Row 4: N->S (tgt above src) ---

    // 19. N->S (tgt up-right)
    // tgt-19 added first, anchors down-left of tgt-17 to step down a row and return left
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownLeftOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'N', 'S', `${testCounter}. S-curve (N->S right)`);

    testCounter++;

    // 20. N->S (tgt up-left)
    // src-20 added first, rightOf tgt-19
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'N', 'S', `${testCounter}. S-curve (N->S left)`);

    testCounter++;

    // --------------------------------------------------------------------------------
    // Category 4: C-Curves (Same face looping)
    // 8 variants: 4 port faces (E, W, N, S) × 2 offset directions (e.g. up/down, left/right)
    // --------------------------------------------------------------------------------
    diagram.addTextAnnotation('cat-4-title', 'Category 4: C-Curves (Same face looping)\nRouting that leaves and enters the same side of elements', 350)
        .positionDownOf(`src-${testCounter - 2}`);

    // --- Row 1: East C-Curves (E->E) ---

    // 21. C-curve E->E (Target below Source)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf('cat-4-title');

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`src-${testCounter}`) // (0,-150)
        .connectFrom(`src-${testCounter}`, 'E', 'E', `${testCounter}. C-curve (E->E down)`);

    testCounter++;

    // 22. C-curve E->E (Target above Source)
    // tgt-22 added first as layout anchor
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`src-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'E', 'E', `${testCounter}. C-curve (E->E up)`);

    testCounter++;

    // --- Row 2: West C-Curves (W->W) ---

    // 23. C-curve W->W (Target below Source)
    // src-23 anchors down-left of tgt-21 (left column)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'W', 'W', `${testCounter}. C-curve (W->W down)`);

    testCounter++;

    // 24. C-curve W->W (Target above Source)
    // tgt-24 added first
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`src-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'W', 'W', `${testCounter}. C-curve (W->W up)`);

    testCounter++;

    // --- Row 3: North C-Curves (N->N) ---

    // 25. C-curve N->N (Target right of Source)
    // src-25 anchors down-left of tgt-23 (left column)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'N', 'N', `${testCounter}. C-curve (N->N right)`);

    testCounter++;

    // 26. C-curve N->N (Target left of Source)
    // tgt-26 added first
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'N', 'N', `${testCounter}. C-curve (N->N right)`);

    testCounter++;

    // --- Row 4: South C-Curves (S->S) ---

    // 27. C-curve S->S (Target right of Source)
    // src-27 anchors down of src-25 (left column)
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`src-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'S', 'S', `${testCounter}. C-curve (S->S right)`);

    testCounter++;

    // 28. C-curve S->S (Target left of Source)
    // tgt-28 added first, rightOf tgt-27
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'S', 'S', `${testCounter}. C-curve (S->S left)`);

    testCounter++;

    // --------------------------------------------------------------------------------
    // Category 5: U-Turns (3+ Elbows)
    // Cases where target forces a loop-around path (target behind source exit face)
    // --------------------------------------------------------------------------------
    diagram.addTextAnnotation('cat-5-title', 'Category 5: U-Turns (3+ Elbows)\nRouting where target is positioned behind the source exit, requiring a loop-around', 350)
        .positionDownOf(`src-${testCounter - 2}`);

    // --- Subcategory 5A: Orthogonal U-Turns (3 Elbows) ---

    // --- Row 1: Source Exits North (N->W, N->E) ---
    // 29. U-Turn (N->E) - Target Down-Right
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf('cat-5-title');

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'N', 'E', `${testCounter}. U-Turn (N->E)`);

    testCounter++;

    // 30. U-Turn (N->W) - Target Down-Left
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionUpRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'N', 'W', `${testCounter}. U-Turn (N->W)`);

    testCounter++;

    // --- Row 2: Source Exits South (S->W, S->E) ---
    // 31. U-Turn (S->E) - Target Up-Right
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownLeftOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'S', 'E', `${testCounter}. U-Turn (S->E)`);

    testCounter++;

    // 32. U-Turn (S->W) - Target Up-Left
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'S', 'W', `${testCounter}. U-Turn (S->W)`);

    testCounter++;

    // --- Row 3: Source Exits East (E->N, E->S) ---
    // 33. U-Turn (E->S) - Target Up-Left
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`src-${testCounter - 2}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'E', 'S', `${testCounter}. U-Turn (E->S)`);

    testCounter++;

    // 34. U-Turn (E->N) - Target Down-Left
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`src-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownLeftOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'E', 'N', `${testCounter}. U-Turn (E->N)`);

    testCounter++;

    // --- Row 4: Source Exits West (W->N, W->S) ---
    // 35. U-Turn (W->N) - Target Down-Right
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownLeftOf(`src-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'W', 'N', `${testCounter}. U-Turn (W->N)`);

    testCounter++;

    // 36. U-Turn (W->S) - Target Up-Right
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionRightOf(`tgt-${testCounter - 1}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionUpRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'W', 'S', `${testCounter}. U-Turn (W->S)`);

    testCounter++;

    // --- Subcategory 5B: Opposite U-Turns (4 Elbows) ---

    // --- Row 5: Vertical Opposites (N->S, S->N) ---
    // 37. U-Turn (N->S) - Target Directly Below Source
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'N', 'S', `${testCounter}. U-Turn (N->S below)`);

    testCounter++;

    // 38. U-Turn (S->N) - Target Directly Above Source
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`src-${testCounter - 1}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionDownOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'S', 'N', `${testCounter}. U-Turn (S->N above)`);

    testCounter++;

    // --- Row 6: Horizontal Opposites (E->W, W->E) ---
    // 39. U-Turn (E->W) - Target Directly Left of Source
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownLeftOf(`tgt-${testCounter - 2}`);

    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionRightOf(`tgt-${testCounter}`)
        .connectTo(`tgt-${testCounter}`, 'E', 'W', `${testCounter}. U-Turn (E->W left)`);

    testCounter++;

    // 40. U-Turn (W->E) - Target Directly Right of Source
    diagram.addTask(`src-${testCounter}`)
        .addWrappedText('Task A')
        .positionRightOf(`src-${testCounter - 1}`);

    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(`src-${testCounter}`)
        .connectFrom(`src-${testCounter}`, 'W', 'E', `${testCounter}. U-Turn (W->E right)`);

    testCounter++;

    // --------------------------------------------------------------------------------
    // Category 6: Auto-resolving Ports
    // --------------------------------------------------------------------------------
    diagram.addTextAnnotation('cat-6-title', 'Category 6: Auto-resolving Ports\nProximity-based automatic port selection', 350)
        .positionDownOf(`tgt-${testCounter - 2}`);

    let centerSrc = `src-${testCounter}`;
    let tlTgt = `tgt-${testCounter}`;

    // 1. Top-Left Task B
    diagram.addTask(tlTgt)
        .addWrappedText('Task B')
        .positionDownOf('cat-6-title');

    // Central Task A
    diagram.addTask(centerSrc)
        .addWrappedText('Task A')
        .positionDownRightOf(tlTgt)
        .connectTo(tlTgt, 'auto', 'auto', 'Auto (Top-Left)');

    testCounter++;

    // 2. Top Task B
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .setPosition(diagram.getElementById(centerSrc).position.x, diagram.getElementById(tlTgt).position.y)
        .connectFrom(centerSrc, 'auto', 'auto', 'Auto (Top)');

    testCounter++;

    // 3. Top-Right Task B
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionUpRightOf(centerSrc)
        .connectFrom(centerSrc, 'auto', 'auto', 'Auto (Top-Right)');

    testCounter++;

    // 4. Left Task B
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionLeftOf(centerSrc)
        .connectFrom(centerSrc, 'auto', 'auto', 'Auto (Left)');

    testCounter++;

    // 5. Right Task B
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionRightOf(centerSrc)
        .connectFrom(centerSrc, 'auto', 'auto', 'Auto (Right)');

    testCounter++;

    // 6. Bottom-Left Task B
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownLeftOf(centerSrc)
        .connectFrom(centerSrc, 'auto', 'auto', 'Auto (Bottom-Left)');

    testCounter++;

    // 7. Bottom Task B
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownOf(centerSrc)
        .connectFrom(centerSrc, 'auto', 'auto', 'Auto (Bottom)');

    testCounter++;

    // 8. Bottom-Right Task B
    diagram.addTask(`tgt-${testCounter}`)
        .addWrappedText('Task B')
        .positionDownRightOf(centerSrc)
        .connectFrom(centerSrc, 'auto', 'auto', 'Auto (Bottom-Right)');

    testCounter++;

    return diagram;
}
