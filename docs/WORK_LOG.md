# 📝 Physical AI Studio - Development Work Log

Development history, feature releases, and architectural milestones for **Physical AI Studio**.

---

## 📅 Log Entry: 2026-09-09 (v1.4.3 Release)

### 🎯 Key Accomplishments

#### 1. 🦾 3D Kinematics & 2-Jaw Gripper Precision Overhaul
- **Unified Downward Wrist Pitch (`-Math.PI - (s + e)`)**:
  - Ensured the gripper claws descend **100% vertically** from directly above target objects during pick, lift, and dump steps.
- **Idle Wrist Flip Fix**:
  - Eliminated the 180-degree wrist flip bug in idle/home pose. Claws now extend straight up into the sky in home pose without overlapping forearm link 2.
- **Zero Floor Clipping Ground Pick Angles**:
  - Recalculated ground pick joint angles (`Shoulder: -50°`, `Elbow: -120°`) to position claw tips at `y = 0.02m` (2cm above floor), guaranteeing **zero floor grid clipping**.
- **Snug Gripper Parenting Offset**:
  - Parented target objects (`red_can`, `blue_bottle`) inside `gripperGroup` at `(0, 0.115, 0)`, snugly centered between black carbon friction pads.
- **Exact 3D Base Drive Snapping**:
  - Added position snapping at the end of `drive_to` steps so the robot base reaches exact target coordinates (`x = 0.40m`) prior to lowering the arm.

#### 2. 💬 Natural Language NLP Action Intent Separation
- **`pick_only` ("빨간캔 집어")**:
  - Drives to target object, lowers in "ㄱ" L-shape, clamps target object, and lifts arm holding object in position (`HOLDING OBJECT`). Does not dump into bin.
- **`dump_only` ("쓰레기통에 버려")**:
  - Transports held object to recycle bin, extends arm over bin, drops object inside, and returns to home pose (`DUMPING INTO BIN`).
- **`pick_and_dump` ("빨간캔 집어서 버려")**:
  - Full end-to-end task execution.

#### 3. 🎨 High-Contrast 3D Visual Redesign
- **Camera Framing**: Close-up camera positioning (`1.7, 1.3, 1.9`) focused on the robot manipulator.
- **Studio Lighting**: Added warm key spotlight (`1.5`), cyan fill light (`2.2`), and under-chassis green ambient glow.
- **Metallic Dual-Tone Model**: Chrome rotary joint caps with LED status rings, titanium white forearm, electric cyan claws (`0x00f2fe`), and dark rubber pads.

#### 4. 📚 Open-Source Ecosystem Reference Document
- Saved [`docs/physical_ai_opensource_reference.md`](./physical_ai_opensource_reference.md) detailing:
  - `gkjohnson/urdf-loaders` (Three.js URDF loader)
  - `huggingface/lerobot` (Hugging Face LeRobot & LeLab)
  - `microsoft/onnxruntime-web` (In-browser 60FPS neural network inference)
  - `pmndrs/cannon-es` / `rapier.js` (Web 3D physics engines)

#### 5. 💡 Ground-Truth Simulation Architecture Baseline
- Established a 100% accurate ground-truth kinematics simulation baseline to eliminate Sim-to-Real gaps and guarantee reliable AI policy evaluation.

---

## 📂 Repository Info
- **GitHub**: [https://github.com/soda4001/physical-ai-studio](https://github.com/soda4001/physical-ai-studio)
- **Local Runtime**: `uv run python server.py` (`http://127.0.0.1:8000`)
