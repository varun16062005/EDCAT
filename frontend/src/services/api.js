const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");


/* ============================================================
   HELPERS
   ============================================================ */

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function parseResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return { detail: text };
    }
  } catch {
    return null;
  }
}

function normalizeRisk(riskTier, classicallyBroken) {
  if (classicallyBroken) {
    return "CRITICAL";
  }

  const value = String(riskTier || "").toLowerCase();

  if (
    value.includes("critical")
  ) {
    return "CRITICAL";
  }

  if (
    value.includes("elevated") ||
    value.includes("high")
  ) {
    return "HIGH";
  }

  if (
    value.includes("monitored") ||
    value.includes("medium")
  ) {
    return "MEDIUM";
  }

  if (
    value.includes("low")
  ) {
    return "LOW";
  }

  return "MEDIUM";
}

function normalizeCategory(type) {
  const value = String(type || "").toLowerCase();

  if (value === "library") {
    return "Library";
  }

  if (value === "algorithm") {
    return "Algorithm";
  }

  if (value === "key_size") {
    return "Key Material";
  }

  if (value === "certificate") {
    return "Certificate";
  }

  if (value === "configuration") {
    return "Configuration";
  }

  return type || "Cryptographic artefact";
}

function inferFileType(filePath) {
  const path = String(filePath || "").toLowerCase();

  if (
    path.endsWith(".java") ||
    path.endsWith(".kt") ||
    path.endsWith(".kts") ||
    path.endsWith(".py") ||
    path.endsWith(".js") ||
    path.endsWith(".jsx") ||
    path.endsWith(".ts") ||
    path.endsWith(".tsx") ||
    path.endsWith(".c") ||
    path.endsWith(".h") ||
    path.endsWith(".cpp") ||
    path.endsWith(".cc") ||
    path.endsWith(".hpp") ||
    path.endsWith(".go") ||
    path.endsWith(".rs") ||
    path.endsWith(".swift")
  ) {
    return "source-code";
  }

  if (
    path.endsWith(".json") ||
    path.endsWith(".yaml") ||
    path.endsWith(".yml") ||
    path.endsWith(".xml") ||
    path.endsWith(".conf") ||
    path.endsWith(".cfg") ||
    path.endsWith(".ini") ||
    path.endsWith(".properties") ||
    path.endsWith(".toml")
  ) {
    return "configuration";
  }

  if (
    path.endsWith(".pem") ||
    path.endsWith(".crt") ||
    path.endsWith(".cer") ||
    path.endsWith(".der") ||
    path.endsWith(".key")
  ) {
    return "certificate";
  }

  if (
    path.endsWith(".jar") ||
    path.endsWith(".war") ||
    path.endsWith(".aar") ||
    path.endsWith(".so") ||
    path.endsWith(".dll") ||
    path.endsWith(".dylib")
  ) {
    return "library";
  }

  if (
    path.endsWith(".txt") ||
    path.endsWith(".md") ||
    path.endsWith(".rst")
  ) {
    return "text";
  }

  return "binary";
}

function normalizeRecommendation(recommendation) {
  if (!recommendation) {
    return null;
  }

  if (typeof recommendation === "string") {
    return {
      alternative: recommendation,
      rationale: "",
    };
  }

  return {
    alternative:
      recommendation.alternative ||
      recommendation.action ||
      recommendation.title ||
      "",
    rationale:
      recommendation.rationale ||
      recommendation.reason ||
      "",
  };
}

