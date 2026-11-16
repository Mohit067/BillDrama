"use client";

import { useState } from "react";
import { Copy, FileDown, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ExpenseCalculationResult } from "@/types/settlement";
import type { Destination } from "@/types/trip";
import { buildShareText, copyToClipboard, shareResults } from "@/lib/utils/share-results";
import { useLanguage, useT } from "@/lib/store/preferences-store";

export function ShareActions({ result, destination }: { result: ExpenseCalculationResult; destination: Destination | null }) {
  const t = useT();
  const language = useLanguage();
  const [pdfBusy, setPdfBusy] = useState(false);
  const tripName = destination?.name ?? "Trip";

  const handleShare = async () => {
    const outcome = await shareResults(buildShareText(result, destination, language), t.share.shareTitle(tripName));
    if (outcome === "shared") toast.success(t.share.shared);
    else if (outcome === "copied") toast.success(t.share.copiedResults);
    else if (outcome === "failed") toast.error(t.share.shareFailed);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(buildShareText(result, destination, language));
    if (ok) toast.success(t.share.copiedResults);
    else toast.error(t.share.copyFailed);
  };

  const handlePdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadResultsPdf } = await import("@/lib/export/pdf-export");
      await downloadResultsPdf(result, destination, language);
      toast.success(t.share.pdfDone);
    } catch {
      toast.error(t.share.pdfFailed);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:flex">
      <Button size="lg" onClick={handleShare} className="px-3 sm:px-6">
        <Share2 /> {t.results.share}
      </Button>
      <Button size="lg" variant="outline" onClick={handleCopy} className="px-3 sm:px-6">
        <Copy /> {t.results.copy}
      </Button>
      <Button size="lg" variant="outline" onClick={handlePdf} disabled={pdfBusy} aria-busy={pdfBusy} className="px-3 sm:px-6">
        {pdfBusy ? <Loader2 className="animate-spin" /> : <FileDown />} {t.results.pdf}
      </Button>
    </div>
  );
}
