// Når siden er lastet, kjør denne koden
document.addEventListener('DOMContentLoaded', () => {

    // --- DUMMY-DATA (erstatt med data fra BigQuery senere) ---
    const boligData = [
        { adresse: "Storgata 1", pris: 5200000, soverom: 2 },
        { adresse: "Parkveien 4", pris: 7800000, soverom: 4 },
        { adresse: "Langgata 12", pris: 4100000, soverom: 2 },
        { adresse: "Fjellveien 22", pris: 6500000, soverom: 3 },
        { adresse: "Strandveien 5", pris: 9500000, soverom: 4 },
    ];
    // ----------------------------------------------------


    // 1. Lag et sirkeldiagram for antall soverom
    const pieCtx = document.getElementById('myPieChart').getContext('2d');
    const soveromCounts = boligData.reduce((acc, bolig) => {
        acc[bolig.soverom] = (acc[bolig.soverom] || 0) + 1;
        return acc;
    }, {});

    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(soveromCounts).map(s => `${s} soverom`),
            datasets: [{
                data: Object.values(soveromCounts),
                backgroundColor: ['#ff6384', '#36a2eb', '#ffce56'],
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Fordeling av antall soverom' } }
        }
    });


    // 2. Lag et stolpediagram for pris per bolig
    const barCtx = document.getElementById('myBarChart').getContext('2d');
    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: boligData.map(b => b.adresse),
            datasets: [{
                label: 'Pris i NOK',
                data: boligData.map(b => b.pris),
                backgroundColor: '#36a2eb',
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Pris per bolig' } }
        }
    });

    // 3. Fyll tabellen med rådata
    const tableBody = document.querySelector('#dataTable tbody');
    boligData.forEach(bolig => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = bolig.adresse;
        row.insertCell(1).textContent = bolig.pris.toLocaleString('nb-NO');
        row.insertCell(2).textContent = bolig.soverom;
    });
});