function normalizeArtifact(rawArtifact, index) {
  const recommendation =
    normalizeRecommendation(
      rawArtifact?.recommendation
    );

  const risk =
    normalizeRisk(
      rawArtifact?.risk_tier,
      rawArtifact?.classically_broken
    );

  let quantumStatus =
    "NOT_CURRENTLY_QUANTUM_VULNERABLE";

  if (rawArtifact?.quantum_vulnerable) {
    quantumStatus = "VULNERABLE";
  } else if (
    String(rawArtifact?.risk_reason || "")
      .toLowerCase()
      .includes("legacy")
  ) {
    quantumStatus = "LEGACY_WEAK";
  }

  const migrationTargets = [];

  if (recommendation?.alternative) {
    migrationTargets.push(
      recommendation.alternative
    );
  }

  return {
    id:
      rawArtifact?.id ??
      `backend-artifact-${index + 1}`,

    file:
      rawArtifact?.file_path ||
      rawArtifact?.file ||
      "Unknown file",

    line:
      rawArtifact?.line_number ??
      rawArtifact?.line ??
      null,

    algorithm:
      rawArtifact?.algorithm ||
      null,

    category:
      normalizeCategory(
        rawArtifact?.type
      ),

    key_size:
      rawArtifact?.key_size ??
      null,

    mode:
      rawArtifact?.mode ||
      null,

    quantum_status:
      quantumStatus,

    risk,

    business_criticality:
      rawArtifact?.criticality ||
      "MEDIUM",

    data_sensitivity:
      rawArtifact?.data_sensitivity ||
      null,

    recommendation,

    recommendation_detail:
      recommendation,

    migration_targets:
      migrationTargets,

    source_evidence:
      rawArtifact?.source_evidence ||
      null,

    confidence:
      rawArtifact?.confidence ||
      null,

    risk_reason:
      rawArtifact?.risk_reason ||
      "",

    classically_broken:
      Boolean(
        rawArtifact?.classically_broken
      ),

    quantum_vulnerable:
      Boolean(
        rawArtifact?.quantum_vulnerable
      ),

    data_lifetime_years:
      rawArtifact?.data_lifetime_years ??
      null,

    migration_time_estimate_years:
      rawArtifact?.migration_time_estimate_years ??
      null,

    mosca_math:
      rawArtifact?.mosca_math ||
      null,
  };
}

function buildFiles(artifacts) {
  const fileMap = new Map();

  artifacts.forEach((artifact) => {
    const filePath =
      artifact.file ||
      "Unknown file";

    if (!fileMap.has(filePath)) {
      fileMap.set(
        filePath,
        {
          path: filePath,
          name: filePath.split("/").pop() || filePath,
          type: inferFileType(filePath),
        }
      );
    }
  });

  return Array.from(fileMap.values());
}

function buildSummary(
  backendResult,
  artifacts,
  files
) {
  const critical =
    artifacts.filter(
      (artifact) =>
        artifact.risk === "CRITICAL"
    ).length;

  const high =
    artifacts.filter(
      (artifact) =>
        artifact.risk === "HIGH"
    ).length;

  const medium =
    artifacts.filter(
      (artifact) =>
        artifact.risk === "MEDIUM"
    ).length;

  const low =
    artifacts.filter(
      (artifact) =>
        artifact.risk === "LOW"
    ).length;

  const quantumVulnerable =
    artifacts.filter(
      (artifact) =>
        artifact.quantum_vulnerable
    ).length;

  const legacyWeak =
    artifacts.filter(
      (artifact) =>
        artifact.quantum_status ===
        "LEGACY_WEAK"
    ).length;

  const recommendations =
    artifacts.filter(
      (artifact) =>
        artifact.recommendation
    ).length;

  const total =
    artifacts.length;

  const riskScore =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (
              critical * 100 +
              high * 70 +
              medium * 40 +
              low * 10
            ) / total
          )
        )
      : 0;

  return {
    files_scanned:
      files.length,

    crypto_assets:
      total,

    critical,

    high,

    medium,

    low,

    quantum_vulnerable:
      quantumVulnerable,

    legacy_weak:
      legacyWeak,

    recommendations,

    risk_score:
      backendResult?.risk_score ??
      riskScore,

    risk_horizon_years:
      backendResult?.risk_horizon_years ??
      12,

    security_posture:
      backendResult?.security_posture ||
      null,
  };
}

function normalizeScanResult(
  backendResult
) {
  const rawArtifacts =
    Array.isArray(
      backendResult?.artefacts
    )
      ? backendResult.artefacts
      : Array.isArray(
          backendResult?.artifacts
        )
        ? backendResult.artifacts
        : [];

  const artifacts =
    rawArtifacts.map(
      normalizeArtifact
    );

  const files =
    buildFiles(artifacts);

  const summary =
    buildSummary(
      backendResult,
      artifacts,
      files
    );

  return {
    ...backendResult,

    input: {
      name:
        extractInputName(
          backendResult
        ),

      size:
        null,

      type:
        "application/octet-stream",
    },

    files,

    artifacts,

    summary,

    scan_id:
      backendResult?.id ??
      backendResult?.scan_id ??
      null,

    status:
      backendResult?.status ||
      "done",

    generated_at:
      backendResult?.created_at ||
      new Date().toISOString(),
  };
}

