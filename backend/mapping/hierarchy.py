"""TMF folder hierarchy definition and creation (Part A).

The hierarchy is a nested dict:
    { "01": {"name": "Trial Management",
             "sections": {
                 "01.01": {"name": "Trial Oversight",
                           "artifacts": {"01.01.01": "Trial Master File Plan", ...}
                 }, ...
             }
      }, ...
    }
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Tuple

log = logging.getLogger(__name__)

UNCLASSIFIED_FOLDER = "_Unclassified"


TMF_HIERARCHY: Dict[str, dict] = {
    "01": {
        "name": "Trial Management",
        "sections": {
            "01.01": {
                "name": "Trial Oversight",
                "artifacts": {
                    "01.01.01": "Trial Master File Plan",
                    "01.01.02": "Trial Management Plan",
                    "01.01.03": "Quality Plan",
                    "01.01.04": "List of SOPs Current During Trial",
                    "01.01.05": "Operational Procedure Manual",
                    "01.01.06": "Recruitment Plan",
                    "01.01.07": "Communication Plan",
                    "01.01.08": "Monitoring Plan",
                    "01.01.09": "Medical Monitoring Plan",
                    "01.01.10": "Publication Policy",
                    "01.01.11": "Debarment Statement",
                    "01.01.12": "Trial Status Report",
                    "01.01.13": "Investigator Newsletter",
                    "01.01.14": "Audit Certificate",
                    "01.01.15": "Filenote Master List",
                    "01.01.16": "Risk Management Plan",
                    "01.01.17": "Vendor Management Plan",
                    "01.01.18": "Roles and Responsibility Matrix",
                    "01.01.19": "Transfer of Regulatory Obligations",
                    "01.01.20": "Operational Oversight",
                },
            },
            "01.02": {
                "name": "Trial Team",
                "artifacts": {
                    "01.02.01": "Trial Team Details",
                    "01.02.02": "Trial Team Curriculum Vitae",
                },
            },
            "01.03": {
                "name": "Trial Committee",
                "artifacts": {
                    "01.03.01": "Committee Process",
                    "01.03.02": "Committee Member List",
                    "01.03.03": "Committee Output",
                    "01.03.04": "Committee Member Curriculum Vitae",
                    "01.03.05": "Committee Member Financial Disclosure Form",
                    "01.03.06": "Committee Member Contract",
                    "01.03.07": "Committee Member Confidentiality Disclosure Agreement",
                },
            },
            "01.04": {
                "name": "Meetings",
                "artifacts": {
                    "01.04.01": "Kick-off Meeting Material",
                    "01.04.02": "Trial Team Training Material",
                    "01.04.03": "Investigators Meeting Material",
                    "01.04.04": "Trial Team Evidence of Training",
                },
            },
            "01.05": {
                "name": "General",
                "artifacts": {
                    "01.05.01": "Relevant Communications",
                    "01.05.02": "Tracking Information",
                    "01.05.03": "Other Meeting Material",
                    "01.05.04": "Filenote",
                },
            },
        },
    },
    "02": {
        "name": "Central Trial Documents",
        "sections": {
            "02.01": {
                "name": "Product and Trial Documentation",
                "artifacts": {
                    "02.01.01": "Investigator's Brochure",
                    "02.01.02": "Protocol",
                    "02.01.03": "Protocol Synopsis",
                    "02.01.04": "Protocol Amendment",
                    "02.01.05": "Financial Disclosure Summary",
                    "02.01.06": "Insurance",
                    "02.01.07": "Sample Case Report Form",
                    "02.01.10": "Report of Prior Investigations",
                    "02.01.11": "Marketed Product Material",
                },
            },
            "02.02": {
                "name": "Subject Documentation",
                "artifacts": {
                    "02.02.01": "Subject Diary",
                    "02.02.02": "Subject Questionnaire",
                    "02.02.03": "Informed Consent Form",
                    "02.02.04": "Subject Information Sheet",
                    "02.02.05": "Subject Participation Card",
                    "02.02.06": "Advertisements for Subject Recruitment",
                    "02.02.07": "Other Information Given to Subjects",
                },
            },
            "02.03": {
                "name": "Reports",
                "artifacts": {
                    "02.03.01": "Clinical Study Report",
                    "02.03.02": "Bioanalytical Report",
                },
            },
            "02.04": {
                "name": "General",
                "artifacts": {
                    "02.04.01": "Relevant Communications",
                    "02.04.02": "Tracking Information",
                    "02.04.03": "Meeting Material",
                    "02.04.04": "Filenote",
                },
            },
        },
    },
    "03": {
        "name": "Regulatory",
        "sections": {
            "03.01": {
                "name": "Trial Approval",
                "artifacts": {
                    "03.01.01": "Regulatory Submission",
                    "03.01.02": "Regulatory Approval Notification",
                    "03.01.03": "Notification of Regulatory Identification Number",
                    "03.01.04": "Public Registration",
                },
            },
            "03.02": {
                "name": "Investigational Medicinal Product",
                "artifacts": {
                    "03.02.01": "Import or Export License Application",
                    "03.02.02": "Import or Export License",
                },
            },
            "03.03": {
                "name": "Trial Status Reporting",
                "artifacts": {
                    "03.03.01": "Notification to Regulatory Authority of Safety or Trial Information",
                    "03.03.02": "Regulatory Progress Report",
                    "03.03.03": "Regulatory Notification of Trial Termination",
                },
            },
            "03.04": {
                "name": "General",
                "artifacts": {
                    "03.04.01": "Relevant Communications",
                    "03.04.02": "Tracking Information",
                    "03.04.03": "Meeting Material",
                    "03.04.04": "Filenote",
                },
            },
        },
    },
    "04": {
        "name": "IRB or IEC and other Approvals",
        "sections": {
            "04.01": {
                "name": "IRB or IEC Trial Approval",
                "artifacts": {
                    "04.01.01": "IRB or IEC Submission",
                    "04.01.02": "IRB or IEC Approval",
                    "04.01.03": "IRB or IEC Composition",
                    "04.01.04": "IRB or IEC Documentation of Non-Voting Status",
                    "04.01.05": "IRB or IEC Compliance Documentation",
                },
            },
            "04.02": {
                "name": "Other Committees",
                "artifacts": {
                    "04.02.01": "Other Submissions",
                    "04.02.02": "Other Approvals",
                },
            },
            "04.03": {
                "name": "Trial Status Reporting",
                "artifacts": {
                    "04.03.01": "Notification to IRB or IEC of Safety Information",
                    "04.03.02": "IRB or IEC Progress Report",
                    "04.03.03": "IRB or IEC Notification of Trial Termination",
                },
            },
            "04.04": {
                "name": "General",
                "artifacts": {
                    "04.04.01": "Relevant Communications",
                    # Corrected from spec typo "04.44.02" to match parent 04.04.
                    "04.04.02": "Tracking Information",
                    "04.04.03": "Meeting Material",
                    "04.04.04": "Filenote",
                },
            },
        },
    },
    "05": {
        "name": "Site Management",
        "sections": {
            "05.01": {
                "name": "Site Selection",
                "artifacts": {
                    "05.01.01": "Site Contact Details",
                    "05.01.02": "Confidentiality Agreement",
                    "05.01.03": "Feasibility Documentation",
                    "05.01.04": "Pre Trial Monitoring Report",
                    "05.01.05": "Sites Evaluated but not Selected",
                },
            },
            "05.02": {
                "name": "Site Set-up",
                "artifacts": {
                    "05.02.01": "Acceptance of Investigator Brochure",
                    "05.02.02": "Protocol Signature Page",
                    "05.02.03": "Protocol Amendment Signature Page",
                    "05.02.04": "Principal Investigator Curriculum Vitae",
                    "05.02.05": "Sub-Investigator Curriculum Vitae",
                    "05.02.06": "Other Curriculum Vitae",
                    "05.02.07": "Site Staff Qualification Supporting Information",
                    "05.02.08": "Form FDA 1572",
                    "05.02.09": "Investigator Regulatory Agreement",
                    "05.02.10": "Financial Disclosure Form",
                    "05.02.11": "Data Privacy Agreement",
                    "05.02.12": "Clinical Trial Agreement",
                    "05.02.13": "Indemnity",
                    "05.02.14": "Other Financial Agreement",
                    "05.02.17": "IP Site Release Documentation",
                    "05.02.18": "Site Signature Sheet",
                    "05.02.19": "Investigators Agreement (Device)",
                    "05.02.20": "Coordinating Investigator Documentation",
                },
            },
            "05.03": {
                "name": "Site Initiation",
                "artifacts": {
                    "05.03.01": "Trial Initiation Monitoring Report",
                    "05.03.02": "Site Training Material",
                    "05.03.03": "Site Evidence of Training",
                },
            },
            "05.04": {
                "name": "Site Management",
                "artifacts": {
                    "05.04.01": "Subject Log",
                    "05.04.02": "Source Data Verification",
                    "05.04.03": "Monitoring Visit Report",
                    "05.04.04": "Visit Log",
                    "05.04.05": "Additional Monitoring Activity",
                    "05.04.06": "Protocol Deviations",
                    "05.04.07": "Financial Documentation",
                    "05.04.08": "Final Trial Close Out Monitoring Report",
                    "05.04.09": "Notification to Investigators of Safety Information",
                    "05.04.10": "Subject Identification Log",
                    "05.04.11": "Source Data",
                    "05.04.12": "Monitoring Visit Follow-up Documentation",
                    "05.04.13": "Subject Eligibility Verification Forms and Worksheets",
                },
            },
            "05.05": {
                "name": "General",
                "artifacts": {
                    "05.05.01": "Relevant Communications",
                    "05.05.02": "Tracking Information",
                    "05.05.03": "Meeting Material",
                    "05.05.04": "Filenote",
                },
            },
        },
    },
    "06": {
        "name": "IP and Trial Supplies",
        "sections": {
            "06.01": {
                "name": "IP Documentation",
                "artifacts": {
                    "06.01.01": "IP Supply Plan",
                    "06.01.02": "IP Instructions for Handling",
                    "06.01.03": "IP Sample Label",
                    "06.01.04": "IP Shipment Documentation",
                    "06.01.05": "IP Accountability Documentation",
                    "06.01.06": "IP Transfer Documentation",
                    "06.01.07": "IP Re-labeling Documentation",
                    "06.01.08": "IP Recall Documentation",
                    "06.01.09": "IP Quality Complaint Form",
                    "06.01.10": "IP Return Documentation",
                    "06.01.11": "IP Certificate of Destruction",
                    "06.01.12": "IP Retest and Expiry Documentation",
                },
            },
            "06.02": {
                "name": "IP Release Process Documentation",
                "artifacts": {
                    "06.02.01": "QP (Qualified Person) Certification",
                    "06.02.02": "IP Regulatory Release Documentation",
                    "06.02.03": "IP Verification Statements",
                    "06.02.04": "Certificate of Analysis",
                },
            },
            "06.03": {
                "name": "IP Allocation Documentation",
                "artifacts": {
                    "06.03.01": "IP Treatment Allocation Documentation",
                    "06.03.02": "IP Unblinding Plan",
                    "06.03.03": "IP Treatment Decoding Documentation",
                },
            },
            "06.04": {
                "name": "Storage",
                "artifacts": {
                    "06.04.01": "IP Storage Condition Documentation",
                    "06.04.02": "IP Storage Condition Excursion Documentation",
                    "06.04.03": "Maintenance Logs (Device)",
                },
            },
            "06.05": {
                "name": "Non-IP Documentation",
                "artifacts": {
                    "06.05.01": "Non-IP Supply Plan",
                    "06.05.02": "Non-IP Shipment Documentation",
                    "06.05.03": "Non-IP Return Documentation",
                },
            },
            "06.06": {
                "name": "Interactive Response Technology",
                "artifacts": {
                    "06.06.01": "IRT User Requirement Specification",
                    "06.06.02": "IRT Validation Certification",
                    "06.06.03": "IRT User Acceptance Testing (UAT) Certification",
                    "06.06.04": "IRT User Manual",
                    "06.06.05": "IRT User Account Management",
                },
            },
            "06.07": {
                "name": "General",
                "artifacts": {
                    "06.07.01": "Relevant Communications",
                    "06.07.02": "Tracking Information",
                    "06.07.03": "Meeting Material",
                    "06.07.04": "Filenote",
                },
            },
        },
    },
    "07": {
        "name": "Safety Reporting",
        "sections": {
            "07.01": {
                "name": "Safety Documentation",
                "artifacts": {
                    "07.01.01": "Safety Management Plan",
                    "07.01.02": "Pharmacovigilance Database Line Listing",
                },
            },
            "07.02": {
                "name": "Trial Status Reporting",
                "artifacts": {
                    "07.02.01": "Expedited Safety Report",
                    "07.02.02": "SAE Report",
                    "07.02.03": "Pregnancy Report",
                    "07.02.04": "Special Events of Interest",
                },
            },
            "07.03": {
                "name": "General",
                "artifacts": {
                    "07.03.01": "Relevant Communications",
                    "07.03.02": "Tracking Information",
                    "07.03.03": "Meeting Material",
                    "07.03.04": "Filenote",
                },
            },
        },
    },
    "08": {
        "name": "Central and Local Testing",
        "sections": {
            "08.01": {
                "name": "Facility Documentation",
                "artifacts": {
                    "08.01.01": "Certification or Accreditation",
                    "08.01.02": "Laboratory Validation Documentation",
                    "08.01.03": "Laboratory Results Documentation",
                    "08.01.04": "Normal Ranges",
                    "08.01.05": "Manual",
                    "08.01.06": "Supply Import Documentation",
                    "08.01.07": "Head of Facility Curriculum Vitae",
                    "08.01.08": "Standardization Methods",
                },
            },
            "08.02": {
                "name": "Sample Documentation",
                "artifacts": {
                    "08.02.01": "Specimen Label",
                    "08.02.02": "Shipment Records",
                    "08.02.03": "Sample Storage Condition Log",
                    "08.02.04": "Sample Import or Export Documentation",
                    "08.02.05": "Record of Retained Samples",
                },
            },
            "08.03": {
                "name": "General",
                "artifacts": {
                    "08.03.01": "Relevant Communications",
                    "08.03.02": "Tracking Information",
                    "08.03.03": "Meeting Material",
                    "08.03.04": "Filenote",
                },
            },
        },
    },
    "09": {
        "name": "Third Parties",
        "sections": {
            "09.01": {
                "name": "Third Party Oversight",
                "artifacts": {
                    "09.01.01": "Qualification and Compliance",
                    "09.01.02": "Third Party Curriculum Vitae",
                    "09.01.03": "Ongoing Third Party Oversight",
                },
            },
            "09.02": {
                "name": "Third Party Set-up",
                "artifacts": {
                    "09.02.01": "Confidentiality Agreement",
                    "09.02.02": "Vendor Selection",
                    "09.02.03": "Contractual Agreement",
                },
            },
            "09.03": {
                "name": "General",
                "artifacts": {
                    "09.03.01": "Relevant Communications",
                    "09.03.02": "Tracking Information",
                    "09.03.03": "Meeting Material",
                    "09.03.04": "Filenote",
                },
            },
        },
    },
    "10": {
        "name": "Data Management",
        "sections": {
            "10.01": {
                "name": "Data Management Oversight",
                "artifacts": {
                    "10.01.01": "Data Management Plan",
                },
            },
            "10.02": {
                "name": "Data Capture",
                "artifacts": {
                    "10.02.01": "CRF Completion Requirements",
                    "10.02.02": "Annotated CRF",
                    "10.02.04": "Documentation of Corrections to Entered Data",
                    "10.02.05": "Final Subject Data",
                },
            },
            "10.03": {
                "name": "Database",
                "artifacts": {
                    "10.03.01": "Database Specifications",
                    "10.03.02": "Edit Check Plan",
                    "10.03.03": "Edit Check Programming",
                    "10.03.04": "Edit Check Testing",
                    "10.03.05": "Approval for Database Activation",
                    "10.03.06": "External Data Transfer Specifications",
                    "10.03.07": "Data Entry Guidelines (Paper)",
                    "10.03.08": "SAE Reconciliation",
                    "10.03.09": "Dictionary Coding",
                    "10.03.10": "Data QC or QA Plan and Results",
                    "10.03.11": "Database Lock and Unlock Approval",
                    "10.03.12": "Database Change Control",
                },
            },
            "10.04": {
                "name": "EDC Management",
                "artifacts": {
                    "10.04.01": "System Account Management",
                    "10.04.02": "Technical Design Document",
                    "10.04.03": "Validation Documents",
                },
            },
            "10.05": {
                "name": "General",
                "artifacts": {
                    "10.05.01": "Relevant Communications",
                    "10.05.02": "Tracking Information",
                    "10.05.03": "Meeting Material",
                    "10.05.04": "Filenote",
                },
            },
        },
    },
    "11": {
        "name": "Statistics",
        "sections": {
            "11.01": {
                "name": "Statistics Oversight",
                "artifacts": {
                    "11.01.01": "Statistical Analysis Plan",
                    "11.01.02": "Sample Size Calculation",
                },
            },
            "11.02": {
                "name": "Randomization",
                "artifacts": {
                    "11.02.01": "Randomization Plan",
                    "11.02.02": "Randomization Procedure",
                    "11.02.03": "Master Randomization List",
                    "11.02.04": "Randomization Programming",
                    "11.02.05": "Randomization Sign Off",
                    "11.02.06": "End of Trial or Interim Unblinding",
                },
            },
            "11.03": {
                "name": "Analysis",
                "artifacts": {
                    "11.03.01": "Data Definitions for Analysis Datasets",
                    "11.03.02": "Analysis QC Documentation",
                    "11.03.03": "Interim Analysis Raw Datasets",
                    "11.03.04": "Interim Analysis Programs",
                    "11.03.05": "Interim Analysis Datasets",
                    "11.03.06": "Interim Analysis Output",
                    "11.03.07": "Final Analysis Raw Datasets",
                    "11.03.08": "Final Analysis Programs",
                    "11.03.09": "Final Analysis Datasets",
                    "11.03.10": "Final Analysis Output",
                    "11.03.11": "Subject Evaluability Criteria and Subject Classification",
                },
            },
            "11.04": {
                "name": "Report",
                "artifacts": {
                    "11.04.01": "Interim Statistical Report(s)",
                    "11.04.02": "Statistical Report",
                },
            },
            "11.05": {
                "name": "General",
                "artifacts": {
                    "11.05.01": "Relevant Communications",
                    "11.05.02": "Tracking Information",
                    "11.05.03": "Meeting Material",
                    "11.05.04": "Filenote",
                },
            },
        },
    },
    "12": {
        "name": "Computer System Validation",
        "sections": {
            "12.01": {
                "name": "Computer System Validation",
                "artifacts": {
                    "12.01.01": "Specification",
                    "12.01.02": "Signoff",
                    "12.01.03": "Computer System Validation Packet",
                },
            },
        },
    },
}


def _sanitize_component(name: str) -> str:
    """Windows-safe folder name: strip forbidden chars but keep readable."""
    forbidden = '<>:"/\\|?*'
    return "".join("_" if ch in forbidden else ch for ch in name).rstrip(" .")


def zone_folder_name(num: str, name: str) -> str:
    return _sanitize_component(f"{num} - {name}")


def artifact_folder_path(root: Path, zone_num: str, section_num: str, artifact_num: str) -> Path:
    """Compute the absolute path to a specific artifact folder under `root`."""
    z = TMF_HIERARCHY[zone_num]
    s = z["sections"][section_num]
    a_name = s["artifacts"][artifact_num]
    return (
        root
        / zone_folder_name(zone_num, z["name"])
        / zone_folder_name(section_num, s["name"])
        / zone_folder_name(artifact_num, a_name)
    )


def section_folder_path(root: Path, zone_num: str, section_num: str) -> Path:
    z = TMF_HIERARCHY[zone_num]
    s = z["sections"][section_num]
    return (
        root
        / zone_folder_name(zone_num, z["name"])
        / zone_folder_name(section_num, s["name"])
    )


def unclassified_folder_path(root: Path) -> Path:
    return root / UNCLASSIFIED_FOLDER


def build_hierarchy(destination_root: Path) -> Tuple[int, int, int, int]:
    """Create the full TMF folder hierarchy under `destination_root`.

    Idempotent: existing folders are skipped silently.
    Returns (zones_created, sections_created, artifacts_created, unclassified_created).
    """
    destination_root = Path(destination_root)
    destination_root.mkdir(parents=True, exist_ok=True)

    zones = sections = artifacts = 0

    for zone_num, zone in TMF_HIERARCHY.items():
        zone_path = destination_root / zone_folder_name(zone_num, zone["name"])
        if not zone_path.exists():
            zone_path.mkdir(parents=True, exist_ok=True)
            zones += 1

        for section_num, section in zone["sections"].items():
            section_path = zone_path / zone_folder_name(section_num, section["name"])
            if not section_path.exists():
                section_path.mkdir(parents=True, exist_ok=True)
                sections += 1

            for artifact_num, artifact_name in section["artifacts"].items():
                artifact_path = section_path / zone_folder_name(artifact_num, artifact_name)
                if not artifact_path.exists():
                    artifact_path.mkdir(parents=True, exist_ok=True)
                    artifacts += 1

    unclassified_path = unclassified_folder_path(destination_root)
    unclassified_created = 0
    if not unclassified_path.exists():
        unclassified_path.mkdir(parents=True, exist_ok=True)
        unclassified_created = 1

    log.info(
        "Hierarchy build complete: zones=%d, sections=%d, artifacts=%d, unclassified=%d",
        zones,
        sections,
        artifacts,
        unclassified_created,
    )
    return zones, sections, artifacts, unclassified_created


def iter_artifacts():
    """Yield (zone_num, section_num, artifact_num, artifact_name) for every artifact."""
    for zone_num, zone in TMF_HIERARCHY.items():
        for section_num, section in zone["sections"].items():
            for artifact_num, artifact_name in section["artifacts"].items():
                yield zone_num, section_num, artifact_num, artifact_name


def iter_sections():
    """Yield (zone_num, section_num, section_name) for every section."""
    for zone_num, zone in TMF_HIERARCHY.items():
        for section_num, section in zone["sections"].items():
            yield zone_num, section_num, section["name"]
