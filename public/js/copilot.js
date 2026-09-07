/**
 * Physical AI Studio - Natural Language Copilot Handler with 3D Animation Trigger
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

                // Robust 3D Animation Trigger Logic
                const vp = this.viewport || window.viewport;
                if (vp) {
                    if (text.includes('파란') || text.includes('병') || text.includes('blue')) {
                        vp.startPickSequence('blue_bottle');
                    } else if (text.includes('공') || text.includes('차') || text.includes('kick')) {
                        vp.startKickSequence();
                    } else {
                        // Default pick red_can for any pick/item/can prompt
                        vp.startPickSequence('red_can');
                    }
                }
            } catch (err) {
                this.appendMessage('assistant', '⚠️ Physical AI Copilot 서버와 통신할 수 없습니다.');
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
