ECDAT — Cryptographic Discovery & Assessment Tool

ECDAT is a prototype platform for discovering cryptographic artefacts in uploaded software projects and files, building a cryptographic inventory, assessing quantum-related risk, and presenting migration recommendations through an interactive web dashboard.

The prototype is designed around the following workflow:

Upload
  ↓
Scan / Discover
  ↓
Cryptographic Inventory
  ↓
Risk Assessment
  ↓
Security Posture
  ↓
PQC / Hybrid Recommendations
  ↓
Interactive Dashboard

Project Goal

The transition to Post-Quantum Cryptography (PQC) requires organizations to first understand where cryptography is being used. ECDAT addresses this discovery stage by scanning software artefacts and identifying cryptographic mechanisms such as algorithms, keys, certificates, protocols, libraries, and configuration references.

The prototype focuses on:

Cryptographic asset discovery and inventory

File and artefact classification

Quantum-vulnerability identification

Risk categorization

Source filename and line-number reporting

Security posture classification

PQC and hybrid migration guidance

Scan history

Exportable JSON and CSV reports

Current Prototype Scope

The current prototype contains two main components:

Frontend

Built with React and Vite.

The frontend provides:

ECDAT homepage

Drag-and-drop upload area

File upload for different artefact types

Scan processing screen

Interactive analysis dashboard

Discovered-content classification

Risk analytics

Cryptographic inventory table

Search and risk filters

Artifact detail panel

Security posture indicator

Migration recommendations

Previous scan history stored locally in the browser

JSON and CSV export

Backend

Built with Python and FastAPI.

The backend provides:

File upload API

Archive extraction

Source/project traversal

File-type classification

Text/source scanning

Basic cryptographic pattern detection

PEM certificate/key detection

Risk classification

Security posture calculation

JSON scan results for the frontend

Technology Stack

Frontend

React

Vite

React Router

Lucide React

JavaScript

CSS

Backend

Python

FastAPI

Uvicorn

python-multipart

Standard Python libraries for file/archive processing

Project Structure

ECDAT/
│
├── backend/
│   ├── app.py
│   ├── scanner/
│   │   ├── __init__.py
│   │   ├── crypto_rules.py
│   │   ├── file_detector.py
│   │   └── scanner.py
│   ├── uploads/
│   └── reports/
│
├── frontend/
│   ├── public/
│   │   └── ecdat-logo.png
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── main.jsx
│   │   │
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   └── services/
│   │       └── api.js
│   │
│   ├── package.json
│   └── vite.config.js
│
├── reports/
├── uploads/
├── .gitignore
└── README.md

Requirements

Install the following before running the project:

Python 3.9 or newer

Node.js and npm

Git

VS Code or another development environment

The prototype was developed using separate Python virtual environments for the backend and Node dependencies for the frontend.

Installation

1. Clone the repository

git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd ECDAT

Replace the repository URL with the actual GitHub repository.

2. Set up the backend

From the project root:

cd backend
python3 -m venv venv
source venv/bin/activate

On Windows:

python -m venv venv
venv\\Scripts\\activate

Install the Python dependencies:

python -m pip install --upgrade pip
python -m pip install fastapi uvicorn python-multipart

3. Set up the frontend

Open a second terminal:

cd ECDAT/frontend
npm install

Make sure the logo exists at:

frontend/public/ecdat-logo.png

Running the Application

The frontend and backend run independently.

Terminal 1 — Backend

cd ~/Desktop/ECDAT/backend
source venv/bin/activate
python -m uvicorn app:app --reload --port 8000

Expected output:

Uvicorn running on http://127.0.0.1:8000
Application startup complete.

Terminal 2 — Frontend

cd ~/Desktop/ECDAT/frontend
npm run dev

Vite will normally provide a URL similar to:

http://localhost:5173/

Open that URL in the browser.

Application Workflow

Step 1 — Home Page

The homepage contains:

ECDAT branding

Upload control

Drag-and-drop area

About section

Workflow explanation

Discovery scope

The side rail contains only the useful navigation controls required by the prototype:

Upload
About
History

Step 2 — Select a File

The upload area accepts files without restricting the user to only .zip files.

Examples include:

Source code
Configuration files
Certificates
Keys
Libraries
Archives
Binaries
Container-related files

