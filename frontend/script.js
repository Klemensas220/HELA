
let clientId = null;
let expenses = [];
let editingId = null;
let loadVersion = 0;
let busy = false;

const form = document.getElementById("expenseForm");
const message = document.getElementById("message");
const clientSelect = document.getElementById("clientSelect");
const activeClient = document.getElementById("activeClient");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

function today() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function money(value) {
    return Number(value).toLocaleString("lt-LT", {
        style: "currency",
        currency: "EUR"
    });
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError ? "error" : "success";
}

async function api(url, options = {}) {
    const response = await fetch(url, {
        cache: "no-store",
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        const detail = data.detail;

        throw new Error(
            typeof detail === "string"
                ? detail
                : JSON.stringify(detail || data)
        );
    }

    return data;
}

function setBusy(value) {
    busy = value;
    clientSelect.disabled = value || clientId === null;
    saveButton.disabled = value || clientId === null;
    cancelButton.disabled = value;
}

function resetForm() {
    editingId = null;
    form.reset();

    document.getElementById("spent_on").value = today();
    document.getElementById("formTitle").textContent = "Pridėti išlaidą";
    saveButton.textContent = "Pridėti išlaidą";
    cancelButton.hidden = true;
}

function updateActiveClient() {
    const selected = clientSelect.selectedOptions[0];

    if (!selected || clientId === null) {
        activeClient.textContent = "Klientas nepasirinktas";
        return;
    }

    activeClient.textContent =
        `Aktyvus klientas: ${selected.textContent} (ID: ${clientId})`;
}

function renderExpenses() {
    const tbody = document.getElementById("expensesTable");
    tbody.replaceChildren();

    if (expenses.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 5;
        cell.textContent = "Išlaidų nėra.";
        return;
    }

    for (const expense of expenses) {
        const row = tbody.insertRow();

        row.insertCell().textContent =
            String(expense.spent_on).slice(0, 10);

        row.insertCell().textContent = expense.category;
        row.insertCell().textContent = expense.description || "–";
        row.insertCell().textContent = money(expense.amount);

        const actions = row.insertCell();

        const editButton = document.createElement("button");
        editButton.textContent = "Redaguoti";
        editButton.className = "small";
        editButton.disabled = busy;
        editButton.onclick = () => editExpense(expense.id);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Ištrinti";
        deleteButton.className = "small danger";
        deleteButton.disabled = busy;
        deleteButton.onclick = () => deleteExpense(expense.id);

        actions.append(editButton, deleteButton);
    }
}

function renderAnalysis(analysis) {
    document.getElementById("total").textContent =
        money(analysis.total ?? 0);

    document.getElementById("topCategory").textContent =
        analysis.top_category || "Nėra";

    const container = document.getElementById("categories");
    container.replaceChildren();

    const entries = Object.entries(analysis.by_category || {});

    if (entries.length === 0) {
        container.textContent = "Duomenų nėra.";
        return;
    }

    for (const [category, amount] of entries) {
        const row = document.createElement("div");
        row.className = "category-row";

        const info = document.createElement("div");
        info.className = "category-info";

        const name = document.createElement("span");
        name.textContent = category;

        const sum = document.createElement("strong");
        sum.textContent = money(amount);

        info.append(name, sum);

        const background = document.createElement("div");
        background.className = "bar-background";

        const fill = document.createElement("div");
        fill.className = "bar-fill";

        const percent = Number(analysis.total) > 0
            ? Number(amount) / Number(analysis.total) * 100
            : 0;

        fill.style.width = `${percent}%`;

        background.append(fill);
        row.append(info, background);
        container.append(row);
    }
}

function renderForecast(data) {
    document.getElementById("forecast").textContent =
        data.forecast == null
            ? "Trūksta duomenų"
            : money(data.forecast);
}

function renderAnomalies(data) {
    const container = document.getElementById("anomalies");
    container.replaceChildren();

    const anomalies = data.anomalies || [];

    if (anomalies.length === 0) {
        container.textContent =
            "Neįprastų mėnesinių išlaidų nenustatyta.";
        return;
    }

    for (const anomaly of anomalies) {
        const paragraph = document.createElement("p");

        const amount = anomaly.amount ?? anomaly.total ?? 0;

        paragraph.textContent =
            `${anomaly.month || "Mėnuo"}: ${money(amount)} – ` +
            `${anomaly.message || "Neįprastai didelės išlaidos"}`;

        container.append(paragraph);
    }
}

function clearData() {
    expenses = [];
    renderExpenses();

    document.getElementById("total").textContent = "–";
    document.getElementById("forecast").textContent = "–";
    document.getElementById("topCategory").textContent = "–";

    document.getElementById("categories").replaceChildren();
    document.getElementById("anomalies").replaceChildren();
}

async function loadData() {
    if (clientId === null) {
        return;
    }

    const requestedClient = clientId;
    const currentVersion = ++loadVersion;

    try {
        const [expenseData, analysis, forecast, anomalies] =
            await Promise.all([
                api(`/expenses/${requestedClient}`),
                api(`/analysis/${requestedClient}`),
                api(`/forecast/${requestedClient}`),
                api(`/anomalies/${requestedClient}`)
            ]);

        if (
            requestedClient !== clientId ||
            currentVersion !== loadVersion
        ) {
            return;
        }

        expenses = expenseData;

        renderExpenses();
        renderAnalysis(analysis);
        renderForecast(forecast);
        renderAnomalies(anomalies);

    } catch (error) {
        if (
            requestedClient !== clientId ||
            currentVersion !== loadVersion
        ) {
            return;
        }

        clearData();
        showMessage("Duomenų įkėlimo klaida: " + error.message, true);
    }
}

async function loadClients() {
    try {
        const clients = await api("/clients");

        clientSelect.replaceChildren();

        if (!Array.isArray(clients) || clients.length === 0) {
            throw new Error("Klientų sąrašas tuščias.");
        }

        for (const client of clients) {
            const option = document.createElement("option");

            option.value = String(client.id);
            option.textContent = client.name;

            clientSelect.append(option);
        }

        clientId = Number(clientSelect.value);

        updateActiveClient();
        setBusy(false);
        await loadData();

    } catch (error) {
        clientId = null;
        clientSelect.replaceChildren();

        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Nepavyko įkelti klientų";

        clientSelect.append(option);

        updateActiveClient();
        setBusy(false);
        showMessage("Klientų įkėlimo klaida: " + error.message, true);
    }
}

function editExpense(id) {
    if (busy || clientId === null) {
        return;
    }

    const expense = expenses.find(item => item.id === id);

    if (!expense || Number(expense.client_id) !== clientId) {
        showMessage("Išlaida nepriklauso pasirinktam klientui.", true);
        return;
    }

    editingId = id;

    document.getElementById("amount").value = expense.amount;
    document.getElementById("category").value = expense.category;
    document.getElementById("description").value =
        expense.description || "";

    document.getElementById("spent_on").value =
        String(expense.spent_on).slice(0, 10);

    document.getElementById("formTitle").textContent =
        "Redaguoti išlaidą";

    saveButton.textContent = "Išsaugoti pakeitimus";
    cancelButton.hidden = false;

    form.scrollIntoView({ behavior: "smooth" });
}

async function deleteExpense(id) {
    if (busy || clientId === null) {
        return;
    }

    const selectedClient = clientId;

    const expense = expenses.find(item => item.id === id);

    if (!expense || Number(expense.client_id) !== selectedClient) {
        showMessage("Išlaida nepriklauso pasirinktam klientui.", true);
        return;
    }

    if (!confirm("Ar tikrai norite ištrinti šią išlaidą?")) {
        return;
    }

    setBusy(true);

    try {
        await api(
            `/expenses/${id}?client_id=${selectedClient}`,
            { method: "DELETE" }
        );

        if (editingId === id) {
            resetForm();
        }

        await loadData();
        showMessage("Išlaida sėkmingai ištrinta.");

    } catch (error) {
        showMessage(error.message, true);

    } finally {
        setBusy(false);
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (busy || clientId === null) {
        showMessage("Pasirinkite klientą.", true);
        return;
    }

    const selectedClient = clientId;
    const isEditing = editingId !== null;
    const expenseId = editingId;

    const expense = {
        client_id: selectedClient,
        amount: Number(document.getElementById("amount").value),
        category: document.getElementById("category").value,
        description: document.getElementById("description").value,
        spent_on:
            document.getElementById("spent_on").value + "T00:00:00"
    };

    if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
        showMessage("Suma turi būti didesnė už 0.", true);
        return;
    }

    setBusy(true);

    try {
        await api(
            isEditing
                ? `/expenses/${expenseId}`
                : "/expense",
            {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(expense)
            }
        );

        resetForm();
        await loadData();

        showMessage(
            isEditing
                ? "Išlaida sėkmingai atnaujinta!"
                : "Išlaida sėkmingai pridėta!"
        );

    } catch (error) {
        showMessage(error.message, true);

    } finally {
        setBusy(false);
    }
});

cancelButton.addEventListener("click", resetForm);

clientSelect.addEventListener("change", async (event) => {
    if (busy) {
        return;
    }

    const selectedId = Number(event.target.value);

    if (!Number.isInteger(selectedId) || selectedId <= 0) {
        return;
    }

    clientId = selectedId;

    resetForm();

    message.textContent = "";
    message.className = "";

    updateActiveClient();
    clearData();

    await loadData();
});

resetForm();
loadClients();
