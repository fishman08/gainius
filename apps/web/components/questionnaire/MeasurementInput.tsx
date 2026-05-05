"use client";

import { useEffect, useState } from "react";
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
} from "@workout/core";

type Props = {
  metric: "height" | "weight";
  unitsPref: "metric" | "imperial";
  onChangeUnitsPref: (v: "metric" | "imperial") => void;
  value: number | undefined; // canonical: cm or kg
  onChange: (v: number) => void;
};

export function MeasurementInput({
  metric,
  unitsPref,
  onChangeUnitsPref,
  value,
  onChange,
}: Props) {
  if (metric === "height") {
    return (
      <HeightInput
        unitsPref={unitsPref}
        onChangeUnitsPref={onChangeUnitsPref}
        cm={value}
        onChangeCm={onChange}
      />
    );
  }
  return (
    <WeightInput
      unitsPref={unitsPref}
      onChangeUnitsPref={onChangeUnitsPref}
      kg={value}
      onChangeKg={onChange}
    />
  );
}

function UnitToggle({
  unitsPref,
  onChange,
  metricLabel,
  imperialLabel,
}: {
  unitsPref: "metric" | "imperial";
  onChange: (v: "metric" | "imperial") => void;
  metricLabel: string;
  imperialLabel: string;
}) {
  return (
    <div className="bg-surface inline-flex rounded-full border border-border p-1 text-sm">
      {(["metric", "imperial"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`rounded-full px-4 py-1.5 ${
            unitsPref === u ? "bg-accent text-bg" : "text-muted"
          }`}
        >
          {u === "metric" ? metricLabel : imperialLabel}
        </button>
      ))}
    </div>
  );
}

function HeightInput({
  unitsPref,
  onChangeUnitsPref,
  cm,
  onChangeCm,
}: {
  unitsPref: "metric" | "imperial";
  onChangeUnitsPref: (v: "metric" | "imperial") => void;
  cm: number | undefined;
  onChangeCm: (v: number) => void;
}) {
  const [localCm, setLocalCm] = useState<string>(cm ? String(cm) : "");
  const [localFt, setLocalFt] = useState<string>("");
  const [localIn, setLocalIn] = useState<string>("");

  useEffect(() => {
    if (cm == null) return;
    setLocalCm(String(cm));
    const { ft, inches } = cmToFeetInches(cm);
    setLocalFt(String(ft));
    setLocalIn(String(inches));
  }, [cm]);

  return (
    <div className="space-y-4">
      <UnitToggle
        unitsPref={unitsPref}
        onChange={onChangeUnitsPref}
        metricLabel="cm"
        imperialLabel="ft / in"
      />
      {unitsPref === "metric" ? (
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="cm"
          value={localCm}
          onChange={(e) => {
            setLocalCm(e.target.value);
            const n = Number.parseFloat(e.target.value);
            if (Number.isFinite(n)) onChangeCm(n);
          }}
          className="text-text w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="decimal"
            placeholder="ft"
            value={localFt}
            onChange={(e) => {
              setLocalFt(e.target.value);
              const ft = Number.parseFloat(e.target.value);
              const inches = Number.parseFloat(localIn || "0");
              if (Number.isFinite(ft)) onChangeCm(feetInchesToCm(ft, Number.isFinite(inches) ? inches : 0));
            }}
            className="text-text w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="in"
            value={localIn}
            onChange={(e) => {
              setLocalIn(e.target.value);
              const inches = Number.parseFloat(e.target.value);
              const ft = Number.parseFloat(localFt || "0");
              if (Number.isFinite(inches)) onChangeCm(feetInchesToCm(Number.isFinite(ft) ? ft : 0, inches));
            }}
            className="text-text w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
          />
        </div>
      )}
    </div>
  );
}

function WeightInput({
  unitsPref,
  onChangeUnitsPref,
  kg,
  onChangeKg,
}: {
  unitsPref: "metric" | "imperial";
  onChangeUnitsPref: (v: "metric" | "imperial") => void;
  kg: number | undefined;
  onChangeKg: (v: number) => void;
}) {
  const [local, setLocal] = useState<string>(
    kg == null ? "" : unitsPref === "metric" ? String(kg) : String(kgToLbs(kg)),
  );

  useEffect(() => {
    if (kg == null) return;
    setLocal(unitsPref === "metric" ? String(kg) : String(kgToLbs(kg)));
  }, [kg, unitsPref]);

  return (
    <div className="space-y-4">
      <UnitToggle
        unitsPref={unitsPref}
        onChange={onChangeUnitsPref}
        metricLabel="kg"
        imperialLabel="lbs"
      />
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        placeholder={unitsPref === "metric" ? "kg" : "lbs"}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          const n = Number.parseFloat(e.target.value);
          if (Number.isFinite(n)) {
            onChangeKg(unitsPref === "metric" ? n : lbsToKg(n));
          }
        }}
        className="text-text w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
      />
    </div>
  );
}
