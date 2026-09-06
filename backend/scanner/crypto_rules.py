CRYPTO_RULES = [
    # =========================================================
    # POST-QUANTUM / CURRENT
    # =========================================================

    {
        "algorithm": "ML-DSA",
        "family": "Post-Quantum Signature",
        "category": "Signature",
        "usage": "Post-quantum digital signature",
        "patterns": [
            "ML-DSA",
            "MLDSA",
            "Dilithium",
        ],
        "quantum_status": "NOT_CURRENTLY_QUANTUM_VULNERABLE",
        "risk": "LOW",
        "recommendation": "Retain current PQC deployment and monitor implementation maturity.",
    },
    {
        "algorithm": "ML-KEM",
        "family": "Post-Quantum KEM",
        "category": "Key Establishment",
        "usage": "Post-quantum key encapsulation",
        "patterns": [
            "ML-KEM",
            "MLKEM",
            "Kyber",
        ],
        "quantum_status": "NOT_CURRENTLY_QUANTUM_VULNERABLE",
        "risk": "LOW",
        "recommendation": "Suitable PQC direction for key establishment; evaluate hybrid deployment where required.",
    },
    {
        "algorithm": "SLH-DSA",
        "family": "Post-Quantum Signature",
        "category": "Signature",
        "usage": "Post-quantum stateless hash-based signature",
        "patterns": [
            "SLH-DSA",
            "SLHDSA",
            "SPHINCS",
        ],
        "quantum_status": "NOT_CURRENTLY_QUANTUM_VULNERABLE",
        "risk": "LOW",
        "recommendation": "Retain current PQC deployment and assess operational requirements.",
    },

    # =========================================================
    # RSA
    # =========================================================

    {
        "algorithm": "RSA-2048",
        "family": "RSA",
        "category": "Public-Key",
        "usage": "RSA encryption/signature/key generation",
        "patterns": [
            "RSA-2048",
            "RSA2048",
            "RSA/ECB",
            "RSA/ECB/PKCS1Padding",
            "generateKeyPair",
            "KeyPairGenerator.getInstance(\"RSA\")",
            "KeyPairGenerator.getInstance('RSA')",
            "getInstance(\"RSA\")",
            "getInstance('RSA')",
            "RSA PRIVATE KEY",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "CRITICAL",
        "recommendation": "Prioritize migration to ML-DSA for signatures and ML-KEM or a hybrid design for key establishment.",
    },
    {
        "algorithm": "RSA",
        "family": "RSA",
        "category": "Public-Key",
        "usage": "RSA cryptographic operation",
        "patterns": [
            "RSA",
            "rsa_private_key",
            "rsa_public_key",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "CRITICAL",
        "recommendation": "Plan PQC or hybrid migration. Prefer ML-DSA for signatures and ML-KEM for key establishment.",
    },

    # =========================================================
    # ECC / ECDSA / ECDH
    # =========================================================

    {
        "algorithm": "ECDSA",
        "family": "Elliptic Curve",
        "category": "Signature",
        "usage": "Elliptic-curve digital signature",
        "patterns": [
            "ECDSA",
            "EC PRIVATE KEY",
            "ECPrivateKey",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "CRITICAL",
        "recommendation": "Plan migration to ML-DSA or a hybrid signature strategy.",
    },
    {
        "algorithm": "ECDH",
        "family": "Elliptic Curve",
        "category": "Key Establishment",
        "usage": "Elliptic-curve key agreement",
        "patterns": [
            "ECDH",
            "KeyAgreement.getInstance(\"ECDH\")",
            "KeyAgreement.getInstance('ECDH')",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "CRITICAL",
        "recommendation": "Plan migration to ML-KEM or a hybrid key-establishment mechanism.",
    },
    {
        "algorithm": "EC",
        "family": "Elliptic Curve",
        "category": "Public-Key",
        "usage": "Elliptic-curve cryptography",
        "patterns": [
            "ECGenParameterSpec",
            "secp256r1",
            "secp384r1",
            "secp521r1",
            "prime256v1",
            "P-256",
            "P-384",
            "P-521",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "HIGH",
        "recommendation": "Assess role and migrate ECC signatures/key establishment toward PQC or hybrid mechanisms.",
    },
    {
        "algorithm": "Ed25519",
        "family": "EdDSA",
        "category": "Signature",
        "usage": "Elliptic-curve digital signature",
        "patterns": [
            "Ed25519",
            "ED25519",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "CRITICAL",
        "recommendation": "Evaluate ML-DSA or a hybrid signature migration path.",
    },
    {
        "algorithm": "X25519",
        "family": "Elliptic Curve",
        "category": "Key Establishment",
        "usage": "Elliptic-curve key agreement",
        "patterns": [
            "X25519",
            "x25519",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "CRITICAL",
        "recommendation": "Evaluate ML-KEM or a hybrid key-establishment migration path.",
    },

    # =========================================================
    # DSA / DH
    # =========================================================

    {
        "algorithm": "DSA",
        "family": "Finite-Field Public-Key",
        "category": "Signature",
        "usage": "Digital signature",
        "patterns": [
            "DSA",
            "DSA PRIVATE KEY",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "CRITICAL",
        "recommendation": "Migrate toward ML-DSA or a hybrid signature mechanism.",
    },
    {
        "algorithm": "Diffie-Hellman",
        "family": "Finite-Field Public-Key",
        "category": "Key Establishment",
        "usage": "Diffie-Hellman key exchange",
        "patterns": [
            "DiffieHellman",
            "Diffie-Hellman",
            "DHParameterSpec",
            "DH PRIVATE KEY",
        ],
        "quantum_status": "VULNERABLE",
        "risk": "CRITICAL",
        "recommendation": "Migrate toward ML-KEM or a hybrid key-establishment mechanism.",
    },

    # =========================================================
    # SYMMETRIC
    # =========================================================

    {
        "algorithm": "AES",
        "family": "AES",
        "category": "Symmetric",
        "usage": "Symmetric encryption",
        "patterns": [
            "AES",
            "AES/GCM",
            "AES/CBC",
            "AES/CTR",
        ],
        "quantum_status": "NOT_CURRENTLY_QUANTUM_VULNERABLE",
        "risk": "LOW",
        "recommendation": "Continue using appropriately sized AES keys and authenticated encryption where possible.",
    },
    {
        "algorithm": "ChaCha20",
        "family": "ChaCha",
        "category": "Symmetric",
        "usage": "Symmetric encryption",
        "patterns": [
            "ChaCha20",
            "CHACHA20",
        ],
        "quantum_status": "NOT_CURRENTLY_QUANTUM_VULNERABLE",
        "risk": "LOW",
        "recommendation": "Continue current deployment while reviewing key-size and implementation requirements.",
    },

    # =========================================================
    # WEAK / LEGACY
    # =========================================================

    {
        "algorithm": "3DES",
        "family": "Triple DES",
        "category": "Symmetric",
        "usage": "Legacy symmetric encryption",
        "patterns": [
            "3DES",
            "DESede",
            "TripleDES",
        ],
        "quantum_status": "LEGACY_WEAK",
        "risk": "CRITICAL",
        "recommendation": "Replace with modern authenticated encryption such as AES-GCM or an approved alternative.",
    },
    {
        "algorithm": "DES",
        "family": "DES",
        "category": "Symmetric",
        "usage": "Legacy symmetric encryption",
        "patterns": [
            "DES",
            "DES/CBC",
            "DES/ECB",
        ],
        "quantum_status": "LEGACY_WEAK",
        "risk": "CRITICAL",
        "recommendation": "Remove DES and migrate to modern symmetric encryption.",
    },
    {
        "algorithm": "RC4",
        "family": "RC4",
        "category": "Symmetric",
        "usage": "Legacy stream encryption",
        "patterns": [
            "RC4",
            "ARCFOUR",
        ],
        "quantum_status": "LEGACY_WEAK",
        "risk": "CRITICAL",
        "recommendation": "Remove RC4 and migrate to a modern authenticated encryption mechanism.",
    },
    {
        "algorithm": "MD5",
        "family": "MD",
        "category": "Hash",
        "usage": "Legacy cryptographic hash",
        "patterns": [
            "MD5",
            "MessageDigest.getInstance(\"MD5\")",
            "MessageDigest.getInstance('MD5')",
        ],
        "quantum_status": "LEGACY_WEAK",
        "risk": "HIGH",
        "recommendation": "Replace MD5 with an approved modern hash such as SHA-256 or stronger.",
    },
    {
        "algorithm": "SHA-1",
        "family": "SHA",
        "category": "Hash",
        "usage": "Legacy cryptographic hash",
        "patterns": [
            "SHA-1",
            "SHA1",
            "MessageDigest.getInstance(\"SHA-1\")",
            "MessageDigest.getInstance('SHA-1')",
        ],
        "quantum_status": "LEGACY_WEAK",
        "risk": "HIGH",
        "recommendation": "Replace SHA-1 with SHA-256 or stronger approved hashes.",
    },

    # =========================================================
    # PROTOCOLS
    # =========================================================

    {
        "algorithm": "TLS 1.0",
        "family": "TLS",
        "category": "Protocol",
        "usage": "Legacy transport security protocol",
        "patterns": [
            "TLSv1",
            "TLS 1.0",
            "TLSv1.0",
        ],
        "quantum_status": "REVIEW",
        "risk": "HIGH",
        "recommendation": "Disable legacy TLS versions and migrate toward modern TLS configurations.",
    },
    {
        "algorithm": "TLS 1.1",
        "family": "TLS",
        "category": "Protocol",
        "usage": "Legacy transport security protocol",
        "patterns": [
            "TLSv1.1",
            "TLS 1.1",
        ],
        "quantum_status": "REVIEW",
        "risk": "HIGH",
        "recommendation": "Disable legacy TLS versions and migrate toward modern TLS configurations.",
    },
]