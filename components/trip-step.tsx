"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MapPin } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepHeader } from "@/components/step-header";
import { StepFooter } from "@/components/step-footer";
import { FieldError } from "@/components/field-error";
import { useTripStore } from "@/lib/store/trip-store";
import { getLanguage, useLanguage, useT } from "@/lib/store/preferences-store";
import { DESTINATION_PRESETS, getDestinationGreeting } from "@/lib/utils/funny-messages";
import { MAX_DESTINATION_LENGTH, createDestinationFormSchema } from "@/lib/utils/validation";
import { cn } from "@/lib/utils/cn";

const schema = createDestinationFormSchema(getLanguage);
type DestinationForm = z.input<typeof schema>;

/** Step 1 — one tap on a place (or type one). */
export function TripStep() {
  const t = useT();
  const language = useLanguage();
  const destination = useTripStore((s) => s.destination);
  const seed = useTripStore((s) => s.seed);
  const selectDestination = useTripStore((s) => s.selectDestination);
  const goToStep = useTripStore((s) => s.goToStep);

  const form = useForm<DestinationForm, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: destination?.isCustom ? destination.name : "" },
  });

  // Re-word a visible error when the language changes.
  const { trigger, formState } = form;
  useEffect(() => {
    if (formState.errors.name) void trigger("name");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const onCustomSubmit = form.handleSubmit(({ name }) => {
    selectDestination({ id: "custom", name, emoji: "📍", isCustom: true });
  });

  return (
    <section>
      <StepHeader step={1} title={t.trip.title} description={t.trip.description} />

      <div role="radiogroup" aria-label={t.trip.presetsAria} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {DESTINATION_PRESETS.map((preset) => {
          const selected = destination?.id === preset.id && !destination.isCustom;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                selectDestination(preset);
                form.reset({ name: "" });
              }}
              className={cn(
                "surface relative flex flex-col items-start gap-3 p-4 text-left transition-[border-color,transform] duration-150 hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-none",
                selected ? "border-primary ring-1 ring-primary" : "hover:border-border-strong",
              )}
            >
              <span aria-hidden className="flex size-11 items-center justify-center rounded-lg bg-elevated text-2xl">
                {preset.emoji}
              </span>
              <span>
                <span className="block text-[16px] font-semibold text-foreground">{preset.name}</span>
                <span className="block text-[13px] text-muted-foreground">{preset.tagline[language]}</span>
              </span>
              {selected && (
                <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <form onSubmit={onCustomSubmit} noValidate className="surface mt-4 p-4 sm:p-5">
        <label htmlFor="custom-destination" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="size-4 text-accent" /> {t.trip.customLabel}
        </label>
        <div className="flex gap-2">
          <Input
            id="custom-destination"
            placeholder={t.trip.customPlaceholder}
            maxLength={MAX_DESTINATION_LENGTH + 10}
            autoComplete="off"
            aria-invalid={!!form.formState.errors.name}
            aria-describedby={form.formState.errors.name ? "custom-destination-error" : undefined}
            {...form.register("name")}
          />
          <Button type="submit" variant={destination?.isCustom ? "default" : "outline"} className="h-12">
            {t.trip.set}
          </Button>
        </div>
        {form.formState.errors.name && <FieldError id="custom-destination-error">{form.formState.errors.name.message}</FieldError>}
      </form>

      {/* A handwritten note once a place is picked. */}
      <AnimatePresence mode="wait">
        {destination && (
          <motion.p
            key={`${destination.id}-${destination.name}-${language}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            aria-live="polite"
            className="mt-7 max-w-xl -rotate-1 font-hand text-[26px] leading-snug text-accent"
          >
            {getDestinationGreeting(destination, seed, language)}
          </motion.p>
        )}
      </AnimatePresence>

      <StepFooter onBack={() => goToStep(0)} onContinue={() => goToStep(2)} canContinue={!!destination} hint={t.trip.hint} />
    </section>
  );
}
