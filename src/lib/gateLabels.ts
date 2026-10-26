import type { ResolutionStatus } from "./router/types";

/** UI four-state labels from the locked Gate determination screen. */
export function gateUiLabel(status: ResolutionStatus): string {
  switch (status) {
    case "ELIGIBLE":
      return "Eligible";
    case "PREMATURE":
      return "Premature";
    case "TIME_BARRED":
      return "Out of Time";
    case "REDIRECT_REQUIRED":
      return "Wrong Door";
  }
}

export function gateTone(status: ResolutionStatus): {
  ribbon: string;
  border: string;
  badge: string;
  ink: string;
} {
  switch (status) {
    case "ELIGIBLE":
      return {
        ribbon: "bg-[#EBF4F0] border-[#CADFD5]",
        border: "border-civic-green",
        badge: "border-civic-green text-civic-green",
        ink: "text-civic-green",
      };
    case "PREMATURE":
      return {
        ribbon: "bg-ochre-fill border-[#E8D4A8]",
        border: "border-ochre",
        badge: "border-ochre text-ochre",
        ink: "text-ochre",
      };
    case "TIME_BARRED":
      return {
        ribbon: "bg-[#FBF3F2] border-[#E8C4C2]",
        border: "border-crimson",
        badge: "border-crimson text-crimson",
        ink: "text-crimson",
      };
    case "REDIRECT_REQUIRED":
      return {
        ribbon: "bg-[#EEF2F6] border-[#C5D0DC]",
        border: "border-redirect",
        badge: "border-redirect text-redirect",
        ink: "text-redirect",
      };
  }
}

/** Matches the locked home chrome stepper from the door-navigator screen. */
export type StepId =
  | "landing"
  | "intake"
  | "extract"
  | "gate"
  | "pack"
  | "ico"
  | "export";

export const HOME_STEPS: { id: StepId; label: string; num: number }[] = [
  { id: "intake", label: "Intake", num: 1 },
  { id: "extract", label: "Extract", num: 2 },
  { id: "gate", label: "Jurisdictional Door", num: 3 },
  { id: "pack", label: "Human Gate Pack", num: 4 },
  { id: "ico", label: "ICO Special", num: 5 },
  { id: "export", label: "Export", num: 6 },
];

/** Alias used by flow progress after landing. */
export const STEPS = HOME_STEPS;
