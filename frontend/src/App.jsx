import { useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CircleHelp,
  FileArchive,
  FileCode2,
  History,
  LockKeyhole,
  Network,
  Search,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import { scanFile } from "./services/api";

import "./App.css";

const HISTORY_KEY = "ecdatScanHistory";
const CURRENT_SCAN_KEY = "ecdatScanResult";

const SCAN_STAGES = [
  "Uploading input",
  "Discovering cryptographic assets",
  "Assessing quantum exposure",
  "Preparing analysis report",
];

function getHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

function saveScanHistory(
  result,
  originalFileName
) {
  const existing = getHistory();

  const entry = {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    name:
      result.input?.name ||
      originalFileName ||
      "Unnamed scan",

    timestamp: new Date().toISOString(),

    result,
  };

  const updated = [
    entry,
    ...existing.filter(
      (item) => item.name !== entry.name
    ),
  ].slice(0, 10);

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(updated)
  );

  return entry;
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function Home() {
  const fileInputRef = useRef(null);
  const stageTimerRef = useRef(null);

  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isScanning, setIsScanning] =
    useState(false);

  const [scanStage, setScanStage] =
    useState(0);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    handleFile(
      event.dataTransfer.files?.[0]
    );
  };

  const startStageAnimation = () => {
    setScanStage(0);

    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
    }

    stageTimerRef.current =
      setInterval(() => {
        setScanStage((current) => {
          if (
            current >=
            SCAN_STAGES.length - 1
          ) {
            return current;
          }

          return current + 1;
        });
      }, 750);
  };

  const stopStageAnimation = () => {
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  };

  const startScan = async () => {
    if (!selectedFile || isScanning) {
      return;
    }

    setIsScanning(true);
    setErrorMessage("");

    startStageAnimation();

    const minimumDisplayTime = 3000;
    const startedAt = Date.now();

    try {
      const result = await Promise.all([
        scanFile(selectedFile),
        sleep(minimumDisplayTime),
      ]).then(([scanResult]) => scanResult);

      const elapsed = Date.now() - startedAt;

      if (elapsed < minimumDisplayTime) {
        await sleep(
          minimumDisplayTime - elapsed
        );
      }

      setScanStage(SCAN_STAGES.length - 1);

      sessionStorage.setItem(
        CURRENT_SCAN_KEY,
        JSON.stringify(result)
      );

      saveScanHistory(
        result,
        selectedFile.name
      );

      stopStageAnimation();

      await sleep(500);

      navigate("/dashboard", {
        state: {
          scanResult: result,
        },
      });
    } catch (error) {
      console.error(error);

      stopStageAnimation();

      setErrorMessage(
        error.message ||
          "Unable to connect to the ECDAT scanner."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const removeFile = () => {
    if (isScanning) {
      return;
    }

    setSelectedFile(null);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const scrollToAbout = () => {
    document
      .getElementById("about-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const scrollToUpload = () => {
    document
      .getElementById("upload-area")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <div className="app-shell">
      {/* SIDE RAIL */}

      <aside className="side-rail">
        <div className="rail-logo-container">
          <img
            src="/ecdat-logo.png"
            alt="ECDAT"
            className="ecdat-logo"
          />
        </div>

        <nav className="rail-nav">
          <button
            className="rail-nav-item active"
            title="Upload"
            aria-label="Go to upload"
            onClick={scrollToUpload}
          >
            <Upload size={19} />
          </button>

          <button
            className="rail-nav-item"
            title="About ECDAT"
            aria-label="About ECDAT"
            onClick={scrollToAbout}
          >
            <CircleHelp size={19} />
          </button>
        </nav>

        <div className="rail-bottom">
          <button
            className="rail-nav-item"
            title="Scan History"
            aria-label="Scan history"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <History size={19} />
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="main-workspace">
        <header className="home-topbar">
          <div className="home-search">
            <Search size={16} />

            <input
              placeholder="Search ECDAT"
              aria-label="Search ECDAT"
            />
          </div>

          <div className="workspace-label">
            Cryptographic Discovery & Assessment
          </div>
        </header>

        <div className="home-content">
          {/* HERO */}

          <section className="home-hero">
            <div className="hero-main-content">
              <div className="hero-kicker">
                <span></span>
                ECDAT · CRYPTOGRAPHIC DISCOVERY PLATFORM
              </div>

              <h1>
                Discover.
                <br />
                <span>Assess.</span>
                <br />
                Prepare.
              </h1>

              <p>
                Discover cryptographic artefacts across
                application code, libraries, certificates,
                configurations and infrastructure. Assess
                quantum exposure and prepare migration paths.
              </p>

              <div className="hero-actions">
                <button
                  className="hero-primary-button"
                  onClick={scrollToUpload}
                >
                  Start discovery
                  <ArrowRight size={16} />
                </button>

                <button
                  className="hero-secondary-button"
                  onClick={scrollToAbout}
                >
                  About ECDAT
                  <CircleHelp size={14} />
                </button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-orbit orbit-a"></div>
              <div className="hero-orbit orbit-b"></div>
              <div className="hero-orbit orbit-c"></div>

              <div className="hero-center-shield">
                <ShieldCheck size={34} />
              </div>

              <div className="hero-floating-card card-one">
                <LockKeyhole size={15} />
                <span>Crypto assets</span>
              </div>

              <div className="hero-floating-card card-two">
                <ShieldAlert size={15} />
                <span>Quantum risk</span>
              </div>

              <div className="hero-floating-card card-three">
                <Network size={15} />
                <span>Discovery</span>
              </div>
            </div>
          </section>

          {/* QUICK METRICS */}

          <section className="home-stat-grid">
            <div className="home-stat-card light">
              <div className="home-stat-top">
                <span>Input</span>

                <div className="home-stat-icon blue">
                  <FileArchive size={16} />
                </div>
              </div>

              <strong>Any</strong>

              <small>
                Source, binary, archive, library,
                configuration or certificate
              </small>
            </div>

            <div className="home-stat-card">
              <div className="home-stat-top">
                <span>Discovery</span>

                <div className="home-stat-icon">
                  <LockKeyhole size={16} />
                </div>
              </div>

              <strong>CBOM</strong>

              <small>
                Structured cryptographic inventory
              </small>
            </div>

            <div className="home-stat-card">
              <div className="home-stat-top">
                <span>Assessment</span>

                <div className="home-stat-icon">
                  <ShieldAlert size={16} />
                </div>
              </div>

              <strong>PQC</strong>

              <small>
                Quantum risk and migration guidance
              </small>
            </div>
          </section>

          {/* UPLOAD + WORKFLOW */}

          <section
            className="home-two-column"
            id="upload-area"
          >
            <div className="upload-card">
              <div className="section-heading-row">
                <div>
                  <span className="section-kicker">
                    NEW SCAN
                  </span>

                  <h2>
                    Upload your project
                  </h2>

                  <p>
                    Submit the artefact you want ECDAT
                    to analyze.
                  </p>
                </div>

                <div className="section-corner-icon">
                  <Upload size={18} />
                </div>
              </div>

              <div
                className={`upload-drop-area ${
                  isDragging
                    ? "dragging"
                    : ""
                } ${
                  selectedFile
                    ? "selected"
                    : ""
                }`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
              >
                {!selectedFile ? (
                  <>
                    <div className="upload-circle">
                      <Upload size={25} />
                    </div>

                    <h3>
                      Drag your file or project here
                    </h3>

                    <p>
                      ECDAT accepts source code,
                      binaries, libraries,
                      certificates, configurations,
                      container artefacts and archives.
                    </p>

                    <button
                      className="upload-button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                    >
                      <Upload size={15} />
                      Upload
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleInputChange}
                      hidden
                    />

                    <span className="upload-helper">
                      ECDAT automatically identifies
                      the input type
                    </span>
                  </>
                ) : (
                  <>
                    <div className="upload-circle selected">
                      <FileArchive size={25} />
                    </div>

                    <h3 className="selected-name">
                      {selectedFile.name}
                    </h3>

                    <p>
                      {formatBytes(
                        selectedFile.size
                      )}{" "}
                      · Ready for analysis
                    </p>

                    <div className="selected-actions">
                      <button
                        className="upload-button"
                        onClick={startScan}
                        disabled={isScanning}
                      >
                        {isScanning ? (
                          <>
                            <span className="mini-spinner"></span>
                            Scanning
                          </>
                        ) : (
                          <>
                            <Activity size={15} />
                            Start Scan
                          </>
                        )}
                      </button>

                      <button
                        className="remove-button"
                        onClick={removeFile}
                        disabled={isScanning}
                      >
                        <X size={15} />
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>

              {errorMessage && (
                <div className="upload-error">
                  <ShieldAlert size={15} />

                  <span>
                    {errorMessage}
                  </span>
                </div>
              )}
            </div>

            <div className="workflow-card">
              <div className="section-heading-row">
                <div>
                  <span className="section-kicker">
                    WORKFLOW
                  </span>

                  <h2>
                    How ECDAT works
                  </h2>
                </div>
              </div>

              <div className="workflow-list">
                <WorkflowItem
                  number="01"
                  icon={<Upload size={16} />}
                  title="Upload"
                  description="Submit a project or cryptographic artefact."
                />

                <WorkflowItem
                  number="02"
                  icon={<Search size={16} />}
                  title="Discover"
                  description="Find algorithms, certificates, keys and protocols."
                />

                <WorkflowItem
                  number="03"
                  icon={<ShieldAlert size={16} />}
                  title="Assess"
                  description="Identify quantum-vulnerable and weak cryptography."
                />

                <WorkflowItem
                  number="04"
                  icon={<ShieldCheck size={16} />}
                  title="Recommend"
                  description="Generate PQC and hybrid migration guidance."
                />
              </div>
            </div>
          </section>

          {/* ABOUT */}

          <section
            className="discovery-section"
            id="about-section"
          >
            <div className="discovery-heading">
              <div>
                <span className="section-kicker">
                  ABOUT ECDAT
                </span>

                <h2>
                  Understand your
                  <br />
                  cryptographic landscape.
                </h2>
              </div>

              <p>
                ECDAT discovers and catalogs cryptographic
                artefacts across application source code,
                libraries, certificates, configurations,
                binaries and infrastructure. The results
                provide the foundation for quantum-risk
                assessment and migration planning.
              </p>
            </div>

            <div className="discovery-types">
              <DiscoveryType
                icon={<FileCode2 size={20} />}
                title="Source Code"
                description="Java, Python, JavaScript, C, C++, Go and more"
              />

              <DiscoveryType
                icon={<Network size={20} />}
                title="Configurations"
                description="TLS, SSH, application and deployment settings"
              />

              <DiscoveryType
                icon={<LockKeyhole size={20} />}
                title="Certificates & Keys"
                description="PEM, CRT, CER and key material metadata"
              />

              <DiscoveryType
                icon={<FileArchive size={20} />}
                title="Libraries"
                description="JAR, WAR and packaged dependencies"
              />

              <DiscoveryType
                icon={<ShieldCheck size={20} />}
                title="Containers"
                description="Docker and container-related artefacts"
              />

              <DiscoveryType
                icon={<Activity size={20} />}
                title="Binaries"
                description="Compiled artefacts and native files"
              />
            </div>
          </section>
        </div>
      </main>

      {/* SCAN PROCESSING OVERLAY */}

      {isScanning && (
        <div className="scan-processing-overlay">
          <div className="scan-processing-card">
            <div className="scan-processing-logo">
              <img
                src="/ecdat-logo.png"
                alt="ECDAT"
              />
            </div>

            <span className="section-kicker">
              ECDAT SCAN ENGINE
            </span>

            <h2>
              Analyzing your cryptographic landscape
            </h2>

            <p>
              The project is being inspected for
              cryptographic artefacts and quantum-risk
              indicators.
            </p>

            <div className="scan-progress">
              <div className="scan-progress-track">
                <div
                  className="scan-progress-fill"
                  style={{
                    width: `${
                      ((scanStage + 1) /
                        SCAN_STAGES.length) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="scan-progress-value">
                {Math.round(
                  ((scanStage + 1) /
                    SCAN_STAGES.length) *
                    100
                )}
                %
              </div>
            </div>

            <div className="scan-stage-list">
              {SCAN_STAGES.map(
                (stage, index) => {
                  const complete =
                    index < scanStage;

                  const current =
                    index === scanStage;

                  return (
                    <div
                      className={`scan-stage ${
                        complete
                          ? "complete"
                          : ""
                      } ${
                        current
                          ? "current"
                          : ""
                      }`}
                      key={stage}
                    >
                      <div className="scan-stage-dot">
                        {complete
                          ? "✓"
                          : index + 1}
                      </div>

                      <span>
                        {stage}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowItem({
  number,
  icon,
  title,
  description,
}) {
  return (
    <div className="workflow-item">
      <div className="workflow-number">
        {number}
      </div>

      <div className="workflow-icon">
        {icon}
      </div>

      <div className="workflow-text">
        <strong>{title}</strong>

        <span>
          {description}
        </span>
      </div>

      <ArrowUpRight
        size={15}
        className="workflow-arrow"
      />
    </div>
  );
}

function DiscoveryType({
  icon,
  title,
  description,
}) {
  return (
    <div className="discovery-type-card">
      <div className="discovery-type-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>

        <span>
          {description}
        </span>
      </div>

      <ArrowUpRight
        size={15}
        className="discovery-arrow"
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;