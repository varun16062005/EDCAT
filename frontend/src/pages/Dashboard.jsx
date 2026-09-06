import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Code2,
  Download,
  FileArchive,
  FileCode2,
  Filter,
  HardDrive,
  History,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  Network,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react";

import {
  Fragment,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  generatePdfReport,
} from "../services/api";


const CURRENT_SCAN_KEY =
  "ecdatScanResult";

const HISTORY_KEY =
  "ecdatScanHistory";


/* ============================================================
   STORAGE
   ============================================================ */

function getStoredHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(
        HISTORY_KEY
      ) || "[]"
    );
  } catch {
    return [];
  }
}


function getInitialResult(
  location
) {
  if (
    location.state?.scanResult
  ) {
    return location.state.scanResult;
  }

  const saved =
    sessionStorage.getItem(
      CURRENT_SCAN_KEY
    );

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    sessionStorage.removeItem(
      CURRENT_SCAN_KEY
    );

    return null;
  }
}


/* ============================================================
   SECURITY POSTURE
   ============================================================ */

function derivePosture(
  summary
) {
  if (
    (summary.critical || 0) > 0
  ) {
    return {
      key: "CRITICAL",
      label: "Highly Critical",
      description:
        "Critical cryptographic findings are present and should be prioritized for immediate remediation.",
      className: "critical",
    };
  }

  if (
    (summary.high || 0) > 0 ||
    (summary.quantum_vulnerable || 0) > 0
  ) {
    return {
      key: "HIGH",
      label: "High Risk",
      description:
        "Quantum-vulnerable or high-risk cryptographic assets require migration planning.",
      className: "high",
    };
  }

  if (
    (summary.medium || 0) > 0 ||
    (summary.legacy_weak || 0) > 0
  ) {
    return {
      key: "ELEVATED",
      label: "Elevated",
      description:
        "Weak, legacy or review-required cryptography was identified.",
      className: "elevated",
    };
  }

  return {
    key: "NORMAL",
    label: "Normal",
    description:
      "No critical or high-risk cryptographic findings were identified by the current scanner.",
    className: "normal",
  };
}


/* ============================================================
   FILE TYPES
   ============================================================ */

function getFileTypeInfo(
  type
) {
  const value =
    String(type || "")
      .toLowerCase();

  if (
    value === "source-code"
  ) {
    return {
      label: "Source Code",
      icon: Code2,
    };
  }

  if (
    value === "configuration"
  ) {
    return {
      label: "Configuration",
      icon: FileCode2,
    };
  }

  if (
    value === "certificate"
  ) {
    return {
      label: "Certificates",
      icon: KeyRound,
    };
  }

  if (
    value === "private-key"
  ) {
    return {
      label: "Private Keys",
      icon: LockKeyhole,
    };
  }

  if (
    value === "public-key"
  ) {
    return {
      label: "Public Keys",
      icon: KeyRound,
    };
  }

  if (
    value === "key-material"
  ) {
    return {
      label: "Key Material",
      icon: KeyRound,
    };
  }

  if (
    value === "archive"
  ) {
    return {
      label: "Archives",
      icon: FileArchive,
    };
  }

  if (
    value === "library"
  ) {
    return {
      label: "Libraries",
      icon: Archive,
    };
  }

  if (
    value === "container"
  ) {
    return {
      label: "Containers",
      icon: Archive,
    };
  }

  if (
    value === "text"
  ) {
    return {
      label: "Text",
      icon: FileCode2,
    };
  }

  return {
    label: type || "Binary",
    icon: HardDrive,
  };
}


/* ============================================================
   STATUS
   ============================================================ */

function getRiskClass(
  risk
) {
  return `risk-badge ${String(
    risk || ""
  ).toLowerCase()}`;
}


function getQuantumClass(
  status
) {
  if (
    status === "VULNERABLE"
  ) {
    return "quantum-badge vulnerable";
  }

  if (
    status === "LEGACY_WEAK"
  ) {
    return "quantum-badge legacy";
  }

  if (
    status === "REVIEW"
  ) {
    return "quantum-badge review";
  }

  return "quantum-badge safe";
}


function getQuantumLabel(
  status
) {
  switch (status) {
    case "VULNERABLE":
      return "Vulnerable";

    case "LEGACY_WEAK":
      return "Legacy / Weak";

    case "NOT_CURRENTLY_QUANTUM_VULNERABLE":
      return "Protected";

    case "REVIEW":
      return "Review";

    default:
      return status || "Unknown";
  }
}


