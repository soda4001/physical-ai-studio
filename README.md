# 🤖 Physical AI Studio

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License MIT">
  <img src="https://img.shields.io/badge/Python-3.10%2B-brightgreen.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Framework-FastAPI%20%7C%20Three.js-00f2fe.svg" alt="Frameworks">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-7f00ff.svg" alt="Platforms">
</p>

> **An Easy, No-Code/Low-Code Physical AI & Robotics Development Environment for Beginners**
> 
> *Develop, simulate, and deploy Physical AI robots with 3D Web Viewport, Visual Policy Cards, and Natural Language AI Copilot.*

---

## 🌟 Key Features

- **🎨 3D Kinematic Physics Viewport (Three.js)**
  - Interactive 3D simulation sandbox for mobile manipulators, humanoid bipedal robots, and precision devices.
  - Multi-joint kinematics, object spawner (cans, bottles, soccer balls, recycle bins), and dynamic camera controls.
- **🧠 Visual AI Policy Cards**
  - Trigger complex AI policies (`Autonav & Pick`, `Alpha Walk`, `Ball Kick`, `Safe Stand`) with a single click.
- **🪄 Natural Language Physical AI Copilot**
  - Tell the robot what to do in natural language (*"Pick up the red can and dump it in the recycle bin"*).
- **🎮 Real-Time Teleoperation Panel**
  - Control base movement and gripper fingers using keyboard shortcuts (`WASD`, `Arrow Keys`) or virtual D-pad.
- **💻 Real Robot Code Export**
  - Export verified 3D simulation workflows to executable Python control scripts (`uv run control.py`), ROS2 nodes, or Arduino sketches.

---

## 🚀 Quick Start

### 1. Windows (One-Click Launcher)
Double-click `run_studio.bat` or run in PowerShell:
```powershell
.\run_studio.ps1
```

### 2. Linux / macOS
Run the shell launcher:
```bash
chmod +x run_studio.sh
./run_studio.sh
```

### 3. Manual Launch with `uv`
```bash
# Install dependencies & run backend server
uv sync
uv run python server.py
```
Open **`http://127.0.0.1:8000`** in your browser!

---

## 📂 Project Structure

```
physical-ai-studio/
├── server.py              # FastAPI backend server with WebSockets & Copilot API
├── pyproject.toml         # Python project configuration (uv compatible)
├── requirements.txt       # Python dependencies
├── run_studio.bat         # Windows launcher script
├── run_studio.ps1         # PowerShell launcher script
├── run_studio.sh          # Linux/macOS launcher script
├── LICENSE                # MIT License
├── README.md              # Project documentation
└── public/                # Web IDE Frontend
    ├── index.html         # Studio IDE layout
    ├── css/style.css      # Dark Glassmorphism CSS design system
    └── js/
        ├── app.js         # Main IDE application controller
        ├── viewport.js    # Three.js 3D physics viewport engine
        ├── policy_cards.js# Visual policy cards component
        └── copilot.js     # Natural language AI copilot handler
```

---

## 🗺️ Roadmap

- [x] Three.js 3D Physics Viewport & Kinematic Arm Engine
- [x] Visual Policy Cards & Natural Language Copilot Handler
- [x] 1-Click Real Robot Python Code Exporter
- [ ] PyWebView Desktop App Wrapper (`.exe` / `.AppImage` standalone build)
- [ ] URDF / MJCF Custom Robot Drag-and-Drop Loader
- [ ] MuJoCo C++ Physics Engine Real-Time WebSocket Telemetry Bridge

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
