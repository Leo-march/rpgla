import { useGameStore } from "@/store/gameStore";
import { SHOP_ITEMS } from "@/data/gameData";

const ITEM_CATEGORIES = [
  { key: "weapon", label: "⚔️ Armas", filter: (item: typeof SHOP_ITEMS[0]) => item.attackBonus > 0 && item.defenseBonus === 0 && item.hpBonus === 0 && item.mpBonus === 0 },
  { key: "armor", label: "🛡️ Armaduras", filter: (item: typeof SHOP_ITEMS[0]) => item.defenseBonus > 0 && item.attackBonus === 0 && item.hpBonus <= 15 && item.mpBonus === 0 },
  { key: "hp", label: "❤️ HP", filter: (item: typeof SHOP_ITEMS[0]) => item.hpBonus > 0 && item.attackBonus === 0 && item.defenseBonus <= 3 },
  { key: "mp", label: "💧 Mana", filter: (item: typeof SHOP_ITEMS[0]) => item.mpBonus > 0 && item.attackBonus <= 4 && item.defenseBonus === 0 && item.hpBonus === 0 },
  { key: "hybrid", label: "✨ Híbridos", filter: (item: typeof SHOP_ITEMS[0]) => (item.attackBonus > 0 || item.defenseBonus > 0) && (item.hpBonus > 0 || item.mpBonus > 0 || (item.attackBonus > 0 && item.defenseBonus > 0)) },
];

export default function ShopPanel() {
  const { gameState, myPlayerId, buyItem, ready } = useGameStore();
  if (!gameState) return null;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const myReady = me?.hasActedThisTurn;
  const activePlayers = gameState.players.filter((p) => p.attributes.hp > 0 && p.isConnected);
  const readyCount = activePlayers.filter((p) => p.hasActedThisTurn).length;

  return (
    <div className="min-h-screen dungeon-bg">
      {/* Header */}
      <div className="border-b border-dungeon-border bg-dungeon-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-dungeon-gold tracking-wide">🏪 Loja do Viajante</h2>
          <p className="text-dungeon-text-dim text-xs mt-0.5">Fortaleça seus heróis para os próximos desafios</p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-mono text-xl">💰 {me?.coins ?? 0}</div>
          <div className="text-dungeon-text-dim text-xs mt-0.5">
            Prontos: <span className="text-dungeon-gold font-mono">{readyCount}/{activePlayers.length}</span>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        {/* Player stats summary */}
        {me && (
          <div className="dungeon-card p-3 mb-4 grid grid-cols-4 gap-3 text-xs font-mono">
            <div className="text-center">
              <div className="text-dungeon-text-dim">HP</div>
              <div className="text-green-400 font-display">{me.attributes.hp}/{me.attributes.maxHp}</div>
            </div>
            <div className="text-center">
              <div className="text-dungeon-text-dim">MP</div>
              <div className="text-blue-400 font-display">{me.attributes.mp}/{me.attributes.maxMp}</div>
            </div>
            <div className="text-center">
              <div className="text-dungeon-text-dim">ATK</div>
              <div className="text-red-400 font-display">{me.attributes.attack}</div>
            </div>
            <div className="text-center">
              <div className="text-dungeon-text-dim">DEF</div>
              <div className="text-yellow-400 font-display">{me.attributes.defense}</div>
            </div>
          </div>
        )}

        {/* Items by category */}
        <div className="space-y-4 mb-6">
          {ITEM_CATEGORIES.map(cat => {
            const catItems = SHOP_ITEMS.filter(cat.filter);
            if (catItems.length === 0) return null;
            return (
              <div key={cat.key}>
                <div className="text-xs font-display text-dungeon-text-dim tracking-widest uppercase mb-2 flex items-center gap-2">
                  <span>{cat.label}</span>
                  <div className="flex-1 h-px bg-dungeon-border" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {catItems.map((item) => {
                    const canBuy = (me?.coins ?? 0) >= item.cost && !myReady;
                    return (
                      <div key={item.id} className={`dungeon-card p-3 flex flex-col gap-2 transition-all hover:border-dungeon-gold/50
                        ${canBuy ? "" : "opacity-60"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-display text-xs text-dungeon-text leading-tight">{item.name}</div>
                            <div className="text-xs text-dungeon-text-dim mt-0.5 leading-tight">{item.description}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-yellow-400 font-mono text-sm">{item.cost}💰</div>
                          </div>
                        </div>
                        {/* Stat display */}
                        <div className="flex flex-wrap gap-1">
                          {item.attackBonus > 0 && <span className="text-xs text-red-400 font-mono bg-red-950/40 px-1 rounded">+{item.attackBonus} ATK</span>}
                          {item.defenseBonus > 0 && <span className="text-xs text-yellow-400 font-mono bg-yellow-950/40 px-1 rounded">+{item.defenseBonus} DEF</span>}
                          {item.hpBonus > 0 && <span className="text-xs text-green-400 font-mono bg-green-950/40 px-1 rounded">+{item.hpBonus} HP</span>}
                          {item.mpBonus > 0 && <span className="text-xs text-blue-400 font-mono bg-blue-950/40 px-1 rounded">+{item.mpBonus} MP</span>}
                        </div>
                        <button onClick={() => buyItem(item.id)} disabled={!canBuy}
                          className="w-full text-xs py-1 border border-dungeon-gold/60 text-dungeon-gold hover:bg-dungeon-gold hover:text-dungeon-bg transition-all disabled:opacity-40 disabled:cursor-not-allowed font-display">
                          {(me?.coins ?? 0) < item.cost ? "Sem moedas" : myReady ? "Pronto" : "Comprar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Other players status */}
        <div className="dungeon-card p-3 mb-4">
          <div className="text-xs font-display text-dungeon-text-dim tracking-widest uppercase mb-2">👥 Estado do Grupo</div>
          <div className="flex flex-wrap gap-3">
            {activePlayers.map(p => (
              <div key={p.id} className={`text-xs font-mono flex items-center gap-1.5 ${p.hasActedThisTurn ? "text-green-400" : "text-dungeon-text-dim"}`}>
                <span>{p.hasActedThisTurn ? "✅" : "⏳"}</span>
                <span>{p.name}</span>
                {p.id === myPlayerId && <span className="text-dungeon-gold">(você)</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button onClick={ready} disabled={!!myReady}
            className="px-10 py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-lg hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed tracking-widest">
            {myReady ? "✅ Pronto! Aguardando..." : "⚔️ Pronto para Batalha!"}
          </button>
        </div>
      </div>
    </div>
  );
}