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
    <div className={`dungeon-card p-2 relative transition-all duration-300
      ${isMe ? "border-dungeon-gold glow-gold" : ""}
      ${isCurrentTurn && !isDead ? "border-dungeon-gold/80 shadow-md shadow-dungeon-gold/20 scale-[1.02]" : ""}
      ${isDead ? "opacity-40 grayscale" : ""}
      ${!player.isConnected ? "opacity-50" : ""}
    `}>
      {isCurrentTurn && !isDead && (
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-dungeon-gold rounded-full animate-ping" />
      )}
      {isMe && (
        <span className="absolute top-1 right-1.5 text-dungeon-gold text-xs font-display leading-none">EU</span>
      )}
      {isDead && (
        <span className="absolute top-1 left-1.5 text-dungeon-crimson-light text-xs font-display leading-none">MORTO</span>
      )}

      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xl">{cls?.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-xs text-dungeon-text leading-tight truncate flex items-center gap-1">
            {player.name}
            {player.initiativeRoll !== undefined && (
              <span className={`text-xs font-mono ml-auto px-1 rounded flex-shrink-0
                ${player.initiativeRoll >= 15 ? "text-green-400 bg-green-950/40" :
                  player.initiativeRoll >= 8  ? "text-yellow-400 bg-yellow-950/40" :
                  "text-red-400 bg-red-950/40"}`}>
                🎲{player.initiativeRoll}
              </span>
            )}
          </div>
          <div className="text-dungeon-text-dim text-xs leading-tight">{cls?.name} · Nv.{player.level}</div>
        </div>
      </div>

      <div className="space-y-1">
        <div>
          <div className="flex justify-between text-xs text-dungeon-text-dim mb-0.5">
            <span>❤️</span>
            <span className="font-mono">{player.attributes.hp}/{player.attributes.maxHp}</span>
          </div>
          <StatBar current={player.attributes.hp} max={player.attributes.maxHp} color="hp" showText={false} size="sm" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-dungeon-text-dim mb-0.5">
            <span>💧</span>
            <span className="font-mono">{player.attributes.mp}/{player.attributes.maxMp}</span>
          </div>
          <StatBar current={player.attributes.mp} max={player.attributes.maxMp} color="mp" showText={false} size="sm" />
        </div>
        <StatBar current={player.xp} max={player.xpToNext} color="xp" showText={false} size="sm" />
      </div>

      <div className="flex gap-2 mt-1.5 text-xs text-dungeon-text-dim font-mono flex-wrap">
        <span>⚔️{player.attributes.attack}</span>
        <span>🛡️{player.attributes.defense}</span>
        {(player.attributes.initiativeBonus ?? 0) > 0 && (
          <span className="text-purple-400">⚡+{player.attributes.initiativeBonus}</span>
        )}
        <span>💰{player.coins}</span>
        {player.summonActive && <span className="text-purple-400">💀{player.summonTurnsLeft}r</span>}
      </div>

      {player.statusEffects.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1">
          {player.statusEffects.map((se) => (
            <span key={se.id} className={`text-xs px-1 rounded leading-tight
              ${se.attackBonus  ? "bg-red-950/60 text-red-300" :
                se.defenseBonus && se.defenseBonus < 999 ? "bg-yellow-950/60 text-yellow-300" :
                se.defenseBonus === 999 ? "bg-blue-950/60 text-blue-300" :
                se.damagePerTurn ? "bg-green-950/60 text-green-300" :
                "bg-dungeon-border text-dungeon-text-dim"}`}>
              {se.name.split(" ")[0]} {se.turnsLeft !== -1 ? `(${se.turnsLeft}r)` : ""}
            </span>
          ))}
        </div>
      )}

      {player.pendingComboId && (
        <div className="mt-1 text-xs text-purple-400 font-display">🤝 Em combo...</div>
      )}
    </div>
  );
}
