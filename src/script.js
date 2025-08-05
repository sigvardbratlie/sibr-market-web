// Hent referanser til HTML-elementene
const sessionId = crypto.randomUUID();
const form = document.getElementById('input-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('chat-messages');
const initialView = document.getElementById('initial-view');
const insightsButton = document.querySelector('.top-buttons').children[1];

insightsButton.addEventListener('click', () => { window.location.href = 'src/insights.html'; });

let isChatActive = false;

// Auto-resize for textarea
function autoResizeTextarea() {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
}
input.addEventListener('input', autoResizeTextarea);
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
    }
});

function activateChat() {
    if (isChatActive) return;
    initialView.classList.add('hidden');
    messagesContainer.classList.remove('hidden');
    addMessageToUI("Hei! Hvordan kan jeg hjelpe deg med boligdata i dag?", 'agent');
    isChatActive = true;
}

// **ROBUST FUNKSJON FOR Å GJØRE URLer KLIKKBARE**
function linkify(text) {
    // Finner http/https/ftp/file-lenker OG lenker som starter med www.
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, (url) => {
        // Hvis lenken ikke starter med http, legg det til
        const fullUrl = url.startsWith('www.') ? 'http://' + url : url;
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

// **NY FUNKSJON FOR Å BYGGE MELDINGER**
function addMessageToUI(text, sender, options = {}) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    const textElement = document.createElement('p');
    // Bruker innerHTML for å rendere lenker. Dette er nå trygt pga. regex-en.
    textElement.innerHTML = linkify(text);
    messageElement.appendChild(textElement);

    if (options.isThinking) {
        // Bygg "thinking"-seksjonen dynamisk
        const details = document.createElement('details');
        details.className = 'thinking-details';
        details.open = true; // Start åpen for å vise prosessen

        const summary = document.createElement('summary');
        summary.className = 'thinking-summary';

        const spinner = document.createElement('div');
        spinner.className = 'spinner';

        const summaryText = document.createElement('span');
        summaryText.textContent = 'Agenten tenker...';

        summary.appendChild(spinner);
        summary.appendChild(summaryText);

        const content = document.createElement('div');
        content.className = 'thinking-content';

        details.appendChild(summary);
        details.appendChild(content);
        messageElement.appendChild(details);
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageElement;
}


form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageText = input.value.trim();
    if (messageText === '') return;

    if (!isChatActive) activateChat();

    addMessageToUI(messageText, 'user');
    input.value = '';
    autoResizeTextarea();
    input.focus();

    // 1. Opprett en meldingsboble med en åpen "thinking"-seksjon
    const agentMessageElement = addMessageToUI("...", 'agent', { isThinking: true });
    const agentTextElement = agentMessageElement.querySelector('p');
    const thinkingDetails = agentMessageElement.querySelector('.thinking-details');
    const thinkingContent = agentMessageElement.querySelector('.thinking-content');
    const thinkingSpinner = agentMessageElement.querySelector('.spinner');
    const thinkingSummaryText = agentMessageElement.querySelector('.thinking-summary span');

    try {
        const response = await fetch('https://agent-homes-86613370495.europe-west1.run.app/ask-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: messageText, session_id: sessionId })
        });

        if (!response.ok) throw new Error(`Serverfeil: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalAnswer = "";
        let isFirstChunk = true;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            if (isFirstChunk) {
                agentTextElement.textContent = ""; // Tøm "..."
                isFirstChunk = false;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n').filter(line => line.startsWith('data:'));

            for (const line of lines) {
                const data = line.substring(5).trim();
                if (data.startsWith('Final Answer:')) {
                    // Legg til linjeskift for å bevare formateringen fra agenten
                    finalAnswer += data.substring(13).trim() + '\n';
                } else if (data.startsWith('Thought:') || data.startsWith('Observation:')) {
                    const logEntry = document.createElement('p');
                    logEntry.textContent = data;
                    thinkingContent.appendChild(logEntry);
                    thinkingContent.scrollTop = thinkingContent.scrollHeight;
                }
            }
        }

        // 2. Oppdater meldingen med endelig svar
        agentTextElement.innerHTML = linkify(finalAnswer.trim() || "Fikk ikke et gyldig svar.");

    } catch (error) {
        console.error("Feil under strømming:", error);
        agentTextElement.textContent = "Beklager, en teknisk feil oppstod.";
    } finally {
        // 3. Fullfør "thinking"-seksjonen
        thinkingSpinner.classList.add('hidden'); // Skjul spinneren
        thinkingSummaryText.textContent = 'Vis tankeprosess'; // Endre teksten
        thinkingDetails.open = false; // Lukk som standard når ferdig
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});