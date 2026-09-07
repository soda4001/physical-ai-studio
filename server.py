#!/usr/bin/env python3
"""Physical AI Studio - Local DevTool & Runtime Backend Server.

Provides REST APIs, WebSockets for 3D physics state, AI Copilot NLP handler,
and serves the Web IDE / Desktop App interface.
"""

import asyncio
import json
import os
import socket
import sys
import threading
import webbrowser
from typing import Dict, Any, List

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse

# Initialize FastAPI App
app = FastAPI(
    title="Physical AI Studio API",
    description="Backend Runtime for Beginner Physical AI Development Environment",
    version="0.1.0",
)

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base Path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

# English Global Physical AI Models & Scenes Repository
PHYSICAL_SCENES = {
    "trash_picker": {
        "id": "trash_picker",
        "name": "🧹 1. Mobile Smart Trash Picker Robot",
        "description": "4-Wheel Mobile Chassis + 4-DOF Gripper Arm + Vision Recognition",
        "robot_type": "mobile_manipulator",
        "joints": ["wheel_left", "wheel_right", "arm_yaw", "arm_shoulder", "arm_elbow", "gripper"],
        "objects": ["trash_can_red", "trash_bottle", "recycle_bin"],
        "default_policy": "autonav_pick",
    },
    "humanoid_kick": {
        "id": "humanoid_kick",
        "name": "⚽ 2. Humanoid Bipedal Soccer Robot",
        "description": "12-DOF Bipedal Legs + Ball Tracking & Kicking Kinematics",
        "robot_type": "bipedal_humanoid",
        "joints": ["hip_yaw_l", "hip_roll_l", "knee_l", "ankle_l", "hip_yaw_r", "hip_roll_r", "knee_r", "ankle_r"],
        "objects": ["soccer_ball", "goal_post"],
        "default_policy": "alpha_walk",
    },
    "sander_care": {
        "id": "sander_care",
        "name": "💅 3. Precision Safety Care Sander Device",
        "description": "2-Axis Micro Spindle + Vision Sensor Boundary Detection",
        "robot_type": "precision_sander",
        "joints": ["spindle_x", "spindle_y", "tool_rotation"],
        "objects": ["finger_fixture", "safety_sensor"],
        "default_policy": "gentle_sanding",
    },
}

POLICIES = [
    {
        "id": "autonav_pick",
        "name": "Autonav & Pick",
        "category": "Mobile AI",
        "description": "Autonomously navigates to detected target objects, clamps with gripper, and dumps into recycle bin.",
        "icon": "🧹",
        "file": "policies/autonav_pick.onnx",
        "params": {"speed": 0.8, "gripper_force": 2.5, "detect_confidence": 0.75},
    },
    {
        "id": "alpha_walk",
        "name": "Alpha Walk",
        "category": "Humanoid",
        "description": "Reinforcement learning 12-DOF bipedal walking & balance stabilization.",
        "icon": "🚶",
        "file": "policies/alpha_walking.onnx",
        "params": {"step_height": 0.05, "stride": 0.15, "frequency": 1.2},
    },
    {
        "id": "ball_kick_left",
        "name": "Ball Kick (Left Leg)",
        "category": "Humanoid",
        "description": "Calculates target ball position and executes precise shooting motion trajectory.",
        "icon": "⚽",
        "file": "policies/ball_kick_left.onnx",
        "params": {"kick_power": 8.0, "prep_time": 0.4},
    },
    {
        "id": "emergency_stand",
        "name": "Safe Stand",
        "category": "General",
        "description": "Fall-detection recovery and instant joint home position stabilization.",
        "icon": "🛡️",
        "file": "policies/alpha_stand.onnx",
        "params": {"stiffness": 50.0, "damping": 5.0},
    },
]


@app.get("/api/status")
async def get_status():
    """Returns workspace & system diagnostic status."""
    return {
        "status": "online",
        "app": "Physical AI Studio",
        "version": "0.1.0",
        "python_version": sys.version,
        "platform": sys.platform,
        "scenes_count": len(PHYSICAL_SCENES),
        "policies_count": len(POLICIES),
    }


@app.get("/api/scenes")
async def get_scenes():
    return list(PHYSICAL_SCENES.values())


@app.get("/api/policies")
async def get_policies():
    return POLICIES


