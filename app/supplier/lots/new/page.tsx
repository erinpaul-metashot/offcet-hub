"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Field, Input, Panel, Textarea, StatusBadge } from "@/components/ui";
import { lotEditorSchema } from "@/lib/validators";
import { formatCurrency, formatDate, classNames, sentenceCase } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ZodError } from "zod";
import { 
  Save, 
  MapPin, 
  Image as ImageIcon, 
  Package, 
  DollarSign, 
  Calendar, 
  Info, 
  X,
  FileText,
  Building
} from "lucide-react";

type LotEditorState = {
  lotId?: Id<"lots">;
  title: string;
  description: string;
  category: string;
  quantity: string;
  unit: string;
  location: string;
  expectedPrice: string;
  expiresAt: string;
  imageStorageIds: Id<"_storage">[];
  localImageUrls: string[];
};

type ExistingLot = {
  _id: Id<"lots">;
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  expectedPrice?: number;
  expiresAt: number;
  imageStorageIds: Id<"_storage">[];
  imageUrls: string[];
};

const emptyEditor: LotEditorState = {
  title: "",
  description: "",
  category: "",
  quantity: "",
  unit: "",
  location: "",
  expectedPrice: "",
  expiresAt: "",
  imageStorageIds: [],
  localImageUrls: [],
};

function buildEditorFromLot(lot: ExistingLot): LotEditorState {
  return {
    lotId: lot._id,
    title: lot.title,
    description: lot.description,
    category: lot.category,
    quantity: String(lot.quantity),
    unit: lot.unit,
    location: lot.location,
    expectedPrice: lot.expectedPrice ? String(lot.expectedPrice) : "",
    expiresAt: new Date(lot.expiresAt).toISOString().slice(0, 10),
    imageStorageIds: lot.imageStorageIds,
    localImageUrls: lot.imageUrls || [],
  };
}

