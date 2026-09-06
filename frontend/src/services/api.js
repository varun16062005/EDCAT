const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");


/* ============================================================
   SCAN FILE
   ============================================================ */

export async function scanFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const formData = new FormData();

  formData.append("file", file);

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/scans/`,
      {
        method: "POST",
        body: formData,
      }
    );
  } catch {
    throw new Error(
      "Cannot connect to the ECDAT backend. Make sure the backend is running and the API URL is correct."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Keep data as null when the response is not JSON.
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `ECDAT scan failed (${response.status}).`
    );
  }

  if (!data) {
    throw new Error(
      "ECDAT returned an empty scan response."
    );
  }

  return data;
}


/* ============================================================
   PDF REPORT
   ============================================================ */

export async function generatePdfReport() {
  if (
    typeof window === "undefined" ||
    typeof window.print !== "function"
  ) {
    throw new Error(
      "PDF export is only available in a browser."
    );
  }

  const previousTitle =
    document.title;

  document.title =
    "ecdat-scan-report";

  try {
    window.print();
  } finally {
    document.title =
      previousTitle;
  }
}