"""Standalone entry-point for the ZIP processing background service.

Run with:
    python -m zip_extractor.service
"""
from __future__ import annotations

import signal
import sys
import time

from .config import load_config
from .scheduler_service import SchedulerService


def main() -> int:
    config = load_config()
    service = SchedulerService(config=config, blocking=False)

    def _stop(_signum, _frame):
        service.shutdown(wait=False)
        sys.exit(0)

    signal.signal(signal.SIGINT, _stop)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, _stop)

    service.start(run_immediately=True)
    try:
        while True:
            time.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        service.shutdown(wait=True)
        raise
    return 0


if __name__ == "__main__":
    sys.exit(main())
