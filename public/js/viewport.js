/**
 * Physical AI Studio - 3-DOF Kinematic Robot Arm with Coordinated Forward Joint Bending
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
        this.scene.background = new THREE.Color(0x090d16);
        this.scene.fog = new THREE.FogExp2(0x090d16, 0.04);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(2.8, 2.2, 3.2);

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
        this.controls.target.set(0, 0.4, 0);
    }

    setupLightsAndFloor() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 8, 5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        const cyanLight = new THREE.PointLight(0x00f2fe, 1.5, 6);
        cyanLight.position.set(0, 2, 0);
        this.scene.add(cyanLight);

        const gridHelper = new THREE.GridHelper(10, 20, 0x00f2fe, 0x1f293d);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        const groundGeo = new THREE.PlaneGeometry(12, 12);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x0e1422,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
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

        // 1. Base Chassis (Front is +X axis)
        const chassisGeo = new THREE.BoxGeometry(0.6, 0.15, 0.45);
        const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.position.y = 0.15;
        chassis.castShadow = true;
        this.robotGroup.add(chassis);

        const stripGeo = new THREE.BoxGeometry(0.62, 0.03, 0.47);
        const stripMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.5 });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.y = 0.16;
        this.robotGroup.add(strip);

        // 2. Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        const wheelPos = [
            [0.2, 0.1, 0.25], [-0.2, 0.1, 0.25],
            [0.2, 0.1, -0.25], [-0.2, 0.1, -0.25]
        ];
        wheelPos.forEach(pos => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.z = Math.PI / 2;
            w.position.set(...pos);
            w.castShadow = true;
            this.robotGroup.add(w);
            this.wheels.push(w);
        });

        // 3. Articulated 3-DOF Arm (Shoulder -> Elbow -> Wrist)
        const armBaseGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.1, 16);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.9, roughness: 0.1 });
        const armBase = new THREE.Mesh(armBaseGeo, armMat);
        armBase.position.set(0.18, 0.25, 0);
        this.robotGroup.add(armBase);

        // Joint 1: Shoulder Pivot (j1Pivot)
        const j1Pivot = new THREE.Group();
        j1Pivot.position.set(0.18, 0.28, 0);
        this.robotGroup.add(j1Pivot);
        this.armJoints.push(j1Pivot); // armJoints[0]

        const link1Geo = new THREE.BoxGeometry(0.06, 0.35, 0.06);
        const link1 = new THREE.Mesh(link1Geo, chassisMat);
        link1.position.y = 0.175;
        link1.castShadow = true;
        j1Pivot.add(link1);

        // Joint 2: Elbow Pivot (j2Pivot)
        const j2Pivot = new THREE.Group();
        j2Pivot.position.set(0, 0.35, 0);
        j1Pivot.add(j2Pivot);
        this.armJoints.push(j2Pivot); // armJoints[1]

        const link2Geo = new THREE.BoxGeometry(0.05, 0.3, 0.05);
        const link2 = new THREE.Mesh(link2Geo, armMat);
        link2.position.y = 0.15;
        link2.castShadow = true;
        j2Pivot.add(link2);

        // Joint 3: Wrist Pitch Pivot (j3Pivot) - Keeps Gripper Pointing Straight Down!
        const j3Pivot = new THREE.Group();
        j3Pivot.position.set(0, 0.3, 0);
        j2Pivot.add(j3Pivot);
        this.armJoints.push(j3Pivot); // armJoints[2]

        // End-Effector Tactile Gripper
        const gripperGroup = new THREE.Group();
        j3Pivot.add(gripperGroup);
        this.gripperGroup = gripperGroup;

        const plateGeo = new THREE.BoxGeometry(0.16, 0.02, 0.06);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.y = 0.01;
        gripperGroup.add(plate);

        const fingerMat = new THREE.MeshStandardMaterial({
            color: 0x00f5a0,
            emissive: 0x00f5a0,
            emissiveIntensity: 0.2
        });

        const fingerGeo = new THREE.BoxGeometry(0.02, 0.14, 0.04);

        const fingerL = new THREE.Mesh(fingerGeo, fingerMat);
        fingerL.position.set(-0.08, 0.07, 0);
        fingerL.castShadow = true;
        gripperGroup.add(fingerL);

        const fingerR = new THREE.Mesh(fingerGeo, fingerMat);
        fingerR.position.set(0.08, 0.07, 0);
        fingerR.castShadow = true;
        gripperGroup.add(fingerR);

        this.fingerMat = fingerMat;
        this.gripperFingers = [fingerL, fingerR];
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

    // 🤖 Coordinated Forward Joint Kinematics Sequence
    startPickSequence(objKey = 'red_can') {
        const targetObj = this.spawnedObjects[objKey] || this.spawnedObjects['red_can'];
        if (!targetObj) return;

        const targetPos = targetObj.position.clone();
        const binObj = this.spawnedObjects['bin'];
        const binPos = binObj ? binObj.position.clone() : new THREE.Vector3(1.5, 0.15, 0.6);

        // Safe stand-off distance (0.50m in front of object)
        const driveTarget = new THREE.Vector3(targetPos.x - 0.50, 0, targetPos.z);
        const binDriveTarget = new THREE.Vector3(binPos.x - 0.50, 0, binPos.z);

        this.animState = {
            active: true,
            targetObjKey: objKey,
            targetObj: targetObj,
            binPos: binPos,
            currentStep: 0,
            progress: 0,
            heldObject: null,
            sequence: [
                // 1. Drive base to target
                { type: 'drive_to', target: driveTarget, duration: 2.0 },
                // 2. Open Gripper Fingers wide (0.08m)
                { type: 'grip_open', duration: 0.5 },
                // 3. Both Shoulder (-0.75) and Elbow (-0.75) bend FORWARD & DOWN to reach floor can!
                { type: 'lower_arm', shoulder: -0.75, elbow: -0.75, duration: 1.8 },
                // 4. Gripper Fingers Squeeze & Clamp Can tightly (0.055m contact)
                { type: 'grip_close', duration: 0.8 },
                // 5. Lift Arm Joints Up carrying Can (Shoulder -0.2, Elbow -0.2)
                { type: 'lift_arm', shoulder: -0.2, elbow: -0.2, duration: 1.6 },
                // 6. Drive Robot to Recycle Bin
                { type: 'drive_to_bin', target: binDriveTarget, duration: 2.5 },
                // 7. Extend Arm over Bin (Shoulder -0.6, Elbow -0.5)
                { type: 'dump_arm', shoulder: -0.6, elbow: -0.5, duration: 1.4 },
                // 8. Open Gripper to Drop Can inside Bin
                { type: 'grip_open_drop', duration: 0.8 },
                // 9. Return Arm Joints to Home Position
                { type: 'home_arm', shoulder: 0.0, elbow: 0.0, duration: 1.2 }
            ]
        };

        if (window.appLog) {
            window.appLog(`[Kinematics AI] 🦾 Robot Arm Bending Forward Down to Pick ${objKey}...`, 'success');
        }
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
        this.camera.position.set(2.8, 2.2, 3.2);
        this.controls.target.set(0, 0.4, 0);
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

            if (this.armJoints.length >= 2) {
                this.armJoints[0].rotation.y = this.teleopState.armYaw;
                this.armJoints[0].rotation.z = this.teleopState.armShoulder;
                this.armJoints[1].rotation.z = this.teleopState.armElbow;
            }

            if (this.gripperFingers.length === 2) {
                const targetX = this.teleopState.gripperOpen ? 0.08 : 0.055;
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
            if (window.appLog) window.appLog('[Kinematics AI] Pick & Dump Task Complete!', 'success');
            return;
        }

        const step = state.sequence[state.currentStep];
        state.progress += 0.016 / step.duration;
        const t = Math.min(1.0, state.progress);

        if (step.type === 'drive_to' || step.type === 'drive_to_bin' || step.type === 'walk_to_ball') {
            this.robotGroup.position.lerp(step.target, 0.08);
            
            const dx = step.target.x - this.robotGroup.position.x;
            const dz = step.target.z - this.robotGroup.position.z;
            if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
                const targetYaw = -Math.atan2(dz, dx);
                this.robotGroup.rotation.y = THREE.MathUtils.lerp(this.robotGroup.rotation.y, targetYaw, 0.1);
            }
            this.wheels.forEach(w => w.rotation.x += 0.15);

        } else if (step.type === 'lower_arm' || step.type === 'lift_arm' || step.type === 'dump_arm' || step.type === 'home_arm') {
            if (this.armJoints.length >= 3) {
                // Rotate shoulder and elbow joints FORWARD together
                const sAngle = THREE.MathUtils.lerp(this.armJoints[0].rotation.z, step.shoulder, 0.08);
                const eAngle = THREE.MathUtils.lerp(this.armJoints[1].rotation.z, step.elbow, 0.08);
                
                this.armJoints[0].rotation.z = sAngle;
                this.armJoints[1].rotation.z = eAngle;

                // Wrist Pitch Joint keeps Gripper pointing straight DOWN toward the can!
                this.armJoints[2].rotation.z = -(sAngle + eAngle);
            }
        } else if (step.type === 'grip_open') {
            if (this.gripperFingers.length === 2) {
                this.gripperFingers[0].position.x = THREE.MathUtils.lerp(this.gripperFingers[0].position.x, -0.08, 0.15);
                this.gripperFingers[1].position.x = THREE.MathUtils.lerp(this.gripperFingers[1].position.x, 0.08, 0.15);
            }
            if (this.fingerMat) this.fingerMat.emissiveIntensity = 0.2;

        } else if (step.type === 'grip_close') {
            if (this.gripperFingers.length === 2) {
                this.gripperFingers[0].position.x = THREE.MathUtils.lerp(this.gripperFingers[0].position.x, -0.055, 0.2);
                this.gripperFingers[1].position.x = THREE.MathUtils.lerp(this.gripperFingers[1].position.x, 0.055, 0.2);
            }
            if (this.fingerMat) this.fingerMat.emissiveIntensity = 0.9;

            if (state.targetObj && !state.heldObject) {
                this.gripperGroup.attach(state.targetObj);
                state.heldObject = state.targetObj;
            }
        } else if (step.type === 'grip_open_drop') {
            if (this.gripperFingers.length === 2) {
                this.gripperFingers[0].position.x = -0.08;
                this.gripperFingers[1].position.x = 0.08;
            }
            if (this.fingerMat) this.fingerMat.emissiveIntensity = 0.2;

            if (state.heldObject) {
                this.scene.attach(state.heldObject);
                const dropPos = state.binPos || new THREE.Vector3(1.5, 0.15, 0.6);
                state.heldObject.position.set(dropPos.x, 0.18, dropPos.z);
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
