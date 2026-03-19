import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { CLASS_DEFINITIONS } from "@/data/gameData";
import { ClassType } from "@/types/game";

export default function JoinScreen() {
  const { connect, joinRoom, isConnected, connectionError, gameState } = useGameStore();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [classType, setClassType] = useState<ClassType>("warrior");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    connect();
  }, []);

  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    joinRoom(roomId.trim().toUpperCase(), name.trim(), classType);
    setJoined(true);
  };

  if (joined && !gameState) {
    return (
      <div className="min-h-screen dungeon-bg flex items-center justify-center">
        <div className="text-dungeon-gold font-display text-2xl animate-pulse">
          ⚔️ Entrando na sala...
        </div>
      </div>
    );
  }

  // All classes are available from the start
  const availableClasses = CLASS_DEFINITIONS;

  return (
    <div className="min-h-screen dungeon-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚔️</div>
          <h1 className="font-display text-5xl text-dungeon-gold tracking-widest mb-2">DUNGEON</h1>
          <h2 className="font-display text-2xl text-dungeon-text-dim tracking-widest">CHRONICLES</h2>
          <p className="text-dungeon-text-dim text-sm mt-3 font-body italic">
            RPG multijogador em tempo real · 6 jogadores · 6 classes · Sistema de Combos
          </p>
        </div>

        {connectionError && (
          <div className="bg-dungeon-crimson/30 border border-dungeon-crimson-light text-red-300 px-4 py-2 rounded mb-4 text-sm font-mono">
            ❌ {connectionError}
          </div>
        )}

        <div className="dungeon-card p-6 space-y-5">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-500 animate-pulse"}`} />
            <span className="text-xs text-dungeon-text-dim font-mono">
              {isConnected ? "Conectado ao servidor" : "Conectando..."}
            </span>
          </div>

          {/* Room + Name on same row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-display text-dungeon-gold tracking-widest uppercase block mb-1">
                Código da Sala
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Ex: DUNGEON01"
                maxLength={12}
                className="w-full bg-dungeon-bg border border-dungeon-border text-dungeon-text
                           px-3 py-2 font-mono text-sm focus:border-dungeon-gold outline-none
                           placeholder:text-dungeon-text-dim/40 uppercase tracking-widest"
              />
            </div>
            <div>
              <label className="text-xs font-display text-dungeon-gold tracking-widest uppercase block mb-1">
                Nome do Personagem
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Thorin"
                maxLength={20}
                className="w-full bg-dungeon-bg border border-dungeon-border text-dungeon-text
                           px-3 py-2 font-mono text-sm focus:border-dungeon-gold outline-none
                           placeholder:text-dungeon-text-dim/40"
              />
            </div>
          </div>

          {/* Class selection — all 6 */}
          <div>
            <label className="text-xs font-display text-dungeon-gold tracking-widest uppercase block mb-2">
              Escolha sua Classe
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setClassType(cls.id)}
                  className={`p-2.5 border rounded text-left transition-all duration-200
                    ${classType === cls.id
                      ? "border-dungeon-gold bg-dungeon-gold/10"
                      : "border-dungeon-border hover:border-dungeon-text-dim"}`}
                >
                  <div className="text-xl mb-1">{cls.emoji}</div>
                  <div className="font-display text-xs text-dungeon-text">{cls.name}</div>
                  <div className="text-dungeon-text-dim text-xs mt-0.5 leading-tight line-clamp-2">
                    {cls.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Class details */}
            {classType && (
              <div className="mt-2 p-2 border border-dungeon-border rounded bg-dungeon-surface">
                {(() => {
                  const cls = CLASS_DEFINITIONS.find((c) => c.id === classType)!;
                  return (
                    <>
                      <div className="text-xs font-display text-yellow-400 mb-1">
                        ✨ Passiva: {cls.passiveDescription}
                      </div>
                      <div className="flex gap-3 text-xs font-mono text-dungeon-text-dim">
                        <span>❤️ {cls.baseAttributes.hp} HP</span>
                        <span>💧 {cls.baseAttributes.mp} MP</span>
                        <span>⚔️ {cls.baseAttributes.attack} ATK</span>
                        <span>🛡️ {cls.baseAttributes.defense} DEF</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={!isConnected || !name.trim() || !roomId.trim()}
            className="w-full py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-xl
                       hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed tracking-widest"
          >
            ⚔️ ENTRAR NA SALA
          </button>
        </div>

        <p className="text-center text-dungeon-text-dim text-xs mt-4 font-mono">
          Todas as 6 classes disponíveis · 15 combos únicos entre classes
        </p>
      </div>
    </div>
  );
}