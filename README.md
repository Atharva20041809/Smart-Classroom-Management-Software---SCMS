# Smart Classroom Management Software (SCMS)

A complete, lightweight, and offline-first desktop application built with **Electron**, **React**, **JavaScript**, and **basic CSS**. Designed specifically for teachers and educators to streamline classroom attendance tracking, visualize attendance analytics, and assist students with an AI-powered tutor using the official Groq API.

---

## 📦 Generated macOS DMG Installer

A production-ready macOS `.dmg` installer has been compiled using `electron-builder`:

- **DMG File Path:** `dist/Smart Classroom Management Software-1.0.0-arm64.dmg`
- **Architecture:** Apple Silicon (macOS arm64 / M1 / M2 / M3 / M4)
- **App Bundle:** `dist/mac-arm64/Smart Classroom Management Software.app`

> **Note on macOS Security / Gatekeeper:**  
> Because the application is not notarized with an Apple Developer Program certificate, macOS Gatekeeper may display a security prompt on first launch. If prompted:
> 1. Right-click (or Control-click) the application in `/Applications` or inside the DMG.
> 2. Select **Open** from the context menu.
> 3. Click **Open** in the confirmation dialog. (Alternatively, go to **System Settings > Privacy & Security** and click **Open Anyway**).

---

## 🚀 Key Modules & Features

### 1. Attendance Management
- **Pre-populated Student Roster:** 12 sample students with realistic names, IDs (`STU-1001` through `STU-1012`), and classes (`Grade 10-A` and `Grade 10-B`).
- **Interactive Marking:** Mark individual students as **Present** or **Absent** with toggle buttons.
- **Date Selector:** Pick any date to record or view attendance. Switching dates automatically retrieves saved records for that day.
- **Search & Filter:** Search instantly by student name, ID, or class.
- **Quick Actions:** One-click **Mark All Present**, **Mark All Absent**, and **Reset Selection** (with confirmation).
- **Persistent Storage:** Saves records reliably into browser `localStorage`. No SQL database or backend server required.
- **History Viewer:** Inspect, load, or delete saved attendance dates from previous class sessions.

### 2. Analytics Dashboard
- **Real-Data Calculations:** All metrics are calculated strictly from actual saved attendance records in `localStorage`.
- **Summary Metrics:** Total enrolled students, students present today, students absent today, and current attendance percentage.
- **Trend Bar Chart:** Built with `recharts`, visualizes Present and Absent student counts across recent recorded dates.
- **Distribution Donut Chart:** Shows the cumulative Present vs. Absent ratio across all recorded sessions.
- **Helpful Empty State:** Clean, user-friendly empty state shown when no records are stored yet (no fake/invented numbers).

### 3. AI Learning Assistant (Groq Powered)
- **Official Groq SDK:** Configured with the verified, production-ready model `openai/gpt-oss-20b` (centralized in `electron/groqService.js`).
- **Strict Electron Security:**
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - Groq API key is accessed **only in the trusted Electron main process** and is **never exposed** to the renderer or browser DevTools.
  - Safe IPC bridge exposed via `electron/preload.js`.
- **System Instructions:** Tailored to explain academic concepts simply, provide real-world examples, identify learning gaps, and recommend revision topics.
- **Chat Interface:** Multiline input (Enter sends, Shift+Enter for new line), loading indicators, suggested quick prompts, conversation history, and chat clearing.
- **Robust Error Handling:** Displays user-friendly error banners if the API key is missing, invalid, or if rate limits/network issues occur.

---

## 🛠️ Technology Stack

- **Desktop Framework:** Electron 33 (macOS arm64)
- **UI Library:** React 18 (pure JavaScript JSX)
- **Build Tool:** Vite 6
- **Styling:** Basic Vanilla CSS (light theme, system fonts, muted blue accent)
- **Charts:** Recharts
- **AI Backend:** Groq SDK (`groq-sdk`) & `dotenv`
- **Packaging:** electron-builder (DMG target)

---

## 📋 Installation & Running Instructions

### Prerequisites
- Node.js (v18 or higher recommended, tested on Node v26)
- npm (v9 or higher)
- macOS (for building the DMG installer)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure the Groq API Key
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and replace the placeholder with your Groq API key (obtained from [Groq Console](https://console.groq.com/keys)):
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   ```
*(Note: You can also configure or update your key inside the app UI under the AI Assistant module's **API Settings** button during runtime without restarting).*

### 3. Run in Development Mode
Launches Vite development server and the Electron desktop application concurrently:
```bash
npm run dev
```

### 4. Build the React Frontend
Compiles the React application into the `build/` directory:
```bash
npm run build
```

### 5. Run Automated Verification Tests
Executes headless end-to-end tests verifying Electron startup, preload bridge, attendance storage, and AI error handling:
```bash
npm run test:verify
```

### 6. Build the macOS DMG Installer
Generates the `.dmg` installer in the `dist/` folder:
```bash
npm run dist:mac
```

The resulting file will be located at:
```
dist/Smart Classroom Management Software-1.0.0-arm64.dmg
```

---

## 📁 Project Structure

```text
adproject/
├── .env.example              # Template for environment variables (GROQ_API_KEY)
├── .gitignore                # Git ignore rules (protects .env, node_modules, dist)
├── index.html                # Application HTML template with CSP
├── package.json              # Project dependencies, scripts, and electron-builder config
├── vite.config.js            # Vite configuration for building into build/
├── dist/                     # Generated packaged macOS DMG and app bundle
│   └── Smart Classroom Management Software-1.0.0-arm64.dmg
├── electron/
│   ├── main.js               # Electron main process (creates window, loads .env, registers IPC)
│   ├── preload.js            # Secure contextBridge exposing window.electronAPI
│   ├── groqService.js        # Groq SDK integration and AI model configuration
│   ├── verify.js             # Basic headless validation script
│   └── verifyFull.js         # End-to-end headless verification test suite
└── src/
    ├── index.jsx             # React DOM entry point
    ├── index.css             # Dedicated clean, professional stylesheet
    ├── App.jsx               # Main layout container and active tab management
    ├── data/
    │   └── sampleStudents.js # Sample roster of 12 students (IDs, names, classes)
    ├── utils/
    │   └── storage.js        # Safe localStorage persistence for attendance
    └── components/
        ├── Sidebar.jsx       # Navigation sidebar for the 3 modules
        ├── Attendance.jsx    # Module 1: Attendance marking, search, date picker, history
        ├── Analytics.jsx     # Module 2: Visual charts and metrics using real records
        └── AiAssistant.jsx   # Module 3: Groq AI chatbot with error handling
```

---

## 🔒 Security Summary

- **No Remote Code Execution:** Node integration is disabled (`nodeIntegration: false`) in all renderer windows.
- **Context Isolation:** `contextIsolation: true` ensures renderer scripts cannot access Node.js or Electron internals.
- **API Key Protection:** The Groq API key is stored and called solely in the Node.js main process. The key is never returned or made visible to the renderer or browser console.
- **Data Privacy:** All attendance records remain local to the user's machine in `localStorage`.
