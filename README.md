# Transform™ Visual Planner

A premium, high-density construction scheduling and lean planning dashboard. This platform is designed for real-time orchestration of site resources, task sequencing, and constraint management in a professional construction environment.

---

## 🏗️ What is Transform™ Visual Planner?

Transform™ Visual Planner provides a centralized "Command Center" for site managers and project directors. It bridges the gap between high-level schedules and day-to-day site operations through:

*   **Prescriptive Resource Allocation**: Shift from descriptive scheduling to automated planning. The system calculates "Earliest Safe Start" dates based on real-time resource availability.
*   **Pipeline Dashboard**: Review and commit upcoming project briefs from the `imports/upcoming/` folder with one-click integration.
*   **Resource Pool Management**: Define global trade capacities (in-house vs subcontractor) to ensure site-wide staffing feasibility.
*   **Dual-View Dashboard**: Toggle between a **Drag-and-Drop Kanban Board** (for resource allocation) and a **28-Day Gantt Timeline** (for sequence visualization).
*   **Constraint Tracking**: Identify and resolve site roadblocks (RFIs, material delays, safety issues) before they impact the critical path.

---

## 🚀 Getting Started

### 1. Installation
Install the necessary dependencies:
```bash
npm install
```

### 2. Database Initialization
The app uses a local SQLite database (`transform.db`). The schema will be automatically initialized on first run.
*Note: The database is ignored by Git to prevent data leaks. See `.gitignore`.*

### 3. Running the App
Start the development server on the configured port (**3004**):
```bash
npm run dev
```
Alternatively, use the provided batch script on Windows:
```bash
start_app.bat
```

Open [http://localhost:3004](http://localhost:3004) to access the dashboard.

---

## 📖 How to Use the App

### 📅 Upcoming Project Pipeline
Click the **LayoutList (Purple)** icon in the header to open the **Pipeline Dashboard**.
1. Place `.xlsx` project briefs into `imports/upcoming/`.
2. Click **Scan Folder** to analyze requirements and sequence dependencies.
3. Review the calculated **Start Dates** and **Bottleneck Warnings**.
4. Click **Commit to Live** to migrate the project into the active schedule.

### 👥 Resource Pool & Staffing
Click the **Users** icon in the header to manage staffing.
- **Staff Panel**: See real-time assignments and leave.
- **Manage Pool**: Click "Manage Pool" to set the total capacity for specific trades (Labourers, Carpenters, etc.). This data drives the Allocation Engine's feasibility checks.

### 🔄 Switching Views
Use the **Board / Gantt** toggle in the top-left header to switch between project management styles.
- **Board Mode**: Drag tasks between different **Front Lanes** (Building zones, levels, or specific work areas).
- **Gantt Mode**: Scroll through the 4-week lookahead to see task durations and overlaps.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (better-sqlite3)
- **State**: Zustand (with Persistence)
- **Allocation Engine**: Custom FIFO constraint solver
- **Styling**: Tailwind CSS & Vanilla CSS Variables
- **Animations**: Framer Motion
- **Charts**: Chart.js

**© 2026 Transform™ Visual Planner | Lean Construction Orchestration**
