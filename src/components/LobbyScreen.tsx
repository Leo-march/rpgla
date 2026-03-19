import { useGameStore } from "@/store/gameStore";
import { CLASS_DEFINITIONS, MAP_DEFINITIONS } from "@/data/gameData";
import { MapId } from "@/types/game";

export default function LobbyScreen() {
  const { gameState, myPlayerId, selectMap, startGame, connectionError } = useGameStore();

  if (!gameState) return null;

  const isLeader = gameState.players[0]?.id === myPlayerId;
  const canStart = gameState.players.length >= 1 && !!gameState.currentMap && isLeader;

  return (
    <div className="min-h-screen dungeon-bg p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-dungeon-gold mb-2 tracking-wide">
            ⚔️ Dungeon Chronicles
          </h1>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="text-dungeon-text-dim font-mono">Sala: <span className="text-dungeon-gold">{gameState.roomId}</span></span>
            <span className="text-dungeon-border">·</span>
            <span className="text-dungeon-text-dim font-mono">Jogadores: <span className="text-dungeon-gold font-bold">{gameState.players.length}/6</span></span>
          </div>
          {isLeader && (
            <span className="text-xs text-yellow-400 font-display mt-1 block">👑 Você é o líder da sala</span>
          )}
        </div>

        {connectionError && (
          <div className="bg-dungeon-crimson/20 border border-dungeon-crimson-light/50 text-white px-4 py-2 rounded mb-4 text-sm font-mono">
            ❌ {connectionError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Players list */}
          <div className="dungeon-card p-4">
            <h2 className="font-display text-dungeon-gold text-sm tracking-widest uppercase mb-3">👥 Grupo</h2>
            <div className="grid grid-cols-2 gap-2">
              {gameState.players.map((p, i) => {
                const cls = CLASS_DEFINITIONS.find((c) => c.id === p.classType);
                return (
                  <div key={p.id} className={`flex items-center gap-2 p-2 border rounded transition-all
                    ${p.id === myPlayerId ? "border-dungeon-gold bg-dungeon-gold/5" : "border-dungeon-border"}`}>
                    <span className="text-xl">{cls?.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-dungeon-text text-sm font-display truncate">{p.name}</span>
                        {i === 0 && <span className="text-yellow-400 text-xs flex-shrink-0">👑</span>}
                      </div>
                      <span className="text-dungeon-text-dim text-xs">{cls?.name}</span>
                    </div>
                  </div>
                );
              })}
              {Array.from({ length: 6 - gameState.players.length }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 border border-dashed border-dungeon-border/50 rounded opacity-40">
                  <span className="text-xl">❓</span>
                  <span className="text-dungeon-text-dim text-xs">Aguardando...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map selection */}
          <div className="dungeon-card p-4">
            <h2 className="font-display text-dungeon-gold text-sm tracking-widest uppercase mb-3">
              🗺️ Mapa {!isLeader && <span className="text-dungeon-text-dim text-xs normal-case">(somente líder)</span>}
            </h2>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {MAP_DEFINITIONS.map((map) => (
                <button key={map.id} onClick={() => isLeader && selectMap(map.id as MapId)} disabled={!isLeader}
                  className={`w-full text-left p-3 border rounded transition-all duration-200
                    ${gameState.currentMap === map.id ? "border-dungeon-gold bg-dungeon-gold/10" : "border-dungeon-border hover:border-dungeon-text-dim"}
                    ${!isLeader ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <div className="flex justify-between items-start">
                    <span className="font-display text-sm text-dungeon-text">{map.name}</span>
                    <span className={`text-xs font-display flex-shrink-0 ml-2
                      ${map.difficulty === "Iniciante" ? "text-green-400" :
                        map.difficulty === "Intermediário" ? "text-yellow-400" :
                        map.difficulty === "Avançado" ? "text-red-400" : "text-purple-400"}`}>
                      {map.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-dungeon-text-dim mt-0.5">{map.description}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {map.defenseDebuff < 1 && <span className="text-xs text-red-400">⚠️ -{Math.round((1 - map.defenseDebuff) * 100)}% DEF</span>}
                    {map.manaCostMultiplier > 1 && <span className="text-xs text-blue-400">⚠️ Mana x{map.manaCostMultiplier}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Iniciativa info */}
        <div className="dungeon-card mt-4 p-3 bg-amber-950/20 border-amber-800/40">
          <div className="text-xs font-display text-amber-400 tracking-widest uppercase mb-1">🎲 Sistema de Iniciativa</div>
          <p className="text-xs text-dungeon-text-dim">
            Cada rodada começa com todos rolando um d20. A ordem de ação segue do maior para o menor resultado.
            Em caso de empate, os dados são relançados automaticamente. Monstros também participam da iniciativa!
          </p>
        </div>

        <div className="dungeon-card mt-3 p-3 max-h-20 overflow-y-auto">
          {gameState.combatLog.slice(-4).map((entry) => (
            <div key={entry.id} className="text-xs text-dungeon-text-dim font-mono leading-relaxed">{entry.message}</div>
          ))}
        </div>

        {isLeader ? (
          <div className="text-center mt-6">
            <button onClick={startGame} disabled={!canStart}
              className="px-10 py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-xl hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
              {!gameState.currentMap ? "🗺️ Selecione um mapa" : "⚔️ Iniciar Aventura!"}
            </button>
            <p className="text-dungeon-text-dim text-xs mt-2">
              {gameState.players.length} jogador{gameState.players.length !== 1 ? "es" : ""} pronto{gameState.players.length !== 1 ? "s" : ""}
            </p>
          </div>
        ) : (
          <p className="text-center text-dungeon-text-dim text-sm mt-6 font-display">
            ⏳ Aguardando o líder iniciar a partida...
          </p>
        )}
      </div>
    </div>
  );
}