# Nialli™ Visual Planner: Weekly Planning Research

## Adding & Editing Tasks

- **Daily Tasks**: Updated during status reviews.
- **Fields**: Task name, details, crew size, and **Actual crew size**.
- **Planning Mode**: When adding an activity, you can align it based on the **Start date** or **End date**.

## Moving Activities

- **Single Tag**: Drag and drop with a mouse or one finger on touch.
- **Full Activity**: Hold **Shift + Drag** (or use two fingers) to move the entire sequence.
- **Partial Move**: Shift + Click a tag to move it and all subsequent tags in that activity.

## Activity Statuses

- **None**: Default status.
- **Done (Diagonal Line)**: Marked by the activity owner when work is finished.
- **Closed (X)**: Confirmed by a supervisor or GC.
- **Not Done (Tilted Tag)**: Triggers a "Reason for Variance" selection.

## Constraint Log

- **Function**: Tracks blockers (inspections, materials, approvals).
- **Visual Cue**: A **yellow dot** appears on any tag (and its dependents) affected by an open constraint.
- **Resolution**: Marking a constraint as "Resolved" removes the yellow dot alerts.

## Dependencies

- **Automatic**: Tags within the same multiday activity are inherently linked.
- **Manual**: Click a tag to see a green icon; drag it to another task to create a dependency.
- **Alerts**: If a prerequisite task is delayed past its dependent task, the dependency line turns **red**.

## Bulk Actions

- **Shift Tags**: Right-click a cell and select "Shift tags" to delay all upcoming activities in a lane (or all lanes) by 1–20 days. Nialli respects workdays and preserves all existing dependencies during the move.
