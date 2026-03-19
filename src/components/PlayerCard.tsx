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
      className={`dungeon-card p-2 relative transition-all duration-300
        ${isMe ? "border-dungeon-gold glow-gold" : ""}
        ${isCurrentTurn && !isDead ? "border-dungeon-mana-light" : ""}
        ${isDead ? "opacity-40 grayscale" : ""}
        ${!player.isConnected ? "opacity-50" : ""}
      `}
    >
      {isMe && (
        <span className="absolute top-1 right-1.5 text-dungeon-gold text-xs font-display leading-none">
          VOCÊ
        </span>
      )}
      {isDead && (
        <span className="absolute top-1 left-1.5 text-dungeon-crimson-light text-xs font-display leading-none">
          MORTO
        </span>
      )}

      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xl">{cls?.emoji}</span>
        <div className="min-w-0">
          <div className="font-display text-xs text-dungeon-text leading-tight truncate">
            {player.name}
          </div>
          <div className="text-dungeon-text-dim text-xs leading-tight">
            {cls?.name} · Lv.{player.level}
          </div>
        </div>
      </div>

      <div className="space-y-1">
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
          <StatBar current={player.xp} max={player.xpToNext} color="xp" showText={false} size="sm" />
        </div>
      </div>

      <div className="flex gap-2 mt-1.5 text-xs text-dungeon-text-dim font-mono">
        <span>⚔️ {player.attributes.attack}</span>
        <span>🛡️ {player.attributes.defense}</span>
        <span>💰 {player.coins}</span>
        {player.summonActive && (
          <span className="text-purple-400">💀{player.summonTurnsLeft}t</span>
        )}
      </div>

      {player.statusEffects.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1">
          {player.statusEffects.map((se) => (
            <span key={se.id} className="text-xs bg-dungeon-border px-1 rounded text-dungeon-text-dim leading-tight">
              {se.name.split(" ")[0]} ({se.turnsLeft}t)
            </span>
          ))}
        </div>
      )}

      {/* Pending combo indicator */}
      {player.pendingComboId && (
        <div className="mt-1 text-xs text-purple-400 font-display">🤝 Em combo...</div>
      )}
    </div>
  );
}