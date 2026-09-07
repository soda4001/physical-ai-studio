/**
 * Physical AI Studio - Three.js 3D Physics Viewport
 * Features "ㄱ" L-Shape Articulated Arm Kinematics & Precision Gripper Clamping
 */

class PhysicsViewport {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Robot & Object references
        this.robotGroup = new THREE.Group();
        this.armJoints = [];
        this.wheels = [];
        this.gripperFingers = [];
        this.spawnedObjects = {};
        this.targetMarker = null;
        this.currentSceneId = 'trash_picker';

        // Teleop & Animation State
        this.teleopState = {
            forward: 0,
            turn: 0,
            gripperOpen: true,
            armYaw: 0,
            armShoulder: 0,
            armElbow: 0,
        };

        this.animState = {
            active: false,
            sequence: [],
            currentStep: 0,
            progress: 0,
            heldObject: null,
        };

        this.initThree();
        this.setupLightsAndFloor();
        this.loadScene(this.currentSceneId);
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    initThree() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x070a12);
        this.scene.fog = new THREE.FogExp2(0x070a12, 0.035);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        // Dramatic, crisp camera angle focused on the robot arm & gripper
        this.camera.position.set(1.7, 1.3, 1.9);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
        this.controls.target.set(0.15, 0.35, 0);
    }

    setupLightsAndFloor() {
        // High-contrast studio lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Key Light (Main Warm/White Spotlight)
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
        keyLight.position.set(4, 7, 4);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.bias = -0.0003;
        this.scene.add(keyLight);

        // Fill Accent Light (Cyan Rim Light)
        const cyanFill = new THREE.PointLight(0x00f2fe, 2.2, 8);
        cyanFill.position.set(-1, 2.5, 2);
        this.scene.add(cyanFill);

        // Under-chassis Ambient Glow
        const greenGlow = new THREE.PointLight(0x00f5a0, 1.2, 4);
        greenGlow.position.set(0, 0.2, 0);
        this.scene.add(greenGlow);

        const gridHelper = new THREE.GridHelper(10, 20, 0x00f2fe, 0x1e293b);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        const groundGeo = new THREE.PlaneGeometry(14, 14);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x0a0f1d,
            roughness: 0.7,
            metalness: 0.3
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 3D Target Detection Ring Marker
        const ringGeo = new THREE.RingGeometry(0.12, 0.16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0 });
        this.targetMarker = new THREE.Mesh(ringGeo, ringMat);
        this.targetMarker.rotation.x = -Math.PI / 2;
        this.targetMarker.position.y = 0.01;
        this.scene.add(this.targetMarker);
    }

    clearScene() {
        if (this.robotGroup) {
            this.scene.remove(this.robotGroup);
            this.robotGroup = new THREE.Group();
        }
        Object.values(this.spawnedObjects).forEach(obj => this.scene.remove(obj));
        this.spawnedObjects = {};
        this.armJoints = [];
        this.wheels = [];
        this.gripperFingers = [];
        this.animState.active = false;
        this.animState.heldObject = null;
    }

    loadScene(sceneId) {
        this.clearScene();
        this.currentSceneId = sceneId;

        if (sceneId === 'trash_picker') {
            this.buildMobileTrashPickerRobot();
            this.spawnTrashPickerEnvironment();
        } else if (sceneId === 'humanoid_kick') {
            this.buildHumanoidRobot();
            this.spawnSoccerEnvironment();
        } else if (sceneId === 'sander_care') {
            this.buildSanderDevice();
        }

        this.scene.add(this.robotGroup);
    }

    buildMobileTrashPickerRobot() {
        this.robotGroup = new THREE.Group();
        this.robotGroup.position.set(0, 0, 0);
        this.robotGroup.rotation.set(0, 0, 0);

        // 1. Base Chassis (Front is +X axis) - Premium Dark Metallic Slate
        const chassisGeo = new THREE.BoxGeometry(0.6, 0.15, 0.45);
        const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.position.y = 0.15;
        chassis.castShadow = true;
        this.robotGroup.add(chassis);

        // Glowing Neon Cyan Chassis Belt
        const stripGeo = new THREE.BoxGeometry(0.62, 0.03, 0.47);
        const stripMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.6 });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.y = 0.16;
        this.robotGroup.add(strip);

        // 2. Wheels - High Contrast Rubber & Silver Metallic Hubcaps
        const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
        const hubMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
        const hubGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.062, 16);

        const wheelPos = [
            [0.2, 0.1, 0.25], [-0.2, 0.1, 0.25],
            [0.2, 0.1, -0.25], [-0.2, 0.1, -0.25]
        ];
        wheelPos.forEach(pos => {
            const wGroup = new THREE.Group();
            wGroup.position.set(...pos);

            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.z = Math.PI / 2;
            w.castShadow = true;
            wGroup.add(w);

            const hub = new THREE.Mesh(hubGeo, hubMat);
            hub.rotation.z = Math.PI / 2;
            wGroup.add(hub);

            this.robotGroup.add(wGroup);
            this.wheels.push(wGroup);
        });

        // 3. Articulated 3-DOF Arm (Shoulder -> Elbow -> Wrist)
        // Shoulder Base Mount
        const armBaseGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.1, 24);
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9, roughness: 0.15 });
        const armBase = new THREE.Mesh(armBaseGeo, silverMat);
        armBase.position.set(0.18, 0.25, 0);
        this.robotGroup.add(armBase);

        // Joint 1: Shoulder Rotary Servo Pivot (j1Pivot)
        const j1Pivot = new THREE.Group();
        j1Pivot.position.set(0.18, 0.28, 0);
        this.robotGroup.add(j1Pivot);
        this.armJoints.push(j1Pivot); // armJoints[0]

        // Shoulder Metallic Servo Cap & LED Ring
        const servoCapGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 20);
        const servoCap = new THREE.Mesh(servoCapGeo, silverMat);
        servoCap.rotation.x = Math.PI / 2;
        j1Pivot.add(servoCap);

        const ringMat1 = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.8 });
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.008, 12, 24), ringMat1);
        ring1.rotation.x = Math.PI / 2;
        j1Pivot.add(ring1);

        // Link 1 (Upper Arm): Heavy Industrial Dual-Tone Arm Beam
        const link1Geo = new THREE.BoxGeometry(0.08, 0.35, 0.08);
        const link1 = new THREE.Mesh(link1Geo, chassisMat);
        link1.position.y = 0.175;
        link1.castShadow = true;
        j1Pivot.add(link1);

        const link1Accent = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.28, 0.02), stripMat);
        link1Accent.position.y = 0.175;
        j1Pivot.add(link1Accent);

        // Joint 2: Elbow Rotary Servo Pivot (j2Pivot)
        const j2Pivot = new THREE.Group();
        j2Pivot.position.set(0, 0.35, 0);
        j1Pivot.add(j2Pivot);
        this.armJoints.push(j2Pivot); // armJoints[1]

        const j2Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 20), silverMat);
        j2Cap.rotation.x = Math.PI / 2;
        j2Pivot.add(j2Cap);

        const ringMat2 = new THREE.MeshStandardMaterial({ color: 0x00f5a0, emissive: 0x00f5a0, emissiveIntensity: 0.8 });
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.057, 0.008, 12, 24), ringMat2);
        ring2.rotation.x = Math.PI / 2;
        j2Pivot.add(ring2);

        // Link 2 (Forearm): Titanium White High-Contrast Forearm Beam
        const link2Geo = new THREE.BoxGeometry(0.07, 0.30, 0.07);
        const link2 = new THREE.Mesh(link2Geo, silverMat);
        link2.position.y = 0.15;
        link2.castShadow = true;
        j2Pivot.add(link2);

        // Joint 3: Wrist Pitch Pivot (j3Pivot)
        const j3Pivot = new THREE.Group();
        j3Pivot.position.set(0, 0.3, 0);
        j3Pivot.rotation.z = 0; // Aligned naturally in home position
        j2Pivot.add(j3Pivot);
        this.armJoints.push(j3Pivot); // armJoints[2]

        const j3Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 20), silverMat);
        j3Cap.rotation.x = Math.PI / 2;
        j3Pivot.add(j3Cap);

        // End-Effector 2-Jaw High-Contrast Parallel Gripper
        const gripperGroup = new THREE.Group();
        j3Pivot.add(gripperGroup);
        this.gripperGroup = gripperGroup;

        // 1. Wrist Mount Bracket
        const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.03, 16), chassisMat);
        mount.position.y = 0.015;
        gripperGroup.add(mount);

        // 2. Linear Slide Rail Base (Bright Silver Aluminum Chassis)
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.07), silverMat);
        rail.position.y = 0.04;
        rail.castShadow = true;
        gripperGroup.add(rail);

        // 3. Central Dark Slide Track & Status LED
        const track = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.038, 0.02), wheelMat);
        track.position.y = 0.04;
        gripperGroup.add(track);

        const statusMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.072), stripMat);
        statusMesh.position.y = 0.04;
        gripperGroup.add(statusMesh);

        // 4. Large Electric Cyan & Green Claws with Dark Carbon Friction Pads
        const clawMat = new THREE.MeshStandardMaterial({
            color: 0x00f2fe,
            emissive: 0x00f2fe,
            emissiveIntensity: 0.4,
            metalness: 0.5,
            roughness: 0.1
        });

        const tipMat = new THREE.MeshStandardMaterial({
            color: 0x00f5a0,
            emissive: 0x00f5a0,
            emissiveIntensity: 0.6
        });

        const padMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.9,
            metalness: 0.2
        });

        // Left Claw Assembly Group
        const clawL = new THREE.Group();
        clawL.position.set(-0.09, 0.04, 0); // Wide open state (0.18m clearance gap!)

        const fPostL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.15, 0.045), clawMat);
        fPostL.position.set(0, 0.075, 0);
        fPostL.castShadow = true;
        clawL.add(fPostL);

        const fTipL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.045), tipMat);
        fTipL.position.set(0.012, 0.15, 0);
        clawL.add(fTipL);

        const padL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.04), padMat);
        padL.position.set(0.014, 0.075, 0);
        clawL.add(padL);

        gripperGroup.add(clawL);

        // Right Claw Assembly Group
        const clawR = new THREE.Group();
        clawR.position.set(0.09, 0.04, 0); // Wide open state

        const fPostR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.15, 0.045), clawMat);
        fPostR.position.set(0, 0.075, 0);
        fPostR.castShadow = true;
        clawR.add(fPostR);

        const fTipR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.045), tipMat);
        fTipR.position.set(-0.012, 0.15, 0);
        clawR.add(fTipR);

        const padR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.04), padMat);
        padR.position.set(-0.014, 0.075, 0);
        clawR.add(padR);

        gripperGroup.add(clawR);

        this.fingerMat = clawMat;
        this.gripperFingers = [clawL, clawR];
    }

    spawnTrashPickerEnvironment() {
        // Red Trash Can
        const canGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16);
        const canMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
        const can = new THREE.Mesh(canGeo, canMat);
        can.position.set(0.9, 0.09, 0.1);
        can.castShadow = true;
        this.scene.add(can);
        this.spawnedObjects['red_can'] = can;

        // Blue Trash Bottle
        const bottleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 16);
        const bottleMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.1, transparent: true, opacity: 0.85 });
        const bottle = new THREE.Mesh(bottleGeo, bottleMat);
        bottle.position.set(0.8, 0.11, -0.6);
        bottle.castShadow = true;
        this.scene.add(bottle);
        this.spawnedObjects['blue_bottle'] = bottle;

        // Recycle Bin (Green Open Box)
        const binGroup = new THREE.Group();
        binGroup.position.set(1.5, 0.15, 0.6);

        const binMat = new THREE.MeshStandardMaterial({ color: 0x00f5a0, roughness: 0.4 });
        
        const bBottom = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.4), binMat);
        bBottom.position.y = -0.14;
        binGroup.add(bBottom);
        
        const wallN = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.02), binMat);
        wallN.position.z = -0.19;
        binGroup.add(wallN);

        const wallS = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.02), binMat);
        wallS.position.z = 0.19;
        binGroup.add(wallS);

        const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.38), binMat);
        wallE.position.x = 0.19;
        binGroup.add(wallE);

        const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.38), binMat);
        wallW.position.x = -0.19;
        binGroup.add(wallW);

        this.scene.add(binGroup);
        this.spawnedObjects['bin'] = binGroup;
    }

    buildHumanoidRobot() {
        this.robotGroup = new THREE.Group();
        const torsoGeo = new THREE.BoxGeometry(0.3, 0.5, 0.2);
        const torsoMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.8;
        torso.castShadow = true;
        this.robotGroup.add(torso);

        const headGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.3 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.15;
        this.robotGroup.add(head);

        const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.5, 16);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x00f5a0 });

        const legL = new THREE.Mesh(legGeo, legMat);
        legL.position.set(-0.1, 0.3, 0);
        legL.castShadow = true;
        this.robotGroup.add(legL);

        const legR = new THREE.Mesh(legGeo, legMat);
        legR.position.set(0.1, 0.3, 0);
        legR.castShadow = true;
        this.robotGroup.add(legR);

        this.armJoints = [legL, legR];
    }

    spawnSoccerEnvironment() {
        const ballGeo = new THREE.SphereGeometry(0.1, 24, 24);
        const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const ball = new THREE.Mesh(ballGeo, ballMat);
        ball.position.set(0.6, 0.1, 0);
        ball.castShadow = true;
        this.scene.add(ball);
        this.spawnedObjects['ball'] = ball;
    }

    buildSanderDevice() {
        this.robotGroup = new THREE.Group();
        const baseGeo = new THREE.BoxGeometry(0.8, 0.1, 0.6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.05;
        this.robotGroup.add(base);

        const spindleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 16);
        const spindleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
        const spindle = new THREE.Mesh(spindleGeo, spindleMat);
        spindle.position.set(0, 0.2, 0);
        this.robotGroup.add(spindle);
        this.armJoints = [spindle];
    }

    // Helper to resolve 3D target object
    resolveTargetObject(objKey) {
        let targetObj = this.spawnedObjects[objKey];

        if (!targetObj) {
            const keys = Object.keys(this.spawnedObjects);
            for (let k of keys) {
                if ((objKey.includes('blue') || objKey.includes('bottle')) && (k.includes('bottle') || k.includes('blue'))) {
                    targetObj = this.spawnedObjects[k];
                    break;
                } else if ((objKey.includes('red') || objKey.includes('can')) && (k.includes('can') || k.includes('red'))) {
                    targetObj = this.spawnedObjects[k];
                    break;
                }
            }
        }

        if (!targetObj) {
            this.spawnTrashPickerEnvironment();
            targetObj = this.spawnedObjects['red_can'];
        }
        return targetObj;
    }

    // 🦾 1. Pick Only Sequence (집기 전용: 타겟 물체를 집어 들어 올리고 서 있음)
    startPickOnlySequence(objKey = 'red_can') {
        const targetObj = this.resolveTargetObject(objKey);
        const targetPos = targetObj.position.clone();

        if (this.targetMarker) {
            this.targetMarker.position.set(targetPos.x, 0.01, targetPos.z);
            this.targetMarker.material.opacity = 0.9;
        }

        const driveTarget = new THREE.Vector3(targetPos.x - 0.500, 0, targetPos.z);

        this.animState = {
            active: true,
            targetObjKey: objKey,
            targetObj: targetObj,
            currentStep: 0,
            progress: 0,
            heldObject: null,
            sequence: [
                { type: 'drive_to', target: driveTarget, duration: 2.0 },
                { type: 'grip_open', duration: 0.5 },
                // Form precise zero-clipping "ㄱ" L-shape (Shoulder -50°, Elbow -120°): Claw tips sit 2cm above floor!
                { type: 'lower_arm_L_shape', shoulder: -0.87, elbow: -2.09, duration: 1.8 },
                { type: 'grip_close_center', duration: 0.8 },
                { type: 'lift_arm', shoulder: -0.40, elbow: -1.20, duration: 1.6 }
            ]
        };

        const statusEl = document.getElementById('simStatusText');
        if (statusEl) statusEl.textContent = 'HOLDING OBJECT';

        if (window.appLog) {
            window.appLog(`[Kinematics AI] 🦾 Robot Arm Clamped Target Object & Holding in Claws!`, 'success');
        }
    }

    // 🗑️ 2. Dump Only Sequence (버리기 전용: 들고 있는 물체를 수거함에 버림)
    startDumpOnlySequence() {
        const binObj = this.spawnedObjects['bin'];
        const binPos = binObj ? binObj.position.clone() : new THREE.Vector3(1.5, 0.15, 0.6);
        const binDriveTarget = new THREE.Vector3(binPos.x - 0.500, 0, binPos.z);

        this.animState = {
            active: true,
            binPos: binPos,
            currentStep: 0,
            progress: 0,
            heldObject: this.animState.heldObject,
            sequence: [
                { type: 'drive_to_bin', target: binDriveTarget, duration: 2.5 },
                { type: 'dump_arm', shoulder: -0.80, elbow: -1.50, duration: 1.4 },
                { type: 'grip_open_drop', duration: 0.8 },
                { type: 'home_arm', shoulder: 0.0, elbow: 0.0, duration: 1.2 }
            ]
        };

        const statusEl = document.getElementById('simStatusText');
        if (statusEl) statusEl.textContent = 'DUMPING INTO BIN';

        if (window.appLog) {
            window.appLog(`[Kinematics AI] 🗑️ Transporting & Dumping Object into Recycle Bin`, 'success');
        }
    }

    // 🦾🗑️ 3. Full Pick & Dump Sequence (집어서 쓰레기통에 버리기)
    startPickAndDumpSequence(objKey = 'red_can') {
        const targetObj = this.resolveTargetObject(objKey);
        const targetPos = targetObj.position.clone();
        const binObj = this.spawnedObjects['bin'];
        const binPos = binObj ? binObj.position.clone() : new THREE.Vector3(1.5, 0.15, 0.6);

        if (this.targetMarker) {
            this.targetMarker.position.set(targetPos.x, 0.01, targetPos.z);
            this.targetMarker.material.opacity = 0.9;
        }

        const driveTarget = new THREE.Vector3(targetPos.x - 0.500, 0, targetPos.z);
        const binDriveTarget = new THREE.Vector3(binPos.x - 0.500, 0, binPos.z);

        this.animState = {
            active: true,
            targetObjKey: objKey,
            targetObj: targetObj,
            binPos: binPos,
            currentStep: 0,
            progress: 0,
            heldObject: null,
            sequence: [
                { type: 'drive_to', target: driveTarget, duration: 2.0 },
                { type: 'grip_open', duration: 0.5 },
                { type: 'lower_arm_L_shape', shoulder: -0.87, elbow: -2.09, duration: 1.8 },
                { type: 'grip_close_center', duration: 0.8 },
                { type: 'lift_arm', shoulder: -0.40, elbow: -1.20, duration: 1.6 },
                { type: 'drive_to_bin', target: binDriveTarget, duration: 2.5 },
                { type: 'dump_arm', shoulder: -0.80, elbow: -1.50, duration: 1.4 },
                { type: 'grip_open_drop', duration: 0.8 },
                { type: 'home_arm', shoulder: 0.0, elbow: 0.0, duration: 1.2 }
            ]
        };

        const statusEl = document.getElementById('simStatusText');
        if (statusEl) statusEl.textContent = 'RUNNING AI POLICY';

        if (window.appLog) {
            window.appLog(`[Kinematics AI] 🦾 Robot Executing Complete Pick & Dump Task`, 'success');
        }
    }

    startPickSequence(objKey = 'red_can') {
        this.startPickOnlySequence(objKey);
    }

    startKickSequence() {
        const ball = this.spawnedObjects['ball'];
        const ballPos = ball ? ball.position.clone() : new THREE.Vector3(0.6, 0.1, 0);

        this.animState = {
            active: true,
            ball: ball,
            currentStep: 0,
            progress: 0,
            sequence: [
                { type: 'walk_to_ball', target: new THREE.Vector3(ballPos.x - 0.25, 0, ballPos.z), duration: 1.5 },
                { type: 'kick_motion', duration: 0.8 },
                { type: 'ball_fly', duration: 1.5 }
            ]
        };

        if (window.appLog) {
            window.appLog(`[Autonomous AI] Action Started: Kick Soccer Ball`, 'success');
        }
    }

    spawnObject(type) {
        let geo, mat, mesh;
        const key = `${type}_${Date.now()}`;
        if (type === 'trash_can') {
            geo = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16);
            mat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        } else if (type === 'bottle') {
            geo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 16);
            mat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
        } else if (type === 'ball') {
            geo = new THREE.SphereGeometry(0.1, 20, 20);
            mat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
        } else {
            geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            mat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6 });
        }

        mesh = new THREE.Mesh(geo, mat);
        const rx = (Math.random() - 0.5) * 1.5;
        const rz = (Math.random() - 0.5) * 1.5;
        mesh.position.set(rx, 0.1, rz);
        mesh.castShadow = true;

        this.scene.add(mesh);
        this.spawnedObjects[key] = mesh;
    }

    resetCamera() {
        this.camera.position.set(1.7, 1.3, 1.9);
        this.controls.target.set(0.15, 0.35, 0);
        this.controls.update();
    }

    updateTeleop(params) {
        Object.assign(this.teleopState, params);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.animState.active) {
            this.processAutonomousStep();
        } else if (this.currentSceneId === 'trash_picker') {
            const speed = this.teleopState.forward * 0.03;
            const turn = this.teleopState.turn * 0.04;

            this.robotGroup.rotation.y += turn;
            this.robotGroup.translateZ(speed);

            this.wheels.forEach(w => w.rotation.x += speed * 5);

            if (this.armJoints.length >= 3) {
                this.armJoints[0].rotation.y = this.teleopState.armYaw;
                this.armJoints[0].rotation.z = this.teleopState.armShoulder;
                this.armJoints[1].rotation.z = this.teleopState.armElbow;

                const isArmMoved = Math.abs(this.teleopState.armShoulder) > 0.05 || Math.abs(this.teleopState.armElbow) > 0.05;
                const targetW = isArmMoved ? -Math.PI - (this.teleopState.armShoulder + this.teleopState.armElbow) : 0.0;
                this.armJoints[2].rotation.z = THREE.MathUtils.lerp(this.armJoints[2].rotation.z, targetW, 0.12);
            }

            if (this.gripperFingers.length === 2) {
                const targetX = this.teleopState.gripperOpen ? 0.09 : 0.045;
                this.gripperFingers[0].position.x = -targetX;
                this.gripperFingers[1].position.x = targetX;
            }
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    processAutonomousStep() {
        const state = this.animState;
        if (state.currentStep >= state.sequence.length) {
            state.active = false;
            if (this.targetMarker) this.targetMarker.material.opacity = 0;
            const statusEl = document.getElementById('simStatusText');
            if (statusEl) statusEl.textContent = 'PHYSICS RUNNING';
            if (window.appLog) window.appLog('[Kinematics AI] Pick & Dump Task Complete!', 'success');
            return;
        }

        const step = state.sequence[state.currentStep];
        state.progress += 0.016 / step.duration;
        const t = Math.min(1.0, state.progress);

        if (step.type === 'drive_to' || step.type === 'drive_to_bin' || step.type === 'walk_to_ball') {
            this.robotGroup.position.x = THREE.MathUtils.lerp(this.robotGroup.position.x, step.target.x, 0.1);
            this.robotGroup.position.z = THREE.MathUtils.lerp(this.robotGroup.position.z, step.target.z, 0.1);
            
            const dx = step.target.x - this.robotGroup.position.x;
            const dz = step.target.z - this.robotGroup.position.z;
            if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
                const targetYaw = -Math.atan2(dz, dx);
                this.robotGroup.rotation.y = THREE.MathUtils.lerp(this.robotGroup.rotation.y, targetYaw, 0.15);
            }
            this.wheels.forEach(w => w.rotation.x += 0.15);

        } else if (step.type === 'lower_arm_L_shape' || step.type === 'lower_arm' || step.type === 'lift_arm' || step.type === 'dump_arm' || step.type === 'home_arm') {
            if (this.armJoints.length >= 3) {
                // Form clear "ㄱ" L-shape elbow bend
                const sAngle = THREE.MathUtils.lerp(this.armJoints[0].rotation.z, step.shoulder, 0.12);
                const eAngle = THREE.MathUtils.lerp(this.armJoints[1].rotation.z, step.elbow, 0.12);
                
                this.armJoints[0].rotation.z = sAngle;
                this.armJoints[1].rotation.z = eAngle;

                // Wrist Pitch Joint: 0 in Home/Pick, -1.57 in Lift, -0.84 in Dump
                let targetW = 0.0;
                if (step.type === 'lift_arm') targetW = -Math.PI / 2;
                else if (step.type === 'dump_arm') targetW = -0.84;
                else targetW = 0.0;

                this.armJoints[2].rotation.z = THREE.MathUtils.lerp(this.armJoints[2].rotation.z, targetW, 0.15);
            }
        } else if (step.type === 'grip_open') {
            if (this.gripperFingers.length === 2) {
                this.gripperFingers[0].position.x = THREE.MathUtils.lerp(this.gripperFingers[0].position.x, -0.08, 0.2);
                this.gripperFingers[1].position.x = THREE.MathUtils.lerp(this.gripperFingers[1].position.x, 0.08, 0.2);
            }
            if (this.fingerMat) this.fingerMat.emissiveIntensity = 0.2;

        } else if (step.type === 'grip_close_center' || step.type === 'grip_close') {
            if (this.gripperFingers.length === 2) {
                this.gripperFingers[0].position.x = THREE.MathUtils.lerp(this.gripperFingers[0].position.x, -0.045, 0.25);
                this.gripperFingers[1].position.x = THREE.MathUtils.lerp(this.gripperFingers[1].position.x, 0.045, 0.25);
            }
            if (this.fingerMat) this.fingerMat.emissiveIntensity = 1.0; // Glow green on contact!

            if (state.targetObj && !state.heldObject) {
                // Attach object to Gripper Tip & Center it EXACTLY between the finger pads!
                this.gripperGroup.add(state.targetObj);
                state.targetObj.position.set(0, 0.115, 0); // Position snugly between finger pads
                state.targetObj.rotation.set(0, 0, 0);
                state.heldObject = state.targetObj;
            }
        } else if (step.type === 'grip_open_drop') {
            if (this.gripperFingers.length === 2) {
                this.gripperFingers[0].position.x = -0.08;
                this.gripperFingers[1].position.x = 0.08;
            }
            if (this.fingerMat) this.fingerMat.emissiveIntensity = 0.2;

            if (state.heldObject) {
                this.scene.add(state.heldObject);
                const dropPos = state.binPos || new THREE.Vector3(1.5, 0.15, 0.6);
                state.heldObject.position.set(dropPos.x, 0.18, dropPos.z);
                state.heldObject.rotation.set(0, 0, 0);
                state.heldObject = null;
            }
        } else if (step.type === 'kick_motion') {
            if (this.armJoints.length >= 2) {
                this.armJoints[0].rotation.x = Math.sin(t * Math.PI) * 0.8;
            }
        } else if (step.type === 'ball_fly') {
            if (state.ball) {
                state.ball.position.x += 0.03;
                state.ball.position.z += 0.01;
            }
        }

        if (t >= 1.0) {
            state.currentStep++;
            state.progress = 0;
        }
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

window.PhysicsViewport = PhysicsViewport;