Step 3 — Start Scan

Click Start Scan.

The application displays a scan-processing screen before opening the dashboard. The current prototype intentionally keeps the processing screen visible for a short minimum period so the scan workflow is understandable in demonstrations.

Step 4 — Backend Scan

The frontend sends the selected file to:

POST http://127.0.0.1:8000/scan

The backend then:

Saves the uploaded file temporarily.

Detects whether the input is an archive or individual file.

Extracts supported archives safely.

Traverses discovered files.

Classifies file types.

Searches readable content for configured cryptographic patterns.

Detects certain PEM certificate/key artefacts.

Calculates risk statistics.

Calculates the overall security posture.

Returns a JSON result to the frontend.

Step 5 — Dashboard

The dashboard displays:

Files scanned

Cryptographic assets

Critical findings

High-risk findings

Quantum-vulnerable findings

Unique algorithms

Discovered content categories

Risk distribution

Algorithm distribution

Project composition

Cryptographic artefacts

Exact file and line information

Recommendations

Scan history

Security Posture

The dashboard provides a high-level assessment of the scan.

The current rules are:

Critical findings present
        ↓
Highly Critical

No Critical, but High or Quantum Vulnerable findings
        ↓
High Risk

No Critical/High, but Medium or Legacy findings
        ↓
Elevated

Otherwise
        ↓
Normal

This is a prototype scoring model. It is not a formal enterprise risk methodology and should be extended with business criticality, asset lifetime, data lifetime, migration effort, and other contextual factors for production use.

Cryptographic Detection

The prototype currently includes rules for examples such as:

Public-key algorithms

RSA
RSA-2048
ECDSA
ECDH
EC
Ed25519
X25519
DSA
Diffie-Hellman

Symmetric algorithms

AES
ChaCha20
3DES
DES
RC4

Hash algorithms

MD5
SHA-1

Protocol-related patterns

TLS 1.0
TLS 1.1

Post-quantum algorithms

ML-DSA
ML-KEM
SLH-DSA

These patterns are configurable in:

backend/scanner/crypto_rules.py

File Classification

The scanner currently classifies files broadly into categories such as:

source/code
configuration
certificate/key
archive
container
library
binary/unknown

Examples of recognized source extensions include:

.java
.py
.js
.jsx
.ts
.tsx
.c
.cpp
.h
.go
.rs
.kt
.cs
.php
.swift

Common configuration formats include:

.json
.yaml
.yml
.toml
.ini
.cfg
.conf
.properties
.xml
.env

Certificate/key formats include examples such as:

.pem
.crt
.cer
.der
.key
.csr
.p12
.pfx
.jks

Archives include examples such as:

.zip
.tar
.gz
.tgz
.bz2
.xz
.7z
.rar

Library/package formats include examples such as:

.jar
.war
.ear
.aar
.whl
.egg

Real Cryptographic File Support

The current backend can inspect some real cryptographic files and not just source-code text.

For example, PEM-encoded certificate/key files can be recognized from their PEM headers.

For certificates, the prototype can attempt to read certificate metadata such as subject, issuer, and expiry.

For private-key files, the dashboard does not display private-key contents. The scanner only records the presence/type of the private-key material and a related security assessment.

Important limitation: the prototype is not yet a complete binary reverse-engineering or cryptographic dependency-analysis engine. Compiled native binaries, complex proprietary formats, JKS/PKCS#12 internals, DER-encoded objects, container layers, and deeply nested library dependencies require dedicated analyzers for production-grade coverage.

API

Health check

GET /

Returns basic API status.

Example:

{
  "name": "ECDAT API",
  "status": "running",
  "version": "0.2.0"
}

Health endpoint

GET /health

Example:

{
  "status": "healthy"
}

Scan endpoint

POST /scan

Multipart form field:

file

The endpoint returns the scan summary, discovered files, and cryptographic artefacts.

Example Scan Result

A simplified result can look like:

{
  "input": {
    "name": "ECDAT_dummy_dataset.zip",
    "type": "archive",
    "size": 12345
  },
  "summary": {
    "files_scanned": 12,
    "crypto_assets": 7,
    "critical": 3,
    "high": 2,
    "medium": 1,
    "low": 1,
    "quantum_vulnerable": 4,
    "legacy_weak": 2,
    "security_posture": {
      "key": "CRITICAL",
      "label": "Highly Critical",
      "description": "Critical findings are present."
    }
  },
  "files": [],
  "artifacts": []
}

