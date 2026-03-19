import { useEffect, useRef } from "react";
import { CombatEntry } from "@/types/game";

interface CombatLogProps {
  entries: CombatEntry[];
}

const TYPE_STYLES: Record<CombatEntry["type"], string> = {
  player_attack: "text-green-400",
  monster_attack: "text-red-400",
  level_up: "text-yellow-300",
  item: "text-blue-300",
  system: "text-dungeon-text-dim",
  special: "text-purple-400",
  combo: "text-fuchsia-400 font-semibold",
};

export default function CombatLog({ entries }: CombatLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="dungeon-card h-full flex flex-col">
      <div className="px-3 py-2 border-b border-dungeon-border">
        <h3 className="font-display text-xs text-dungeon-gold tracking-widest uppercase">
          ⚔️ Log de Combate
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-xs min-h-0">
        {entries.map((entry) => (
          <div key={entry.id} className={`log-entry ${TYPE_STYLES[entry.type]} leading-relaxed`}>
            {entry.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}