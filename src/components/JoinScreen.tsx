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

  useEffect(() => { connect(); }, []);

  const handleJoin = () => {
    if (!name.trim() || !roomId.trim()) return;
    joinRoom(roomId.trim().toUpperCase(), name.trim(), classType);
    setJoined(true);
  };

  if (joined && !gameState) {
    return (
      <div className="min-h-screen dungeon-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-spin">⚙️</div>
          <div className="text-dungeon-gold font-display text-xl animate-pulse">Entrando na sala...</div>
        </div>
      </div>
    );
  }

  const selectedClass = CLASS_DEFINITIONS.find(c => c.id === classType);

  return (
    <div className="min-h-screen dungeon-bg flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="text-7xl mb-3 drop-shadow-2xl">⚔️</div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-dungeon-gold rounded-full animate-ping opacity-60" />
          </div>
          <h1 className="font-display text-6xl text-dungeon-gold tracking-widest mb-1 drop-shadow-lg">DUNGEON</h1>
          <h2 className="font-display text-3xl text-dungeon-text-dim tracking-widest">CHRONICLES</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-16 bg-dungeon-border" />
            <p className="text-dungeon-text-dim text-xs font-mono">RPG MULTIJOGADOR · 8 CLASSES · SISTEMA DE INICIATIVA</p>
            <div className="h-px w-16 bg-dungeon-border" />
          </div>
        </div>

        {connectionError && (
          <div className="bg-dungeon-crimson/20 border border-dungeon-crimson-light/50 text-red-300 px-4 py-2 rounded mb-4 text-sm font-mono">
            ❌ {connectionError}
          </div>
        )}

        <div className="dungeon-card p-6 space-y-5">
          {/* Connection status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-500 animate-pulse"}`} />
              <span className="text-xs text-dungeon-text-dim font-mono">
                {isConnected ? "Conectado ao servidor" : "Conectando..."}
              </span>
            </div>
            <span className="text-xs text-dungeon-text-dim font-mono">máx. 6 jogadores/sala</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-display text-dungeon-gold tracking-widest uppercase block mb-1">
                Código da Sala
              </label>
              <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Ex: DUNGEON01" maxLength={12}
                className="w-full bg-dungeon-bg border border-dungeon-border text-dungeon-text px-3 py-2 font-mono text-sm focus:border-dungeon-gold outline-none placeholder:text-dungeon-text-dim/40 uppercase tracking-widest" />
            </div>
            <div>
              <label className="text-xs font-display text-dungeon-gold tracking-widest uppercase block mb-1">
                Nome do Personagem
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Thorin" maxLength={20}
                className="w-full bg-dungeon-bg border border-dungeon-border text-dungeon-text px-3 py-2 font-mono text-sm focus:border-dungeon-gold outline-none placeholder:text-dungeon-text-dim/40" />
            </div>
          </div>

          {/* Class selection */}
          <div>
            <label className="text-xs font-display text-dungeon-gold tracking-widest uppercase block mb-2">
              Escolha sua Classe
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CLASS_DEFINITIONS.map((cls) => (
                <button key={cls.id} onClick={() => setClassType(cls.id)}
                  className={`p-2.5 border rounded text-left transition-all duration-200
                    ${classType === cls.id
                      ? "border-dungeon-gold bg-dungeon-gold/10 shadow-md shadow-dungeon-gold/20"
                      : "border-dungeon-border hover:border-dungeon-text-dim hover:bg-dungeon-surface"}`}>
                  <div className="text-2xl mb-1">{cls.emoji}</div>
                  <div className="font-display text-xs text-dungeon-text leading-tight">{cls.name}</div>
                  {(cls.id === "druida" || cls.id === "berserker") && (
                    <div className="text-xs text-purple-400 font-mono mt-0.5">✨ Novo</div>
                  )}
                </button>
              ))}
            </div>

            {selectedClass && (
              <div className="mt-2 p-3 border border-dungeon-border rounded bg-dungeon-surface space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedClass.emoji}</span>
                  <div>
                    <div className="font-display text-sm text-dungeon-gold">{selectedClass.name}</div>
                    <div className="text-xs text-dungeon-text-dim">{selectedClass.description}</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-yellow-400 bg-yellow-950/30 px-2 py-1 rounded border border-yellow-900/50">
                  ⚡ {selectedClass.passiveDescription}
                </div>
                <div className="flex gap-3 text-xs font-mono text-dungeon-text-dim">
                  <span className="text-green-400">❤️ {selectedClass.baseAttributes.hp}</span>
                  <span className="text-blue-400">💧 {selectedClass.baseAttributes.mp}</span>
                  <span className="text-red-400">⚔️ {selectedClass.baseAttributes.attack}</span>
                  <span className="text-yellow-400">🛡️ {selectedClass.baseAttributes.defense}</span>
                </div>
                <div className="text-xs text-dungeon-text-dim">
                  <span className="text-purple-400 font-display">Skills: </span>
                  {selectedClass.skills.map(s => s.name).join(" · ")}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleJoin} disabled={!isConnected || !name.trim() || !roomId.trim()}
            className="w-full py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-xl hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed tracking-widest">
            ⚔️ ENTRAR NA SALA
          </button>
        </div>

        <p className="text-center text-dungeon-text-dim text-xs mt-4 font-mono">
          8 classes · Sistema de Iniciativa d20 · Combos únicos entre classes
        </p>
      </div>
    </div>
  );
}