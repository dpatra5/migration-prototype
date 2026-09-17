"""TMF Folder Hierarchy Builder and Document Mapper.

Part A: One-time creation of the TMF 3-level folder hierarchy.
Part B: Ongoing mapping of unzipped source documents into the hierarchy.
"""

from .hierarchy import TMF_HIERARCHY, build_hierarchy
from .mapper import map_source_to_destination
from .agent import run_agent

__all__ = [
    "TMF_HIERARCHY",
    "build_hierarchy",
    "map_source_to_destination",
    "run_agent",
]
