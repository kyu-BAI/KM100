# PETC Inventory & Document Viewing System

A full-stack web inventory and document management platform built according to the provided system architecture diagrams, featuring a **React Native (Web)** frontend and a **Node.js Express** REST backend.

---

## 📋 System Architecture & Diagram Mapping

This project organizes and catalogs all entities, periods, and categories directly transcribed from your handwritten notes:

| Section from Notes | Diagram Hierarchy | Subcategories / Branches | Coverage & Period |
| :--- | :--- | :--- | :--- |
| **PETC SALES** | `PETC SALES` | `2026` & `2027` → `JAN` to `DEC` | Monthly emission test sales records & test volumes |
| **PETC INCOME** | `PETC INCOME` | `2026` & `2027` → `JAN` to `DEC` | Audited gross vs operating costs vs net profit sheets |
| **EXPENSES** | `Expenses` | • `Expenses 2026 (PETC)`<br>• `Expenses 2027 (PETC)`<br>• `Red Goose Expenses 2026`<br>• `Red Goose Expenses 2027`<br>• `Knoah Mari Expenses 2026`<br>• `Knoah Mari Expenses 2027` | Audited disbursements: Utilities, Calibration, Lease, Payroll, Permits |
| **CONSUMABLES** | `Consumables` | • `Office supply`<br>• `Cleaning supply`<br>• `Red Goose`<br>• `Knoah Mari` | Real-time stock levels, SKU codes, reorder thresholds, low stock alerts |
| **VOUCHERS** | `Vouchers` | • `PETC`<br>• `STC`<br>• `Knoah Mari`<br>• `Red Goose` | Payment vouchers, check numbers, payees, audit signatures |
| **PETC INSURANCE** | `PETC Insurance` | `2026` & `2027` → `JAN` to `DEC` | CTPL motor vehicle insurance policies & remittances |
| **GENERATE** | `Generate` (Top Right) | Automated Report Generator Modal | Produces instant consolidated reports and catalogs them into inventory |

---

## 📁 Folder Structure

The project code is cleanly divided into the dedicated folders you created:

```
KM100 OJT/
├── BACKEND/                     # Node.js & Express REST API Server
│   ├── data/
│   │   └── inventory.json       # Pre-seeded database (148+ comprehensive records)
│   ├── uploads/                 # Upload directory for attachments
│   ├── server.js                # Express API with CRUD, Generate & Stats endpoints
│   └── package.json
│
├── FRONTEND/                    # React Native for Web Application
│   ├── src/
│   │   ├── App.jsx              # React Native UI (Tree, Viewer, KPI cards, Modals)
│   │   └── main.jsx             # React entry point
│   ├── index.html
│   ├── vite.config.js           # React Native Web aliases & fast bundler
│   └── package.json
│
├── start.bat                    # One-click startup script for both servers
└── README.md                    # System documentation
```

---

## 🚀 How to Run the System

### Option 1: One-Click Launch (Windows)
Double click `start.bat` in the project root. It will launch both the backend server and frontend development server and open your browser automatically.

### Option 2: Running via Terminal

#### 1. Start the Backend API
```powershell
cd BACKEND
npm start
# Server runs on http://localhost:5000
```

#### 2. Start the Frontend
```powershell
cd FRONTEND
npm run dev
# Frontend runs on http://localhost:3000
```

Open `http://localhost:3000` in your web browser.

---

## ✨ Key Features

1. **Faithful Hierarchical Sidebar Tree**:
   - Interactive accordion sidebar mapping each branch from your handwritten notes.
   - Quick month filter pills (`JAN` through `DEC`) under 2026 and 2027.

2. **Rich Document & File Viewer Modal**:
   - Click any record or card to inspect its metadata, file size, status, and embedded ledger preview table.
   - Print-friendly layout and file export capability.

3. **Report Generator ("Generate" Functionality)**:
   - Dedicated modal triggered by the "Generate Report" button (matching the handwritten "Generate" note).
   - Filter by Target Category, Entity (`PETC`, `Red Goose`, `Knoah Mari`, `STC`), Year (`2026`, `2027`), and Month.
   - Generates summary statistics and automatically files the certified audit report into inventory.

4. **Multi-Entity Filtering & Real-time Search**:
   - Filter instantly by `PETC`, `Red Goose`, `Knoah Mari`, or `STC`.
   - Real-time search across file names, notes, amounts, and dates.
   - Switch between **Grid Cards** and **Table List** view modes.

5. **Consumables Stock Alerts**:
   - Monitors safety thresholds for office, cleaning, and testing supplies with automatic "Low Stock" indicators.
