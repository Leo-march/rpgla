import { useGameStore } from "@/store/gameStore";

export function VictoryScreen() {
  const { gameState, returnToMapSelect, disconnect } = useGameStore();
  if (!gameState) return null;

  const isLeader = gameState.players[0]?.id === useGameStore.getState().myPlayerId;
  const survivors = gameState.players.filter((p) => p.attributes.hp > 0);

  return (
    <div className="min-h-screen dungeon-bg flex items-center justify-center p-4">
      <div className="text-center max-w-lg w-full">
        <div className="text-8xl mb-4 animate-bounce">🏆</div>
        <h1 className="font-display text-5xl text-dungeon-gold mb-2 tracking-wide">VITÓRIA!</h1>
        <p className="text-dungeon-text text-lg font-body mb-6">
          O grupo conquistou o mapa e derrotou o chefe!
        </p>

        <div className="dungeon-card p-4 mb-4">
          <h3 className="font-display text-dungeon-gold text-sm tracking-widest uppercase mb-3">
            👥 Sobreviventes
          </h3>
          {survivors.map((p) => (
            <div key={p.id} className="flex justify-between text-sm font-mono mb-1">
              <span className="text-dungeon-text">{p.name} · Lv.{p.level}</span>
              <span className="text-dungeon-text-dim">{p.attributes.hp}/{p.attributes.maxHp} HP · 💰{p.coins}</span>
            </div>
          ))}
        </div>

        {gameState.unlockedClasses.filter(c => !["warrior","mage","ranger"].includes(c)).length > 0 && (
          <div className="dungeon-card p-4 mb-4">
            <h3 className="font-display text-dungeon-gold text-sm tracking-widest uppercase mb-2">
              🔓 Classes Desbloqueadas
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {gameState.unlockedClasses.filter(c => !["warrior","mage","ranger"].includes(c)).map((cls) => (
                <span key={cls} className="text-xs border border-dungeon-gold text-dungeon-gold px-2 py-1 font-display">
                  {cls}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isLeader ? (
            <button
              onClick={returnToMapSelect}
              className="w-full py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-lg
                         hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200"
            >
              🗺️ Escolher Próximo Mapa
            </button>
          ) : (
            <div className="dungeon-card p-3 text-dungeon-text-dim font-display text-sm">
              ⏳ Aguardando o líder escolher o próximo mapa...
            </div>
          )}
          <button
            onClick={disconnect}
            className="w-full py-2 border border-dungeon-border text-dungeon-text-dim font-display text-sm
                       hover:border-dungeon-text hover:text-dungeon-text transition-all duration-200"
          >
            🏠 Sair para o Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export function GameOverScreen() {
  const { gameState, returnToMapSelect, disconnect } = useGameStore();
  const isLeader = gameState?.players[0]?.id === useGameStore.getState().myPlayerId;

  return (
    <div className="min-h-screen dungeon-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="text-8xl mb-4">💀</div>
        <h1 className="font-display text-5xl text-dungeon-crimson-light mb-2 tracking-wide">
          GAME OVER
        </h1>
        <p className="text-dungeon-text-dim text-lg font-body mb-8">
          O grupo foi aniquilado nas profundezas da masmorra.
        </p>
        <div className="space-y-3">
          {isLeader ? (
            <button
              onClick={returnToMapSelect}
              className="w-full py-3 border-2 border-dungeon-crimson-light text-dungeon-crimson-light font-display text-lg
                         hover:bg-dungeon-crimson hover:text-white transition-all duration-200"
            >
              🔄 Tentar Novamente
            </button>
          ) : (
            <div className="dungeon-card p-3 text-dungeon-text-dim font-display text-sm">
              ⏳ Aguardando o líder...
            </div>
          )}
          <button
            onClick={disconnect}
            className="w-full py-2 border border-dungeon-border text-dungeon-text-dim font-display text-sm
                       hover:border-dungeon-text hover:text-dungeon-text transition-all duration-200"
          >
            🏠 Sair para o Menu
          </button>
        </div>
      </div>
    </div>
  );
}