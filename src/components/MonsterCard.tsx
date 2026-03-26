import { Monster } from "@/types/game";
import StatBar from "./StatBar";

interface MonsterCardProps {
  monster: Monster;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export default function MonsterCard({ monster, onSelect, selected }: MonsterCardProps) {
  if (monster.hp <= 0) return null;

  return (
    <div
      onClick={() => onSelect?.(monster.id)}
      className={`dungeon-card p-3 cursor-pointer transition-all duration-200 relative
        ${selected ? "border-dungeon-gold glow-gold ring-1 ring-dungeon-gold/50" : "hover:border-dungeon-crimson hover:shadow-md"}
        ${monster.isBoss ? "border-yellow-600/70" : ""}
      `}
    >
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 bg-dungeon-gold text-dungeon-bg text-xs font-display px-1.5 py-0.5 rounded-full">
          🎯
        </div>
      )}

      {monster.initiativeRoll !== undefined && (
        <div className={`absolute top-1 right-1 text-xs font-mono px-1 rounded
          ${monster.initiativeRoll >= 15 ? "text-red-300 bg-red-950/60" :
            monster.initiativeRoll >= 8 ? "text-yellow-400 bg-yellow-950/60" :
            "text-dungeon-text-dim bg-dungeon-border/60"}`}>
          🎲{monster.initiativeRoll}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className={`${monster.isBoss ? "text-4xl" : "text-3xl"}`}>{monster.emoji}</span>
        <div>
          <div className="font-display text-sm text-dungeon-text leading-tight">
            {monster.name}
            {monster.isBoss && <span className="ml-1 text-xs text-yellow-400">⚠️ BOSS</span>}
          </div>
          <div className="text-dungeon-text-dim text-xs">Nv.{monster.level}</div>
        </div>
      </div>

      <StatBar current={monster.hp} max={monster.maxHp} color="hp" showText={false} size="sm" />
      <div className="text-xs text-dungeon-text-dim font-mono mt-0.5">
        {monster.hp}/{monster.maxHp} HP
      </div>

      <div className="flex gap-3 mt-2 text-xs text-dungeon-text-dim font-mono">
        <span>⚔️ {monster.attack}</span>
        <span>🛡️ {monster.defense}</span>
        <span className="text-yellow-600">💰 {monster.coinReward}</span>
      </div>
    </div>
  );
}