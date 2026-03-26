import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { SHOP_ITEMS } from "@/data/gameData";
import { Item } from "@/types/game";

// ─── Attribute tooltip content ────────────────────────────────────────────────

const ATTR_INFO: Record<string, { label: string; emoji: string; desc: string }> = {
  attack: {
    label: "Ataque (ATK)",
    emoji: "⚔️",
    desc: "Somado ao dado (1-10) para calcular o dano bruto. Dano = (dado + ATK) × multiplicador_skill − DEF do alvo. Cada +1 ATK equivale a +1 de dano base por golpe.",
  },
  defense: {
    label: "Defesa (DEF)",
    emoji: "🛡️",
    desc: "Subtraída do dano bruto do atacante antes de aplicar a você. DEF não pode bloquear mais que (dano − 1). Mapas com debuff de DEF reduzem este valor proporcionalmente.",
  },
  hp: {
    label: "Vida (HP)",
    emoji: "❤️",
    desc: "Seus pontos de vida. Ao chegar a 0 você é derrotado e não age mais neste mapa. HP máximo cresce +12 a cada level up.",
  },
  mp: {
    label: "Mana (MP)",
    emoji: "💧",
    desc: "Necessária para usar habilidades. Regenera 10% do valor máximo ao fim de cada rodada. Mapas com multiplicador de mana encarecem o custo das skills.",
  },
  initiative: {
    label: "Iniciativa (INIT)",
    emoji: "⚡",
    desc: "Bônus fixo somado ao d20 rolado no início de cada rodada. Quem tira mais alto age primeiro. Classes como Assassino (+4) e Arqueiro (+2) já possuem vantagem natural.",
  },
};

