
const clientId = 1;

let expenses = [];
let editingId = null;

const form = document.getElementById("expenseForm");
const message = document.getElementById("message");

function today() {
    const now = new Date();
    const local = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    );
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
    const response = await fetch(url, options);
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

function resetForm() {
    editingId = null;
    form.reset();
    document.getElementById("spent_on").value = today();
    document.getElementById("formTitle").textContent =
        "Pridėti išlaidą";
    document.getElementById("saveButton").textContent =
        "Pridėti išlaidą";
    document.getElementById("cancelButton").hidden = true;
}

function renderExpenses() {
    const tbody = document.getElementById("expensesTable");
    tbody.replaceChildren();

    if (expenses.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = "Išlaidų dar nėra.";
        return;
    }

    for (const expense of expenses) {
        const row = tbody.insertRow();

        row.insertCell().textContent =
            expense.spent_on.slice(0, 10);

        row.insertCell().textContent = expense.category;
        row.insertCell().textContent =
            expense.description || "–";
        row.insertCell().textContent = money(expense.amount);

        const actions = row.insertCell();

        const editButton = document.createElement("button");
        editButton.textContent = "Redaguoti";
        editButton.className = "small";
        editButton.onclick = () => editExpense(expense.id);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Ištrinti";
        deleteButton.className = "small danger";
        deleteButton.onclick = () => deleteExpense(expense.id);

        actions.append(editButton, deleteButton);
    }
}

function renderAnalysis(analysis) {
    document.getElementById("total").textContent =
        money(analysis.total);

    document.getElementById("topCategory").textContent =
        analysis.top_category || "Nėra";

    const container = document.getElementById("categories");
    container.replaceChildren();

    const entries = Object.entries(analysis.by_category);

    if (entries.length === 0) {
        container.textContent = "Duomenų dar nėra.";
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

        const percent = analysis.total > 0
            ? (amount / analysis.total) * 100
            : 0;

        fill.style.width = `${percent}%`;

        background.append(fill);
        row.append(info, background);
        container.append(row);
    }
}

function renderForecast(data) {
    document.getElementById("forecast").textContent =
        data.forecast === null
            ? "Trūksta duomenų"
            : money(data.forecast);
}

function renderAnomalies(data) {
    const container = document.getElementById("anomalies");
    container.replaceChildren();

    if (!data.anomalies.length) {
        container.textContent =
            "Neįprastų mėnesinių išlaidų nenustatyta.";
        return;
    }

    for (const anomaly of data.anomalies) {
        const paragraph = document.createElement("p");
        paragraph.textContent =
            `${anomaly.month}: ${money(anomaly.amount)} – ` +
            `${anomaly.message} (ankstesnis vidurkis: ` +
            `${money(anomaly.average)})`;

        container.append(paragraph);
    }
}

async function loadData() {
    try {
        const [expenseData, analysis, forecast, anomalies] =
            await Promise.all([
                api(`/expenses/${clientId}`),
                api(`/analysis/${clientId}`),
                api(`/forecast/${clientId}`),
                api(`/anomalies/${clientId}`)
            ]);

        expenses = expenseData;

        renderExpenses();
        renderAnalysis(analysis);
        renderForecast(forecast);
        renderAnomalies(anomalies);

    } catch (error) {
        showMessage("Nepavyko įkelti duomenų: " +
            error.message, true);
    }
}

function editExpense(id) {
    const expense = expenses.find(item => item.id === id);

    if (!expense) return;

    editingId = id;

    document.getElementById("amount").value = expense.amount;
    document.getElementById("category").value = expense.category;
    document.getElementById("description").value =
        expense.description || "";
    document.getElementById("spent_on").value =
        expense.spent_on.slice(0, 10);

    document.getElementById("formTitle").textContent =
        "Redaguoti išlaidą";
    document.getElementById("saveButton").textContent =
        "Išsaugoti pakeitimus";
    document.getElementById("cancelButton").hidden = false;

    form.scrollIntoView({ behavior: "smooth" });
}

async function deleteExpense(id) {
    if (!confirm("Ar tikrai norite ištrinti išlaidą?")) {
        return;
    }

    try {
        await api(
            `/expenses/${id}?client_id=${clientId}`,
            { method: "DELETE" }
        );

        if (editingId === id) resetForm();

        showMessage("Išlaida ištrinta.");
        await loadData();

    } catch (error) {
        showMessage(error.message, true);
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const expense = {
        client_id: clientId,
        amount: Number(
            document.getElementById("amount").value
        ),
        category: document.getElementById("category").value,
        description:
            document.getElementById("description").value,
        spent_on:
            document.getElementById("spent_on").value +
            "T00:00:00"
    };

    try {
        const isEditing = editingId !== null;

        await api(
            isEditing
                ? `/expenses/${editingId}`
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

        showMessage(
            isEditing
                ? "Išlaida sėkmingai atnaujinta!"
                : "Išlaida sėkmingai pridėta!"
        );

        await loadData();

    } catch (error) {
        showMessage(error.message, true);
    }
});

document.getElementById("cancelButton").onclick = resetForm;

resetForm();
loadData();
