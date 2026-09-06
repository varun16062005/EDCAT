const API_BASE_URL =
  (
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");


/* ============================================================
   SCAN FILE
   ============================================================ */

export async function scanFile(file) {
  if (!file) {
    throw new Error(
      "No file selected."
    );
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

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
      "Cannot connect to the ECDAT backend. Make sure the backend is running and the API URL is correct."
    );
  }


  /* ----------------------------------------------------------
     BACKEND ERROR
     ---------------------------------------------------------- */

  if (!response.ok) {
    let message =
      "ECDAT scan failed.";

    try {
      const errorData =
        await response.json();

      if (
        errorData?.detail
      ) {
        message = String(
          errorData.detail
        );
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(
      message
    );
  }


  /* ----------------------------------------------------------
     SCAN RESPONSE
     ---------------------------------------------------------- */

  try {
    return await response.json();
  } catch {
    throw new Error(
      "ECDAT returned an invalid scan response."
    );
  }
}


/* ============================================================
   PDF REPORT
   ============================================================

   Your current backend does NOT expose a dedicated PDF
   endpoint. The existing application therefore uses the
   browser print dialog to create/save the report as PDF.

   This preserves that functionality.
   ============================================================ */

export async function generatePdfReport() {
  if (
    typeof window ===
      "undefined" ||
    typeof window.print !==
      "function"
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