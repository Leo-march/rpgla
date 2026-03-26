interface StatBarProps {
  current: number;
  max: number;
  color: "hp" | "mp" | "xp";
  showText?: boolean;
  size?: "sm" | "md";
}

const COLOR_MAP = {
  hp: "bg-green-600",
  mp: "bg-blue-600",
  xp: "bg-yellow-600",
};

export default function StatBar({ current, max, color, showText = true, size = "md" }: StatBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const h = size === "sm" ? "h-2" : "h-3";

  return (
    <div className="w-full">
      <div className={`w-full ${h} bg-dungeon-border rounded-sm overflow-hidden`}>
        <div
          className={`${h} ${COLOR_MAP[color]} hp-bar rounded-sm`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showText && (
        <div className="text-xs text-dungeon-text-dim font-mono mt-0.5">
          {current}/{max}
        </div>
      )}
    </div>
  );
}
