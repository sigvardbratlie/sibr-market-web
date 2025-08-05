// Hent referanser til HTML-elementene
const sessionId = crypto.randomUUID();
const form = document.getElementById('input-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('chat-messages');
const initialView = document.getElementById('initial-view');
// Legg til dette helt øverst i script.js
const topButtonsContainer = document.querySelector('.top-buttons');
const insightsButton = topButtonsContainer.children[1]; // Finner den andre knappen

insightsButton.addEventListener('click', () => {
    window.location.href = 'src/insights.html'; // Send brukeren til den nye siden
});

let isChatActive = false;

// Funksjon som bytter fra start-visning til aktiv chat
function activateChat() {
    if (isChatActive) return; // Kjør bare én gang

    initialView.classList.add('hidden'); // Skjul start-teksten
    messagesContainer.classList.remove('hidden'); // Vis meldingsvinduet

    // Legg til den første meldingen fra agenten
    addMessage("Hei! Hvordan kan jeg hjelpe deg med boligdata i dag?", 'agent');

    isChatActive = true;
}


form.addEventListener('submit', async (event) => { // Legg til 'async' her
    event.preventDefault();
    const messageText = input.value.trim();
    if (messageText === '') return;

    // Aktiver chat-visningen hvis det er første melding
    if (!isChatActive) {
        activateChat();
    }

    // 1. Vis brukerens melding umiddelbart
    addMessage(messageText, 'user');
    input.value = '';

    // 2. Vis en "Tenker..."-melding mens vi venter på API-svar
    const thinkingMessageElement = addMessage("Tenker...", 'agent');

    // 3. Kall ditt ekte API med fetch
    try {
        const response = await fetch('https://agent-homes-86613370495.europe-west1.run.app/ask-agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: messageText,
                session_id: sessionId
            })
        });

        if (!response.ok) {
            // Håndter feil fra serveren (f.eks. 500-feil)
            throw new Error(`Serveren svarte med status: ${response.status}`);
        }

        const data = await response.json();

        // 4. Oppdater "Tenker..."-meldingen med det ekte svaret
        thinkingMessageElement.querySelector('p').textContent = data.answer || "Fikk ikke et gyldig svar fra agenten.";

    } catch (error) {
        console.error("Feil ved kall til agent-API:", error);
        // 5. Vis en feilmelding i chatten hvis noe gikk galt
        thinkingMessageElement.querySelector('p').textContent = "Beklager, en feil oppstod. Prøv igjen.";
    }
});

function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    const textElement = document.createElement('p');
    textElement.textContent = text;
    messageElement.appendChild(textElement);

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageElement;
}