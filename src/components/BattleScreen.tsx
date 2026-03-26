import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { MAP_DEFINITIONS } from "@/data/gameData";
import PlayerCard from "./PlayerCard";
import MonsterCard from "./MonsterCard";
import CombatLog from "./CombatLog";
import ActionPanel from "./ActionPanel";

export default function BattleScreen() {
  const { gameState, myPlayerId, combatLog } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const mapDef = MAP_DEFINITIONS.find((m) => m.id === gameState.currentMap);
  const allMonsters = [
    ...gameState.monsters.filter((m) => m.hp > 0),
    ...(gameState.currentBoss && gameState.currentBoss.hp > 0 ? [gameState.currentBoss] : []),
  ];

  const isBossFight = !!gameState.currentBoss && gameState.currentBoss.hp > 0;
  const validTarget = selectedTarget && allMonsters.find((m) => m.id === selectedTarget)
    ? selectedTarget : allMonsters[0]?.id ?? null;

  // Current actor in initiative
  const initiativeOrder = gameState.initiativeOrder ?? [];
  const currentActorEntry = initiativeOrder.find(e => !e.acted);
  const isMyTurn = currentActorEntry?.id === myPlayerId;
  const myInitiativeRoll = me?.initiativeRoll;

  return (
    <div className="h-screen dungeon-bg flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="border-b border-dungeon-border bg-dungeon-surface/80 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display text-dungeon-gold text-sm tracking-wide">
            ⚔️ {mapDef?.name ?? "Batalha"}
          </span>
          <span className="text-dungeon-text-dim text-xs font-mono border border-dungeon-border px-2 py-0.5 rounded">
            Rodada {gameState.turnNumber + 1}
          </span>
          {isBossFight && (
            <span className="text-yellow-400 text-xs font-display animate-pulse border border-yellow-700 px-2 py-0.5 rounded">
              ⚠️ BOSS
            </span>
          )}
        </div>

        {/* Initiative order bar */}
        {initiativeOrder.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto max-w-md">
            {initiativeOrder.map((entry, i) => (
              <div
                key={entry.id}
                title={`${entry.name}: ${entry.roll}`}
                className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border transition-all
                  ${!entry.acted && i === initiativeOrder.findIndex(e => !e.acted)
                    ? "border-dungeon-gold bg-dungeon-gold/20 text-dungeon-gold shadow-md scale-105"
                    : entry.acted
                    ? "border-dungeon-border/40 text-dungeon-text-dim/40 line-through"
                    : "border-dungeon-border text-dungeon-text-dim"
                  }`}
              >
                <span>{entry.isPlayer ? "👤" : "👹"}</span>
                <span className="hidden sm:inline max-w-14 truncate">{entry.name}</span>
                <span className={`font-bold ${entry.roll >= 15 ? "text-green-400" : entry.roll >= 8 ? "text-yellow-400" : "text-red-400"}`}>
                  {entry.roll}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-dungeon-text-dim font-mono flex-shrink-0">
          {isMyTurn && (
            <span className="text-dungeon-gold font-display animate-pulse border border-dungeon-gold px-2 py-0.5 rounded">
              ⚡ SEU TURNO
            </span>
          )}
          {me && <span className="text-yellow-400">💰 {me.coins}</span>}
          <span className={`px-2 py-0.5 rounded text-xs font-display border
            ${mapDef?.difficulty === "Iniciante" ? "text-green-400 border-green-800" :
              mapDef?.difficulty === "Intermediário" ? "text-yellow-400 border-yellow-800" :
              mapDef?.difficulty === "Avançado" ? "text-red-400 border-red-900" :
              "text-purple-400 border-purple-900"}`}>
            {mapDef?.difficulty}
          </span>
          {mapDef && mapDef.defenseDebuff < 1 && <span className="text-red-400">🛡️-{Math.round((1 - mapDef.defenseDebuff) * 100)}%</span>}
          {mapDef && mapDef.manaCostMultiplier > 1 && <span className="text-blue-400">💧×{mapDef.manaCostMultiplier}</span>}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Players */}
        <div className="w-52 flex-shrink-0 border-r border-dungeon-border p-2 overflow-y-auto space-y-1.5 bg-dungeon-surface/30">
          <div className="text-xs font-display text-dungeon-text-dim tracking-widest uppercase px-1 pb-1 border-b border-dungeon-border">
            👥 Grupo
          </div>
          {gameState.players.map((player) => {
            const isCurrentActor = currentActorEntry?.id === player.id;
            return (
              <PlayerCard
                key={player.id}
                player={player}
                isMe={player.id === myPlayerId}
                isCurrentTurn={isCurrentActor && !player.hasActedThisTurn && player.attributes.hp > 0}
              />
            );
          })}
        </div>

        {/* Center: Monsters + Actions */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Monsters area */}
          <div className="flex-1 p-3 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-display text-dungeon-text-dim tracking-widest uppercase">
                {isBossFight ? "⚠️ Chefe da Masmorra" : "👹 Inimigos"}
              </div>
              {validTarget && (
                <div className="text-xs text-dungeon-text-dim font-mono">
                  🎯 Alvo: <span className="text-dungeon-gold">
                    {allMonsters.find((m) => m.id === validTarget)?.name ?? "—"}
                  </span>
                </div>
              )}
            </div>

            {allMonsters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-3">
                <div className="text-4xl animate-bounce">✨</div>
                <span className="text-dungeon-text-dim font-display text-base">
                  Todos os inimigos foram derrotados!
                </span>
                <div className="text-xs text-dungeon-text-dim animate-pulse">Preparando próxima onda...</div>
              </div>
            ) : (
              <div className={`grid gap-2 ${isBossFight ? "grid-cols-1 max-w-sm" : "grid-cols-2 md:grid-cols-3"}`}>
                {allMonsters.map((monster) => (
                  <MonsterCard
                    key={monster.id}
                    monster={monster}
                    onSelect={(id) => setSelectedTarget(id)}
                    selected={validTarget === monster.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action panel */}
          <div className="border-t border-dungeon-border p-2 flex-shrink-0 bg-dungeon-surface/50">
            {me ? (
              <ActionPanel
                player={me}
                monsters={gameState.monsters.filter((m) => m.hp > 0)}
                boss={gameState.currentBoss}
                mapManaMult={mapDef?.manaCostMultiplier ?? 1}
                gameState={gameState}
                selectedTarget={validTarget}
                onTargetSelect={(id) => setSelectedTarget(id)}
                isMyTurn={isMyTurn}
              />
            ) : (
              <div className="text-center text-dungeon-text-dim font-display text-sm py-2">
                Você não está nesta partida
              </div>
            )}
          </div>
        </div>

        {/* Right: Combat log */}
        <div className="w-64 flex-shrink-0 border-l border-dungeon-border flex flex-col overflow-hidden min-h-0">
          <CombatLog entries={combatLog} />
        </div>
      </div>
    </div>
  );
}