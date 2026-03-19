import { useGameStore } from "@/store/gameStore";

export function VictoryScreen() {
  const { gameState, disconnect } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="min-h-screen dungeon-bg flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="text-8xl mb-4 animate-bounce">🏆</div>
        <h1 className="font-display text-5xl text-dungeon-gold mb-2 tracking-wide">VITÓRIA!</h1>
        <p className="text-dungeon-text text-lg font-body mb-6">
          O grupo conquistou o mapa e derrotou todos os inimigos!
        </p>

        <div className="dungeon-card p-4 mb-6">
          <h3 className="font-display text-dungeon-gold text-sm tracking-widest uppercase mb-3">
            🌟 Classe(s) Desbloqueadas
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {gameState.unlockedClasses.map((cls) => (
              <span key={cls} className="text-xs border border-dungeon-gold text-dungeon-gold px-2 py-1 font-display">
                {cls}
              </span>
            ))}
          </div>
        </div>

        <div className="dungeon-card p-4 mb-6">
          <h3 className="font-display text-dungeon-gold text-sm tracking-widest uppercase mb-3">
            👥 Sobreviventes
          </h3>
          {gameState.players.filter((p) => p.attributes.hp > 0).map((p) => (
            <div key={p.id} className="text-dungeon-text text-sm font-body mb-1">
              {p.name} · Lv.{p.level} · {p.attributes.hp} HP restante
            </div>
          ))}
        </div>

        <button
          onClick={disconnect}
          className="px-8 py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-lg
                     hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200"
        >
          🏠 Menu Principal
        </button>
      </div>
    </div>
  );
}

export function GameOverScreen() {
  const { disconnect } = useGameStore();

  return (
    <div className="min-h-screen dungeon-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-4">💀</div>
        <h1 className="font-display text-5xl text-dungeon-crimson-light mb-2 tracking-wide">
          GAME OVER
        </h1>
        <p className="text-dungeon-text-dim text-lg font-body mb-8">
          O grupo foi aniquilado nas profundezas da masmorra.
        </p>
        <button
          onClick={disconnect}
          className="px-8 py-3 border-2 border-dungeon-crimson-light text-dungeon-crimson-light font-display text-lg
                     hover:bg-dungeon-crimson hover:text-white transition-all duration-200"
        >
          🔄 Tentar Novamente
        </button>
      </div>
    </div>
  );
}
