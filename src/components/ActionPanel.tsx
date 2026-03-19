import { useState } from "react";
import { Player, Monster, GameState } from "@/types/game";
import { CLASS_DEFINITIONS, COMBO_ACTIONS, findComboForClasses } from "@/data/gameData";
import { useGameStore } from "@/store/gameStore";

interface ActionPanelProps {
  player: Player;
  monsters: Monster[];
  boss: Monster | null;
  mapManaMult: number;
  gameState: GameState;
  selectedTarget: string | null;
  onTargetSelect: (id: string) => void;
}

export default function ActionPanel({
  player, monsters, boss, mapManaMult, gameState, selectedTarget, onTargetSelect,
}: ActionPanelProps) {
  const { performAction } = useGameStore();
  const [showComboPanel, setShowComboPanel] = useState(false);
  const [comboPartnerId, setComboPartnerId] = useState<string | null>(null);

  const cls = CLASS_DEFINITIONS.find((c) => c.id === player.classType)!;
  const allTargets = [...monsters.filter((m) => m.hp > 0), ...(boss && boss.hp > 0 ? [boss] : [])];
  const isDead = player.attributes.hp <= 0;
  const hasActed = player.hasActedThisTurn;

  // Check for pending combo where this player is the partner
  const myPendingCombo = player.pendingComboId
    ? gameState.pendingCombos.find((c) => c.id === player.pendingComboId)
    : null;

  const incomingCombo = gameState.pendingCombos.find(
    (c) => c.partnerId === player.id && !c.partnerReady
  );

  // Allies available for combo
  const allies = gameState.players.filter(
    (p) => p.id !== player.id && p.attributes.hp > 0 && !p.hasActedThisTurn && p.isConnected
  );

  const handleSkill = (skillId: string) => {
    const target = selectedTarget || allTargets[0]?.id;
    performAction("attack", { skillId, targetId: target ?? undefined });
  };

  const handleSkip = () => performAction("skip");

  const handleComboPropose = (partnerId: string, comboActionId: string) => {
    const target = selectedTarget || allTargets[0]?.id;
    performAction("combo_propose", { targetId: target ?? undefined, comboActionId, partnerId });
    setShowComboPanel(false);
  };

  const handleComboAccept = () => {
    if (incomingCombo) {
      performAction("combo_accept");
    }
  };

  const handleComboCancel = () => {
    performAction("combo_cancel");
    setShowComboPanel(false);
    setComboPartnerId(null);
  };

  if (isDead) {
    return (
      <div className="dungeon-card p-4 text-center">
        <span className="text-dungeon-crimson-light font-display text-lg">💀 Você foi derrotado</span>
      </div>
    );
  }

  if (hasActed && !myPendingCombo) {
    return (
      <div className="dungeon-card p-4 text-center">
        <span className="text-dungeon-text-dim font-display text-sm">⏳ Aguardando outros jogadores...</span>
      </div>
    );
  }

  // Show incoming combo request
  if (incomingCombo && !hasActed) {
    const proposer = gameState.players.find((p) => p.id === incomingCombo.proposerId);
    const comboAction = COMBO_ACTIONS.find((c) => c.id === incomingCombo.comboActionId);
    const target = allTargets.find((t) => t.id === incomingCombo.targetId) || allTargets[0];
    const mpCost = Math.floor((comboAction?.mpCostPerPlayer ?? 0) * mapManaMult);
    const canAfford = player.attributes.mp >= mpCost;

    return (
      <div className="dungeon-card p-3 space-y-2 border-purple-600">
        <div className="font-display text-xs text-purple-400 tracking-widest uppercase border-b border-dungeon-border pb-2">
          🤝 Convite de Combo!
        </div>
        <div className="text-sm text-dungeon-text">
          <span className="text-purple-300 font-display">{proposer?.name}</span> propõe:
        </div>
        <div className="p-2 border border-purple-700 rounded bg-purple-900/20">
          <div className="font-display text-sm text-purple-300">
            {comboAction?.emoji} {comboAction?.name}
          </div>
          <div className="text-xs text-dungeon-text-dim mt-0.5">{comboAction?.description}</div>
          <div className="text-xs mt-1">
            <span className={canAfford ? "text-blue-400" : "text-red-400"}>
              💧 {mpCost} MP
            </span>
            <span className="text-dungeon-text-dim ml-2">
              Alvo: {target ? `${target.emoji} ${target.name}` : "primeiro inimigo"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleComboAccept}
            disabled={!canAfford}
            className="flex-1 py-1.5 text-xs border border-purple-500 text-purple-300
                       hover:bg-purple-900/40 disabled:opacity-40 transition-colors font-display"
          >
            ✅ Aceitar Combo
          </button>
          <button
            onClick={handleComboCancel}
            className="flex-1 py-1.5 text-xs border border-dungeon-border text-dungeon-text-dim
                       hover:border-dungeon-crimson hover:text-dungeon-crimson-light transition-colors font-display"
          >
            ❌ Recusar
          </button>
        </div>
      </div>
    );
  }

  // Show awaiting combo partner response
  if (myPendingCombo && myPendingCombo.proposerId === player.id) {
    const partner = gameState.players.find((p) => p.id === myPendingCombo.partnerId);
    const comboAction = COMBO_ACTIONS.find((c) => c.id === myPendingCombo.comboActionId);
    return (
      <div className="dungeon-card p-3 space-y-2 border-purple-600">
        <div className="font-display text-xs text-purple-400 tracking-widest uppercase border-b border-dungeon-border pb-2">
          🤝 Aguardando Parceiro...
        </div>
        <div className="text-sm text-dungeon-text-dim">
          Proposta enviada para <span className="text-purple-300">{partner?.name}</span>:
        </div>
        <div className="text-sm font-display text-purple-300">
          {comboAction?.emoji} {comboAction?.name}
        </div>
        <button
          onClick={handleComboCancel}
          className="w-full py-1.5 text-xs border border-dungeon-border text-dungeon-text-dim
                     hover:border-dungeon-crimson hover:text-dungeon-crimson-light transition-colors"
        >
          Cancelar Combo
        </button>
      </div>
    );
  }

  // Combo partner selection view
  if (showComboPanel) {
    return (
      <div className="dungeon-card p-3 space-y-3">
        <div className="font-display text-xs text-purple-400 tracking-widest uppercase border-b border-dungeon-border pb-2 flex justify-between">
          <span>🤝 Ações de Combo</span>
          <button onClick={() => { setShowComboPanel(false); setComboPartnerId(null); }}
            className="text-dungeon-text-dim hover:text-dungeon-text text-xs">← Voltar</button>
        </div>

        {allies.length === 0 ? (
          <div className="text-dungeon-text-dim text-xs text-center py-2">
            Nenhum aliado disponível para combo.
          </div>
        ) : !comboPartnerId ? (
          <>
            <div className="text-xs text-dungeon-text-dim mb-1">Escolha o parceiro:</div>
            <div className="space-y-1">
              {allies.map((ally) => {
                const combo = findComboForClasses(player.classType, ally.classType);
                if (!combo) return null;
                return (
                  <button
                    key={ally.id}
                    onClick={() => setComboPartnerId(ally.id)}
                    className="w-full text-left p-2 border border-dungeon-border hover:border-purple-500 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {CLASS_DEFINITIONS.find((c) => c.id === ally.classType)?.emoji}
                      </span>
                      <div>
                        <div className="text-sm font-display text-dungeon-text">{ally.name}</div>
                        <div className="text-xs text-purple-300">{combo.emoji} {combo.name}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {allies.every((ally) => !findComboForClasses(player.classType, ally.classType)) && (
                <div className="text-dungeon-text-dim text-xs text-center py-2">
                  Nenhuma combinação disponível com os aliados presentes.
                </div>
              )}
            </div>
          </>
        ) : (
          (() => {
            const partner = gameState.players.find((p) => p.id === comboPartnerId)!;
            const combo = findComboForClasses(player.classType, partner.classType)!;
            const mpCost = Math.floor(combo.mpCostPerPlayer * mapManaMult);
            const canAfford = player.attributes.mp >= mpCost;
            const target = selectedTarget
              ? allTargets.find((t) => t.id === selectedTarget)
              : allTargets[0];

            return (
              <div className="space-y-2">
                <div className="text-xs text-dungeon-text-dim">
                  Parceiro: <span className="text-purple-300">{partner.name}</span>
                </div>
                <div className="p-2 border border-purple-700 rounded bg-purple-900/20">
                  <div className="font-display text-sm text-purple-300">
                    {combo.emoji} {combo.name}
                  </div>
                  <div className="text-xs text-dungeon-text-dim mt-0.5">{combo.description}</div>
                  <div className="flex gap-3 mt-1 text-xs font-mono">
                    <span className={canAfford ? "text-blue-400" : "text-red-400"}>
                      💧 {mpCost} MP cada
                    </span>
                    <span className="text-yellow-400">×{combo.damageMultiplier} dano</span>
                  </div>
                </div>
                {target && (
                  <div className="text-xs text-dungeon-text-dim">
                    Alvo: <span className="text-dungeon-text">{target.emoji} {target.name}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleComboPropose(comboPartnerId, combo.id)}
                    disabled={!canAfford || allTargets.length === 0}
                    className="flex-1 py-1.5 text-xs border border-purple-500 text-purple-300
                               hover:bg-purple-900/40 disabled:opacity-40 transition-colors font-display"
                  >
                    🤝 Propor Combo
                  </button>
                  <button
                    onClick={() => setComboPartnerId(null)}
                    className="px-3 py-1.5 text-xs border border-dungeon-border text-dungeon-text-dim
                               hover:border-dungeon-text transition-colors"
                  >
                    ←
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </div>
    );
  }

  // Normal action panel
  return (
    <div className="dungeon-card p-3 space-y-3">
      <div className="font-display text-xs text-dungeon-gold tracking-widest uppercase border-b border-dungeon-border pb-2">
        🎯 Suas Ações
      </div>

      {/* Skills */}
      <div className="grid grid-cols-2 gap-2">
        {cls.skills.map((skill) => {
          const cost = Math.floor(skill.mpCost * mapManaMult);
          const canAfford = player.attributes.mp >= cost;

          return (
            <button
              key={skill.id}
              onClick={() => handleSkill(skill.id)}
              disabled={!canAfford || allTargets.length === 0}
              title={skill.description}
              className={`text-left p-2 border rounded transition-all duration-150
                ${skill.isSpecial
                  ? "border-purple-700 hover:border-purple-400 hover:bg-purple-900/30 disabled:opacity-40"
                  : "border-dungeon-border hover:border-dungeon-gold hover:bg-dungeon-surface disabled:opacity-40"}
                ${!canAfford ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className={`text-xs font-display leading-tight
                ${skill.isSpecial ? "text-purple-300" : "text-dungeon-text"}`}>
                {skill.isSpecial ? "⭐ " : ""}{skill.name}
              </div>
              <div className="text-xs font-mono mt-0.5">
                {cost > 0 ? (
                  <span className={canAfford ? "text-blue-400" : "text-red-400"}>
                    💧 {cost} MP
                  </span>
                ) : (
                  <span className="text-dungeon-text-dim">Grátis</span>
                )}
                <span className="text-dungeon-text-dim ml-1">×{skill.damageMultiplier}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {/* Combo button — only show if there are valid combo partners */}
        {allies.some((ally) => findComboForClasses(player.classType, ally.classType)) && (
          <button
            onClick={() => setShowComboPanel(true)}
            className="flex-1 text-xs py-1.5 border border-purple-700 text-purple-300
                       hover:border-purple-400 hover:bg-purple-900/20 transition-colors font-display"
          >
            🤝 Combo
          </button>
        )}

        <button
          onClick={handleSkip}
          className="flex-1 text-xs py-1.5 border border-dungeon-border text-dungeon-text-dim
                     hover:border-dungeon-text hover:text-dungeon-text transition-colors"
        >
          Passar Turno
        </button>
      </div>
    </div>
  );
}