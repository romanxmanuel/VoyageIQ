"use client";

import { startTransition, useState } from "react";

import type { PlannerViewModel } from "@/domain/trip/types";

type SavePlanButtonProps = {
  viewModel: PlannerViewModel;
  selectedScenarioId: string;
};

export function SavePlanButton({ viewModel, selectedScenarioId }: SavePlanButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          startTransition(() => {
            void (async () => {
              setStatus("saving");
              setMessage("");

              try {
                const response = await fetch("/api/trips", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    viewModel,
                    selectedScenarioId
                  })
                });

                const payload = (await response.json()) as { id?: string; error?: string };

                if (!response.ok) {
                  throw new Error(payload.error ?? "Unable to save this strategy right now.");
                }

                setStatus("saved");
                setMessage(`Saved strategy ${payload.id}`);
              } catch (error) {
                setStatus("error");
                setMessage(error instanceof Error ? error.message : "Unable to save this strategy.");
              }
            })();
          });
        }}
        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-400 hover:text-cyan-700"
      >
        {status === "saving" ? "Saving strategy..." : "Save this strategy"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-rose-600" : "text-emerald-600"}`}>{message}</p>
      ) : null}
    </div>
  );
}

