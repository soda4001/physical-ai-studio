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
                    if (lowerText.includes('blue') || lowerText.includes('bottle') || text.includes('파란') || text.includes('병')) {
                        vp.startPickSequence('blue_bottle');
                    } else if (lowerText.includes('kick') || lowerText.includes('ball') || lowerText.includes('soccer') || text.includes('공') || text.includes('차')) {
                        vp.startKickSequence();
                    } else {
                        // Default pick red_can for any pick/item/can prompt
                        vp.startPickSequence('red_can');
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