function LotEditorForm({
  editId,
  initialEditor,
}: {
  editId: Id<"lots"> | null;
  initialEditor: LotEditorState;
}) {
  const router = useRouter();
  const createDraft = useMutation(api.lots.createDraft);
  const updateDraft = useMutation(api.lots.updateDraft);
  const submitForReview = useMutation(api.lots.submitForReview);
  const generateUploadUrl = useMutation(api.lots.generateUploadUrl);

  const [editor, setEditor] = useState<LotEditorState>(initialEditor);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof LotEditorState>(field: K, value: LotEditorState[K]) {
    setEditor((current) => ({ ...current, [field]: value }));
    // Clear error for this field as the user is fixing it
    if (fieldErrors[field as string]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[field as string];
        return next;
      });
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return { uploadedIds: [], localUrls: [] };
    }

    const uploadedIds: Id<"_storage">[] = [];
    const localUrls: string[] = [];

    for (const file of Array.from(files)) {
      localUrls.push(URL.createObjectURL(file));
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Image upload failed.");
      }

      const result = (await response.json()) as { storageId: Id<"_storage"> };
      uploadedIds.push(result.storageId);
    }

    return { uploadedIds, localUrls };
  }

  function onSaveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      try {
        const parsed = lotEditorSchema.parse({
          ...editor,
          quantity: editor.quantity,
          expectedPrice: editor.expectedPrice,
        });

        const payload = {
          ...parsed,
          expiresAt: new Date(parsed.expiresAt).getTime(),
          imageStorageIds: editor.imageStorageIds,
        };

        if (editor.lotId) {
          await updateDraft({
            lotId: editor.lotId,
            ...payload,
          });
          router.push("/supplier/lots");
        } else {
          const lotId = await createDraft(payload);
          setEditor((current) => ({ ...current, lotId }));
          router.push("/supplier/lots");
        }
      } catch (submissionError: any) {
        if (submissionError instanceof ZodError) {
          const issues = submissionError.issues || [];
          
          const newFieldErrors: Record<string, string> = {};
          issues.forEach((issue: any) => {
            const path = issue.path[0];
            if (path && !newFieldErrors[path]) {
              newFieldErrors[path] = issue.message;
            }
          });
          
          if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            setError("Please fix the highlighted fields above before saving.");
          } else {
            setError(issues.length > 0 ? issues.map((e: any) => e.message).join(", ") : submissionError.message);
          }
        } else {
          setError(
            submissionError instanceof Error
              ? submissionError.message
              : "Could not save the draft.",
          );
        }
      }
    });
  }

  const isFormDirty = editor.title || editor.category || editor.quantity || editor.location || editor.expectedPrice || editor.expiresAt;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 lg:grid-cols-12 min-h-[calc(100vh-140px)]">
      {/* Left Column: Form Editor (8/12 width) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-8 flex flex-col gap-6"
      >
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--line)] shadow-sm">
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--brand-green)] flex items-center gap-2">
                <FileText size={14} />
                {editId ? "Edit Draft" : "New Lot Draft"}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)]">
                Supply Details
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Provide accurate details about your excess inventory to expedite the review and assignment process.
              </p>
            </div>
            {editor.lotId ? (
              <Button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await submitForReview({ lotId: editor.lotId! });
                      router.push("/supplier/lots");
                    } catch (submissionError: any) {
                      setError(
                        submissionError instanceof Error
                          ? submissionError.message
                          : "Unable to submit draft.",
                      );
                    }
                  });
                }}
                type="button"
                className="shrink-0 font-bold tracking-wider"
              >
                Submit For Review
              </Button>
            ) : null}
          </div>

          <form className="grid gap-7" onSubmit={onSaveDraft}>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Title" hint="A clear, descriptive name for this lot." error={fieldErrors.title}>
                <Input
                  value={editor.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  required
                  placeholder="e.g. Premium Grade Aluminum Offcuts"
                  className={fieldErrors.title ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
                />
              </Field>
              <Field label="Category" hint="E.g. Metals, Plastics, Textiles." error={fieldErrors.category}>
                <Input
                  value={editor.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  required
                  placeholder="e.g. Metals"
                  className={fieldErrors.category ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
                />
              </Field>
            </div>

            <Field label="Description" hint="Include material specs, condition, and any handling requirements." error={fieldErrors.description}>
              <Textarea
                value={editor.description}
                onChange={(event) => updateField("description", event.target.value)}
                required
                placeholder="Detailed description of the lot..."
                className={fieldErrors.description ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-3">
              <Field label="Quantity" error={fieldErrors.quantity}>
                <Input
                  min="0"
                  step="any"
                  type="number"
                  value={editor.quantity}
                  onChange={(event) => updateField("quantity", event.target.value)}
                  required
                  placeholder="0"
                  className={fieldErrors.quantity ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
                />
              </Field>
              <Field label="Unit" hint="kg, tons, pallets, etc." error={fieldErrors.unit}>
                <Input
                  value={editor.unit}
                  onChange={(event) => updateField("unit", event.target.value)}
                  required
                  placeholder="e.g. tons"
                  className={fieldErrors.unit ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
                />
              </Field>
              <Field label="Expected Price" hint="In USD (Optional)" error={fieldErrors.expectedPrice}>
                <Input
                  min="0"
                  step="any"
                  type="number"
                  value={editor.expectedPrice}
                  onChange={(event) => updateField("expectedPrice", event.target.value)}
                  placeholder="Optional"
                  className={fieldErrors.expectedPrice ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
                />
              </Field>
            </div>

            <Field label="Location" hint="Where is this inventory currently stored?" error={fieldErrors.location}>
              <Textarea
                value={editor.location}
                onChange={(event) => updateField("location", event.target.value)}
                required
                placeholder="Warehouse address or general location..."
                className={classNames("min-h-16 resize-none", fieldErrors.location ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : "")}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Expiry Date" hint="When does this offer expire?" error={fieldErrors.expiresAt}>
                <Input
                  type="date"
                  value={editor.expiresAt}
                  onChange={(event) => updateField("expiresAt", event.target.value)}
                  required
                  className={fieldErrors.expiresAt ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
                />
              </Field>
              <Field label="Photos" hint="Upload clear images of the inventory." error={fieldErrors.imageStorageIds}>
                <div className="relative">
                  <Input
                    multiple
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const files = event.target.files;
                      if (!files?.length) {
                        return;
                      }

                      startTransition(async () => {
                        try {
                          const { uploadedIds, localUrls } = await uploadFiles(files);
                          setEditor((current) => ({
                            ...current,
                            imageStorageIds: [...current.imageStorageIds, ...uploadedIds],
                            localImageUrls: [...current.localImageUrls, ...localUrls],
                          }));
                          
                          if (fieldErrors.imageStorageIds) {
                            setFieldErrors(curr => {
                              const next = { ...curr };
                              delete next.imageStorageIds;
                              return next;
                            });
                          }
                        } catch (uploadError: any) {
                          setError(
                            uploadError instanceof Error
                              ? uploadError.message
                              : "Image upload failed.",
                          );
                        }
                      });
                    }}
                    className={classNames(
                      "pl-10 text-[var(--ink-muted)] file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--brand-green-muted)] file:text-[var(--brand-green)] hover:file:bg-[var(--brand-green)] hover:file:text-white file:transition-colors",
                      fieldErrors.imageStorageIds ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""
                    )}
                  />
                  <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] pointer-events-none" />
                </div>
              </Field>
            </div>

            {editor.localImageUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-[var(--brand-green-muted)]/10 border border-[var(--brand-green)]/20">
                <div className="w-full text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 flex items-center gap-1.5">
                  <ImageIcon size={14} /> Uploaded Images ({editor.localImageUrls.length})
                </div>
                {editor.localImageUrls.map((url, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-[var(--line)] shadow-sm bg-[var(--paper)]">
                    <img src={url} alt={`Upload ${index}`} className="w-20 h-20 object-cover" />
                    <button 
                      type="button"
                      onClick={() => {
                        setEditor(curr => {
                          const ids = [...curr.imageStorageIds];
                          const urls = [...curr.localImageUrls];
                          ids.splice(index, 1);
                          urls.splice(index, 1);
                          return { ...curr, imageStorageIds: ids, localImageUrls: urls };
                        });
                      }}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error ? (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600"
              >
                <X size={16} className="shrink-0" />
                <span className="break-words leading-relaxed">{error}</span>
              </motion.div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--line)]">
              <Button as={Link} href="/supplier/lots" type="button" variant="secondary" className="font-bold border-[var(--line-strong)] hover:border-[var(--ink)]">
                Cancel
              </Button>
              <Button disabled={isPending} type="submit" className="font-bold flex items-center gap-2">
                <Save size={16} />
                {isPending ? "Saving..." : editor.lotId ? "Update Draft" : "Save Draft"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Right Column: Live Preview Card (4/12 width) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-4 flex flex-col gap-4 sticky top-6"
      >
        <div className="flex items-center gap-2 px-2">
          <Info size={16} className="text-[var(--ink-muted)]" />
          <h3 className="text-sm font-bold tracking-tight text-[var(--ink-muted)] uppercase">Live Preview</h3>
        </div>
        
        <AnimatePresence mode="wait">
          {isFormDirty ? (
            <motion.div 
              key="preview-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--paper)] rounded-2xl border border-[var(--brand-green)]/40 ring-2 ring-[var(--brand-green)]/10 p-5 shadow-lg overflow-hidden relative group transition-all"
            >
              <div className="flex flex-col gap-3 relative z-10">
                {/* Upper row: category and status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--brand-green)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-green)] animate-pulse"></span>
                    {editor.category ? sentenceCase(editor.category) : "Category"}
                  </span>
                  <StatusBadge status="draft" />
                </div>

                {/* Title */}
                <h4 className="text-xl font-bold tracking-tight text-[var(--ink)] line-clamp-2 break-all leading-tight mt-1">
                  {editor.title || <span className="text-[var(--ink-muted)] italic opacity-60">Draft Title</span>}
                </h4>

                {/* Images Preview Carousel */}
                {editor.localImageUrls.length > 0 && (
                  <div className="flex gap-2 mt-1 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                    {editor.localImageUrls.map((url, idx) => (
                      <img key={idx} src={url} className="h-24 w-auto rounded-lg object-cover border border-[var(--line)] shadow-sm shrink-0" alt="Preview" />
                    ))}
                  </div>
                )}

                {/* Details */}
                <div className="flex flex-col gap-2 text-sm mt-1 bg-[var(--surface)] p-4 rounded-xl border border-[var(--line)]">
                  <div className="flex items-start gap-3 text-[var(--ink-muted)]">
                    <MapPin size={16} className="shrink-0 mt-0.5 opacity-70 text-[var(--ink)]" />
                    <span className="line-clamp-2 leading-relaxed">
                      {editor.location || "Location TBD"}
                    </span>
                  </div>
                  
                  <div className="w-full h-px bg-[var(--line)] my-1" />

                  <div className="flex items-center gap-3 text-[var(--ink-muted)]">
                    <Package size={16} className="shrink-0 opacity-70 text-[var(--ink)]" />
                    <span className="font-semibold text-[var(--ink)]">
                      {editor.quantity || "0"} {editor.unit || "unit(s)"}
                    </span>
                  </div>
                  
                  <div className="w-full h-px bg-[var(--line)] my-1" />

                  <div className="flex items-center gap-3 text-[var(--ink-muted)]">
                    <DollarSign size={16} className="shrink-0 opacity-70 text-[var(--ink)]" />
                    <span className={classNames("font-bold text-base", editor.expectedPrice ? "text-[var(--brand-green)]" : "text-[var(--ink-muted)]")}>
                      {editor.expectedPrice ? formatCurrency(Number(editor.expectedPrice)) : "Price on request"}
                    </span>
                  </div>

                  {editor.expiresAt && (
                    <>
                      <div className="w-full h-px bg-[var(--line)] my-1" />
                      <div className="flex items-center gap-3 text-[var(--ink-muted)]">
                        <Calendar size={16} className="shrink-0 opacity-70 text-[var(--ink)]" />
                        <span className="font-medium text-[var(--ink)]">
                          Expires {formatDate(new Date(editor.expiresAt).getTime())}
                        </span>
                      </div>
                    </>
                  )}

                  {editor.description && (
                    <>
                      <div className="w-full h-px bg-[var(--line)] my-1" />
                      <div className="flex items-start gap-3 text-[var(--ink-muted)]">
                        <FileText size={16} className="shrink-0 mt-0.5 opacity-70 text-[var(--ink)]" />
                        <span className="italic text-xs line-clamp-3 leading-relaxed">
                          {editor.description}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Active Indicator Line */}
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[var(--brand-green)]" />
            </motion.div>
          ) : (
            <motion.div
              key="empty-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border-2 border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-12 text-center shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--brand-green-muted)]/30 border border-[var(--brand-green)]/20 flex items-center justify-center mx-auto mb-5 text-[var(--brand-green)] shadow-sm">
                <FileText size={24} />
              </div>
              <p className="text-lg font-bold text-[var(--ink)] mb-2 tracking-tight">Design your Lot</p>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed max-w-[250px] mx-auto">
                As you fill out the form, a live preview will appear here, showing exactly how buyers will see your offer.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function LotEditorPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") as Id<"lots"> | null;
  const existingLot = useQuery(api.lots.get, editId ? { lotId: editId } : "skip");

  if (editId && existingLot === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-3 text-[var(--ink-muted)]">
          <div className="w-8 h-8 border-2 border-[var(--brand-green)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium tracking-wide uppercase">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (editId && existingLot === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 rounded-full bg-red-50 text-red-500 mb-2">
          <X size={32} />
        </div>
        <p className="text-xl font-bold text-[var(--ink)] tracking-tight">Draft not found</p>
        <p className="text-sm text-[var(--ink-muted)] mb-4">The lot you're trying to edit doesn't exist or was removed.</p>
        <Button as={Link} href="/supplier/lots" variant="secondary" className="font-bold border-[var(--line-strong)]">
          Return to My Lots
        </Button>
      </div>
    );
  }

  const initialEditor = existingLot ? buildEditorFromLot(existingLot as ExistingLot) : emptyEditor;

  return (
    <LotEditorForm
      key={existingLot ? `edit-${existingLot._id}` : "new"}
      editId={editId}
      initialEditor={initialEditor}
    />
  );
}
