import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { CLASS_DEFINITIONS, MAP_DEFINITIONS } from "@/data/gameData";
import { ClassType, MapId } from "@/types/game";

export default function LobbyScreen() {
  const { gameState, myPlayerId, selectMap, startGame, connectionError } = useGameStore();
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);

  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const isLeader = gameState.players[0]?.id === myPlayerId;
  const canStart = gameState.players.length >= 1 && !!gameState.currentMap && isLeader;

  return (
    <div className="min-h-screen dungeon-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-dungeon-gold mb-2 tracking-wide">
            ⚔️ Dungeon Chronicles
          </h1>
          <p className="text-dungeon-text-dim text-sm">
            Sala: <span className="text-dungeon-text font-mono">{gameState.roomId}</span>
            {" · "}
            Jogadores: <span className="text-dungeon-gold">{gameState.players.length}/4</span>
          </p>
          {isLeader && (
            <span className="text-xs text-yellow-400 font-display mt-1 block">👑 Você é o líder</span>
          )}
        </div>

        {connectionError && (
          <div className="bg-dungeon-crimson border border-dungeon-crimson-light text-white px-4 py-2 rounded mb-4 text-sm font-mono">
            ❌ {connectionError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Players list */}
          <div className="dungeon-card p-4">
            <h2 className="font-display text-dungeon-gold text-sm tracking-widest uppercase mb-3">
              👥 Jogadores na Sala
            </h2>
            <div className="space-y-2">
              {gameState.players.map((p, i) => {
                const cls = CLASS_DEFINITIONS.find((c) => c.id === p.classType);
                return (
                  <div key={p.id} className={`flex items-center gap-2 p-2 border rounded
                    ${p.id === myPlayerId ? "border-dungeon-gold" : "border-dungeon-border"}`}>
                    <span className="text-xl">{cls?.emoji}</span>
                    <div>
                      <span className="text-dungeon-text text-sm font-display">{p.name}</span>
                      <span className="text-dungeon-text-dim text-xs ml-2">({cls?.name})</span>
                      {i === 0 && <span className="text-yellow-400 text-xs ml-1">👑</span>}
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 border border-dashed border-dungeon-border rounded opacity-40">
                  <span className="text-xl">❓</span>
                  <span className="text-dungeon-text-dim text-sm">Aguardando jogador...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map selection */}
          <div className="dungeon-card p-4">
            <h2 className="font-display text-dungeon-gold text-sm tracking-widest uppercase mb-3">
              🗺️ Escolha o Mapa {!isLeader && <span className="text-dungeon-text-dim text-xs normal-case">(somente líder)</span>}
            </h2>
            <div className="space-y-2">
              {MAP_DEFINITIONS.map((map) => (
                <button
                  key={map.id}
                  onClick={() => isLeader && selectMap(map.id as MapId)}
                  disabled={!isLeader}
                  className={`w-full text-left p-3 border rounded transition-all duration-200
                    ${gameState.currentMap === map.id
                      ? "border-dungeon-gold bg-dungeon-gold/10"
                      : "border-dungeon-border hover:border-dungeon-text-dim"}
                    ${!isLeader ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-display text-sm text-dungeon-text">{map.name}</span>
                    <span className={`text-xs font-display
                      ${map.difficulty === "Iniciante" ? "text-green-400" :
                        map.difficulty === "Intermediário" ? "text-yellow-400" :
                        map.difficulty === "Avançado" ? "text-red-400" :
                        "text-purple-400"}`}>
                      {map.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-dungeon-text-dim mt-1">{map.description}</p>
                  {map.defenseDebuff < 1 && (
                    <span className="text-xs text-red-400">⚠️ -20% Defesa</span>
                  )}
                  {map.manaCostMultiplier > 1 && (
                    <span className="text-xs text-blue-400">⚠️ Custo de Mana x2</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Combat log preview */}
        <div className="dungeon-card mt-4 p-3 max-h-32 overflow-y-auto">
          {gameState.combatLog.slice(-8).map((entry) => (
            <div key={entry.id} className="text-xs text-dungeon-text-dim font-mono leading-relaxed">
              {entry.message}
            </div>
          ))}
        </div>

        {/* Start button */}
        {isLeader && (
          <div className="text-center mt-6">
            <button
              onClick={startGame}
              disabled={!canStart}
              className="px-10 py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-xl
                         hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!gameState.currentMap
                ? "🗺️ Selecione um mapa primeiro"
                : "⚔️ Iniciar Aventura!"}
            </button>
          </div>
        )}
        {!isLeader && (
          <p className="text-center text-dungeon-text-dim text-sm mt-4 font-display">
            Aguardando o líder iniciar a partida...
          </p>
        )}
      </div>
    </div>
  );
}