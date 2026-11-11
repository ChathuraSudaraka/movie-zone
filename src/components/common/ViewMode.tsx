import { LayoutGrid, List } from "lucide-react";
import { LiquidSegmentedControl } from "./LiquidGlassControls";

interface ViewModeProps {
  viewMode: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

function ViewMode({ viewMode, onViewChange }: ViewModeProps) {
  return (
    <LiquidSegmentedControl<"grid" | "list">
      layoutId="browse-view-mode-lens"
      value={viewMode}
      onChange={onViewChange}
      options={[
        {
          value: "grid",
          label: "Grid",
          icon: <LayoutGrid className="w-3.5 h-3.5" />,
        },
        {
          value: "list",
          label: "List",
          icon: <List className="w-3.5 h-3.5" />,
        },
      ]}
    />
  );
}

export default ViewMode;
