import { useGameStore } from "@/store/gameStore";
import { SHOP_ITEMS } from "@/data/gameData";

export default function ShopPanel() {
  const { gameState, myPlayerId, buyItem, ready } = useGameStore();
  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const myReady = me?.hasActedThisTurn;
  const activePlayers = gameState.players.filter((p) => p.attributes.hp > 0 && p.isConnected);
  const readyCount = activePlayers.filter((p) => p.hasActedThisTurn).length;

  return (
    <div className="min-h-screen dungeon-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <h2 className="font-display text-3xl text-dungeon-gold mb-1">🏪 Loja do Viajante</h2>
          <p className="text-dungeon-text-dim text-sm">
            Suas moedas: <span className="text-yellow-400 font-mono">{me?.coins ?? 0} 💰</span>
          </p>
          <p className="text-dungeon-text-dim text-xs mt-1">
            Prontos: {readyCount}/{activePlayers.length}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {SHOP_ITEMS.map((item) => (
            <div key={item.id} className="dungeon-card p-3 flex justify-between items-start">
              <div>
                <div className="font-display text-sm text-dungeon-text">{item.name}</div>
                <div className="text-xs text-dungeon-text-dim mt-0.5">{item.description}</div>
                {item.attackBonus > 0 && (
                  <span className="text-xs text-green-400 mr-2">+{item.attackBonus} ATK</span>
                )}
                {item.defenseBonus > 0 && (
                  <span className="text-xs text-blue-400 mr-2">+{item.defenseBonus} DEF</span>
                )}
                {item.hpBonus > 0 && (
                  <span className="text-xs text-red-400 mr-2">+{item.hpBonus} HP</span>
                )}
                {item.mpBonus > 0 && (
                  <span className="text-xs text-indigo-400">+{item.mpBonus} MP</span>
                )}
              </div>
              <div className="text-right ml-3">
                <div className="text-yellow-400 font-mono text-sm">{item.cost}💰</div>
                <button
                  onClick={() => buyItem(item.id)}
                  disabled={(me?.coins ?? 0) < item.cost || !!myReady}
                  className="mt-1 text-xs px-3 py-1 border border-dungeon-gold text-dungeon-gold
                             hover:bg-dungeon-gold hover:text-dungeon-bg transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={ready}
            disabled={!!myReady}
            className="px-8 py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-lg
                       hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {myReady ? "✅ Pronto! Aguardando..." : "⚔️ Pronto para Batalha!"}
          </button>
        </div>
      </div>
    </div>
  );
}