function extractInputName(
  backendResult
) {
  const target =
    String(
      backendResult?.target ||
      ""
    );

  const match =
    target.match(
      /uploaded_file:\s*(.+)$/i
    );

  if (match?.[1]) {
    return match[1].trim();
  }

  return (
    backendResult?.input?.name ||
    backendResult?.name ||
    "Unnamed scan"
  );
}

function isCompleted(status) {
  const value =
    String(status || "")
      .toLowerCase()
      .trim();

  return (
    value === "done" ||
    value === "completed" ||
    value === "complete" ||
    value === "finished" ||
    value === "success" ||
    value === "succeeded"
  );
}

function isFailed(status) {
  const value =
    String(status || "")
      .toLowerCase()
      .trim();

  return (
    value === "failed" ||
    value === "error" ||
    value === "cancelled" ||
    value === "canceled"
  );
}


/* ============================================================
   GET SCAN
   ============================================================ */

export async function getScan(
  scanId
) {
  if (
    scanId === undefined ||
    scanId === null ||
    scanId === ""
  ) {
    throw new Error(
      "ECDAT did not return a scan ID."
    );
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/scans/${encodeURIComponent(
        scanId
      )}`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
        },
      }
    );
  } catch {
    throw new Error(
      "Cannot connect to the ECDAT backend."
    );
  }

  const data =
    await parseResponse(
      response
    );

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `Unable to retrieve scan (${response.status}).`
    );
  }

  return data;
}


/* ============================================================
   WAIT FOR SCAN
   ============================================================ */

export async function waitForScan(
  scanId,
  options = {}
) {
  const intervalMs =
    options.intervalMs ?? 1000;

  const maxAttempts =
    options.maxAttempts ?? 180;

  let lastResult = null;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt += 1
  ) {
    const result =
      await getScan(scanId);

    lastResult = result;

    if (
      isCompleted(
        result?.status
      )
    ) {
      return result;
    }

    if (
      isFailed(
        result?.status
      )
    ) {
      throw new Error(
        result?.detail ||
          result?.error ||
          `ECDAT scan failed with status "${result?.status}".`
      );
    }

    await sleep(
      intervalMs
    );
  }

  throw new Error(
    `ECDAT scan did not finish within the expected time. Last status: ${
      lastResult?.status || "unknown"
    }.`
  );
}


/* ============================================================
   SCAN FILE
   ============================================================ */

export async function scanFile(
  file
) {
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

  let createResponse;

  try {
    createResponse =
      await fetch(
        `${API_BASE_URL}/api/scans/`,
        {
          method: "POST",
          body: formData,
        }
      );
  } catch {
    throw new Error(
      "Cannot connect to the ECDAT backend. Make sure the backend URL is correct."
    );
  }

  const created =
    await parseResponse(
      createResponse
    );

  if (!createResponse.ok) {
    throw new Error(
      created?.detail ||
        `ECDAT scan creation failed (${createResponse.status}).`
    );
  }

  const scanId =
    created?.id ??
    created?.scan_id;

  if (
    scanId === undefined ||
    scanId === null
  ) {
    throw new Error(
      "ECDAT accepted the upload but did not return a scan ID."
    );
  }

  /*
   * The backend returns immediately with:
   *
   * {
   *   status: "queued",
   *   id: 3,
   *   ...
   * }
   *
   * We therefore poll GET /api/scans/{id}
   * until the scan is complete.
   */

  const completed =
    await waitForScan(
      scanId,
      {
        intervalMs: 1000,
        maxAttempts: 180,
      }
    );

  return normalizeScanResult(
    completed
  );
}


/* ============================================================
   PDF REPORT
   ============================================================ */

export async function generatePdfReport(
  scanResult
) {
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

  const inputName =
    scanResult?.input?.name ||
    "ECDAT scan";

  document.title =
    `${inputName} - ECDAT Report`;

  try {
    window.print();
  } finally {
    document.title =
      previousTitle;
  }
}


/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

export default {
  scanFile,
  getScan,
  waitForScan,
  generatePdfReport,
};