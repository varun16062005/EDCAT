from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Dict
from zipfile import BadZipFile, ZipFile, is_zipfile
import tarfile

from fastapi import (
    FastAPI,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware

from scanner.file_detector import detect_file_type
from scanner.scanner import scan_directory


BASE_DIR = Path(__file__).resolve().parent

UPLOADS_DIR = BASE_DIR / "uploads"
REPORTS_DIR = BASE_DIR / "reports"

UPLOADS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

REPORTS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


app = FastAPI(
    title="ECDAT API",
    version="0.2.0",
    description=(
        "Cryptographic Discovery, "
        "CBOM Analysis and Quantum Risk Assessment API"
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def safe_zip_extract(
    archive_path: Path,
    destination: Path,
) -> None:
    with ZipFile(
        archive_path,
        "r",
    ) as archive:
        destination_root = destination.resolve()

        for member in archive.infolist():
            target = (
                destination
                / member.filename
            ).resolve()

            if not str(target).startswith(
                str(destination_root)
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Unsafe archive path detected."
                    ),
                )

        archive.extractall(
            destination
        )


def safe_tar_extract(
    archive_path: Path,
    destination: Path,
) -> None:
    destination_root = destination.resolve()

    with tarfile.open(
        archive_path,
        "r:*",
    ) as archive:
        for member in archive.getmembers():
            target = (
                destination
                / member.name
            ).resolve()

            if not str(target).startswith(
                str(destination_root)
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Unsafe archive path detected."
                    ),
                )

        archive.extractall(
            destination
        )


async def save_upload_file(
    upload: UploadFile,
    destination: Path,
) -> int:
    total_size = 0

    with destination.open(
        "wb"
    ) as output:
        while True:
            chunk = await upload.read(
                1024 * 1024
            )

            if not chunk:
                break

            total_size += len(chunk)
            output.write(chunk)

    return total_size


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "name": "ECDAT API",
        "status": "running",
        "version": "0.2.0",
    }


@app.get("/health")
def health() -> Dict[str, str]:
    return {
        "status": "healthy",
    }


@app.post("/scan")
async def scan_file(
    file: UploadFile = File(...),
) -> Dict[str, Any]:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename was provided.",
        )

    original_name = Path(
        file.filename
    ).name

    with TemporaryDirectory(
        prefix="ecdat_scan_"
    ) as temporary_directory:
        temp_root = Path(
            temporary_directory
        )

        uploaded_file = (
            temp_root / original_name
        )

        size = await save_upload_file(
            file,
            uploaded_file,
        )

        if size == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        input_type = detect_file_type(
            uploaded_file
        )

        scan_root = temp_root / "scan"

        scan_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:
            if is_zipfile(
                uploaded_file
            ):
                safe_zip_extract(
                    uploaded_file,
                    scan_root,
                )

            elif tarfile.is_tarfile(
                uploaded_file
            ):
                safe_tar_extract(
                    uploaded_file,
                    scan_root,
                )

            else:
                target = (
                    scan_root
                    / original_name
                )

                target.write_bytes(
                    uploaded_file.read_bytes()
                )

        except BadZipFile:
            raise HTTPException(
                status_code=400,
                detail="The uploaded ZIP file is invalid.",
            )

        except tarfile.TarError:
            raise HTTPException(
                status_code=400,
                detail="The uploaded TAR archive is invalid.",
            )

        result = scan_directory(
            scan_root
        )

        result["input"] = {
            "name": original_name,
            "type": input_type,
            "size": size,
        }

        return result
