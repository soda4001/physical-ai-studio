/**
 * Physical AI Studio - Global English & Multilingual Copilot Handler
 */

class PhysicalCopilot {
    constructor(formId, inputId, messagesId, viewport) {
        this.form = document.getElementById(formId);
        this.input = document.getElementById(inputId);
        this.messages = document.getElementById(messagesId);
        this.viewport = viewport;

        this.init();
    }

    init() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = this.input.value.trim();
            if (!text) return;

            this.appendMessage('user', text);
            this.input.value = '';

            try {
                const res = await fetch('/api/copilot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: text }),
                });

                const data = await res.json();
                this.appendMessage('assistant', data.reply.replace(/\n/g, '<br>'));

                // Robust 3D Animation Trigger (English & Korean)
                const vp = this.viewport || window.viewport;
                const lowerText = text.toLowerCase();

                if (vp) {
                    const params = data.params || {};
                    const action = params.action || 'pick_only';
                    const targetObj = params.target_object || 'red_can';

                    if (action === 'pick_and_dump') {
                        vp.startPickAndDumpSequence(targetObj);
                    } else if (action === 'dump_only') {
                        vp.startDumpOnlySequence();
                    } else if (action === 'kick') {
                        vp.startKickSequence();
                    } else {
                        // Default: Pick only (holds target object in gripper without dumping)
                        vp.startPickOnlySequence(targetObj);
                    }
                }
            } catch (err) {
                this.appendMessage('assistant', '⚠️ Cannot connect to Physical AI Copilot server.');
            }
        });
    }

    appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;

        const icon = sender === 'assistant' ? 'fa-robot' : 'fa-user';
        msgDiv.innerHTML = `
            <div class="avatar"><i class="fa-solid ${icon}"></i></div>
            <div class="bubble">${text}</div>
        `;

        this.messages.appendChild(msgDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }
}

window.PhysicalCopilot = PhysicalCopilot;
