"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, Pencil, Plus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StepHeader } from "@/components/step-header";
import { StepFooter } from "@/components/step-footer";
import { FieldError } from "@/components/field-error";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LeaderRow, ReceiptRule, Stamp } from "@/components/receipt";
import { useTripStore } from "@/lib/store/trip-store";
import { getAmountErrors, type LiveExpenseSummary } from "@/lib/store/trip-selectors";
import { getLanguage, useLanguage, useT } from "@/lib/store/preferences-store";
import { useLiveSummary } from "@/hooks/use-trip";
import { CURRENCIES, CURRENCY_CODES, getCurrency, isCurrencyCode } from "@/lib/calculations/money-utils";
import { formatMoney } from "@/lib/utils/format-currency";
import { getAvatarColor } from "@/lib/utils/avatar";
import { LOADING_MESSAGES, pickBySeed, pickCtaLabel } from "@/lib/utils/funny-messages";
import {
  MAX_NAME_LENGTH,
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS,
  createAmountSchema,
  createParticipantFormSchema,
  sanitizeAmountInput,
  validateAmountInput,
} from "@/lib/utils/validation";
import { cn } from "@/lib/utils/cn";
import type { Participant } from "@/types/participant";
import type { CurrencyCode } from "@/types/trip";

const liveParticipants = () => useTripStore.getState().participants;
const liveCurrency = () => useTripStore.getState().currency;

/** "Name + Amount + Add" — validated with Zod against the live list and currency. */
const addSchema = createParticipantFormSchema(liveParticipants, undefined, getLanguage).extend({
  amount: createAmountSchema(liveCurrency, getLanguage),
});
type AddForm = z.input<typeof addSchema>;

const REVEAL_PAUSE_MS = 900;

/* ------------------------------ one person row ------------------------------ */

function PersonRow({ participant, showError, onRemove }: { participant: Participant; showError: boolean; onRemove: () => void }) {
  const t = useT();
  const language = useLanguage();
  const raw = useTripStore((s) => s.expenses[participant.id] ?? "");
  const currencyCode = useTripStore((s) => s.currency);
  const setExpense = useTripStore((s) => s.setExpense);
  const renameParticipant = useTripStore((s) => s.renameParticipant);
  const currency = getCurrency(currencyCode);
  const [touched, setTouched] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(participant.name);
  const [nameError, setNameError] = useState<string | null>(null);

  const validation = validateAmountInput(raw, currencyCode, language);
  const amountError = (touched || showError) && !validation.success ? validation.error : null;
  const errorId = `amount-${participant.id}-error`;

  const saveName = () => {
    const result = renameParticipant(participant.id, draft, getLanguage());
    if (result.success) {
      setEditing(false);
      setNameError(null);
      if (result.name !== participant.name) toast(t.people.renamed(result.name));
    } else {
      setNameError(result.error);
    }
  };

  const cancelEdit = () => {
    setDraft(participant.name);
    setNameError(null);
    setEditing(false);
  };

  return (
    <motion.li layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }} className="py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <ParticipantAvatar name={participant.name} colorIndex={participant.colorIndex} className="max-sm:size-8" />

        {editing ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
          >
            <Input
              autoFocus
              value={draft}
              maxLength={MAX_NAME_LENGTH + 5}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
              aria-label={t.people.editNameAria(participant.name)}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? errorId : undefined}
              className="h-10"
            />
            <Button type="submit" size="icon-sm" variant="outline" aria-label={t.people.saveName}>
              <Check />
            </Button>
            <Button type="button" size="icon-sm" variant="ghost" aria-label={t.people.cancelEdit} onClick={cancelEdit}>
              <X />
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(participant.name);
              setEditing(true);
            }}
            aria-label={t.people.editNameAria(participant.name)}
            className="group flex min-w-0 flex-1 items-center gap-1.5 rounded-md text-left focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-none"
          >
            <span className="truncate text-[16px] font-medium text-foreground">{participant.name}</span>
            <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" />
          </button>
        )}

        {!editing && (
          <>
            <div className="relative w-28 shrink-0 sm:w-36">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-muted-foreground">{currency.symbol}</span>
              <input
                value={raw}
                onChange={(e) => setExpense(participant.id, sanitizeAmountInput(e.target.value, currency.minorUnitDigits))}
                onBlur={() => setTouched(true)}
                onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
                inputMode={currency.minorUnitDigits > 0 ? "decimal" : "numeric"}
                autoComplete="off"
                placeholder="0"
                aria-label={t.people.amountAria(participant.name)}
                aria-invalid={!!amountError}
                aria-describedby={amountError ? errorId : undefined}
                className={cn(
                  "h-11 w-full rounded-lg border border-input bg-card pr-3 pl-7 text-right font-mono text-[16px] text-foreground tabular-nums outline-none",
                  "focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-ring/25",
                  amountError && "border-danger ring-3 ring-danger/20",
                )}
              />
            </div>
            <Button size="icon-sm" variant="ghost" onClick={onRemove} aria-label={t.people.removeAria(participant.name)} className="-mr-2">
              <X />
            </Button>
          </>
        )}
      </div>
      {(amountError || nameError) && (
        <FieldError id={errorId} className="justify-end text-right">
          {nameError ?? amountError}
        </FieldError>
      )}
    </motion.li>
  );
}

