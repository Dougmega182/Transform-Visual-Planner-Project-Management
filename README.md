# Transform™ Visual Planner

A premium, high-density construction scheduling and lean planning dashboard. This platform is designed for real-time orchestration of site resources, task sequencing, and constraint management in a professional construction environment.

---

## 🏗️ What is Transform™ Visual Planner?

Transform™ Visual Planner provides a centralized "Command Center" for site managers and project directors. It bridges the gap between high-level schedules and day-to-day site operations through:

*   **Dual-View Dashboard**: Toggle between a **Drag-and-Drop Kanban Board** (for resource allocation) and a **28-Day Gantt Timeline** (for sequence visualization).
*   **Resource Management**: Track site staff utilization, roles, and leave schedules in real-time.
*   **Constraint Tracking**: Identify and resolve site roadblocks (RFIs, material delays, safety issues) before they impact the critical path.
*   **Theme Awareness**: Fully optimized for both **Light and Dark modes**, ensuring visibility in both site offices and fieldwork environments.

---

## 🚀 Getting Started

### 1. Installation
Install the necessary dependencies:
```bash
npm install
```

### 2. Database Initialization
The app uses a local SQLite database (`transform.db`). You can initialize it with mock data (optional) or leave it empty for production use.
*Note: Seeding logic is currently disabled for production readiness. To re-enable, see `src/lib/db/seed.ts`.*

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

### 🔄 Switching Views
Use the **Board / Gantt** toggle in the top-left header to switch between project management styles.
*   **Board Mode**: Drag tasks between different **Front Lanes** (Building zones, levels, or specific work areas).
*   **Gantt Mode**: Scroll through the 4-week lookahead to see task durations and overlaps.

### 🌓 Theme Selection
Click the **Sun/Moon icon** in the header to toggle between Light and Dark modes. The app will remember your preference.

### 👷 Managing Resources
Click the **Users** icon in the header to open the **Resource Management** panel. Here you can see who is assigned to which tasks and their current utilization percentage.

### 🛑 Managing Constraints
Click the **Shield/Alert** icon to open the **Constraints** panel. This lists all site issues. Critical risks are highlighted in red to ensure immediate attention.

### 📝 Task Details
Click on any **Task Card** to open the deep-dive modal. From here, you can:
*   Update **Percent Complete**.
*   View and add **Comments**.
*   Check **Dependencies** and **Linked Resources**.
*   Edit task metadata (Start/End dates, Assignee, Priority).

### 📥 Importing Data
The system includes an automated import pipeline. Place your `.xlsx` or `.xlsm` schedule files into the `imports/` folder and use the `/api/import` endpoint to synchronize the database with your master schedules.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (better-sqlite3)
- **State**: Zustand (with Persistence)
- **Styling**: Tailwind CSS & Vanilla CSS Variables
- **Animations**: Framer Motion
- **Charts**: Chart.js

**© 2026 Transform™ Visual Planner | Lean Construction Orchestration**
