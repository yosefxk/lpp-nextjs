# LPP Next.js 🚗

An advanced, high-performance Israeli License Plate intelligence dashboard.

This project was successfully migrated from a legacy Python Streamlit application into a modern, full-stack web architecture utilizing **Next.js**, **React**, **Tailwind CSS**, and **FastAPI**. It provides a sleek, dark-mode "glassmorphism" aesthetic with animated interactions.

## 🏗️ Architecture Stack

### Frontend (`/frontend`)
*   **Framework**: Next.js 16.2.1 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + CSS Modules
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **Typography**: Google Fonts (Rubik, optimized for RTL/Hebrew data)

### Backend (`/backend`)
*   **Framework**: FastAPI (Python)
*   **Server**: Uvicorn
*   **Concurrency**: Built-in ThreadPoolExecutor for extremely fast multithreaded fetching across 17+ government endpoints simultaneously.
*   **Functionality**: Replaces Streamlit caching with native API request routing while maintaining the exact same data parsing logic.

---

## 🚀 Quick Start Guide

You will need two separate terminal windows to run both the frontend and the backend locally.

### 1. Start the FastAPI Backend
Ensure you have Python installed.

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the development server (Hot-reload enabled)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*The backend will be available at `http://localhost:8000`. You can view the Auto-generated Swagger docs at `http://localhost:8000/docs`.*

### 2. Start the Next.js Frontend
Ensure you have Node.js (LTS version) installed.

```bash
cd frontend

# Install dependencies (First time only)
npm install

# Start the development server
npm run dev
```
*The React UI will be available at `http://localhost:3000`.*

---

## 🐳 Docker Setup
You can run both the frontend and backend simultaneously using Docker Compose. Make sure Docker Desktop is installed and running.

```bash
# Build and start the entire stack
docker-compose up --build -d
```
The React UI will automatically be available at `http://localhost:3000`, and the backend at `http://localhost:8000`.

For local frontend development, set `INTERNAL_BACKEND_URL=http://localhost:8000` so the Next.js proxy can reach the FastAPI server.

To stop the containers:
```bash
docker-compose down
```

---

## 🌟 Key Features
*   **Deep Integration**: Pulls live data from the Ministry of Transport regarding private vehicles, historical ownership, official recalls, structural modifications, and handicapped statuses.
*   **Red Flag System**: Automatically detects and highlights critical warnings (e.g. inactive status, outstanding mandatory recalls).
*   **Shareable URLs**: The UI automatically parses `?lp=` parameters, meaning you can link directly to a specific vehicle's profile (e.g. `http://localhost:3000/?lp=1234567`).
*   **Responsive RTL UI**: Expertly tailored for Hebrew audiences with fluid CSS grid layouts that adapt to both desktop and mobile devices.
