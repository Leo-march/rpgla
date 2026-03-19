import { useState } from "react";
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

  return (
    <div className="h-screen dungeon-bg flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="border-b border-dungeon-border px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="font-display text-dungeon-gold text-sm tracking-wide">
          ⚔️ {mapDef?.name ?? "Batalha"}
          <span className="text-dungeon-text-dim text-xs ml-2">
            · Rodada {gameState.turnNumber + 1}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-dungeon-text-dim font-mono">
          <span className={`font-display text-xs tracking-widest uppercase
            ${isBossFight ? "text-yellow-400 animate-pulse" : "text-dungeon-text-dim"}`}>
            {isBossFight ? "⚠️ BOSS BATTLE" : gameState.turnPhase === "monster_turn" ? "👹 Turno dos Monstros" : "🧑 Turno dos Jogadores"}
          </span>
          {me && <span>💰 {me.coins}</span>}
          <span className={`px-2 py-0.5 rounded text-xs font-display
            ${mapDef?.difficulty === "Iniciante" ? "text-green-400 border border-green-800" :
              mapDef?.difficulty === "Intermediário" ? "text-yellow-400 border border-yellow-800" :
              mapDef?.difficulty === "Avançado" ? "text-red-400 border border-red-900" :
              "text-purple-400 border border-purple-900"}`}>
            {mapDef?.difficulty}
          </span>
          {mapDef && mapDef.defenseDebuff < 1 && (
            <span className="text-red-400">🛡️-20%</span>
          )}
          {mapDef && mapDef.manaCostMultiplier > 1 && (
            <span className="text-blue-400">💧×2</span>
          )}
        </div>
      </div>

      {/* Main layout - fills remaining height */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Players */}
        <div className="w-52 flex-shrink-0 border-r border-dungeon-border p-2 overflow-y-auto space-y-2">
          <div className="text-xs font-display text-dungeon-text-dim tracking-widest uppercase px-1 pb-1 border-b border-dungeon-border">
            Grupo
          </div>
          {gameState.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isMe={player.id === myPlayerId}
              isCurrentTurn={!player.hasActedThisTurn && player.attributes.hp > 0}
            />
          ))}
        </div>

        {/* Center: Battle field + actions */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Monsters - scrollable if needed */}
          <div className="flex-1 p-3 overflow-y-auto min-h-0">
            <div className="text-xs font-display text-dungeon-text-dim tracking-widest uppercase mb-2">
              {isBossFight ? "⚠️ Chefe" : "👹 Inimigos"}
            </div>

            {allMonsters.length === 0 ? (
              <div className="flex items-center justify-center h-24">
                <span className="text-dungeon-text-dim font-display text-base animate-pulse">
                  ✨ Todos os inimigos foram derrotados!
                </span>
              </div>
            ) : (
              <div className={`grid gap-2 ${isBossFight ? "grid-cols-1 max-w-xs" : "grid-cols-2 md:grid-cols-3"}`}>
                {allMonsters.map((monster) => (
                  <MonsterCard
                    key={monster.id}
                    monster={monster}
                    onSelect={setSelectedTarget}
                    selected={selectedTarget === monster.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action panel - fixed at bottom of center */}
          <div className="border-t border-dungeon-border p-2 flex-shrink-0">
            {me ? (
              <ActionPanel
                player={me}
                monsters={gameState.monsters.filter((m) => m.hp > 0)}
                boss={gameState.currentBoss}
                mapManaMult={mapDef?.manaCostMultiplier ?? 1}
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