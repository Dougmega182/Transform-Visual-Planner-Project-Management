# Nialli™ Visual Planner: Plan Setup Research

## Project Structure & Work Breakdown

- **Organization**: Projects are broken down into **Plans** (areas, phases, or zones).
- **Lanes**: Each plan contains horizontal rows (Lanes) to organize work by trade, discipline, or team.
- **Activities & Tags**: An **Activity** represents a continuous stretch of work. Each activity is a sequence of **Tags**, which represent a single day's work.
- **Recommendation**: Limit plans to a maximum of 25 lanes for optimal performance.

## Creating a New Plan

1. Go to <https://software.nialli.com/> and sign in.
2. Click **Add plan** at the bottom of the dashboard (requires Admin permissions).
3. Fill in mandatory fields: **Subscription**, **Plan name**, **Week starts on**, and **Working days**.
4. **Sample Data**: You can toggle "Sample Plan" to populate the plan with example activities, trades, and milestones.

## User Management

- **Permission Levels**:
  - **View only**: Cannot edit.
  - **Edit my trade**: Can only edit tasks for assigned trade(s).
  - **Edit all**: Full editing of tasks/trades (no admin settings).
  - **Plan admin**: Full administrative access (invite users, create plans, manage settings).
- **Trades**: Users must be linked to one or more trades to assign work.

## Trade Settings

- **Attributes**: Each trade has a name, contact person, email, and a unique **background color** for easy visual identification on the board.
- **Importing**: Trades can be imported via Excel/CSV or synced from the Nialli Administration Portal.

## Lane Management

- **Actions**: Right-click a lane title to **Add**, **Edit**, **Move**, **Copy**, or **Delete** lanes.
- **Copy Lane**: Useful for replicating similar sequences (e.g., identical floor layouts). Note that tag statuses and dependencies are not copied.

## Reasons for Variance

- **Purpose**: Tracks why planned work was not completed (e.g., missing materials, weather, labor).
- **Customization**: Plan admins can add custom reasons with specific colors for reporting.

## Holidays & Milestones

- **Holidays**: Designated as "Site closed" (dark red) or "Site open" (light red). Multiday activities automatically skip these days.
- **Master Milestones**: High-level deadlines imported from scheduling software (P6, MS Project). They appear in a dedicated, fixed lane.
- **Plan Milestones**: Key checkpoints added manually to specific lanes. Can include **Conditions of Satisfaction** to define completion criteria.
