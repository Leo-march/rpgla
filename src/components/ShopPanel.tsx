import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { SHOP_ITEMS } from "@/data/gameData";
import { Item } from "@/types/game";

// ─── Attribute tooltip content ────────────────────────────────────────────────
const ATTR_INFO: Record<string, { label: string; emoji: string; desc: string }> = {
  attack: {
    label: "Ataque (ATK)",
    emoji: "⚔️",
    desc: "Somado ao dado (1-10) para calcular o dano bruto. Dano = (dado + ATK) × multiplicador_skill − DEF do alvo.",
  },
  defense: {
    label: "Defesa (DEF)",
    emoji: "🛡️",
    desc: "Subtraída do dano bruto do atacante antes de aplicar a você.",
  },
  hp: {
    label: "Vida (HP)",
    emoji: "❤️",
    desc: "Seus pontos de vida. Ao chegar a 0 você é derrotado.",
  },
  mp: {
    label: "Mana (MP)",
    emoji: "💧",
    desc: "Necessária para usar habilidades. Regenera 10% do máximo ao fim de cada rodada.",
  },
  initiative: {
    label: "Iniciativa (INIT)",
    emoji: "⚡",
    desc: "Bônus fixo somado ao d20 rolado no início de cada rodada.",
  },
};

const ITEM_CATEGORIES = [
  { key: "weapon",    label: "⚔️ Armas",      filter: (i: Item) => i.attackBonus > 0 },
  { key: "armor",     label: "🛡️ Armaduras",  filter: (i: Item) => i.defenseBonus > 0 },
  { key: "hp",        label: "❤️ HP",         filter: (i: Item) => i.hpBonus > 0 },
  { key: "mp",        label: "💧 Mana",       filter: (i: Item) => i.mpBonus > 0 },
  { key: "initiative",label: "⚡ Iniciativa", filter: (i: Item) => !!i.initiativeBonus },
  { key: "hybrid",    label: "✨ Híbridos",   filter: (i: Item) => 
    (i.attackBonus > 0 || i.defenseBonus > 0) && (i.hpBonus > 0 || i.mpBonus > 0) 
  },
];

