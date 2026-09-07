/**
 * Physical AI Studio - Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize 3D Viewport
    const viewport = new PhysicsViewport('canvasContainer');
    window.viewport = viewport;

    // 2. Initialize Policy Cards & Copilot
    const policyManager = new PolicyCardManager('policyCardList', viewport);
    const copilot = new PhysicalCopilot('copilotForm', 'copilotInput', 'copilotMessages', viewport);

    // 3. Application Telemetry Logger
    window.appLog = function(message, type = 'info') {
        const logContainer = document.getElementById('telemetryLog');
        if (!logContainer) return;

        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

        logContainer.appendChild(line);
        logContainer.scrollTop = logContainer.scrollHeight;
    };

    // 4. Tab Navigation Handler
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.sidebar');
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            const targetContent = parent.querySelector(`#${targetId}`);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // 5. Scene Selector Handler
    const sceneSelect = document.getElementById('sceneSelect');
    sceneSelect.addEventListener('change', (e) => {
        const sceneId = e.target.value;
        viewport.loadScene(sceneId);
        window.appLog(`[Scene Loaded] Switch to scene: ${sceneId}`, 'success');
    });

    // 6. Object Spawner Buttons
    document.querySelectorAll('.btn-obj-spawn').forEach(btn => {
        btn.addEventListener('click', () => {
            const objType = btn.dataset.obj;
            viewport.spawnObject(objType);
            window.appLog(`[3D Object] Spawned 3D object: ${objType}`, 'info');
        });
    });

    // 7. Teleop D-Pad & Key Controls
    const keys = { forward: 0, turn: 0 };

    const updateTeleopMove = () => {
        viewport.updateTeleop(keys);
    };

    document.getElementById('keyForward').addEventListener('mousedown', () => { keys.forward = -1; updateTeleopMove(); });
    document.getElementById('keyBackward').addEventListener('mousedown', () => { keys.forward = 1; updateTeleopMove(); });
    document.getElementById('keyLeft').addEventListener('mousedown', () => { keys.turn = 0.05; updateTeleopMove(); });
    document.getElementById('keyRight').addEventListener('mousedown', () => { keys.turn = -0.05; updateTeleopMove(); });
    document.getElementById('keyStop').addEventListener('click', () => { keys.forward = 0; keys.turn = 0; updateTeleopMove(); });

    document.addEventListener('mouseup', () => {
        keys.forward = 0;
        keys.turn = 0;
        updateTeleopMove();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'w' || e.key === 'W') { keys.forward = -1; updateTeleopMove(); }
        else if (e.key === 's' || e.key === 'S') { keys.forward = 1; updateTeleopMove(); }
        else if (e.key === 'a' || e.key === 'A') { keys.turn = 0.05; updateTeleopMove(); }
        else if (e.key === 'd' || e.key === 'D') { keys.turn = -0.05; updateTeleopMove(); }
        else if (e.key === 'r' || e.key === 'R') { viewport.resetCamera(); }
    });

    document.addEventListener('keyup', (e) => {
        if (['w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
            keys.forward = 0;
            keys.turn = 0;
            updateTeleopMove();
        }
    });

    // Gripper Toggle Buttons
    document.getElementById('btnGripOpen').addEventListener('click', () => {
        viewport.updateTeleop({ gripperOpen: true });
        document.getElementById('btnGripOpen').classList.add('active');
        document.getElementById('btnGripClose').classList.remove('active');
        window.appLog('[Gripper] Open', 'info');
    });

    document.getElementById('btnGripClose').addEventListener('click', () => {
        viewport.updateTeleop({ gripperOpen: false });
        document.getElementById('btnGripClose').classList.add('active');
        document.getElementById('btnGripOpen').classList.remove('active');
        window.appLog('[Gripper] Close', 'info');
    });

    // Viewport Top Controls
    document.getElementById('btnResetCam').addEventListener('click', () => viewport.resetCamera());

    const visionPip = document.getElementById('visionPipWindow');
    document.getElementById('btnToggleVision').addEventListener('click', () => {
        visionPip.classList.toggle('hidden');
    });
    document.getElementById('btnClosePip').addEventListener('click', () => {
        visionPip.classList.add('hidden');
    });

    // Export Modal Code Dialog
    const exportModal = document.getElementById('exportModal');
    const btnExport = document.getElementById('btnExport');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const exportCodeText = document.getElementById('exportCodeText');

    btnExport.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scene_id: sceneSelect.value, format: 'python' }),
            });
            const data = await res.json();
            exportCodeText.value = data.code;
            exportModal.classList.remove('hidden');
        } catch (err) {
            alert('Failed to generate export code');
        }
    });

    btnCloseModal.addEventListener('click', () => exportModal.classList.add('hidden'));

    // WebSocket Telemetry Connection
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    try {
        const socket = new WebSocket(wsUrl);
        socket.onopen = () => {
            window.appLog(`[WebSocket] Connected to physics backend at ${wsUrl}`, 'success');
        };
        socket.onmessage = (event) => {
            // Telemetry tick update
        };
    } catch (e) {
        console.warn('WebSocket connection failed:', e);
    }
});
