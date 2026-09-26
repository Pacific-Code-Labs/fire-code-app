import { AlertTriangle, BookOpen, Check, FolderPlus, Globe } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import type { ProjectCreatedData } from "@/lib/assistantResponse";

interface Props { data: ProjectCreatedData; }

function toContextItems(
  raw: ProjectCreatedData["project"]["contextCr"],
): { topic?: string; detail: string; authority?: string; reference?: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => (typeof c === "string" ? { detail: c } : c));
}

export function ProjectCard({ data }: Props) {
  const { lang, tr } = useLang();
  const project = data.project ?? ({ name: "" } as ProjectCreatedData["project"]);
  const reqs = project.requirements ?? [];
  const refs = project.reference ?? [];
  const ctx = toContextItems(project.contextCr);
  // FCR-100: projectId === null/undefined ⇒ non-persisted demo PREVIEW.
  const isPreview = data.projectId == null;
  const name = project.name || tr.chat_project_fallback;

  // FCR-102: electrical projects surface a kVA / transformer summary line.
  const projectType = (project.projectType ?? project.project_type) as string | undefined;
  const isElectrical = projectType === "electrical";
  const elec = (project.electrical ?? null) as
    | { result?: { demandKva?: number; suggestedTransformerKva?: number } }
    | null;
  const demandKva = elec?.result?.demandKva;
  const transformerKva = elec?.result?.suggestedTransformerKva;

  // FCR-115: characteristics grid mirrors the full /projects/:id page.
  const chars: { label: string; value: string | number | undefined }[] = [
    { label: tr.project_usage, value: project.usage },
    { label: tr.project_type, value: project.buildingType },
    { label: tr.area, value: project.areaM2 != null ? `${project.areaM2} m²` : undefined },
    { label: tr.floors, value: project.floors },
    { label: tr.occupants, value: project.occupants },
    { label: tr.ceilingHeight, value: project.ceilingHeightM != null ? `${project.ceilingHeightM} m` : undefined },
    { label: tr.volume, value: project.volumeM3 != null ? `${project.volumeM3} m³` : undefined },
  ].filter((c) => c.value !== undefined && c.value !== "");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-accent">
        <FolderPlus className="h-4 w-4" />
        {isPreview
          ? tr.project_preview_title
          : tr.project_created_title}
      </div>

      <div className="rounded-md border border-border bg-background/40 p-2 text-xs space-y-2">
        <div className="text-sm font-semibold text-foreground">{name}</div>

        {chars.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {chars.map((c) => (
              <div key={c.label}>
                <span className="font-semibold">{c.label}:</span> {c.value}
              </div>
            ))}
          </div>
        )}

        {isElectrical && (demandKva != null || transformerKva != null) && (
          <div className="border-t border-border/60 pt-1.5 text-foreground">
            {demandKva != null && (
              <div>
                <span className="font-semibold">{tr.elec_demand_kva}:</span>{" "}
                {demandKva.toLocaleString(undefined, { maximumFractionDigits: 1 })} kVA
              </div>
            )}
            {transformerKva != null && (
              <div>
                <span className="font-semibold">{tr.elec_suggested_transformer}:</span>{" "}
                {transformerKva.toLocaleString(undefined, { maximumFractionDigits: 1 })} kVA
              </div>
            )}
          </div>
        )}

        {reqs.length > 0 && (
          <div className="border-t border-border/60 pt-1.5">
            <div className="mb-1 font-semibold">{tr.project_key_requirements}:</div>
            <ul className="space-y-1">
              {reqs.map((r, i) => (
                <li key={i} className="flex gap-2 leading-relaxed">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ctx.length > 0 && (
          <div className="border-t border-border/60 pt-1.5">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <Globe className="h-3.5 w-3.5 text-accent" /> {tr.crContextTitle}:
            </div>
            <ul className="space-y-0.5 text-muted-foreground">
              {ctx.map((c, i) => (
                <li key={i}>
                  {c.topic && <span className="font-semibold text-foreground/80">{c.topic}: </span>}
                  {c.detail}
                  {(c.authority || c.reference) && (
                    <span className="ml-1 opacity-70">({[c.authority, c.reference].filter(Boolean).join(" · ")})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.risk === "alto" && (
          <div className="flex items-center gap-1.5 border-t border-border/60 pt-1.5 text-[hsl(var(--risk-high))]">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span><strong>{tr.riskWarning}</strong></span>
          </div>
        )}

        {refs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-1.5 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="font-semibold">{tr.refLabel}:</span>
            {refs.map((r) => (
              <span key={r} className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px]">{r}</span>
            ))}
          </div>
        )}
      </div>

      {isPreview && (
        <p className="text-[11px] italic text-muted-foreground">{tr.demoPreviewNote}</p>
      )}
    </div>
  );
}
