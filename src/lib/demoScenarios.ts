/**
 * Curated demo scenarios — each capability card carries STRUCTURED building
 * params (not just a query string) so tapping it grounds the agent (and fills
 * the demo's building inputs), yielding a real evaluation instead of the whole
 * rules set. Labels/queries/usage come from i18n; numeric params live here.
 */
import { BellRing, ShieldCheck, UtensilsCrossed, Warehouse, type LucideIcon } from "lucide-react";
import { BuildingType } from "@/services/fireCodeApi";
import type { Dict } from "@/lib/i18n";

/** The building inputs a scenario sets (overwrites the demo selector + sent with the request). */
export interface DemoScenarioParams {
  building_type: BuildingType;
  usage: string;
  area_m2: number;
  floors: number;
  occupants: number;
  ceiling_height_m: number;
  volume_m3: number;
}

export interface DemoScenario {
  icon: LucideIcon;
  label: string;
  query: string;
  params: DemoScenarioParams;
}

/** Build the 4 demo scenarios with localized label/query/usage + fixed params. */
export function getDemoScenarios(tr: Dict): DemoScenario[] {
  return [
    {
      icon: UtensilsCrossed,
      label: tr.demoExLabel1,
      query: tr.demoEx1,
      params: { building_type: BuildingType.comercial, usage: tr.demoEx1Usage, area_m2: 350, floors: 2, occupants: 120, ceiling_height_m: 3, volume_m3: 2100 },
    },
    {
      icon: Warehouse,
      label: tr.demoExLabel2,
      query: tr.demoEx2,
      params: { building_type: BuildingType.industrial, usage: tr.demoEx2Usage, area_m2: 1200, floors: 1, occupants: 40, ceiling_height_m: 8, volume_m3: 9600 },
    },
    {
      icon: BellRing,
      label: tr.demoExLabel3,
      query: tr.demoEx3,
      params: { building_type: BuildingType.residencial, usage: tr.demoEx3Usage, area_m2: 250, floors: 1, occupants: 4, ceiling_height_m: 2.5, volume_m3: 625 },
    },
    {
      icon: ShieldCheck,
      label: tr.demoExLabel4,
      query: tr.demoEx4,
      params: { building_type: BuildingType.comercial, usage: tr.demoEx4Usage, area_m2: 200, floors: 1, occupants: 50, ceiling_height_m: 3, volume_m3: 600 },
    },
  ];
}