const ITEM_CATEGORIES = [
  { key: "weapon",    label: "⚔️ Armas",     filter: (i: Item) => i.attackBonus > 0 && i.defenseBonus === 0 && i.hpBonus === 0 && i.mpBonus === 0 && !i.initiativeBonus },
  { key: "armor",     label: "🛡️ Armaduras", filter: (i: Item) => i.defenseBonus > 0 && i.attackBonus === 0 && i.hpBonus <= 15 && i.mpBonus === 0 && !i.initiativeBonus },
  { key: "hp",        label: "❤️ HP",         filter: (i: Item) => i.hpBonus > 0 && i.attackBonus === 0 && i.defenseBonus <= 3 && !i.initiativeBonus },
  { key: "mp",        label: "💧 Mana",       filter: (i: Item) => i.mpBonus > 0 && i.attackBonus <= 4 && i.defenseBonus === 0 && i.hpBonus === 0 && !i.initiativeBonus },
  { key: "initiative",label: "⚡ Iniciativa", filter: (i: Item) => !!i.initiativeBonus },
  { key: "hybrid",    label: "✨ Híbridos",   filter: (i: Item) => !i.initiativeBonus && (i.attackBonus > 0 || i.defenseBonus > 0) && (i.hpBonus > 0 || i.mpBonus > 0 || (i.attackBonus > 0 && i.defenseBonus > 0)) },
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
        className="text-dungeon-text-dim hover:text-dungeon-gold text-xs ml-1 leading-none align-middle"
        title="O que é isso?"
      >
        ❓
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-5 w-64 bg-dungeon-surface border border-dungeon-gold/50 rounded p-2 shadow-xl text-xs text-dungeon-text leading-snug">
          <div className="font-display text-dungeon-gold mb-1">{info.emoji} {info.label}</div>
          <div>{info.desc}</div>
          <button onClick={() => setOpen(false)} className="mt-1 text-dungeon-text-dim hover:text-dungeon-text">✕ fechar</button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShopPanel() {
  const { gameState, myPlayerId, buyItem, ready } = useGameStore();
  const [tab, setTab] = useState<"shop" | "inventory" | "stats">("shop");

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

      {/* Tabs */}
      <div className="flex border-b border-dungeon-border bg-dungeon-surface/60">
        {([
          { id: "shop",      label: "🏪 Loja"      },
          { id: "inventory", label: "🎒 Inventário" },
          { id: "stats",     label: "📊 Atributos"  },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 text-xs font-display tracking-widest border-b-2 transition-all
              ${tab === t.id ? "border-dungeon-gold text-dungeon-gold" : "border-transparent text-dungeon-text-dim hover:text-dungeon-text"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-5xl mx-auto">

        {/* ── SHOP TAB ── */}
        {tab === "shop" && (
          <>
            {/* Player stats row */}
            {me && (
              <div className="dungeon-card p-3 mb-4 grid grid-cols-5 gap-3 text-xs font-mono">
                <div className="text-center">
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-0.5">HP <AttrTooltip attrKey="hp" /></div>
                  <div className="text-green-400 font-display">{me.attributes.hp}/{me.attributes.maxHp}</div>
                </div>
                <div className="text-center">
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-0.5">MP <AttrTooltip attrKey="mp" /></div>
                  <div className="text-blue-400 font-display">{me.attributes.mp}/{me.attributes.maxMp}</div>
                </div>
                <div className="text-center">
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-0.5">ATK <AttrTooltip attrKey="attack" /></div>
                  <div className="text-red-400 font-display">{me.attributes.attack}</div>
                </div>
                <div className="text-center">
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-0.5">DEF <AttrTooltip attrKey="defense" /></div>
                  <div className="text-yellow-400 font-display">{me.attributes.defense}</div>
                </div>
                <div className="text-center">
                  <div className="text-dungeon-text-dim flex items-center justify-center gap-0.5">INIT <AttrTooltip attrKey="initiative" /></div>
                  <div className="text-purple-400 font-display">+{me.attributes.initiativeBonus ?? 0}</div>
                </div>
              </div>
            )}

            {/* Items */}
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
                          <div key={item.id} className={`dungeon-card p-3 flex flex-col gap-2 transition-all hover:border-dungeon-gold/50 ${canBuy ? "" : "opacity-60"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-display text-xs text-dungeon-text leading-tight">{item.name}</div>
                                <div className="text-xs text-dungeon-text-dim mt-0.5 leading-tight">{item.description}</div>
                              </div>
                              <div className="text-yellow-400 font-mono text-sm flex-shrink-0">{item.cost}💰</div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.attackBonus   > 0 && <span className="text-xs text-red-400    font-mono bg-red-950/40    px-1 rounded">+{item.attackBonus} ATK</span>}
                              {item.defenseBonus  > 0 && <span className="text-xs text-yellow-400 font-mono bg-yellow-950/40 px-1 rounded">+{item.defenseBonus} DEF</span>}
                              {item.hpBonus       > 0 && <span className="text-xs text-green-400  font-mono bg-green-950/40  px-1 rounded">+{item.hpBonus} HP</span>}
                              {item.mpBonus       > 0 && <span className="text-xs text-blue-400   font-mono bg-blue-950/40   px-1 rounded">+{item.mpBonus} MP</span>}
                              {item.initiativeBonus && item.initiativeBonus > 0 &&
                                <span className="text-xs text-purple-400 font-mono bg-purple-950/40 px-1 rounded">+{item.initiativeBonus} INIT</span>}
                            </div>
                            <button
                              onClick={() => buyItem(item.id)}
                              disabled={!canBuy}
                              className="w-full text-xs py-1 border border-dungeon-gold/60 text-dungeon-gold hover:bg-dungeon-gold hover:text-dungeon-bg transition-all disabled:opacity-40 disabled:cursor-not-allowed font-display"
                            >
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
              <button
                onClick={ready}
                disabled={!!myReady}
                className="px-10 py-3 border-2 border-dungeon-gold text-dungeon-gold font-display text-lg hover:bg-dungeon-gold hover:text-dungeon-bg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed tracking-widest"
              >
                {myReady ? "✅ Pronto! Aguardando..." : "⚔️ Pronto para Batalha!"}
              </button>
            </div>
          </>
        )}

        {/* ── INVENTORY TAB ── */}
        {tab === "inventory" && (
          <div>
            {me && me.inventory.length === 0 && (
              <div className="text-dungeon-text-dim text-center py-10 font-display text-sm">
                Seu inventário está vazio. Compre itens na loja!
              </div>
            )}
            {me && me.inventory.length > 0 && (
              <>
                <div className="text-xs font-display text-dungeon-text-dim tracking-widest uppercase mb-3">
                  🎒 Itens adquiridos por {me.name}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {me.inventory.map((item, idx) => (
                    <div key={item.id + idx} className="dungeon-card p-3 space-y-1.5 border-dungeon-border/80">
                      <div className="font-display text-xs text-dungeon-gold leading-tight">{item.name}</div>
                      <div className="text-xs text-dungeon-text-dim leading-tight">{item.description}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.attackBonus   > 0 && <span className="text-xs text-red-400    font-mono bg-red-950/40    px-1 rounded">+{item.attackBonus} ATK</span>}
                        {item.defenseBonus  > 0 && <span className="text-xs text-yellow-400 font-mono bg-yellow-950/40 px-1 rounded">+{item.defenseBonus} DEF</span>}
                        {item.hpBonus       > 0 && <span className="text-xs text-green-400  font-mono bg-green-950/40  px-1 rounded">+{item.hpBonus} HP</span>}
                        {item.mpBonus       > 0 && <span className="text-xs text-blue-400   font-mono bg-blue-950/40   px-1 rounded">+{item.mpBonus} MP</span>}
                        {item.initiativeBonus && item.initiativeBonus > 0 &&
                          <span className="text-xs text-purple-400 font-mono bg-purple-950/40 px-1 rounded">+{item.initiativeBonus} INIT</span>}
                      </div>
                      <div className="text-xs text-dungeon-text-dim font-mono">Pago: {item.cost} 💰</div>
                    </div>
                  ))}
                </div>

                {/* Summary totals */}
                <div className="dungeon-card p-3 mt-4 border-dungeon-gold/30">
                  <div className="text-xs font-display text-dungeon-gold tracking-widest uppercase mb-2">📈 Bônus acumulados de itens</div>
                  <div className="grid grid-cols-5 gap-2 text-xs font-mono text-center">
                    {[
                      { label: "ATK", value: me.inventory.reduce((s, i) => s + i.attackBonus, 0), color: "text-red-400" },
                      { label: "DEF", value: me.inventory.reduce((s, i) => s + i.defenseBonus, 0), color: "text-yellow-400" },
                      { label: "HP",  value: me.inventory.reduce((s, i) => s + i.hpBonus, 0), color: "text-green-400" },
                      { label: "MP",  value: me.inventory.reduce((s, i) => s + i.mpBonus, 0), color: "text-blue-400" },
                      { label: "INIT",value: me.inventory.reduce((s, i) => s + (i.initiativeBonus ?? 0), 0), color: "text-purple-400" },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div className="text-dungeon-text-dim">{stat.label}</div>
                        <div className={`font-display ${stat.color}`}>+{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div className="space-y-3">
            <div className="text-xs font-display text-dungeon-text-dim tracking-widest uppercase mb-2">
              📊 O que cada atributo faz?
            </div>

            {Object.entries(ATTR_INFO).map(([key, info]) => (
              <div key={key} className="dungeon-card p-3 space-y-1">
                <div className="font-display text-sm text-dungeon-gold">{info.emoji} {info.label}</div>
                <div className="text-xs text-dungeon-text leading-relaxed">{info.desc}</div>
                {me && (
                  <div className="text-xs font-mono text-dungeon-text-dim mt-1">
                    {key === "attack"     && `Seu valor atual: ⚔️ ${me.attributes.attack}`}
                    {key === "defense"    && `Seu valor atual: 🛡️ ${me.attributes.defense}`}
                    {key === "hp"         && `Seu valor atual: ❤️ ${me.attributes.hp}/${me.attributes.maxHp}`}
                    {key === "mp"         && `Seu valor atual: 💧 ${me.attributes.mp}/${me.attributes.maxMp} (regen ${Math.max(1, Math.floor(me.attributes.maxMp * 0.10))}/rodada)`}
                    {key === "initiative" && `Seu valor atual: ⚡ +${me.attributes.initiativeBonus ?? 0} (d20 + ${me.attributes.initiativeBonus ?? 0})`}
                  </div>
                )}
              </div>
            ))}

            <div className="dungeon-card p-3 mt-2 bg-amber-950/20 border-amber-800/40">
              <div className="font-display text-xs text-amber-400 tracking-widest uppercase mb-1">🎲 Fórmula de dano</div>
              <div className="text-xs text-dungeon-text leading-relaxed font-mono">
                dano = (dado (1-10) + ATK + bônus) × mult_skill − DEF_alvo
                <br />
                <span className="text-dungeon-text-dim">— mínimo 1 de dano por golpe</span>
                <br />
                <span className="text-dungeon-text-dim">— DEF com mapa de debuff = DEF × fator (ex: 0.8 = −20%)</span>
                <br />
                <span className="text-dungeon-text-dim">— Pierce (Tiro Perfurante) usa DEF ÷ 2</span>
              </div>
            </div>

            <div className="dungeon-card p-3 bg-blue-950/20 border-blue-800/40">
              <div className="font-display text-xs text-blue-400 tracking-widest uppercase mb-1">💧 Regeneração de Mana</div>
              <div className="text-xs text-dungeon-text leading-relaxed">
                Ao final de cada rodada (após todos agirem), cada jogador vivo recupera automaticamente
                <span className="text-blue-300 font-bold"> 10% do seu MP máximo</span>. 
                Isso é somado aos efeitos de itens, passivas e habilidades de cura.
              </div>
            </div>

            <div className="dungeon-card p-3 bg-purple-950/20 border-purple-800/40">
              <div className="font-display text-xs text-purple-400 tracking-widest uppercase mb-1">⚡ Sistema de Iniciativa</div>
              <div className="text-xs text-dungeon-text leading-relaxed">
                Todo início de rodada todos os combatentes (jogadores + monstros) rolam um d20.
                O bônus de iniciativa é somado ao resultado. Quem tira mais alto age primeiro.
                Empates são desempatados com relançamentos automáticos.
                <br /><span className="text-purple-300 mt-1 block">Assassino base: +4 · Arqueiro base: +2 · Druida base: +1</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
