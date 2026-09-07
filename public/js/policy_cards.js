/**
 * Physical AI Studio - Visual Policy Card Component with Animation Triggers
 */

class PolicyCardManager {
    constructor(containerId, viewport) {
        this.container = document.getElementById(containerId);
        this.viewport = viewport;
        this.policies = [];
        this.activePolicyId = null;

        this.init();
    }

    async init() {
        try {
            const res = await fetch('/api/policies');
            this.policies = await res.json();
            this.renderCards();
        } catch (err) {
            console.error('Failed to load policies:', err);
        }
    }

    renderCards() {
        this.container.innerHTML = '';

        this.policies.forEach(policy => {
            const card = document.createElement('div');
            card.className = `policy-card ${this.activePolicyId === policy.id ? 'active' : ''}`;
            card.dataset.id = policy.id;

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">
                        <span>${policy.icon}</span>
                        <span>${policy.name}</span>
                    </div>
                    <span class="card-category">${policy.category}</span>
                </div>
                <div class="card-desc">${policy.description}</div>
            `;

            card.addEventListener('click', () => this.selectPolicy(policy));
            this.container.appendChild(card);
        });
    }

    selectPolicy(policy) {
        this.activePolicyId = policy.id;
        this.renderCards();

        // Trigger 3D Viewport Animations!
        if (policy.id === 'autonav_pick') {
            this.viewport.startPickSequence('red_can');
        } else if (policy.id === 'alpha_walk') {
            this.viewport.updateTeleop({ forward: 1, turn: 0 });
            setTimeout(() => this.viewport.updateTeleop({ forward: 0 }), 3000);
        } else if (policy.id === 'ball_kick_left') {
            this.viewport.startKickSequence();
        } else if (policy.id === 'emergency_stand') {
            this.viewport.updateTeleop({ forward: 0, turn: 0, armYaw: 0, armShoulder: 0.4, armElbow: 0.6, gripperOpen: true });
        }

        if (window.appLog) {
            window.appLog(`[AI Policy Triggered] ${policy.name} running in 3D viewport...`, 'success');
        }
    }
}

window.PolicyCardManager = PolicyCardManager;
