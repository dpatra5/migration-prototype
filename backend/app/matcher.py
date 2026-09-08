from pathlib import Path

LOCAL_VTMF = Path(__file__).resolve().parent.parent / "local_vtmf"


def match_path(study: str, country: str, site: str) -> dict:
    """Check if the study/country/site path exists in the VTMF destination structure."""
    dest = LOCAL_VTMF / study / country / site
    study_dir = LOCAL_VTMF / study
    country_dir = LOCAL_VTMF / study / country

    if not study_dir.exists():
        return {"matched": False, "reason": f"Study '{study}' not found in VTMF"}
    if not country_dir.exists():
        return {"matched": False, "reason": f"Country '{country}' not found under study '{study}'"}
    if not dest.exists():
        return {"matched": False, "reason": f"Site '{site}' not found under {study}/{country}"}

    return {"matched": True, "dest": str(dest)}
