import { useState } from "react";
import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Code2,
  Download,
  FileArchive,
  FileCode2,
  FileSearch,
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
  TerminalSquare,
  X,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

const CURRENT_SCAN_KEY = "ecdatScanResult";
const HISTORY_KEY = "ecdatScanHistory";

function getStoredHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

function getInitialResult(location) {
  if (location.state?.scanResult) {
    const result = location.state.scanResult;

    sessionStorage.setItem(
      CURRENT_SCAN_KEY,
      JSON.stringify(result)
    );

    return result;
  }

  const saved = sessionStorage.getItem(
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

function deriveSecurityPosture(summary) {
  if ((summary.critical || 0) > 0) {
    return {
      key: "CRITICAL",
      label: "Highly Critical",
      description:
        "Immediate remediation is recommended. Critical cryptographic findings are present.",
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
        "Weak or legacy cryptography was identified and should be reviewed.",
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

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [scanResult, setScanResult] =
    useState(() =>
      getInitialResult(location)
    );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [riskFilter, setRiskFilter] =
    useState("ALL");

  const [viewMode, setViewMode] =
    useState("table");

  const [selectedArtifact, setSelectedArtifact] =
    useState(null);

  const [history, setHistory] =
    useState(getStoredHistory);

  const summary = scanResult?.summary || {
    files_scanned: 0,
    crypto_assets: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    quantum_vulnerable: 0,
    legacy_weak: 0,
  };

  const files = scanResult?.files || [];
  const artifacts =
    scanResult?.artifacts || [];

  const posture =
    summary.security_posture ||
    deriveSecurityPosture(summary);

  const algorithmCounts = {};

  artifacts.forEach((artifact) => {
    const algorithm =
      artifact.algorithm || "Unknown";

    algorithmCounts[algorithm] =
      (algorithmCounts[algorithm] || 0) + 1;
  });

  const uniqueAlgorithms =
    Object.entries(algorithmCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
      }));

  const fileTypeCounts = {};

  files.forEach((file) => {
    const type =
      file.type || "binary/unknown";

    fileTypeCounts[type] =
      (fileTypeCounts[type] || 0) + 1;
  });

  const fileTypes = Object.entries(
    fileTypeCounts
  ).sort((a, b) => b[1] - a[1]);

  const query = searchTerm
    .trim()
    .toLowerCase();

  const filteredArtifacts =
    artifacts.filter((artifact) => {
      const text = [
        artifact.file,
        artifact.algorithm,
        artifact.category,
        artifact.usage,
        artifact.recommendation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        text.includes(query);

      const matchesRisk =
        riskFilter === "ALL" ||
        artifact.risk === riskFilter;

      return matchesSearch && matchesRisk;
    });

  const quantumExposure =
    summary.crypto_assets > 0
      ? Math.round(
          (summary.quantum_vulnerable /
            summary.crypto_assets) *
            100
        )
      : 0;

  const maxRisk = Math.max(
    summary.critical || 0,
    summary.high || 0,
    summary.medium || 0,
    summary.low || 0,
    1
  );

  const maxAlgorithmCount = Math.max(
    ...uniqueAlgorithms.map(
      (item) => item.count
    ),
    1
  );

  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const loadHistoryEntry = (entry) => {
    if (!entry?.result) {
      return;
    }

    sessionStorage.setItem(
      CURRENT_SCAN_KEY,
      JSON.stringify(entry.result)
    );

    setScanResult(entry.result);
    setSelectedArtifact(null);
    setSearchTerm("");
    setRiskFilter("ALL");
    setViewMode("table");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const downloadFile = (
    content,
    fileName,
    contentType
  ) => {
    const blob = new Blob([content], {
      type: contentType,
    });

    const url = URL.createObjectURL(blob);
    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!scanResult) {
      return;
    }

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

  const exportCSV = () => {
    if (!artifacts.length) {
      return;
    }

    const headers = [
      "File",
      "Line",
      "Algorithm",
      "Algorithm Family",
      "Category",
      "Usage",
      "Quantum Status",
      "Risk",
      "Recommendation",
    ];

    const rows = artifacts.map(
      (artifact) => [
        artifact.file,
        artifact.line,
        artifact.algorithm,
        artifact.algorithm_family,
        artifact.category,
        artifact.usage,
        artifact.quantum_status,
        artifact.risk,
        artifact.recommendation,
      ]
    );

    const escapeCSV = (value) =>
      `"${String(value ?? "").replaceAll(
        '"',
        '""'
      )}"`;

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row.map(escapeCSV).join(",")
      )
      .join("\n");

    downloadFile(
      csv,
      "ecdat-inventory.csv",
      "text/csv;charset=utf-8"
    );
  };

  if (!scanResult) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-icon">
          <FileSearch size={26} />
        </div>

        <h2>No scan available</h2>

        <p>
          Upload a project or artefact from
          the ECDAT homepage to generate an
          analysis report.
        </p>

        <button
          className="dashboard-primary-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={15} />
          Back to upload
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {/* SIDE RAIL */}

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
              scrollTo("risk-analysis")
            }
          >
            <ShieldAlert size={19} />
          </button>

          <button
            className="dashboard-rail-item"
            title="Artefacts"
            onClick={() =>
              scrollTo("inventory")
            }
          >
            <LockKeyhole size={19} />
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
            <Lightbulb size={19} />
          </button>

          <button
            className="dashboard-rail-item"
            title="History"
            onClick={() =>
              scrollTo("history")
            }
          >
            <History size={19} />
          </button>
        </nav>

        <div className="dashboard-rail-bottom">
          <button
            className="dashboard-rail-item"
            title="New Scan"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={19} />
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-search">
            <Search size={15} />

            <input
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
          {/* HEADER */}

          <section className="report-header">
            <div>
              <span className="section-kicker">
                CRYPTOGRAPHIC RESULTS
              </span>

              <h1>
                Security intelligence
              </h1>

              <p>
                {scanResult.input?.name ||
                  "Uploaded project"}
              </p>
            </div>

            <div className="report-actions">
              <button
                className="dashboard-secondary-button"
                onClick={exportCSV}
                disabled={
                  !artifacts.length
                }
              >
                <Download size={14} />
                CSV
              </button>

              <button
                className="dashboard-secondary-button"
                onClick={exportJSON}
              >
                <Download size={14} />
                JSON
              </button>

              <button
                className="dashboard-primary-button"
                onClick={() => navigate("/")}
              >
                New Scan
              </button>
            </div>
          </section>

          {/* FLOW */}

          <section className="analysis-flow">
            <AnalysisFlowStep
              number="01"
              title="Discover"
              description="Inventory assets"
              icon={<Search size={18} />}
            />

            <div className="analysis-flow-line"></div>

            <AnalysisFlowStep
              number="02"
              title="Assess"
              description="Identify risk"
              icon={
                <ShieldAlert size={18} />
              }
            />

            <div className="analysis-flow-line"></div>

            <AnalysisFlowStep
              number="03"
              title="Recommend"
              description="Plan migration"
              icon={
                <Lightbulb size={18} />
              }
            />

            <div className="analysis-flow-line"></div>

            <AnalysisFlowStep
              number="04"
              title="Act"
              description="Prioritize remediation"
              icon={<Activity size={18} />}
            />
          </section>

          {/* SUMMARY */}

          <section className="dashboard-summary-grid">
            <DashboardSummary
              label="Files"
              value={summary.files_scanned}
              description="Files scanned"
              icon={<FileCode2 size={16} />}
              light
            />

            <DashboardSummary
              label="Crypto assets"
              value={summary.crypto_assets}
              description="Detected artefacts"
              icon={
                <LockKeyhole size={16} />
              }
            />

            <DashboardSummary
              label="Critical"
              value={summary.critical}
              description="Immediate attention"
              icon={
                <ShieldAlert size={16} />
              }
            />

            <DashboardSummary
              label="High"
              value={summary.high}
              description="Priority findings"
              icon={
                <ShieldAlert size={16} />
              }
            />

            <DashboardSummary
              label="Quantum vulnerable"
              value={
                summary.quantum_vulnerable
              }
              description="PQC planning required"
              icon={
                <ShieldAlert size={16} />
              }
            />

            <DashboardSummary
              label="Algorithms"
              value={
                uniqueAlgorithms.length
              }
              description="Unique algorithms"
              icon={
                <TerminalSquare size={16} />
              }
            />
          </section>

          {/* SECURITY POSTURE */}

          <section
            className={`security-posture-card ${posture.className}`}
          >
            <div className="security-posture-left">
              <div className="security-posture-icon">
                {posture.key ===
                "CRITICAL" ? (
                  <ShieldAlert
                    size={22}
                  />
                ) : posture.key ===
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
                  {posture.description}
                </p>
              </div>
            </div>

            <div className="security-posture-metrics">
              <div>
                <span>Critical</span>
                <strong>
                  {summary.critical}
                </strong>
              </div>

              <div>
                <span>High</span>
                <strong>
                  {summary.high}
                </strong>
              </div>

              <div>
                <span>Quantum</span>
                <strong>
                  {
                    summary.quantum_vulnerable
                  }
                </strong>
              </div>
            </div>
          </section>

          {/* DISCOVERED CONTENT */}

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
                    <div
                      className="content-type-card"
                      key={type}
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
                    </div>
                  );
                }
              )}

              {fileTypes.length ===
                0 && (
                <div className="no-data-message">
                  No files were discovered.
                </div>
              )}
            </div>
          </section>

          {/* RISK + ALGORITHMS */}

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

                <div className="card-count">
                  {artifacts.length} findings
                </div>
              </div>

              <div className="risk-chart">
                <RiskBar
                  label="Critical"
                  value={summary.critical}
                  max={maxRisk}
                  className="critical"
                />

                <RiskBar
                  label="High"
                  value={summary.high}
                  max={maxRisk}
                  className="high"
                />

                <RiskBar
                  label="Medium"
                  value={summary.medium}
                  max={maxRisk}
                  className="medium"
                />

                <RiskBar
                  label="Low"
                  value={summary.low}
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
                    {summary.legacy_weak}
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
              </div>

              <div className="algorithm-layout">
                <div className="algorithm-donut">
                  <div>
                    <strong>
                      {artifacts.length}
                    </strong>

                    <span>
                      Assets
                    </span>
                  </div>
                </div>

                <div className="algorithm-list">
                  {uniqueAlgorithms
                    .slice(0, 7)
                    .map(
                      (
                        algorithm,
                        index
                      ) => (
                        <div
                          className="algorithm-row"
                          key={algorithm.name}
                        >
                          <div>
                            <span
                              className={`algorithm-dot dot-${index}`}
                            ></span>

                            <span>
                              {
                                algorithm.name
                              }
                            </span>
                          </div>

                          <strong>
                            {
                              algorithm.count
                            }
                          </strong>
                        </div>
                      )
                    )}

                  {uniqueAlgorithms.length ===
                    0 && (
                    <span className="muted">
                      No algorithms detected.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* FILE COMPOSITION + RECOMMENDATION */}

          <section className="dashboard-two-column">
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <span className="section-kicker">
                    PROJECT COMPOSITION
                  </span>

                  <h2>
                    File inventory
                  </h2>
                </div>
              </div>

              <div className="project-file-list">
                {fileTypes.map(
                  ([type, count]) => {
                    const info =
                      getFileTypeInfo(
                        type
                      );

                    const Icon =
                      info.icon;

                    return (
                      <div
                        className="project-file-row"
                        key={type}
                      >
                        <div>
                          <Icon size={16} />

                          <span>
                            {info.label}
                          </span>
                        </div>

                        <strong>
                          {count}
                        </strong>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div
              className="dashboard-card recommendation-dashboard-card"
              id="recommendations"
            >
              <div className="dashboard-card-header">
                <div>
                  <span className="section-kicker">
                    MIGRATION GUIDANCE
                  </span>

                  <h2>
                    Recommended direction
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
                    Prioritize quantum-vulnerable
                    public-key cryptography.
                  </strong>

                  <p>
                    Review RSA, ECC, ECDSA,
                    ECDH, DSA and related
                    signature or key-establishment
                    mechanisms.
                  </p>
                </div>
              </div>

              <div className="recommendation-tags">
                <span>ML-DSA</span>
                <span>ML-KEM</span>
                <span>Hybrid</span>
              </div>
            </div>
          </section>

          {/* INVENTORY */}

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
                  Detected cryptographic
                  artefacts
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
                    value={riskFilter}
                    onChange={(event) =>
                      setRiskFilter(
                        event.target.value
                      )
                    }
                  >
                    <option value="ALL">
                      All
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

                  <ChevronDown size={12} />
                </div>

                <div className="inventory-view-toggle">
                  <button
                    className={
                      viewMode ===
                      "table"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setViewMode(
                        "table"
                      )
                    }
                    title="Table view"
                  >
                    <FileCode2 size={14} />
                  </button>

                  <button
                    className={
                      viewMode ===
                      "bars"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setViewMode(
                        "bars"
                      )
                    }
                    title="Algorithm view"
                  >
                    <Activity size={14} />
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "table" ? (
              <div className="inventory-table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>ASSET</th>
                      <th>USAGE</th>
                      <th>QUANTUM STATUS</th>
                      <th>RISK</th>
                      <th>LOCATION</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredArtifacts.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="empty-table"
                        >
                          No matching cryptographic
                          artefacts.
                        </td>
                      </tr>
                    ) : (
                      filteredArtifacts.map(
                        (
                          artifact,
                          index
                        ) => (
                          <tr
                            className="inventory-row"
                            key={`${artifact.file}-${artifact.line}-${index}`}
                            onClick={() =>
                              setSelectedArtifact(
                                artifact
                              )
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
                                      artifact.algorithm
                                    }
                                  </strong>

                                  <span>
                                    {
                                      artifact.category
                                    }
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="usage-cell">
                                {artifact.usage ||
                                  "Unknown"}
                              </span>
                            </td>

                            <td>
                              <span
                                className={getQuantumClass(
                                  artifact.quantum_status
                                )}
                              >
                                {getQuantumLabel(
                                  artifact.quantum_status
                                )}
                              </span>
                            </td>

                            <td>
                              <span
                                className={getRiskClass(
                                  artifact.risk
                                )}
                              >
                                {artifact.risk ||
                                  "UNKNOWN"}
                              </span>
                            </td>

                            <td>
                              <div className="location-cell">
                                <span>
                                  {
                                    artifact.file
                                  }
                                </span>

                                <small>
                                  Line{" "}
                                  {
                                    artifact.line
                                  }
                                </small>
                              </div>
                            </td>

                            <td>
                              <ArrowUpRight
                                size={14}
                                className="row-arrow"
                              />
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="algorithm-bars-view">
                {uniqueAlgorithms.map(
                  (algorithm) => (
                    <div
                      className="algorithm-bar"
                      key={algorithm.name}
                    >
                      <div>
                        <span>
                          {algorithm.name}
                        </span>

                        <strong>
                          {
                            algorithm.count
                          }
                        </strong>
                      </div>

                      <div className="algorithm-bar-track">
                        <div
                          className="algorithm-bar-fill"
                          style={{
                            width: `${
                              (algorithm.count /
                                maxAlgorithmCount) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="inventory-footer">
              Showing{" "}
              <strong>
                {filteredArtifacts.length}
              </strong>{" "}
              of{" "}
              <strong>
                {artifacts.length}
              </strong>{" "}
              findings
            </div>
          </section>

          {/* HISTORY */}

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
                  Previous analyses
                </h2>
              </div>

              {history.length > 0 && (
                <button
                  className="clear-history-button"
                  onClick={clearHistory}
                >
                  Clear history
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="history-empty">
                <History size={20} />

                <div>
                  <strong>
                    No previous scans
                  </strong>

                  <span>
                    Completed scans will appear
                    here.
                  </span>
                </div>
              </div>
            ) : (
              <div className="history-grid">
                {history
                  .slice(0, 6)
                  .map((entry) => {
                    const entryResult =
                      entry.result ||
                      {};

                    const entrySummary =
                      entryResult.summary ||
                      {};

                    const isCurrent =
                      entryResult.input?.name ===
                      scanResult.input?.name;

                    return (
                      <button
                        className={`history-card ${
                          isCurrent
                            ? "current"
                            : ""
                        }`}
                        key={entry.id}
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
                          {entry.name}
                        </strong>

                        <span>
                          {formatHistoryDate(
                            entry.timestamp
                          )}
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
                  })}
              </div>
            )}
          </section>

          {/* STATUS */}

          <footer className="dashboard-status-footer">
            <div>
              <CheckCircle2 size={15} />

              <strong>
                Scan completed
              </strong>

              <span>
                {scanResult.input?.name ||
                  "Uploaded project"}
              </span>
            </div>

            <div>
              <span>
                {summary.files_scanned} files
              </span>

              <span>
                {summary.crypto_assets} assets
              </span>

              <span className="status-high">
                {summary.critical +
                  summary.high}{" "}
                priority findings
              </span>
            </div>
          </footer>
        </div>
      </main>

      {/* DETAIL PANEL */}

      {selectedArtifact && (
        <div
          className="artifact-overlay"
          onClick={() =>
            setSelectedArtifact(null)
          }
        >
          <aside
            className="artifact-detail-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="detail-header">
              <div>
                <span className="section-kicker">
                  CRYPTOGRAPHIC ARTEFACT
                </span>

                <h2>
                  {
                    selectedArtifact.algorithm
                  }
                </h2>

                <p>
                  {
                    selectedArtifact.category
                  }
                </p>
              </div>

              <button
                className="detail-close"
                onClick={() =>
                  setSelectedArtifact(
                    null
                  )
                }
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="detail-badges">
              <span
                className={getRiskClass(
                  selectedArtifact.risk
                )}
              >
                {selectedArtifact.risk}
              </span>

              <span
                className={getQuantumClass(
                  selectedArtifact.quantum_status
                )}
              >
                {getQuantumLabel(
                  selectedArtifact.quantum_status
                )}
              </span>
            </div>

            <div className="detail-location-box">
              <FileCode2 size={16} />

              <div>
                <span>
                  Exact source location
                </span>

                <strong>
                  {selectedArtifact.file}
                </strong>

                <small>
                  Line{" "}
                  {selectedArtifact.line}
                </small>
              </div>
            </div>

            <div className="source-code-box">
              <div className="source-code-header">
                <span>
                  DETECTED SOURCE
                </span>

                <span>
                  Line{" "}
                  {selectedArtifact.line}
                </span>
              </div>

              <pre>
                {selectedArtifact.code ||
                  "Source unavailable"}
              </pre>
            </div>

            <div className="detail-section">
              <span className="section-kicker">
                QUANTUM ASSESSMENT
              </span>

              <div className="detail-assessment">
                <ShieldAlert size={18} />

                <div>
                  <strong>
                    {selectedArtifact.quantum_status ===
                    "VULNERABLE"
                      ? "Quantum vulnerable"
                      : getQuantumLabel(
                          selectedArtifact.quantum_status
                        )}
                  </strong>

                  <p>
                    This cryptographic mechanism
                    should be considered during
                    post-quantum migration planning.
                  </p>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <span className="section-kicker">
                MIGRATION RECOMMENDATION
              </span>

              <div className="detail-recommendation">
                <Lightbulb size={18} />

                <div>
                  <strong>
                    {selectedArtifact.recommendation ||
                      "Further assessment required"}
                  </strong>

                  <p>
                    Evaluate migration according
                    to cryptographic role,
                    performance requirements,
                    data lifetime and system
                    criticality.
                  </p>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <span className="section-kicker">
                USAGE
              </span>

              <div className="detail-usage">
                <TerminalSquare size={16} />

                <span>
                  {selectedArtifact.usage ||
                    "Unknown usage"}
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function AnalysisFlowStep({
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
        <span>{number}</span>

        <strong>{title}</strong>

        <small>
          {description}
        </small>
      </div>
    </div>
  );
}

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
        <span>{label}</span>

        <div className="summary-icon">
          {icon}
        </div>
      </div>

      <strong>{value}</strong>

      <small>{description}</small>
    </div>
  );
}

function RiskBar({
  label,
  value,
  max,
  className,
}) {
  return (
    <div className="risk-row">
      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>

      <div className="risk-track">
        <div
          className={`risk-fill ${className}`}
          style={{
            width: `${(value / max) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

function getFileTypeInfo(type) {
  const normalized =
    String(type || "").toLowerCase();

  if (normalized === "source/code") {
    return {
      label: "Source Code",
      icon: Code2,
    };
  }

  if (normalized === "configuration") {
    return {
      label: "Configuration",
      icon: TerminalSquare,
    };
  }

  if (normalized === "certificate/key") {
    return {
      label: "Certificates / Keys",
      icon: KeyRound,
    };
  }

  if (normalized === "container") {
    return {
      label: "Containers",
      icon: Archive,
    };
  }

  if (normalized === "archive") {
    return {
      label: "Archives",
      icon: FileArchive,
    };
  }

  if (normalized === "binary/unknown") {
    return {
      label: "Binary / Unknown",
      icon: HardDrive,
    };
  }

  return {
    label: type || "Unknown",
    icon: FileCode2,
  };
}

function getRiskClass(risk) {
  return `risk-badge ${
    String(risk || "")
      .toLowerCase()
  }`;
}

function getQuantumClass(status) {
  if (status === "VULNERABLE") {
    return "quantum-badge vulnerable";
  }

  if (status === "LEGACY_WEAK") {
    return "quantum-badge legacy";
  }

  return "quantum-badge safe";
}

function getQuantumLabel(status) {
  switch (status) {
    case "VULNERABLE":
      return "Vulnerable";

    case "LEGACY_WEAK":
      return "Legacy / Weak";

    case "NOT_CURRENTLY_QUANTUM_VULNERABLE":
      return "Not Currently Vulnerable";

    case "REVIEW":
      return "Review";

    default:
      return status || "Unknown";
  }
}

function formatHistoryDate(value) {
  if (!value) {
    return "Unknown date";
  }

  try {
    return new Date(value).toLocaleString(
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
    return "Unknown date";
  }
}

export default Dashboard;