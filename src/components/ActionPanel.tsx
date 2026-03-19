import { useState } from "react";
import { Player, Monster } from "@/types/game";
import { CLASS_DEFINITIONS } from "@/data/gameData";
import { useGameStore } from "@/store/gameStore";

interface ActionPanelProps {
  player: Player;
  monsters: Monster[];
  boss: Monster | null;
  mapManaMult: number;
}

export default function ActionPanel({ player, monsters, boss, mapManaMult }: ActionPanelProps) {
  const { performAction } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const cls = CLASS_DEFINITIONS.find((c) => c.id === player.classType)!;

  const allTargets = [...monsters.filter((m) => m.hp > 0), ...(boss && boss.hp > 0 ? [boss] : [])];
  const isDead = player.attributes.hp <= 0;
  const hasActed = player.hasActedThisTurn;

  const handleSkill = (skillId: string) => {
    const target = selectedTarget || allTargets[0]?.id;
    performAction("attack", skillId, target ?? undefined);
  };

  const handleSkip = () => performAction("skip");

  if (isDead) {
    return (
      <div className="dungeon-card p-4 text-center">
        <span className="text-dungeon-crimson-light font-display text-lg">💀 Você foi derrotado</span>
      </div>
    );
  }

  if (hasActed) {
    return (
      <div className="dungeon-card p-4 text-center">
        <span className="text-dungeon-text-dim font-display text-sm">⏳ Aguardando outros jogadores...</span>
      </div>
    );
  }

  return (
    <div className="dungeon-card p-3 space-y-3">
      <div className="font-display text-xs text-dungeon-gold tracking-widest uppercase border-b border-dungeon-border pb-2">
        🎯 Suas Ações
      </div>

      {/* Target selection */}
      {allTargets.length > 1 && (
        <div>
          <div className="text-xs text-dungeon-text-dim mb-1">Selecionar alvo:</div>
          <div className="flex flex-wrap gap-1">
            {allTargets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTarget(t.id)}
                className={`text-xs px-2 py-1 border rounded transition-colors
                  ${selectedTarget === t.id
                    ? "border-dungeon-crimson-light bg-dungeon-crimson text-white"
                    : "border-dungeon-border text-dungeon-text-dim hover:border-dungeon-crimson"}`}
              >
                {t.emoji} {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="grid grid-cols-2 gap-2">
        {cls.skills.map((skill) => {
          const cost = Math.floor(skill.mpCost * mapManaMult);
          const canAfford = player.attributes.mp >= cost;

          return (
            <button
              key={skill.id}
              onClick={() => handleSkill(skill.id)}
              disabled={!canAfford || allTargets.length === 0}
              title={skill.description}
              className={`text-left p-2 border rounded transition-all duration-150 group
                ${skill.isSpecial
                  ? "border-purple-700 hover:border-purple-400 hover:bg-purple-900/30 disabled:opacity-40"
                  : "border-dungeon-border hover:border-dungeon-gold hover:bg-dungeon-surface disabled:opacity-40"}
                ${!canAfford ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className={`text-xs font-display leading-tight
                ${skill.isSpecial ? "text-purple-300" : "text-dungeon-text"}`}>
                {skill.isSpecial ? "⭐ " : ""}{skill.name}
              </div>
              <div className="text-xs font-mono mt-0.5">
                {cost > 0 ? (
                  <span className={canAfford ? "text-blue-400" : "text-red-400"}>
                    💧 {cost} MP
                  </span>
                ) : (
                  <span className="text-dungeon-text-dim">Grátis</span>
                )}
                <span className="text-dungeon-text-dim ml-1">×{skill.damageMultiplier}</span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSkip}
        className="w-full text-xs py-1.5 border border-dungeon-border text-dungeon-text-dim
                   hover:border-dungeon-text hover:text-dungeon-text transition-colors"
      >
        Passar Turno
      </button>
    </div>
  );
}