function formatDate(
  value
) {
  try {
    return new Date(
      value
    ).toLocaleString(
      [],
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return "Unknown";
  }
}


/* ============================================================
   EXPORT
   ============================================================ */

function downloadFile(
  content,
  fileName,
  contentType
) {
  const blob =
    new Blob(
      [content],
      {
        type: contentType,
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;
  link.download =
    fileName;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );
}


/* ============================================================
   SUMMARY CARD
   ============================================================ */

function DashboardSummary({
  label,
  value,
  description,
  icon,
  light = false,
}) {
  return (
    <div
      className={`dashboard-summary-card ${
        light ? "light" : ""
      }`}
    >
      <div className="summary-top">
        <span>
          {label}
        </span>

        <div className="summary-icon">
          {icon}
        </div>
      </div>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>
    </div>
  );
}


/* ============================================================
   RISK BAR
   ============================================================ */

function RiskBar({
  label,
  value,
  max,
  className,
}) {
  return (
    <div className="risk-row">
      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <div className="risk-track">
        <div
          className={`risk-fill ${className}`}
          style={{
            width: `${
              (value / max) *
              100
            }%`,
          }}
        />
      </div>
    </div>
  );
}


/* ============================================================
   MAIN DASHBOARD
   ============================================================ */

function Dashboard() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  /*
   * IMPORTANT:
   *
   * There is NO selectedArtifact state here.
   *
   * The previous implementation opened a right-side
   * artifact drawer using selectedArtifact.
   *
   * That has intentionally been removed.
   */

  const [
    scanResult,
    setScanResult,
  ] = useState(() =>
    getInitialResult(
      location
    )
  );

  const [
    history,
    setHistory,
  ] = useState(
    getStoredHistory
  );

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    riskFilter,
    setRiskFilter,
  ] = useState("ALL");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("ALL");

  const [
    quantumFilter,
    setQuantumFilter,
  ] = useState("ALL");

  const [
    pdfLoading,
    setPdfLoading,
  ] = useState(false);

  const [
    expandedArtifactId,
    setExpandedArtifactId,
  ] = useState(null);


  /* ==========================================================
     DATA
     ========================================================== */

  const summary =
    scanResult?.summary || {
      files_scanned: 0,
      crypto_assets: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      quantum_vulnerable: 0,
      legacy_weak: 0,
      recommendations: 0,
      risk_score: 0,
    };

  const files =
    scanResult?.files || [];

  const artifacts =
    scanResult?.artifacts || [];

  const posture =
    summary.security_posture ||
    derivePosture(
      summary
    );


  /* ==========================================================
     FILE TYPE COUNTS
     ========================================================== */

  const fileTypes =
    useMemo(() => {
      const counts = {};

      files.forEach(
        (file) => {
          const type =
            file.type ||
            "binary";

          counts[type] =
            (counts[type] || 0) +
            1;
        }
      );

      return Object.entries(
        counts
      ).sort(
        (a, b) =>
          b[1] - a[1]
      );
    }, [files]);


  /* ==========================================================
     CATEGORIES
     ========================================================== */

  const categories =
    useMemo(
      () => [
        ...new Set(
          artifacts
            .map(
              (artifact) =>
                artifact.category
            )
            .filter(Boolean)
        ),
      ],
      [artifacts]
    );


  /* ==========================================================
     ALGORITHM COUNTS
     ========================================================== */

  const algorithms =
    useMemo(() => {
      const counts = {};

      artifacts.forEach(
        (artifact) => {
          const algorithm =
            artifact.algorithm ||
            "Unknown";

          counts[algorithm] =
            (counts[algorithm] ||
              0) + 1;
        }
      );

      return Object.entries(
        counts
      ).sort(
        (a, b) =>
          b[1] - a[1]
      );
    }, [artifacts]);


  /* ==========================================================
     FILTERED ARTIFACTS
     ========================================================== */

  const filteredArtifacts =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      return artifacts.filter(
        (artifact) => {
          const searchable =
            [
              artifact.file,
              artifact.algorithm,
              artifact.category,
              artifact.key_size,
              artifact.mode,
              artifact.business_criticality,
              artifact.data_sensitivity,
              artifact.recommendation,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !query ||
            searchable.includes(
              query
            );

          const matchesRisk =
            riskFilter === "ALL" ||
            artifact.risk ===
              riskFilter;

          const matchesType =
            typeFilter === "ALL" ||
            artifact.category ===
              typeFilter;

          const matchesQuantum =
            quantumFilter ===
              "ALL" ||
            artifact.quantum_status ===
              quantumFilter;

          return (
            matchesSearch &&
            matchesRisk &&
            matchesType &&
            matchesQuantum
          );
        }
      );
    }, [
      artifacts,
      searchTerm,
      riskFilter,
      typeFilter,
      quantumFilter,
    ]);


  /* ==========================================================
     RISK DATA
     ========================================================== */

  const maxRisk =
    Math.max(
      summary.critical || 0,
      summary.high || 0,
      summary.medium || 0,
      summary.low || 0,
      1
    );

  const quantumExposure =
    summary.crypto_assets >
    0
      ? Math.round(
          (
            (summary.quantum_vulnerable ||
              0) /
            summary.crypto_assets
          ) *
            100
        )
      : 0;


  /* ==========================================================
     RECOMMENDATION COUNTS
     ========================================================== */

  const recommendations =
    useMemo(() => {
      const counts =
        new Map();

      artifacts.forEach(
        (artifact) => {
          const targets =
            artifact.migration_targets ||
            artifact
              .recommendation_detail
              ?.migration_targets ||
            [];

          targets.forEach(
            (target) => {
              counts.set(
                target,
                (
                  counts.get(
                    target
                  ) || 0
                ) + 1
              );
            }
          );
        }
      );

      return [
        ...counts.entries(),
      ]
        .map(
          ([target, count]) => ({
            target,
            count,
          })
        )
        .sort(
          (a, b) =>
            b.count -
            a.count
        );
    }, [artifacts]);


  /* ==========================================================
     BUSINESS CRITICALITY
     ========================================================== */

  const businessCounts =
    useMemo(() => {
      const counts = {};

      artifacts.forEach(
        (artifact) => {
          const value =
            artifact.business_criticality ||
            "MEDIUM";

          counts[value] =
            (counts[value] ||
              0) + 1;
        }
      );

      return counts;
    }, [artifacts]);


  /* ==========================================================
     MOSCA COUNTS
     ========================================================== */

  const moscaCounts =
    useMemo(() => {
      const counts = {
        ACTION_REQUIRED: 0,
        PRIORITIZE: 0,
        PLAN: 0,
      };

      artifacts.forEach(
        (artifact) => {
          const status =
            artifact.mosca?.status;

          if (
            status &&
            Object.prototype.hasOwnProperty.call(
              counts,
              status
            )
          ) {
            counts[status] +=
              1;
          }
        }
      );

      return counts;
    }, [artifacts]);


  /* ==========================================================
     SCROLL
     ========================================================== */

  const scrollTo = (
    id
  ) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };


  /* ==========================================================
     HISTORY
     ========================================================== */

  const loadHistoryEntry =
    (entry) => {
      if (
        !entry?.result
      ) {
        return;
      }

      setScanResult(
        entry.result
      );

      sessionStorage.setItem(
        CURRENT_SCAN_KEY,
        JSON.stringify(
          entry.result
        )
      );

      setSearchTerm("");
      setRiskFilter("ALL");
      setTypeFilter("ALL");
      setQuantumFilter(
        "ALL"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  const clearHistory = () => {
    localStorage.removeItem(
      HISTORY_KEY
    );

    setHistory([]);
  };


  /* ==========================================================
     EXPORT JSON
     ========================================================== */

  const exportJSON = () => {
    downloadFile(
      JSON.stringify(
        scanResult,
        null,
        2
      ),
      "ecdat-scan-report.json",
      "application/json"
    );
  };


  /* ==========================================================
     EXPORT CSV
     ========================================================== */

  const exportCSV = () => {
    if (
      !artifacts.length
    ) {
      return;
    }

    const headers = [
      "File",
      "Line",
      "Algorithm",
      "Category",
      "Key Size",
      "Mode",
      "Quantum Status",
      "Risk",
      "Business Criticality",
      "Recommendation",
      "Migration Targets",
    ];

    const rows =
      artifacts.map(
        (artifact) => [
          artifact.file,
          artifact.line,
          artifact.algorithm,
          artifact.category,
          artifact.key_size,
          artifact.mode,
          artifact.quantum_status,
          artifact.risk,
          artifact.business_criticality,
          artifact.recommendation,
          (
            artifact.migration_targets ||
            []
          ).join(
            " | "
          ),
        ]
      );

    const quote =
      (value) =>
        `"${String(
          value ?? ""
        ).replaceAll(
          '"',
          '""'
        )}"`;

    const csv = [
      headers,
      ...rows,
    ]
      .map(
        (row) =>
          row
            .map(
              quote
            )
            .join(",")
      )
      .join("\n");

    downloadFile(
      csv,
      "ecdat-inventory.csv",
      "text/csv;charset=utf-8"
    );
  };


  /* ==========================================================
     EXPORT PDF
     ========================================================== */

  const exportPDF =
    async () => {
      setPdfLoading(true);

      try {
        await generatePdfReport(
          scanResult
        );
      } catch (error) {
        window.alert(
          error?.message ||
            "Unable to generate PDF report."
        );
      } finally {
        setPdfLoading(
          false
        );
      }
    };


  /* ==========================================================
     EMPTY STATE
     ========================================================== */

  if (!scanResult) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-logo">
          <img
            src="/ecdat-logo.png"
            alt="ECDAT"
          />
        </div>

        <h2>
          No scan available
        </h2>

        <p>
          Upload a project or
          cryptographic artefact
          from the ECDAT homepage.
        </p>

        <button
          className="dashboard-primary-button"
          onClick={() =>
            navigate("/")
          }
        >
          <ArrowLeft size={15} />
          Back to upload
        </button>
      </div>
    );
  }


  /* ==========================================================
     DASHBOARD
     ========================================================== */

  return (
    <div className="dashboard-shell">

      {/* ======================================================
          SIDE RAIL
      ====================================================== */}

      <aside className="dashboard-rail">

        <div className="dashboard-logo-container">
          <img
            src="/ecdat-logo.png"
            alt="ECDAT"
            className="ecdat-logo"
          />
        </div>

        <nav className="dashboard-rail-nav">

          <button
            className="dashboard-rail-item active"
            title="Dashboard"
            onClick={() =>
              scrollTo(
                "dashboard-overview"
              )
            }
          >
            <Network size={19} />
          </button>


          <button
            className="dashboard-rail-item"
            title="Discovery"
            onClick={() =>
              scrollTo(
                "discovered-content"
              )
            }
          >
            <Search size={19} />
          </button>


          <button
            className="dashboard-rail-item"
            title="Risk"
            onClick={() =>
              scrollTo(
                "risk-analysis"
              )
            }
          >
            <ShieldAlert
              size={19}
            />
          </button>


          <button
            className="dashboard-rail-item"
            title="Cryptographic assets"
            onClick={() =>
              scrollTo(
                "inventory"
              )
            }
          >
            <LockKeyhole
              size={19}
            />
          </button>


          <button
            className="dashboard-rail-item"
            title="Recommendations"
            onClick={() =>
              scrollTo(
                "recommendations"
              )
            }
          >
            <Lightbulb
              size={19}
            />
          </button>


          <button
            className="dashboard-rail-item"
            title="History"
            onClick={() =>
              scrollTo(
                "history"
              )
            }
          >
            <History size={19} />
          </button>

        </nav>


        <div className="dashboard-rail-bottom">

          <button
            className="dashboard-rail-item"
            title="Back to upload"
            onClick={() =>
              navigate("/")
            }
          >
            <ArrowLeft size={19} />
          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="dashboard-main">

        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <header className="dashboard-topbar">

          <div className="dashboard-search">

            <Search size={15} />

            <input
              value={searchTerm}
              onChange={(
                event
              ) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search report"
              aria-label="Search report"
            />

          </div>


          <div className="dashboard-title-mini">
            ECDAT ANALYSIS WORKSPACE
          </div>


          <div
            className={`dashboard-top-posture ${posture.className}`}
          >
            <span></span>

            {posture.label}
          </div>

        </header>


        <div
          className="dashboard-content"
          id="dashboard-overview"
        >

          {/* ==================================================
              HEADER
          ================================================== */}

          <section className="report-header">

            <div>

              <span className="section-kicker">
                CRYPTOGRAPHIC RESULTS
              </span>

              <h1>
                Security intelligence
              </h1>

              <p>
                {
                  scanResult.input?.name ||
                  "Uploaded project"
                }
                {" · "}
                {
                  formatDate(
                    location.state
                      ?.historyEntry
                      ?.timestamp ||
                      new Date()
                  )
                }
              </p>

            </div>


            <div className="report-actions">

              <button
                className="dashboard-secondary-button"
                onClick={
                  exportPDF
                }
                disabled={
                  pdfLoading
                }
              >
                <Download size={14} />

                {pdfLoading
                  ? "Generating..."
                  : "PDF"}
              </button>


              <button
                className="dashboard-secondary-button"
                onClick={
                  exportCSV
                }
                disabled={
                  !artifacts.length
                }
              >
                <Download size={14} />
                CSV
              </button>


              <button
                className="dashboard-secondary-button"
                onClick={
                  exportJSON
                }
              >
                <Download size={14} />
                JSON
              </button>


              <button
                className="dashboard-primary-button"
                onClick={() =>
                  navigate("/")
                }
              >
                New Scan
              </button>

            </div>

          </section>


          {/* ==================================================
              FLOW
          ================================================== */}

          <section className="analysis-flow">

            <FlowStep
              number="01"
              title="Discover"
              description="Inventory assets"
              icon={
                <Search size={18} />
              }
            />

            <div className="analysis-flow-line"></div>

            <FlowStep
              number="02"
              title="Assess"
              description="Identify risk"
              icon={
                <ShieldAlert
                  size={18}
                />
              }
            />

            <div className="analysis-flow-line"></div>

            <FlowStep
              number="03"
              title="Recommend"
              description="Plan migration"
              icon={
                <Lightbulb
                  size={18}
                />
              }
            />

            <div className="analysis-flow-line"></div>

            <FlowStep
              number="04"
              title="Inspect"
              description="Open evidence"
              icon={
                <Code2 size={18} />
              }
            />

          </section>


          {/* ==================================================
              SUMMARY CARDS
          ================================================== */}

          <section className="dashboard-summary-grid">

            <DashboardSummary
              label="Files"
              value={
                summary.files_scanned
              }
              description="Files scanned"
              icon={
                <FileCode2
                  size={16}
                />
              }
              light
            />


            <DashboardSummary
              label="Crypto assets"
              value={
                summary.crypto_assets
              }
              description="Detected artefacts"
              icon={
                <LockKeyhole
                  size={16}
                />
              }
            />


            <DashboardSummary
              label="Critical"
              value={
                summary.critical
              }
              description="Immediate attention"
              icon={
                <ShieldAlert
                  size={16}
                />
              }
            />


            <DashboardSummary
              label="High"
              value={
                summary.high
              }
              description="Priority findings"
              icon={
                <ShieldAlert
                  size={16}
                />
              }
            />


            <DashboardSummary
              label="Quantum vulnerable"
              value={
                summary.quantum_vulnerable
              }
              description="PQC planning required"
              icon={
                <ShieldAlert
                  size={16}
                />
              }
            />


            <DashboardSummary
              label="Recommendations"
              value={
                summary.recommendations ||
                0
              }
              description="Findings with guidance"
              icon={
                <Lightbulb
                  size={16}
                />
              }
            />

          </section>


          {/* ==================================================
              SECURITY POSTURE
          ================================================== */}

          <section
            className={`security-posture-card ${posture.className}`}
          >

            <div className="security-posture-left">

              <div className="security-posture-icon">

                {posture.key ===
                "NORMAL" ? (
                  <ShieldCheck
                    size={22}
                  />
                ) : (
                  <ShieldAlert
                    size={22}
                  />
                )}

              </div>


              <div>

                <span className="section-kicker">
                  SECURITY POSTURE
                </span>

                <h2>
                  {posture.label}
                </h2>

                <p>
                  {
                    posture.description
                  }
                </p>

              </div>

            </div>


            <div className="security-posture-metrics">

              <div>
                <span>
                  Critical
                </span>

                <strong>
                  {summary.critical}
                </strong>
              </div>


              <div>
                <span>
                  High
                </span>

                <strong>
                  {summary.high}
                </strong>
              </div>


              <div>
                <span>
                  Quantum
                </span>

                <strong>
                  {
                    summary.quantum_vulnerable
                  }
                </strong>
              </div>


              <div>
                <span>
                  Exposure
                </span>

                <strong>
                  {quantumExposure}%
                </strong>
              </div>

            </div>

          </section>


          {/* ==================================================
              DISCOVERED CONTENT
          ================================================== */}

          <section
            className="dashboard-card"
            id="discovered-content"
          >

            <div className="dashboard-card-header">

              <div>

                <span className="section-kicker">
                  DISCOVERED CONTENT
                </span>

                <h2>
                  What is available in the upload
                </h2>

              </div>


              <div className="card-count">
                {files.length} files
              </div>

            </div>


            <div className="content-type-grid">

              {fileTypes.map(
                ([type, count]) => {
                  const info =
                    getFileTypeInfo(
                      type
                    );

                  const Icon =
                    info.icon;

                  return (
                    <button
                      className="content-type-card"
                      key={type}
                      onClick={() =>
                        scrollTo(
                          "inventory"
                        )
                      }
                    >

                      <div className="content-type-icon">
                        <Icon size={19} />
                      </div>


                      <div className="content-type-copy">

                        <strong>
                          {info.label}
                        </strong>

                        <span>
                          {count}{" "}
                          {count === 1
                            ? "file"
                            : "files"}
                        </span>

                      </div>


                      <ArrowUpRight
                        size={15}
                        className="content-type-arrow"
                      />

                    </button>
                  );
                }
              )}


              {!fileTypes.length && (
                <div className="no-data-message">
                  No files discovered.
                </div>
              )}

            </div>

          </section>


          {/* ==================================================
              RISK + ALGORITHM
          ================================================== */}

          <section
            className="dashboard-two-column"
            id="risk-analysis"
          >

            <div className="dashboard-card">

              <div className="dashboard-card-header">

                <div>

                  <span className="section-kicker">
                    RISK ANALYTICS
                  </span>

                  <h2>
                    Risk distribution
                  </h2>

                </div>

              </div>


              <div className="risk-chart">

                <RiskBar
                  label="Critical"
                  value={
                    summary.critical
                  }
                  max={maxRisk}
                  className="critical"
                />


                <RiskBar
                  label="High"
                  value={
                    summary.high
                  }
                  max={maxRisk}
                  className="high"
                />


                <RiskBar
                  label="Medium"
                  value={
                    summary.medium
                  }
                  max={maxRisk}
                  className="medium"
                />


                <RiskBar
                  label="Low"
                  value={
                    summary.low
                  }
                  max={maxRisk}
                  className="low"
                />

              </div>


              <div className="risk-footer">

                <div>
                  <span>
                    Quantum vulnerable
                  </span>

                  <strong>
                    {
                      summary.quantum_vulnerable
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Legacy / weak
                  </span>

                  <strong>
                    {
                      summary.legacy_weak
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Exposure
                  </span>

                  <strong>
                    {quantumExposure}%
                  </strong>
                </div>

              </div>

            </div>


            <div className="dashboard-card">

              <div className="dashboard-card-header">

                <div>

                  <span className="section-kicker">
                    ALGORITHM ANALYSIS
                  </span>

                  <h2>
                    Cryptographic distribution
                  </h2>

                </div>

                <BarChart3 size={18} />

              </div>


              <div className="algorithm-layout">

                <div className="algorithm-donut">

                  <div>

                    <strong>
                      {
                        summary.crypto_assets
                      }
                    </strong>

                    <span>
                      Assets
                    </span>

                  </div>

                </div>


                <div className="algorithm-list">

                  {algorithms
                    .slice(0, 8)
                    .map(
                      (
                        [
                          name,
                          count,
                        ],
                        index
                      ) => (
                        <div
                          className="algorithm-row"
                          key={name}
                        >

                          <div>

                            <span
                              className={`algorithm-dot dot-${index}`}
                            />

                            <span>
                              {name}
                            </span>

                          </div>


                          <strong>
                            {count}
                          </strong>

                        </div>
                      )
                    )}

                </div>

              </div>

            </div>

          </section>


          {/* ==================================================
              BUSINESS + MOSCA
          ================================================== */}

          <section className="dashboard-two-column">

            <div className="dashboard-card">

              <div className="dashboard-card-header">

                <div>

                  <span className="section-kicker">
                    BUSINESS CRITICALITY
                  </span>

                  <h2>
                    Remediation priority
                  </h2>

                </div>

                <Target size={19} />

              </div>


              <div className="business-criticality-grid">

                {[
                  [
                    "CRITICAL",
                    "critical",
                  ],
                  [
                    "HIGH",
                    "high",
                  ],
                  [
                    "MEDIUM",
                    "medium",
                  ],
                  [
                    "LOW",
                    "low",
                  ],
                ].map(
                  ([
                    label,
                    className,
                  ]) => (
                    <div
                      className={`business-criticality-card ${className}`}
                      key={label}
                    >

                      <span>
                        {label}
                      </span>

                      <strong>
                        {
                          businessCounts[
                            label
                          ] || 0
                        }
                      </strong>

                      <small>
                        assets
                      </small>

                    </div>
                  )
                )}

              </div>

            </div>


            <div className="dashboard-card">

              <div className="dashboard-card-header">

                <div>

                  <span className="section-kicker">
                    MOSCA-STYLE ASSESSMENT
                  </span>

                  <h2>
                    Migration timing
                  </h2>

                </div>

              </div>


              <div className="mosca-summary">

                <div className="mosca-primary">

                  <span>
                    Planning horizon
                  </span>

                  <strong>
                    {
                      summary.planning_horizon_years ||
                      10
                    }{" "}
                    yrs
                  </strong>

                </div>


                <div className="mosca-status-grid">

                  <div>

                    <span>
                      Action required
                    </span>

                    <strong>
                      {
                        moscaCounts.ACTION_REQUIRED
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Prioritize
                    </span>

                    <strong>
                      {
                        moscaCounts.PRIORITIZE
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Plan
                    </span>

                    <strong>
                      {
                        moscaCounts.PLAN
                      }
                    </strong>

                  </div>

                </div>

              </div>


              <div className="mosca-note">
                Data lifetime plus estimated
                migration time is compared with
                the configured planning horizon.
              </div>

            </div>

          </section>


          {/* ==================================================
              RECOMMENDATIONS
          ================================================== */}

          <section
            className="dashboard-card recommendation-dashboard-card"
            id="recommendations"
          >

            <div className="dashboard-card-header">

              <div>

                <span className="section-kicker">
                  RECOMMENDATION ENGINE
                </span>

                <h2>
                  PQC / hybrid migration guidance
                </h2>

              </div>


              <div className="recommendation-mark">
                <Lightbulb size={17} />
              </div>

            </div>


            <div className="recommendation-main">

              <div className="recommendation-main-icon">
                <ShieldCheck size={21} />
              </div>


              <div>

                <strong>
                  Recommendations are generated
                  per cryptographic finding.
                </strong>

                <p>
                  Click an asset in the inventory to
                  open its complete inspection page,
                  including the recommendation,
                  evidence and exact source location.
                </p>

              </div>

            </div>


            <div className="recommendation-tags">

              {(recommendations.length
                ? recommendations
                : [
                    {
                      target:
                        "ML-DSA",
                      count: 0,
                    },
                    {
                      target:
                        "ML-KEM",
                      count: 0,
                    },
                    {
                      target:
                        "Hybrid",
                      count: 0,
                    },
                  ]
              )
                .slice(0, 8)
                .map(
                  (item) => (
                    <span
                      key={
                        item.target
                      }
                    >
                      {item.target}

                      {item.count
                        ? ` · ${item.count}`
                        : ""}
                    </span>
                  )
                )}

            </div>

          </section>


          {/* ==================================================
              INVENTORY
          ================================================== */}

          <section
            className="dashboard-card inventory-card"
            id="inventory"
          >

            <div className="inventory-header">

              <div>

                <span className="section-kicker">
                  CRYPTOGRAPHIC RESULTS
                </span>

                <h2>
                  Detected cryptographic artefacts
                </h2>

              </div>


              <div className="inventory-toolbar">

                <div className="inventory-search">

                  <Search size={14} />

                  <input
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search assets"
                  />

                </div>


                <div className="inventory-filter">

                  <Filter size={13} />

                  <select
                    value={
                      riskFilter
                    }
                    onChange={(event) =>
                      setRiskFilter(
                        event.target.value
                      )
                    }
                  >

                    <option value="ALL">
                      Risk: All
                    </option>

                    <option value="CRITICAL">
                      Critical
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="LOW">
                      Low
                    </option>

                  </select>

                  <ChevronDown
                    size={12}
                  />

                </div>


                <div className="inventory-filter">

                  <select
                    value={
                      typeFilter
                    }
                    onChange={(event) =>
                      setTypeFilter(
                        event.target.value
                      )
                    }
                  >

                    <option value="ALL">
                      Type: All
                    </option>

                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {
                            category
                          }
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={12}
                  />

                </div>


                <div className="inventory-filter">

                  <select
                    value={
                      quantumFilter
                    }
                    onChange={(event) =>
                      setQuantumFilter(
                        event.target.value
                      )
                    }
                  >

                    <option value="ALL">
                      Quantum: All
                    </option>

                    <option value="VULNERABLE">
                      Vulnerable
                    </option>

                    <option value="LEGACY_WEAK">
                      Legacy / Weak
                    </option>

                    <option value="REVIEW">
                      Review
                    </option>

                    <option value="NOT_CURRENTLY_QUANTUM_VULNERABLE">
                      Protected
                    </option>

                  </select>

                  <ChevronDown
                    size={12}
                  />

                </div>

              </div>

            </div>


            <div className="inventory-table-wrapper">

              <table className="inventory-table">

                <thead>

                  <tr>

                    <th>
                      ASSET
                    </th>

                    <th>
                      KEY / MODE
                    </th>

                    <th>
                      QUANTUM
                    </th>

                    <th>
                      RISK
                    </th>

                    <th>
                      BUSINESS
                    </th>

                    <th>
                      LOCATION
                    </th>

                    <th></th>

                  </tr>

                </thead>


                <tbody>

                  {!filteredArtifacts.length ? (

                    <tr>

                      <td
                        colSpan="7"
                        className="empty-table"
                      >
                        No matching
                        cryptographic
                        artefacts.
                      </td>

                    </tr>

                  ) : (

                    filteredArtifacts.map(
                      (
                        artifact,
                        filteredIndex
                      ) => {
                        return (
                          <Fragment
                            key={`${artifact.file}-${artifact.line}-${artifact.algorithm}-${filteredIndex}`}
                          >
                            <tr
                              className="inventory-row"
                              onClick={() =>
                                setExpandedArtifactId(
                                  expandedArtifactId === artifact.id
                                    ? null
                                    : artifact.id
                                )
                              }
                              aria-expanded={
                                expandedArtifactId === artifact.id
                              }
                            >

                            <td>

                              <div className="asset-cell">

                                <div className="asset-icon">
                                  <LockKeyhole
                                    size={15}
                                  />
                                </div>


                                <div>

                                  <strong>
                                    {
                                      artifact.algorithm ||
                                      "Unknown"
                                    }
                                  </strong>

                                  <span>
                                    {
                                      artifact.category ||
                                      "Cryptographic artefact"
                                    }
                                  </span>

                                </div>

                              </div>

                            </td>


                            <td>

                              <div className="key-mode-cell">

                                <span>
                                  {
                                    artifact.key_size ||
                                    "—"
                                  }
                                </span>

                                <small>
                                  {
                                    artifact.mode ||
                                    "N/A"
                                  }
                                </small>

                              </div>

                            </td>


                            <td>

                              <span
                                className={getQuantumClass(
                                  artifact.quantum_status
                                )}
                              >
                                {
                                  getQuantumLabel(
                                    artifact.quantum_status
                                  )
                                }
                              </span>

                            </td>


                            <td>

                              <span
                                className={getRiskClass(
                                  artifact.risk
                                )}
                              >
                                {
                                  artifact.risk ||
                                  "UNKNOWN"
                                }
                              </span>

                            </td>


                            <td>

                              <span
                                className={`business-badge ${String(
                                  artifact.business_criticality ||
                                    "MEDIUM"
                                ).toLowerCase()}`}
                              >
                                {
                                  artifact.business_criticality ||
                                  "MEDIUM"
                                }
                              </span>

                            </td>


                            <td>

                              <div className="location-cell">

                                <span>
                                  {
                                    artifact.file ||
                                    "Unknown file"
                                  }
                                </span>

                                <small>
                                  Line{" "}
                                  {
                                    artifact.line ??
                                    "n/a"
                                  }
                                </small>

                              </div>

                            </td>


                            <td>

                              <ChevronDown
                                size={15}
                                className="row-arrow"
                                style={{
                                  transform:
                                    expandedArtifactId === artifact.id
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                  transition:
                                    "transform 0.2s ease",
                                }}
                              />

                            </td>

                          </tr>

                          {expandedArtifactId === artifact.id && (
                            <tr className="asset-detail-row">
                              <td colSpan="7">
                                <div className="asset-detail-dropdown">
                                  <div className="asset-detail-header">
                                    <div>
                                      <span>ASSET INSPECTION</span>
                                      <strong>
                                        {artifact.algorithm ||
                                          "Unknown algorithm"}
                                      </strong>
                                    </div>

                                    <button
                                      type="button"
                                      className="asset-detail-close"
                                      aria-label="Close asset inspection"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setExpandedArtifactId(null);
                                      }}
                                    >
                                      <ChevronDown
                                        size={17}
                                        style={{
                                          transform:
                                            "rotate(180deg)",
                                        }}
                                      />
                                    </button>
                                  </div>

                                  <div className="asset-detail-grid">
                                    <div>
                                      <span>FILE</span>
                                      <strong>
                                        {artifact.file ||
                                          "Unknown file"}
                                      </strong>
                                    </div>

                                    <div>
                                      <span>SOURCE LINE</span>
                                      <strong>
                                        {artifact.line ?? "n/a"}
                                      </strong>
                                    </div>

                                    <div>
                                      <span>CATEGORY</span>
                                      <strong>
                                        {artifact.category ||
                                          "Unknown"}
                                      </strong>
                                    </div>

                                    <div>
                                      <span>KEY SIZE</span>
                                      <strong>
                                        {artifact.key_size ?? "—"}
                                      </strong>
                                    </div>

                                    <div>
                                      <span>MODE</span>
                                      <strong>
                                        {artifact.mode || "N/A"}
                                      </strong>
                                    </div>

                                    <div>
                                      <span>QUANTUM STATUS</span>
                                      <strong>
                                        {getQuantumLabel(
                                          artifact.quantum_status
                                        )}
                                      </strong>
                                    </div>

                                    <div>
                                      <span>RISK</span>
                                      <strong>
                                        {artifact.risk || "UNKNOWN"}
                                      </strong>
                                    </div>

                                    <div>
                                      <span>CRITICALITY</span>
                                      <strong>
                                        {artifact.business_criticality ||
                                          "MEDIUM"}
                                      </strong>
                                    </div>
                                  </div>

                                  {artifact.risk_reason && (
                                    <div className="asset-detail-reason">
                                      <span>RISK ASSESSMENT</span>
                                      <p>
                                        {artifact.risk_reason}
                                      </p>
                                    </div>
                                  )}

                                  {artifact.recommendation && (
                                    <div className="asset-detail-recommendation">
                                      <span>RECOMMENDATION</span>
                                      <strong>
                                        {artifact.recommendation?.alternative ||
                                          "Review required"}
                                      </strong>
                                      {artifact.recommendation?.rationale && (
                                        <p>
                                          {artifact.recommendation.rationale}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {artifact.mosca_math && (
                                    <div className="asset-detail-mosca">
                                      <span>MIGRATION ASSESSMENT</span>
                                      <strong>
                                        {artifact.mosca_math}
                                      </strong>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    }
                  )

                  )}

                </tbody>

              </table>

            </div>


            <div className="inventory-footer">

              Showing{" "}

              <strong>
                {
                  filteredArtifacts.length
                }
              </strong>

              {" "}of{" "}

              <strong>
                {artifacts.length}
              </strong>

              {" "}findings

            </div>

          </section>


          {/* ==================================================
              HISTORY
          ================================================== */}

          <section
            className="dashboard-card history-card"
            id="history"
          >

            <div className="dashboard-card-header">

              <div>

                <span className="section-kicker">
                  SCAN HISTORY
                </span>

                <h2>
                  Previous complete reports
                </h2>

              </div>


              {history.length >
                0 && (

                <button
                  className="clear-history-button"
                  onClick={
                    clearHistory
                  }
                >
                  Clear history
                </button>

              )}

            </div>


            {!history.length ? (

              <div className="history-empty">

                <History size={20} />

                <div>

                  <strong>
                    No previous scans
                  </strong>

                  <span>
                    Complete scan results
                    will appear here.
                  </span>

                </div>

              </div>

            ) : (

              <div className="history-grid">

                {history
                  .slice(0, 10)
                  .map(
                    (entry) => {

                      const result =
                        entry.result ||
                        {};

                      const entrySummary =
                        result.summary ||
                        {};

                      const isCurrent =
                        result.input
                          ?.name ===
                        scanResult.input
                          ?.name;

                      return (
                        <button
                          className={`history-card ${
                            isCurrent
                              ? "current"
                              : ""
                          }`}
                          key={
                            entry.id
                          }
                          onClick={() =>
                            loadHistoryEntry(
                              entry
                            )
                          }
                        >

                          <div className="history-card-top">

                            <div className="history-card-icon">
                              <Archive size={16} />
                            </div>

                            <ArrowUpRight
                              size={14}
                            />

                          </div>


                          <strong>
                            {
                              entry.name
                            }
                          </strong>


                          <span>
                            {
                              formatDate(
                                entry.timestamp
                              )
                            }
                          </span>


                          <div className="history-metrics">

                            <small>
                              {
                                entrySummary.files_scanned
                              }{" "}
                              files
                            </small>

                            <small>
                              {
                                entrySummary.crypto_assets
                              }{" "}
                              assets
                            </small>

                            <small className="history-critical">
                              {
                                entrySummary.critical
                              }{" "}
                              critical
                            </small>

                          </div>


                          {isCurrent && (

                            <div className="current-history-label">
                              Current
                            </div>

                          )}

                        </button>
                      );
                    }
                  )}

              </div>

            )}

          </section>


          {/* ==================================================
              FOOTER
          ================================================== */}

          <footer className="dashboard-status-footer">

            <div>

              <CheckCircle2 size={15} />

              <strong>
                Scan completed
              </strong>

              <span>
                {
                  scanResult.input?.name
                }
              </span>

            </div>


            <div>

              <span>
                {
                  summary.files_scanned
                }{" "}
                files
              </span>

              <span>
                {
                  summary.crypto_assets
                }{" "}
                assets
              </span>

              <span className="status-high">
                {
                  (summary.critical || 0) +
                  (summary.high || 0)
                }{" "}
                priority findings
              </span>

            </div>

          </footer>

        </div>

      </main>

    </div>
  );
}


/* ============================================================
   FLOW STEP
   ============================================================ */

function FlowStep({
  number,
  title,
  description,
  icon,
}) {
  return (
    <div className="analysis-flow-step active">

      <div className="analysis-flow-icon">
        {icon}
      </div>

      <div>

        <span>
          {number}
        </span>

        <strong>
          {title}
        </strong>

        <small>
          {description}
        </small>

      </div>

    </div>
  );
}


export default Dashboard;