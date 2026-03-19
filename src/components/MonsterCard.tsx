import { Monster } from "@/types/game";
import StatBar from "./StatBar";

interface MonsterCardProps {
  monster: Monster;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export default function MonsterCard({ monster, onSelect, selected }: MonsterCardProps) {
  const isDead = monster.hp <= 0;
  if (isDead) return null;

  return (
    <div
      onClick={() => onSelect?.(monster.id)}
      className={`dungeon-card p-3 cursor-pointer transition-all duration-200 relative
        ${selected
          ? "border-dungeon-gold glow-gold ring-1 ring-dungeon-gold/50"
          : "hover:border-dungeon-crimson hover:shadow-md"}
        ${monster.isBoss ? "border-yellow-600 animate-pulse-slow" : ""}
      `}
    >
      {/* Target indicator */}
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 bg-dungeon-gold text-dungeon-bg text-xs font-display px-1 rounded-full">
          🎯
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl">{monster.emoji}</span>
        <div>
          <div className="font-display text-sm text-dungeon-text">
            {monster.name}
            {monster.isBoss && (
              <span className="ml-1 text-xs text-yellow-400 font-display">⚠️ BOSS</span>
            )}
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