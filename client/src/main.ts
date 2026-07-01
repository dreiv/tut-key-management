// Base URL pointing to your Vite proxy prefix
const API_BASE_URL = "/api";

// --- DOM Element References ---
const btnGenerate = document.getElementById(
  "btn-generate",
) as HTMLButtonElement;
const generatedKeyInput = document.getElementById(
  "generated-key",
) as HTMLInputElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;

const inputKey = document.getElementById("input-key") as HTMLInputElement;
const btnFetchAnalytics = document.getElementById(
  "btn-fetch-analytics",
) as HTMLButtonElement;
const btnFetchUsers = document.getElementById(
  "btn-fetch-users",
) as HTMLButtonElement;
const statusIndicator = document.getElementById(
  "status-indicator",
) as HTMLDivElement;
const responseOutput = document.getElementById(
  "response-output",
) as HTMLPreElement;

// --- Helper Functions ---

function updateStatusBadge(status: number, statusText: string) {
  statusIndicator.textContent = `${status} ${statusText}`;

  if (status >= 200 && status < 300) {
    statusIndicator.style.color = "green";
  } else {
    statusIndicator.style.color = "red";
  }
}

// Universal fetch handler for protected resources
async function fetchFromResource(endpoint: "analytics" | "users") {
  const token = inputKey.value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "GET",
      headers: {
        "X-API-Key": token,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    updateStatusBadge(response.status, response.statusText);
    responseOutput.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    updateStatusBadge(500, "Network Error");
    responseOutput.textContent = JSON.stringify(
      {
        error: "Failed to communicate with the API server.",
      },
      null,
      2,
    );
  }
}

// --- Event Listeners ---

// 1. Handle Token Minting
btnGenerate.addEventListener("click", async () => {
  const checkedBoxes = document.querySelectorAll<HTMLInputElement>(
    'input[name="scope"]:checked',
  );
  const selectedRoles = Array.from(checkedBoxes).map((box) => box.value);

  try {
    const response = await fetch(`${API_BASE_URL}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: selectedRoles }),
    });

    if (!response.ok) {
      const errData = await response.json();
      alert(`Error: ${errData.error}`);
      return;
    }

    const data = (await response.json()) as { apiKey: string };

    generatedKeyInput.value = data.apiKey;
    inputKey.value = data.apiKey; // Auto-populate the playground for convenience
  } catch (error) {
    alert("Could not connect to the server to generate a key.");
  }
});

// 2. Handle Copy to Clipboard
btnCopy.addEventListener("click", async () => {
  if (!generatedKeyInput.value) return;

  try {
    await navigator.clipboard.writeText(generatedKeyInput.value);
    const originalText = btnCopy.textContent;
    btnCopy.textContent = "Copied! ✅";
    setTimeout(() => {
      btnCopy.textContent = originalText;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
});

// 3. Connect Playground Request Triggers
btnFetchAnalytics.addEventListener("click", () =>
  fetchFromResource("analytics"),
);
btnFetchUsers.addEventListener("click", () => fetchFromResource("users"));
