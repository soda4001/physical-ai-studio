#!/usr/bin/env python3
"""Physical AI Studio - Local DevTool & Runtime Backend Server.

Provides REST APIs, WebSockets for 3D physics state, AI Copilot NLP handler,
and serves the Web IDE / Desktop App interface.
"""

import asyncio
import json
import os
import sys
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

# Mock State & Physical AI Models / Scenes Repository
PHYSICAL_SCENES = {
    "trash_picker": {
        "id": "trash_picker",
        "name": "🧹 이동형 스마트 쓰레기 픽업 로봇",
        "description": "모바일 바퀴 섀시 + 4축 집게 로봇 팔 + YOLO 쓰레기 인식",
        "robot_type": "mobile_manipulator",
        "joints": ["wheel_left", "wheel_right", "arm_yaw", "arm_shoulder", "arm_elbow", "gripper"],
        "objects": ["trash_can_red", "trash_bottle", "recycle_bin"],
        "default_policy": "autonav_pick",
    },
    "humanoid_kick": {
        "id": "humanoid_kick",
        "name": "⚽ 휴머노이드 로봇 축구 & 보행",
        "description": "하반신 12축 이족보행 + 공 추적 및 슈팅 키네마틱스",
        "robot_type": "bipedal_humanoid",
        "joints": ["hip_yaw_l", "hip_roll_l", "knee_l", "ankle_l", "hip_yaw_r", "hip_roll_r", "knee_r", "ankle_r"],
        "objects": ["soccer_ball", "goal_post"],
        "default_policy": "alpha_walk",
    },
    "sander_care": {
        "id": "sander_care",
        "name": "💅 안전 샌딩형 케어 디바이스",
        "description": "2축 정밀 마이크로 스핀들 + 비전 센서 경계 감지",
        "robot_type": "precision_sander",
        "joints": ["spindle_x", "spindle_y", "tool_rotation"],
        "objects": ["finger_fixture", "safety_sensor"],
        "default_policy": "gentle_sanding",
    },
}

POLICIES = [
    {
        "id": "autonav_pick",
        "name": "자율 탐색 & 픽업 (Autonav & Pick)",
        "category": "Mobile AI",
        "description": "쓰레기 물체를 발견하면 자동으로 이동하여 집게로 파지 후 수거함에 덤프합니다.",
        "icon": "🧹",
        "file": "policies/autonav_pick.onnx",
        "params": {"speed": 0.8, "gripper_force": 2.5, "detect_confidence": 0.75},
    },
    {
        "id": "alpha_walk",
        "name": "이족 보행 밸런스 (Alpha Walk)",
        "category": "Humanoid",
        "description": "강화학습 기반 12축 이족보행 보정 및 외란 보상 파리미터.",
        "icon": "🚶",
        "file": "policies/alpha_walking.onnx",
        "params": {"step_height": 0.05, "stride": 0.15, "frequency": 1.2},
    },
    {
        "id": "ball_kick_left",
        "name": "왼발 킥 & 슈팅 (Ball Kick)",
        "category": "Humanoid",
        "description": "목표 공 위치를 계산하여 정밀하게 발로 차는 모션 궤적 생성.",
        "icon": "⚽",
        "file": "policies/ball_kick_left.onnx",
        "params": {"kick_power": 8.0, "prep_time": 0.4},
    },
    {
        "id": "emergency_stand",
        "name": "안정적 기립 (Safe Stand)",
        "category": "General",
        "description": "넘어짐 감지 시 즉시 전관절 홈 포지션 복귀 및 자세 제어.",
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
    """Processes natural language prompts for Physical AI control & generation."""
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is empty")

    prompt_lower = prompt.lower()
    response_text = ""
    action_type = "autonomous_pick"
    suggested_params = {}

    if "파란" in prompt or "blue" in prompt_lower or "병" in prompt:
        response_text = "🤖 **파란색 페트병 픽업 AI 동작**을 가동합니다.\n1. 파란 병 3D 위치 추적\n2. 로봇 이동 및 4축 로봇 팔 하강\n3. 집게 파지 후 수거함(Recycle Bin) 이동 & 덤프"
        suggested_params = {"action": "pick", "target_object": "blue_bottle"}
    elif "공" in prompt or "kick" in prompt_lower or "차" in prompt:
        action_type = "autonomous_kick"
        response_text = "⚽ **축구 공 슈팅 AI 동작**을 가동합니다.\n1. 공 위치 추적\n2. 슈팅 준비 자세 및 킥 궤적 생성"
        suggested_params = {"action": "kick", "target_object": "ball"}
    elif "걸어가" in prompt or "walk" in prompt_lower or "이동" in prompt:
        action_type = "autonomous_walk"
        response_text = "🚶 **보행 및 이동 궤적**을 가동합니다."
        suggested_params = {"action": "walk", "target_object": "forward"}
    else:
        # Default for any pick, red can, item, trash, or general prompt (e.g. 빨간캔, 집어줘, 물건)
        response_text = f"🤖 **빨간색 캔 픽업 AI 동작**을 가동합니다.\n1. 빨간 캔 3D 위치 추적\n2. 로봇 이동 및 4축 로봇 팔 하강\n3. 집게 파지 후 수거함(Recycle Bin) 이동 & 덤프"
        suggested_params = {"action": "pick", "target_object": "red_can"}

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
            # Handle incoming commands from client
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.03)
                payload = json.loads(data)
                # Client message handled here if needed
            except asyncio.TimeoutError:
                pass
            except Exception:
                pass

            # Broadcast 60Hz physics telemetry tick
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


import socket
import threading

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

