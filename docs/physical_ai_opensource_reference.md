# 🚀 Physical AI Studio - Open Source Reference & Integration List

Curated open-source libraries, frameworks, and tools to reference and integrate into **Physical AI Studio**.

---

## 1. 🤖 3D Robot Kinematics & URDF Loaders

| Library | GitHub Repository | Description & Usage |
| :--- | :--- | :--- |
| **`urdf-loader`** | [`gkjohnson/urdf-loaders`](https://github.com/gkjohnson/urdf-loaders) | **Industry standard Three.js URDF Loader**. Parses ROS `.urdf`, `.stl`, and `.dae` files to dynamically render custom robot models in browser viewports. |
| **`xacro-parser`** | [`gkjohnson/xacro-parser`](https://github.com/gkjohnson/xacro-parser) | Parses ROS `.xacro` macro files into standard URDF XML prior to rendering in Three.js. |
| **`robot_viewer`** | [`fan-ziqi/robot_viewer`](https://github.com/fan-ziqi/robot_viewer) | Web-based robot visualizer supporting URDF, MJCF, and USD formats with interactive joint sliders. |

---

## 2. 🤗 Physical AI & Robot Learning Frameworks

| Project | GitHub Repository | Description & Usage |
| :--- | :--- | :--- |
| **Hugging Face `LeRobot`** | [`huggingface/lerobot`](https://github.com/huggingface/lerobot) | Unified Python framework for Physical AI. Includes `LeRobotDataset` format, Diffusion Policy / ACT / $\pi_0$ models, and hardware control APIs. |
| **`Diffusion Policy`** | [`real-stanford/diffusion_policy`](https://github.com/real-stanford/diffusion_policy) | State-of-the-art imitation learning algorithms for robot manipulation tasks. |
| **`ManiSkill`** | [`haosulab/ManiSkill`](https://github.com/haosulab/ManiSkill) | GPU-parallelized robotics simulation benchmark for generalizable Physical AI policy training. |

---

## 3. ⚡ In-Browser AI Neural Network Inference

| Library | Package / Link | Description & Usage |
| :--- | :--- | :--- |
| **`onnxruntime-web`** | [`microsoft/onnxruntime-web`](https://github.com/microsoft/onnxruntime) | Runs ONNX neural network models (`.onnx`) directly in JavaScript at **60 FPS** using WebGL/WebGPU. |
| **`TensorFlow.js`** | [`tensorflow/tfjs`](https://github.com/tensorflow/tfjs) | Runs pre-trained deep learning policies directly in the browser runtime. |

---

## 4. ⚙️ Web 3D Physics Engines

| Engine | GitHub Repository | Description & Usage |
| :--- | :--- | :--- |
| **`cannon-es`** | [`pmndrs/cannon-es`](https://github.com/pmndrs/cannon-es) | Lightweight JavaScript 3D physics engine for rigid body collision, friction, and joint dynamics. |
| **`rapier.js`** | [`dimforge/rapier.js`](https://github.com/dimforge/rapier.js) | High-performance WebAssembly 3D physics engine written in Rust for fast collision detection. |

---

## 🛠️ Recommended Integration Roadmap for Physical AI Studio

1. **Custom URDF Model Upload (`urdf-loader`)**:
   - Allow users to drag & drop custom `.urdf` files to swap the robot model in `viewport.js`.
2. **Hugging Face `LeRobot` Code Export (`lerobot`)**:
   - In `server.py`, add `format="lerobot"` to generate Hugging Face compatible Python scripts.
3. **In-Browser Policy Execution (`onnxruntime-web`)**:
   - Load pre-trained ONNX models (`public/policies/`) to drive 3D joints dynamically via neural network inference.

---
*Created and saved in `docs/physical_ai_opensource_reference.md` for Physical AI Studio project.*