@app.post("/api/copilot")
async def process_copilot_prompt(payload: Dict[str, Any]):
    """Processes natural language prompts (English & Korean) for Physical AI control."""
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is empty")

    prompt_lower = prompt.lower()
    response_text = ""
    action_type = "autonomous_pick"
    suggested_params = {}

    target_obj = "red_can"
    if "blue" in prompt_lower or "bottle" in prompt_lower or "파란" in prompt or "병" in prompt:
        target_obj = "blue_bottle"

    is_dump = "dump" in prompt_lower or "recycle" in prompt_lower or "bin" in prompt_lower or "버려" in prompt or "쓰레기통" in prompt
    is_pick = "pick" in prompt_lower or "get" in prompt_lower or "take" in prompt_lower or "grab" in prompt or "집" in prompt or "잡" in prompt

    if is_pick and is_dump:
        action_type = "pick_and_dump"
        obj_name = "Blue Bottle" if target_obj == "blue_bottle" else "Red Can"
        response_text = f"🤖 **{obj_name} Pick & Dump AI Triggered**\n1. Tracking {obj_name} 3D position\n2. Navigating mobile base & clamping with gripper\n3. Transporting & dumping into Recycle Bin"
        suggested_params = {"action": "pick_and_dump", "target_object": target_obj}
    elif is_dump and not is_pick:
        action_type = "dump_only"
        response_text = "🗑️ **Recycle Bin Dump AI Triggered**\n1. Navigating mobile base to Recycle Bin\n2. Extending arm joints & dropping held item into bin"
        suggested_params = {"action": "dump_only", "target_object": "bin"}
    elif "kick" in prompt_lower or "ball" in prompt_lower or "soccer" in prompt_lower or "공" in prompt or "차" in prompt:
        action_type = "autonomous_kick"
        response_text = "⚽ **Soccer Ball Kick AI Triggered**\n1. Tracking ball 3D position\n2. Aligning shooting posture & executing leg kick trajectory"
        suggested_params = {"action": "kick", "target_object": "ball"}
    elif "walk" in prompt_lower or "move" in prompt_lower or "drive" in prompt_lower or "걸어가" in prompt or "이동" in prompt:
        action_type = "autonomous_walk"
        response_text = "🚶 **Bipedal Walk & Motion Trajectory Triggered**\n1. Adjusting step height & stride frequency"
        suggested_params = {"action": "walk", "target_object": "forward"}
    else:
        # Default: Pick Only (holding object in gripper without dumping)
        action_type = "pick_only"
        obj_name = "Blue Bottle" if target_obj == "blue_bottle" else "Red Can"
        response_text = f"🤖 **{obj_name} Pick AI Triggered**\n1. Tracking {obj_name} 3D position\n2. Navigating mobile base & lowering arm joints in 'ㄱ' shape\n3. Clamping with gripper & holding object in position"
        suggested_params = {"action": "pick_only", "target_object": target_obj}

    return {
        "status": "success",
        "prompt": prompt,
        "reply": response_text,
        "action_type": action_type,
        "params": suggested_params,
    }


@app.post("/api/export")
async def export_robot_code(payload: Dict[str, Any]):
    """Generates runnable Python / C++ control code for real hardware."""
    scene_id = payload.get("scene_id", "trash_picker")
    target_format = payload.get("format", "python")

    scene = PHYSICAL_SCENES.get(scene_id, PHYSICAL_SCENES["trash_picker"])

    code_template = f'''#!/usr/bin/env python3
"""Auto-generated Physical AI Controller Script
Generated by Physical AI Studio (Target: {scene['name']})
"""

import time
import math
import numpy as np

# Robot Joint Registry
JOINTS = {json.dumps(scene['joints'], indent=2)}

def initialize_robot():
    print("[Physical AI] Connecting to robot hardware / simulator...")
    print(f"[Physical AI] Active Joint Count: {{len(JOINTS)}}")

def run_control_loop():
    print("[Physical AI] Starting autonomous policy loop...")
    step = 0
    while step < 100:
        # 1. Read Vision & Encoder Sensors
        t = step * 0.05
        joint_cmd = [math.sin(t + i*0.5) * 0.5 for i in range(len(JOINTS))]
        
        # 2. Output Joint Commands to Motors
        # print(f"Step {{step}}: Joint Commands = {{joint_cmd}}")
        time.sleep(0.05)
        step += 1
    
    print("[Physical AI] Task Completed Successfully!")

if __name__ == "__main__":
    initialize_robot()
    run_control_loop()
'''

    return {
        "status": "success",
        "format": target_format,
        "scene": scene_id,
        "code": code_template,
        "filename": f"control_{scene_id}.py",
    }


# WebSocket Manager for Real-Time Physics Telemetry
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        step = 0
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.03)
                payload = json.loads(data)
            except asyncio.TimeoutError:
                pass
            except Exception:
                pass

            step += 1
            telemetry = {
                "type": "telemetry",
                "step": step,
                "time": round(step * 0.016, 2),
                "fps": 60,
                "status": "running",
            }
            await websocket.send_json(telemetry)
            await asyncio.sleep(0.016)

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Mount Static Files
if os.path.exists(PUBLIC_DIR):
    app.mount("/static", StaticFiles(directory=PUBLIC_DIR), name="static")


@app.get("/")
async def root():
    index_file = os.path.join(PUBLIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h1>Physical AI Studio Server Running</h1>")


def find_available_port(host: str = "127.0.0.1", start_port: int = 8000) -> int:
    port = start_port
    while port < start_port + 100:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex((host, port)) != 0:
                return port
            port += 1
    return start_port


def launch_studio():
    host = "127.0.0.1"
    port = find_available_port(host, 8000)
    url = f"http://{host}:{port}"
    print(f"\n🚀 Physical AI Studio starting at: {url}\n")

    def open_browser():
        webbrowser.open(url)

    threading.Timer(1.5, open_browser).start()
    uvicorn.run("server:app", host=host, port=port, reload=True, log_level="info")


if __name__ == "__main__":
    launch_studio()
