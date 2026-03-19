import { Player } from "@/types/game";
import { CLASS_DEFINITIONS } from "@/data/gameData";
import StatBar from "./StatBar";

interface PlayerCardProps {
  player: Player;
  isMe: boolean;
  isCurrentTurn?: boolean;
}

export default function PlayerCard({ player, isMe, isCurrentTurn }: PlayerCardProps) {
  const cls = CLASS_DEFINITIONS.find((c) => c.id === player.classType);
  const isDead = player.attributes.hp <= 0;

  return (
    <div
      className={`dungeon-card p-3 relative transition-all duration-300
        ${isMe ? "border-dungeon-gold glow-gold" : ""}
        ${isCurrentTurn ? "border-dungeon-mana-light" : ""}
        ${isDead ? "opacity-40 grayscale" : ""}
        ${!player.isConnected ? "opacity-50" : ""}
      `}
    >
      {isMe && (
        <span className="absolute top-1 right-2 text-dungeon-gold text-xs font-display">
          VOCÊ
        </span>
      )}
      {isDead && (
        <span className="absolute top-1 left-2 text-dungeon-crimson-light text-xs font-display">
          MORTO
        </span>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{cls?.emoji}</span>
        <div>
          <div className="font-display text-sm text-dungeon-text leading-tight">
            {player.name}
          </div>
          <div className="text-dungeon-text-dim text-xs">
            {cls?.name} · Lv.{player.level}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div>
          <div className="flex justify-between text-xs text-dungeon-text-dim mb-0.5">
            <span>❤️ HP</span>
            <span className="font-mono">{player.attributes.hp}/{player.attributes.maxHp}</span>
          </div>
          <StatBar current={player.attributes.hp} max={player.attributes.maxHp} color="hp" showText={false} size="sm" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-dungeon-text-dim mb-0.5">
            <span>💧 MP</span>
            <span className="font-mono">{player.attributes.mp}/{player.attributes.maxMp}</span>
          </div>
          <StatBar current={player.attributes.mp} max={player.attributes.maxMp} color="mp" showText={false} size="sm" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-dungeon-text-dim mb-0.5">
            <span>⭐ XP</span>
          </div>
          <StatBar current={player.xp} max={player.xpToNext} color="xp" showText={false} size="sm" />
        </div>
      </div>

      <div className="flex gap-3 mt-2 text-xs text-dungeon-text-dim font-mono">
        <span>⚔️ {player.attributes.attack}</span>
        <span>🛡️ {player.attributes.defense}</span>
        {player.summonActive && (
          <span className="text-purple-400">💀+{player.summonTurnsLeft}t</span>
        )}
      </div>

      {player.statusEffects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {player.statusEffects.map((se) => (
            <span key={se.id} className="text-xs bg-dungeon-border px-1 rounded text-dungeon-text-dim">
              {se.name} ({se.turnsLeft}t)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