// ─── Attribute Info Tooltip ───────────────────────────────────────────────────
function AttrTooltip({ attrKey }: { attrKey: string }) {
  const [open, setOpen] = useState(false);
  const info = ATTR_INFO[attrKey];
  if (!info) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-dungeon-text-dim hover:text-dungeon-gold text-xs ml-1"
        title="O que é isso?"
      >
        ❓
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-6 w-64 bg-dungeon-surface border border-dungeon-gold/50 rounded p-3 shadow-xl text-xs text-dungeon-text leading-snug">
          <div className="font-display text-dungeon-gold mb-1">{info.emoji} {info.label}</div>
          <div>{info.desc}</div>
          <button onClick={() => setOpen(false)} className="mt-2 text-xs text-dungeon-text-dim hover:text-white">✕ Fechar</button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShopPanel() {
  const { gameState, myPlayerId, buyItem, ready } = useGameStore();
  const [tab, setTab] = useState<"shop" | "inventory" | "stats">("shop");
  const [search, setSearch] = useState("");   // ← Agora está no lugar correto!

  if (!gameState) return <div className="p-8 text-center">Carregando loja...</div>;

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const myReady = me?.hasActedThisTurn ?? false;
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

      {/* Tabs */}
      <div className="flex border-b border-dungeon-border bg-dungeon-surface/60">
        {[
          { id: "shop",      label: "🏪 Loja" },
          { id: "inventory", label: "🎒 Inventário" },
          { id: "stats",     label: "📊 Atributos" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-6 py-3 text-sm font-display tracking-widest border-b-2 transition-all flex-1
              ${tab === t.id ? "border-dungeon-gold text-dungeon-gold" : "border-transparent text-dungeon-text-dim hover:text-dungeon-text"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-5xl mx-auto">

        {/* SHOP TAB */}
        {tab === "shop" && (
          <>
            {/* Stats do jogador */}
            {me && (
              <div className="dungeon-card p-4 mb-6 grid grid-cols-5 gap-4 text-center text-sm">
                <div>
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-1">HP <AttrTooltip attrKey="hp" /></div>
                  <div className="text-green-400 font-bold">{me.attributes.hp}/{me.attributes.maxHp}</div>
                </div>
                <div>
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-1">MP <AttrTooltip attrKey="mp" /></div>
                  <div className="text-blue-400 font-bold">{me.attributes.mp}/{me.attributes.maxMp}</div>
                </div>
                <div>
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-1">ATK <AttrTooltip attrKey="attack" /></div>
                  <div className="text-red-400 font-bold">{me.attributes.attack}</div>
                </div>
                <div>
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-1">DEF <AttrTooltip attrKey="defense" /></div>
                  <div className="text-yellow-400 font-bold">{me.attributes.defense}</div>
                </div>
                <div>
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-1">INIT <AttrTooltip attrKey="initiative" /></div>
                  <div className="text-purple-400 font-bold">+{me.attributes.initiativeBonus ?? 0}</div>
                </div>
              </div>
            )}

            {/* Barra de busca */}
            <input
              type="text"
              placeholder="Buscar itens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dungeon-surface border border-dungeon-border rounded-lg px-4 py-3 mb-6 focus:outline-none focus:border-dungeon-gold"
            />

            {/* Categorias de Itens */}
            <div className="space-y-8">
              {ITEM_CATEGORIES.map(cat => {
                const filteredItems = SHOP_ITEMS
                  .filter(cat.filter)
                  .filter(i => 
                    i.name.toLowerCase().includes(search.toLowerCase()) || 
                    i.description.toLowerCase().includes(search.toLowerCase())
                  );

                if (filteredItems.length === 0) return null;

                return (
                  <div key={cat.key}>
                    <div className="text-xs uppercase tracking-widest text-dungeon-text-dim mb-3 flex items-center gap-3">
                      <span>{cat.label}</span>
                      <div className="flex-1 h-px bg-dungeon-border" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredItems.map((item) => {
                        const alreadyBought = me?.purchasedItems?.includes(item.id) ?? false;
                        const canBuy = (me?.coins ?? 0) >= item.cost && !myReady && !alreadyBought;

                        return (
                          <div key={item.id} className={`dungeon-card p-5 flex flex-col transition-all ${canBuy ? 'hover:border-dungeon-gold' : 'opacity-70'}`}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="font-bold text-lg text-white">{item.name}</div>
                                <div className="text-sm text-dungeon-text-dim mt-1">{item.description}</div>
                              </div>
                              <div className="text-yellow-400 font-mono text-xl">{item.cost}💰</div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-5">
                              {item.attackBonus > 0 && <span className="text-red-400 text-xs px-2 py-0.5 bg-red-950/60 rounded">+{item.attackBonus} ATK</span>}
                              {item.defenseBonus > 0 && <span className="text-yellow-400 text-xs px-2 py-0.5 bg-yellow-950/60 rounded">+{item.defenseBonus} DEF</span>}
                              {item.hpBonus > 0 && <span className="text-green-400 text-xs px-2 py-0.5 bg-green-950/60 rounded">+{item.hpBonus} HP</span>}
                              {item.mpBonus > 0 && <span className="text-blue-400 text-xs px-2 py-0.5 bg-blue-950/60 rounded">+{item.mpBonus} MP</span>}
                              {item.initiativeBonus && <span className="text-purple-400 text-xs px-2 py-0.5 bg-purple-950/60 rounded">+{item.initiativeBonus} INIT</span>}
                            </div>

                            <button
                              onClick={() => buyItem(item.id)}
                              disabled={!canBuy}
                              className="mt-auto w-full py-3 text-sm font-display border border-dungeon-gold text-dungeon-gold hover:bg-dungeon-gold hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {alreadyBought ? "✅ Já comprado" : !canBuy ? "Sem moedas" : "COMPRAR"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Estado do Grupo */}
            <div className="dungeon-card p-5 mt-10">
              <div className="uppercase text-xs tracking-widest text-dungeon-text-dim mb-3">👥 Estado do Grupo</div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {activePlayers.map(p => (
                  <div key={p.id} className={`flex items-center gap-2 ${p.hasActedThisTurn ? "text-green-400" : "text-gray-400"}`}>
                    <span>{p.hasActedThisTurn ? "✅" : "⏳"}</span>
                    <span>{p.name} {p.id === myPlayerId && "(você)"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Pronto */}
            <div className="flex justify-center mt-8">
              <button
                onClick={ready}
                disabled={myReady}
                className="px-12 py-4 border-2 border-dungeon-gold text-dungeon-gold font-display text-xl hover:bg-dungeon-gold hover:text-black transition-all disabled:opacity-50"
              >
                {myReady ? "✅ Aguardando os outros..." : "⚔️ PRONTO PARA A BATALHA!"}
              </button>
            </div>
          </>
        )}

        {/* Inventory e Stats mantidos iguais (você pode deixar como estava) */}
        {/* ... (o resto do código de inventory e stats continua igual) */}

      </div>
    </div>
  );
}