Scan History

The prototype stores recent scan results in browser localStorage.

The dashboard supports:

Viewing previous scans

Reopening stored scan results

Clearing scan history

This is client-side storage only. A production system should move scan history into a controlled backend database with appropriate authentication, authorization, retention, and audit controls.

Export

The dashboard can export:

JSON

Contains the complete scan response.

Filename:

ecdat-scan-report.json

CSV

Contains the cryptographic inventory in tabular form.

Filename:

ecdat-inventory.csv

Git Setup

Initialize Git from the project root:

cd ~/Desktop/ECDAT
git init
git add .
git commit -m "Initial ECDAT CBOM scanner prototype"

Connect the GitHub repository:

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main

For future changes:

git add .
git commit -m "Update ECDAT scanner and dashboard"
git push

Recommended .gitignore

Do not commit virtual environments, dependency folders, local reports, uploaded files, or secrets.

Example:

# Python
__pycache__/
*.py[cod]
.venv/
venv/
.env

# Node
node_modules/
dist/

# Local/project data
uploads/*
backend/uploads/*
reports/*
backend/reports/*

# OS/editor
.DS_Store
.vscode/
.idea/

Development Notes

Frontend changes

After modifying the frontend, Vite normally reloads automatically. If necessary:

Ctrl + C
npm run dev

Backend changes

Uvicorn is running with --reload, so Python changes normally restart the backend automatically.

Python interpreter in VS Code

The backend should use the backend virtual environment:

ECDAT/backend/venv/bin/python

In VS Code:

Command + Shift + P
→ Python: Select Interpreter
→ ECDAT/backend/venv/bin/python

Do not accidentally select the unrelated root .venv when working on this backend.

Troubleshooting

uvicorn: command not found

Use the virtual environment and launch Uvicorn through Python:

cd backend
source venv/bin/activate
python -m uvicorn app:app --reload --port 8000

fastapi could not be resolved in VS Code

Ensure VS Code is using:

backend/venv/bin/python

Then reload the VS Code window if required.

Vite cannot resolve ./services/api

api.js must be located at:

frontend/src/services/api.js

The import in App.jsx should be:

import { scanFile } from "./services/api";

CORS / backend connection error

Confirm the FastAPI server is running:

python -m uvicorn app:app --reload --port 8000

Then test:

http://127.0.0.1:8000/

Dashboard is empty

Open the homepage first:

http://localhost:5173/

Upload a file and start a scan. The dashboard expects the current scan result to be supplied by the application flow.

Security Considerations

This project is a prototype. Do not use it to process production secrets or private keys without adding appropriate controls.

Before production use, consider adding:

Authentication and role-based access control

Encrypted storage

Secure file handling and malware scanning

Strict upload size/type limits

Sandbox isolation for untrusted input

Database-backed scan history

Audit logging

Secret redaction and sensitive-data controls

More complete binary and dependency analysis

Certificate chain analysis

Key-size and parameter validation

SBOM/CBOM standardized output

Business criticality and data-lifetime inputs

Mosca-style harvest-now-decrypt-later assessment

Migration-time estimation

PQC/hybrid performance and cost analysis

Policy and compliance mappings

Roadmap

Potential next stages for ECDAT include:

More complete language-aware source scanning.

JAR/WAR/library dependency inspection.

Real certificate and key parsing.

Native binary analysis.

Container image scanning.

Standardized CBOM export.

Asset lifetime and business-criticality scoring.

Mosca-style quantum risk analysis using data lifetime, migration time, and a configurable cryptographically relevant quantum-computer horizon.

Better PQC/hybrid recommendations based on usage, latency, key size, compatibility, and operational constraints.

Backend database and user/project management.

Enterprise repository integrations such as GitHub, GitLab, Bitbucket, and Azure DevOps.

Prototype Disclaimer

ECDAT is currently a prototype for demonstration, development, and research purposes. Its cryptographic detection rules and risk classifications should not be treated as a complete security assessment or as a substitute for a production-grade cryptographic inventory platform, formal risk assessment, or independent security review.

License

Add the appropriate project license before public distribution.
