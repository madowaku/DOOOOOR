# DOOOOOR: instructions for coding agents

## Mission

Turn this repository into a polished, genuinely playable mobile-first top-down **door puzzle game**. The game's identity comes from three questions: **WHEN** to open a door, **WHICH WAY** to swing it, and which doors to **LEAVE CLOSED**.

The current `index.html` is an early disposable prototype, not a reference implementation for door physics, level quality, or solver correctness. **Do not preserve faulty mechanics for backward compatibility.** Keep the title spelled **DOOOOOR** (five O characters) and Japanese subtitle **ドアドアめぐり**.

## Non-negotiable mechanics

- A closed door occupies an **edge between adjacent walkable cells**, not an entire cell.
- The hinge is at one endpoint of that edge. A legal opening swings the leaf 90 degrees around that hinge onto a **perpendicular edge that shares the hinge**. Thus an opening removes one blocked edge and creates another.
- Player **pushes** from the allowed side, never pulls. A one-way door only allows its designated side. A bidirectional door has two possible pushes, one from either side; push side determines final swing direction.
- A door opens **at most once** and remains fixed forever during play. UNDO and RESTART can revert it.
- For every opening, reject collision with solid wall/door leaf/other closed-door obstruction, overlapping occupied swing edges, and any other conditions defined by the physical simulation. Do not teleport leafs to arbitrary cells.
- Opened leafs are barriers, but not automatically whole-cell blockers. Walking is always blocked by walls/leaf edges; occupants are cell positions.
- Interlocking hinges and door order must produce real, visible consequences. A stage cannot merely claim an intended solution if a shorter trivial route exists.
- Use a **single pure transition function** for the interactive game, tests, BFS/solver, and stage generator/validator; never duplicate slightly divergent physics in each place.

## Scope and autonomy

Implement the task in GitHub issue titled **Build the full DOOOOOR playable vertical slice with art, solver and QA** end-to-end. You may replace the prototype's file structure with a simple maintainable stack (TypeScript + Vite/Canvas/SVG is a reasonable option). Prefer a small fast offline-friendly app without paid dependencies or backend. Avoid making the user decide incidental implementation details. Create a branch and PR, not a direct final merge into main.

Aim for **20 carefully verified stages** matching the former Stage 001–020 learning arc. At minimum, finish the 8 priority stages: **001, 003, 005, 009, 011, 012, 018, 020**. It is better to ship eight genuinely clever, polished levels than twenty fake or unsolvable ones. Clearly mark any deferred stages and never misrepresent stage counts.

## Visual art direction

- A distinct premium indie puzzle look: warm amber/copper doors, cool blue-gray maze walls, cream/calm floor tiles, soft warm light, subtle textures and shadows; recognizable from a small smartphone screen.
- Primarily **top-down 2D, legible physical geometry**, not a 3D scene that hides hinges. Strong silhouettes for closed/open leafs and hinges. Static preview of swing direction is allowed if needed for comprehension.
- A minimal striking title screen with **D + OOOOO + R**, with the five O's evoking door hinges or swings. Refine the concept image from the original design conversation when available; no need to imitate it literally. Japanese subtitle.
- Small satisfying OPEN → SWING → CLICK sequence, tactile audio with mute, appropriate short transitions, and no overwhelming decorations.
- Mobile-first portrait target around 720x1280, responsive desktop layout. Keyboard arrows/WASD and touch/swipe (or direct taps), obvious undo/restart/level select, optional EN/JA, reduced-motion support, contrast/readability.
- All visual assets must be locally generated, code-drawn, or appropriately licensed with attribution. No copyrighted game art or unlicensed stock images.

## Quality bar

- Pure simulator unit tests and solver-based verification: each shipped level solvable, all doors physically legal, full solution replayable by the same runtime reducer, intended concepts occur in valid solutions, optional branches and short-circuits analyzed, no softlocks without clear undo.
- A verified walkthrough/solution witness for every level; generate a machine-readable validation report and show a concise summary in the PR.
- At least one automated browser smoke test covering start → opening a door → undo → win → next stage; run in Chromium on mobile and desktop viewports if feasible.
- Build/lint/test commands must be documented and actually executed; add GitHub Actions where practical.
- No fake tests, no broken placeholder links, no dead menu options, no unhandled JS errors.
- README includes how to play, quickstart, controls, architecture, level validation and deployment.
- Provide screenshots (desktop and mobile) from the **actual running game**, not concept art, in the PR if possible.

## Working style

1. Audit the current prototype, note broken shortcuts or misleading stage designs.
2. Implement/refactor the single-source-of-truth engine + BFS solver + tests.
3. Create and validate levels, prioritizing 005, 012 and 018 as proof of depth.
4. Polish visuals/UX and animate/sound the door swing.
5. Test on real browser and device-scale viewports, repair and capture screenshots.
6. Open a PR with summary, verified numbers, screenshots, and honest remaining risks.

Don't stop at only a plan, a design concept, or a TODO list. **Write, run, test and deliver the game.**