/* ------------------------------ summary panel ------------------------------ */

function SummaryPanel({ summary, participants, currencyCode }: { summary: LiveExpenseSummary; participants: Participant[]; currencyCode: CurrencyCode }) {
  const t = useT();
  const count = participants.length;
  const max = Math.max(1, ...participants.map((p) => summary.amounts[p.id] ?? 0));
  return (
    <div className="surface p-5">
      <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t.people.summaryTitle}</p>
      <p className="mt-2 font-mono text-3xl font-semibold text-foreground tabular-nums">{formatMoney(summary.total, currencyCode)}</p>
      <p className="text-sm text-muted-foreground">{t.people.total}</p>
      <ReceiptRule className="my-4" />
      <div className="space-y-1.5 text-[15px] text-foreground">
        <LeaderRow label={t.results.statPeople} value={count} />
        <LeaderRow
          label={t.people.share}
          value={count ? `${summary.isExact ? "" : "≈ "}${formatMoney(summary.average, currencyCode)}` : "—"}
          valueClassName="font-semibold"
        />
      </div>
      {count > 0 && summary.total > 0 && (
        <>
          <ReceiptRule className="my-4" />
          <p className="mb-2.5 text-xs font-medium text-muted-foreground">{t.people.coveredTitle}</p>
          <ul className="space-y-2">
            {participants.map((p) => {
              const amount = summary.amounts[p.id] ?? 0;
              return (
                <li key={p.id} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-foreground">{p.name}</span>
                    <span className="font-mono text-muted-foreground tabular-nums">{Math.round((amount / summary.total) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-elevated" aria-hidden>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getAvatarColor(p.colorIndex) }}
                      initial={false}
                      animate={{ width: `${(amount / max) * 100}%` }}
                      transition={{ type: "spring", stiffness: 140, damping: 22 }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/* --------------------------------- the step -------------------------------- */

export function PeopleStep({ onRevealed }: { onRevealed: () => void }) {
  const t = useT();
  const language = useLanguage();
  const participants = useTripStore((s) => s.participants);
  const expenses = useTripStore((s) => s.expenses);
  const currencyCode = useTripStore((s) => s.currency);
  const seed = useTripStore((s) => s.seed);
  const addPerson = useTripStore((s) => s.addPerson);
  const removeParticipant = useTripStore((s) => s.removeParticipant);
  const setCurrency = useTripStore((s) => s.setCurrency);
  const goToStep = useTripStore((s) => s.goToStep);
  const currency = getCurrency(currencyCode);
  const summary = useLiveSummary();

  const [pendingRemoval, setPendingRemoval] = useState<Participant | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const form = useForm<AddForm>({ resolver: zodResolver(addSchema), defaultValues: { name: "", amount: "" }, reValidateMode: "onSubmit" });
  const { ref: nameFieldRef, ...nameField } = form.register("name");

  // Errors shown in the old language are cleared when switching.
  const { clearErrors } = form;
  useEffect(() => clearErrors(), [language, clearErrors]);

  const isFull = participants.length >= MAX_PARTICIPANTS;
  const count = participants.length;
  const ctaStamp = useMemo(() => pickCtaLabel(seed, language), [seed, language]);

  const onAdd = form.handleSubmit(({ name, amount }) => {
    const result = addPerson(name, amount, getLanguage());
    if (result.success) {
      toast(t.people.added(result.name));
      form.reset({ name: "", amount: "" });
      requestAnimationFrame(() => nameRef.current?.focus());
    } else {
      if (result.nameError) form.setError("name", { message: result.nameError });
      if (result.amountError) form.setError("amount", { message: result.amountError });
    }
  });

  const handleSplit = () => {
    const errors = getAmountErrors({ participants, expenses, currency: currencyCode, destination: null, revealed: false });
    if (Object.keys(errors).length > 0) {
      setShowAllErrors(true);
      toast.error(t.people.fixToast);
      return;
    }
    setBusy(true);
    // The maths is instant — the short pause just lets the moment land.
    timer.current = window.setTimeout(() => {
      const ok = useTripStore.getState().reveal();
      setBusy(false);
      if (ok) onRevealed();
      else toast.error(t.results.errorText);
    }, REVEAL_PAUSE_MS);
  };

  const amountErrorMsg = form.formState.errors.amount?.message;
  const nameErrorMsg = form.formState.errors.name?.message;

  return (
    <section>
      <StepHeader step={2} title={t.people.title} description={t.people.description} />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="min-w-0">
          {/* Add a person */}
          <form onSubmit={onAdd} noValidate className="surface p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <span className="flex size-7 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <UserPlus className="size-4" />
                </span>
                {t.people.addTitle}
              </p>
              <Select value={currencyCode} onValueChange={(v) => isCurrencyCode(v) && setCurrency(v)}>
                <SelectTrigger aria-label={t.people.amountsIn} className="shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {CURRENCY_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {CURRENCIES[code].symbol} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-start">
              <div>
                <label htmlFor="person-name" className="mb-1 block text-sm font-medium text-foreground">
                  {t.people.nameLabel}
                </label>
                <Input
                  id="person-name"
                  placeholder={t.people.namePlaceholder}
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  maxLength={MAX_NAME_LENGTH + 5}
                  disabled={isFull}
                  aria-invalid={!!nameErrorMsg}
                  aria-describedby={nameErrorMsg ? "person-name-error" : undefined}
                  ref={(el) => {
                    nameFieldRef(el);
                    nameRef.current = el;
                  }}
                  {...nameField}
                />
                {nameErrorMsg && <FieldError id="person-name-error">{nameErrorMsg}</FieldError>}
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 sm:contents">
                <div>
                  <label htmlFor="person-amount" className="mb-1 block text-sm font-medium text-foreground">
                    {t.people.amountLabel} ({currency.symbol})
                  </label>
                  <Input
                    id="person-amount"
                    placeholder="0"
                    inputMode={currency.minorUnitDigits > 0 ? "decimal" : "numeric"}
                    autoComplete="off"
                    enterKeyHint="done"
                    disabled={isFull}
                    className="text-right font-mono tabular-nums"
                    aria-invalid={!!amountErrorMsg}
                    aria-describedby={amountErrorMsg ? "person-amount-error" : undefined}
                    {...form.register("amount", {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const clean = sanitizeAmountInput(e.target.value, currency.minorUnitDigits);
                        if (clean !== e.target.value) form.setValue("amount", clean);
                      },
                    })}
                    onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
                  />
                  {amountErrorMsg && <FieldError id="person-amount-error">{amountErrorMsg}</FieldError>}
                </div>
                <Button type="submit" disabled={isFull} className="mt-6 h-12 px-5">
                  <Plus /> {t.people.add}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{isFull ? t.people.full(MAX_PARTICIPANTS) : t.people.zeroTip}</p>
          </form>

          {/* The list */}
          <div className="surface mt-4 px-4 py-2 sm:px-5">
            {count === 0 ? (
              <div className="py-8 text-center">
                <p className="font-serif text-2xl text-foreground">{t.people.emptyTitle}</p>
                <p className="mt-1 text-[15px] text-muted-foreground">{t.people.emptyText}</p>
              </div>
            ) : (
              <ul aria-label={t.people.listAria} className="divide-y divide-dashed divide-border-strong">
                <AnimatePresence initial={false}>
                  {participants.map((p) => (
                    <PersonRow key={p.id} participant={p} showError={showAllErrors} onRemove={() => setPendingRemoval(p)} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" /> {t.people.sharedOnly}
          </p>
        </div>

        <aside className="lg:sticky lg:top-24">
          <SummaryPanel summary={summary} participants={participants} currencyCode={currencyCode} />
        </aside>
      </div>

      <ConfirmDialog
        open={!!pendingRemoval}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title={t.people.removeTitle(pendingRemoval?.name ?? "")}
        description={t.people.removeText}
        confirmLabel={t.people.removeConfirm}
        cancelLabel={t.people.removeCancel}
        destructive
        onConfirm={() => {
          if (!pendingRemoval) return;
          removeParticipant(pendingRemoval.id);
          toast(t.people.removed(pendingRemoval.name));
          setPendingRemoval(null);
        }}
      />

      <StepFooter
        onBack={() => goToStep(1)}
        onContinue={handleSplit}
        continueLabel={busy ? pickBySeed(LOADING_MESSAGES[language], seed, "loading") : t.people.cta}
        canContinue={count >= MIN_PARTICIPANTS}
        busy={busy}
        hint={t.people.minHint}
        above={
          count >= MIN_PARTICIPANTS && (
            <div className="mb-3 hidden justify-end sm:flex">
              <Stamp className="text-[11px]">{ctaStamp}</Stamp>
            </div>
          )
        }
      />
    </section>
  );
}
