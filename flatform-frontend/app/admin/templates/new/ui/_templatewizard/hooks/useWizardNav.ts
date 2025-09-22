"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { TabKey } from "../types";
import { STEP_TITLES, TAB_TO_STEP } from "../constants";

export function useWizardNav<TForm extends FieldValues>(
  initialTab?: TabKey,
  methods?: UseFormReturn<TForm>,
  requiredFields: Path<TForm>[] = [] // <-- truyền từ caller, đúng kiểu Path<TForm>[]
) {
  const search = useSearchParams();

  // đọc tab từ URL (?reviewsave | ?export | ?tab=reviewsave)
  const initialStepFromUrl = useMemo(() => {
    const tabParam = search.get("tab");
    const knownTab =
      (tabParam && TAB_TO_STEP[tabParam as TabKey]) ||
      (search.has("reviewsave") ? TAB_TO_STEP.reviewsave : undefined) ||
      (search.has("export") ? TAB_TO_STEP.export : undefined);
    return typeof knownTab === "number" ? knownTab : 0;
  }, [search]);

  // ưu tiên prop initialTab nếu có, không thì theo URL
  const computedInitialStep = useMemo(() => {
    if (initialTab && initialTab in TAB_TO_STEP) return TAB_TO_STEP[initialTab];
    return initialStepFromUrl;
  }, [initialTab, initialStepFromUrl]);

  const [step, setStep] = useState<number>(computedInitialStep);
  useEffect(() => setStep(computedInitialStep), [computedInitialStep]);

  const canGoNext = step < STEP_TITLES.length - 1;
  const canGoBack = step > 0;

  const next = async () => {
    if (!canGoNext) return;
    // validate khi rời bước Info
    if (step === 1 && methods && requiredFields.length) {
      const ok = await methods.trigger(requiredFields, { shouldFocus: true });
      if (!ok) return false;
    }
    setStep((s) => s + 1);
    return true;
  };

  const back = () => canGoBack && setStep((s) => s - 1);
  const goTo = (idx: number) => setStep(idx);

  return { step, setStep, canGoNext, canGoBack, next, back, goTo };
}
