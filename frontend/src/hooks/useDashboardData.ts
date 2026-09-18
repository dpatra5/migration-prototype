import { useEffect, useRef, useState } from "react";
import {
  dtoToJob,
  fetchSnapshot,
  fetchTransferReport,
  type DashboardJobDTO,
  type TransferReportDTO,
} from "../api/dashboard";
import type { Job, MigrationMetrics } from "../types";

interface DashboardData {
  metrics: MigrationMetrics | null;
  jobs: Job[];
  active: Job[];
  online: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  mapping: boolean;
  mappingLabel: string | null;
  report: TransferReportDTO | null;
}

const POLL_MS = 3000;

const EMPTY: DashboardData = {
  metrics: null,
  jobs: [],
  active: [],
  online: false,
  loading: true,
  error: null,
  lastUpdated: null,
  mapping: false,
  mappingLabel: null,
  report: null,
};

function toJobList(list: DashboardJobDTO[]): Job[] {
  return list.map(dtoToJob);
}

export function useDashboardData(): DashboardData {
  const [state, setState] = useState<DashboardData>(EMPTY);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const tick = async () => {
      try {
        const [snap, report] = await Promise.all([
          fetchSnapshot(controller.signal),
          fetchTransferReport(50, controller.signal).catch(() => null),
        ]);
        if (cancelled) return;
        const active = toJobList(snap.active);
        const mapping = active.length > 0;
        const mappingLabel = mapping ? active[0].study : null;
        setState({
          metrics: snap.metrics,
          jobs: toJobList(snap.recent),
          active,
          online: true,
          loading: false,
          error: null,
          lastUpdated: new Date(),
          mapping,
          mappingLabel,
          report,
        });
      } catch (err: any) {
        if (cancelled || err?.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          online: false,
          loading: false,
          error: err?.message ?? "Unknown error",
        }));
      }
    };

    tick();
    const id = window.setInterval(tick, POLL_MS);
    timerRef.current = id;

    return () => {
      cancelled = true;
      controller.abort();
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return state;
}
