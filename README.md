# Transform™ Visual Planner

A high-density, professional-grade construction scheduling and lean planning dashboard. Designed for real-time orchestration of site resources, task sequencing, and constraint management.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
Initialize the SQLite database with the industrial dataset (Staff, Tasks, Constraints):
```bash
npx tsx src/lib/db/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the planner.

---

## 🏗️ Core Architecture

### 1. Technology Stack
- **Framework**: Next.js 16 (App Router)
- **State Management**: Zustand (Synchronized with local storage and API)
- **Drag & Drop**: @dnd-kit (Optimized for high-density grids)
- **Database**: SQLite (via better-sqlite3)
- **Styling**: Tailwind CSS (Dark-mode professional aesthetic)
- **Icons**: Lucide React

### 2. Data Model
- **Tasks**: Rich metadata including Zones, Trades, Crew Pax, and Schedule Variance.
- **Fronts**: Logical project boundaries (Lanes) for resource grouping.
- **Staff**: Site resource tracking with utilization and leave management.
- **Constraints**: Risk management system for RFIs, material delays, and site issues.

---

## 🛠️ Key Components

### 📅 **28-Day Gantt Timeline**
Scrollable timeline view with RAG (Red/Amber/Green) status tracking, progress overlays, and "Today" focal points.

### 📋 **Drag & Drop Board**
Orchestrate tasks between Project Fronts. Real-time API persistence ensures site movements are captured instantly.

### 🛑 **Constraint & Issue Management**
Side panel for tracking project risks. Filter by severity (Critical/High) and status (Open/Resolved) to maintain site reliability.

### 👷 **Staff & Resource Panel**
Derive real-time utilization stats. Track which engineers are assigned to which Fronts and manage team leave records.

### 🔍 **Task Detail Deep-Dive**
Comprehensive modal for managing:
- **Dependencies**: FS/SS connection mapping.
- **Progress**: Interactive percentage sliders.
- **Comments**: Site-wide audit log and collaboration thread.
- **Variance**: Automated "Ahead/Behind" calculation relative to the current date.

---

## 🧹 Maintenance & Cleanup
Legacy components have been removed to ensure zero-risk production builds. The system is fully type-safe and verified against the latest `better-sqlite3` schema.

**© 2026 Transform™ Visual Planner | Lean Construction Orchestration**
