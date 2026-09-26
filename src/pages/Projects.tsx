import { useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProjects } from "@/hooks/useProjects";
import { useLang } from "@/contexts/LangContext";
import { useAssistant } from "@/contexts/AssistantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/RiskBadge";
import { FolderKanban, Plus, Trash2, Eye, Zap } from "lucide-react";
import { BuildingType } from "@/services/fireCodeApi";
import { localizedPath } from "@/lib/paths";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@pacific-code-labs/fire-code-design-system";

export default function Projects() {
  const { projects, loading, remove } = useProjects();
  const { lang, tr } = useLang();
  const { setPageContext, setInput } = useAssistant();

  useEffect(() => {
    setPageContext({ page: "projects", payload: { count: projects.length } });
    setInput({});
  }, [projects.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildingLabel: Record<number, string> = {
    [BuildingType.residencial]: tr.bt_residential,
    [BuildingType.comercial]: tr.bt_commercial,
    [BuildingType.industrial]: tr.bt_industrial,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{tr.projects_title}</h2>
            <p className="text-sm text-muted-foreground">{tr.projects_subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to={localizedPath(lang, "/projects/electrical")}><Zap className="h-4 w-4" /> {tr.new_electrical}</Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to={localizedPath(lang, "/projects/new")}><Plus className="h-4 w-4" /> {tr.new_project}</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">{tr.loading}</p>
            ) : projects.length === 0 ? (
              <div className="text-center py-16">
                <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">{tr.no_projects}</p>
                <Button asChild size="sm"><Link to={localizedPath(lang, "/projects/new")}>{tr.create_first}</Link></Button>
              </div>
            ) : (
              <>
              {/* Mobile (<sm): card stack — a wide table doesn't fit 375px. */}
              <ul className="divide-y divide-border sm:hidden">
                {projects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link to={localizedPath(lang, `/projects/${p.id}`)} className="min-w-0 flex-1">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {buildingLabel[p.building_type]} · {p.usage} · {p.area_m2} m²
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <RiskBadge level={p.risk} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={tr.delete}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{tr.delete_project}</AlertDialogTitle>
                            <AlertDialogDescription>{tr.delete_confirm}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tr.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(p.id)}>{tr.delete}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Tablet/desktop (≥sm): full table. */}
              <Table className="hidden sm:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr.name}</TableHead>
                    <TableHead className="hidden sm:table-cell">{tr.usage_label}</TableHead>
                    <TableHead className="hidden md:table-cell">{tr.area}</TableHead>
                    <TableHead>{tr.risk_label}</TableHead>
                    <TableHead className="hidden lg:table-cell">{tr.created}</TableHead>
                    <TableHead className="text-right">{tr.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{buildingLabel[p.building_type]}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{p.usage}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.area_m2} m²</TableCell>
                      <TableCell><RiskBadge level={p.risk} /></TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" aria-label={tr.view}>
                            <Link to={localizedPath(lang, `/projects/${p.id}`)}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={tr.delete}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{tr.delete_project}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {tr.delete_confirm}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{tr.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(p.id)}>{tr.delete}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
