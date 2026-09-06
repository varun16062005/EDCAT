const API_BASE_URL = "http://127.0.0.1:8000";

export async function scanFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const formData = new FormData();
  formData.append("file", file);

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/scan`,
      {
        method: "POST",
        body: formData,
      }
    );
  } catch {
    throw new Error(
      "Cannot connect to the ECDAT backend. Make sure FastAPI is running on port 8000."
    );
  }

  if (!response.ok) {
    let message = "ECDAT scan failed.";

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        message = String(errorData.detail);
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(
      "ECDAT returned an invalid scan response."
    );
  }
}

// The backend currently exposes scan endpoints only. Use the browser's
// print-to-PDF flow until a dedicated server-side PDF endpoint is added.
export async function generatePdfReport() {
  if (
    typeof window === "undefined" ||
    typeof window.print !== "function"
  ) {
    throw new Error(
      "PDF export is only available in a browser."
    );
  }

  const previousTitle = document.title;
  document.title = "ecdat-scan-report";

  try {
    window.print();
  } finally {
    document.title = previousTitle;
  }
}
