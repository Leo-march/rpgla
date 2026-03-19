import {
  GameState, Player, Monster, ClassType, MapId,
  CombatEntry, ActionType, Item, StatusEffect, PendingCombo, InitiativeEntry,
} from "@/types/game";
import {
  CLASS_DEFINITIONS, MAP_DEFINITIONS, SHOP_ITEMS,
  MONSTER_POOLS, BOSSES, XP_TO_NEXT_LEVEL, COMBO_ACTIONS, findComboForClasses,
} from "@/data/gameData";
import { nanoid } from "nanoid";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const rollD20 = () => Math.floor(Math.random() * 20) + 1;
export const rollDice = () => Math.floor(Math.random() * 10) + 1;

const logEntry = (
  message: string,
  type: CombatEntry["type"] = "system"
): CombatEntry => ({ id: nanoid(), timestamp: Date.now(), message, type });

const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

// ─── Initiative System ────────────────────────────────────────────────────────

export function rollInitiative(state: GameState): { state: GameState; newEntries: CombatEntry[] } {
  const log: CombatEntry[] = [];
  const entries: InitiativeEntry[] = [];

  // Roll for each alive player
  const activePlayers = state.players.filter(p => p.attributes.hp > 0 && p.isConnected);
  
  // Roll for monsters (group roll — one roll per monster group / individual)
  const allMonsters = [
    ...state.monsters.filter(m => m.hp > 0),
    ...(state.currentBoss && state.currentBoss.hp > 0 ? [state.currentBoss] : []),
  ];

  // Collect all rolls first to detect ties
  const playerRolls: { id: string; name: string; roll: number }[] = [];
  const monsterRolls: { id: string; name: string; roll: number }[] = [];

  activePlayers.forEach(p => {
    playerRolls.push({ id: p.id, name: p.name, roll: rollD20() });
  });

  allMonsters.forEach(m => {
    monsterRolls.push({ id: m.id, name: m.name, roll: rollD20() });
  });

  // Detect ties — reroll tied values among players or between player/monster
  const resolveTies = (rolls: { id: string; name: string; roll: number }[]) => {
    let hasAnyTie = true;
    let rerollCount = 0;
    while (hasAnyTie && rerollCount < 10) {
      hasAnyTie = false;
      const seen: Record<number, string[]> = {};
      rolls.forEach(r => {
        if (!seen[r.roll]) seen[r.roll] = [];
        seen[r.roll].push(r.id);
      });
      Object.values(seen).forEach(ids => {
        if (ids.length > 1) {
          hasAnyTie = true;
          ids.forEach(id => {
            const entry = rolls.find(r => r.id === id)!;
            const newRoll = rollD20();
            log.push(logEntry(`🎲 Empate! ${entry.name} relança e tira ${newRoll}`, "initiative"));
            entry.roll = newRoll;
          });
        }
      });
      rerollCount++;
    }
  };

  // Combine all and resolve ties globally
  const allRolls = [...playerRolls, ...monsterRolls];
  resolveTies(allRolls);

  log.push(logEntry(`⚔️ ─── ORDEM DE INICIATIVA (Rodada ${state.turnNumber + 1}) ───`, "initiative"));

  allRolls.forEach(r => {
    const isPlayer = activePlayers.some(p => p.id === r.id);
    const entity = isPlayer ? activePlayers.find(p => p.id === r.id)! : allMonsters.find(m => m.id === r.id)!;
    entries.push({
      id: r.id,
      name: r.name,
      roll: r.roll,
      isPlayer,
      isMonster: !isPlayer,
      acted: false,
    });
    log.push(logEntry(`  🎲 ${isPlayer ? "👤" : "👹"} ${r.name}: ${r.roll}`, "initiative"));

    // Save roll on the entity
    if (isPlayer) {
      const p = state.players.find(p => p.id === r.id)!;
      p.initiativeRoll = r.roll;
    } else {
      const m = allMonsters.find(m => m.id === r.id)!;
      m.initiativeRoll = r.roll;
    }
  });

  // Sort descending (highest roll acts first)
  entries.sort((a, b) => b.roll - a.roll);

  state.initiativeOrder = entries;
  state.currentInitiativeIndex = 0;
  state.initiativeRolled = true;
  state.turnPhase = "player_actions";

  // Reset hasActedThisTurn
  state.players.forEach(p => { p.hasActedThisTurn = false; p.pendingComboId = undefined; });
  state.pendingCombos = [];

  log.push(logEntry(`📋 Ordem: ${entries.map(e => `${e.isPlayer ? "👤" : "👹"}${e.name}(${e.roll})`).join(" → ")}`, "initiative"));

  return { state, newEntries: log };
}

// ─── Advance Initiative ───────────────────────────────────────────────────────

export function getNextActorInInitiative(state: GameState): InitiativeEntry | null {
  for (let i = 0; i < state.initiativeOrder.length; i++) {
    const entry = state.initiativeOrder[i];
    if (entry.acted) continue;
    if (entry.isPlayer) {
      const player = state.players.find(p => p.id === entry.id);
      if (!player || player.attributes.hp <= 0 || !player.isConnected) {
        entry.acted = true;
        continue;
      }
    } else {
      const monster = [...state.monsters, ...(state.currentBoss ? [state.currentBoss] : [])].find(m => m.id === entry.id);
      if (!monster || monster.hp <= 0) {
        entry.acted = true;
        continue;
      }
    }
    return entry;
  }
  return null;
}

export function isRoundComplete(state: GameState): boolean {
  // Round is complete only when ALL actors have acted
  return state.initiativeOrder.every(e => e.acted) || getNextActorInInitiative(state) === null;
}

// ─── Player Factory ───────────────────────────────────────────────────────────

export function createPlayer(socketId: string, name: string, classType: ClassType): Player {
  const cls = CLASS_DEFINITIONS.find((c) => c.id === classType)!;
  const base = cls.baseAttributes;
  return {
    id: socketId, name, classType,
    attributes: { hp: base.hp, maxHp: base.maxHp, mp: base.mp, maxMp: base.maxMp, attack: base.attack, defense: base.defense },
    level: 1, xp: 0, xpToNext: XP_TO_NEXT_LEVEL(1),
    inventory: [], coins: 0, statusEffects: [],
    hasActedThisTurn: false, isConnected: true,
    summonActive: false, summonTurnsLeft: 0,
    pendingComboId: undefined, initiativeRoll: undefined,
  };
}

// ─── Initial Game State ───────────────────────────────────────────────────────

export function createInitialGameState(roomId: string): GameState {
  return {
    roomId, phase: "lobby", currentMap: null,
    players: [], monsters: [], currentBoss: null,
    bossDefeated: { forest: false, dungeon: false, abyss: false, volcano: false, cemetery: false, ice_castle: false, void: false },
    unlockedClasses: ["warrior", "mage", "ranger", "necromancer", "paladin", "assassin", "druida", "berserker"],
    sharedCoins: 0, shopItems: SHOP_ITEMS,
    combatLog: [logEntry("⚔️ Aventureiros chegaram à taverna. Aguardando grupo...", "system")],
    turnNumber: 0, turnPhase: "initiative_roll",
    currentPlayerTurnIndex: 0, roundWinner: null,
    pendingCombos: [], initiativeOrder: [],
    currentInitiativeIndex: 0, initiativeRolled: false,
  };
}

// ─── Map Spawn ────────────────────────────────────────────────────────────────

export function spawnMonstersForMap(mapId: MapId): Monster[] {
  const pool = MONSTER_POOLS[mapId];
  const count = Math.floor(Math.random() * 2) + 2;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((m) => ({ ...m, id: nanoid(), hp: m.maxHp }));
}

// ─── Damage Calculation (Escalonado) ─────────────────────────────────────────

export function calculateDamage(
  attackerAttack: number,
  diceResult: number,      // 1-10
  targetDefense: number,
  multiplier = 1.0,
  piercing = false
): number {
  const effectiveDefense = piercing ? Math.floor(targetDefense / 2) : targetDefense;
  // Scale: raw = (attack + dice) * multiplier - defense
  const raw = Math.floor((diceResult + attackerAttack) * multiplier) - effectiveDefense;
  return Math.max(1, raw);
}

// ─── Status Effect Tick ───────────────────────────────────────────────────────

export function tickStatusEffects(entity: Player | Monster, log: CombatEntry[], isPlayer: boolean): void {
  if (!("statusEffects" in entity)) return;
  const p = entity as Player;

  // Apply DoT
  p.statusEffects.forEach(se => {
    if (se.damagePerTurn && se.damagePerTurn > 0) {
      p.attributes.hp = Math.max(0, p.attributes.hp - se.damagePerTurn);
      log.push(logEntry(`☠️ ${p.name} sofre ${se.damagePerTurn} de dano de ${se.name}!`, "system"));
    }
  });

  p.statusEffects = p.statusEffects
    .map((se) => ({ ...se, turnsLeft: se.turnsLeft - 1 }))
    .filter((se) => {
      if (se.turnsLeft <= 0) {
        log.push(logEntry(`${p.name}: efeito "${se.name}" expirou.`, "system"));
        return false;
      }
      return true;
    });

  if (isPlayer && p.summonActive) {
    p.summonTurnsLeft--;
    if (p.summonTurnsLeft <= 0) {
      p.summonActive = false;
      log.push(logEntry(`${p.name}: invocação expirou.`, "system"));
    }
  }

  // Druid passive: regenerate 4 HP per turn
  if (isPlayer && p.classType === "druida" && p.attributes.hp > 0) {
    p.attributes.hp = clamp(p.attributes.hp + 4, 0, p.attributes.maxHp);
    log.push(logEntry(`🌿 ${p.name} regenerou 4 HP (Regeneração)`, "special"));
  }

  // Paladin passive: heal 6 HP to all allies
  if (isPlayer && p.classType === "paladin" && p.attributes.hp > 0) {
    // handled in processMonsterTurn for all players
  }
}

// ─── Level Up ────────────────────────────────────────────────────────────────

export function checkLevelUp(player: Player, log: CombatEntry[]): void {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = XP_TO_NEXT_LEVEL(player.level);
    player.attributes.maxHp += 12;
    player.attributes.hp = clamp(player.attributes.hp + 12, 0, player.attributes.maxHp);
    player.attributes.maxMp += 6;
    player.attributes.mp = clamp(player.attributes.mp + 5, 0, player.attributes.maxMp);
    player.attributes.attack += 1;
    log.push(logEntry(`🌟 ${player.name} subiu para Nv.${player.level}! +12 HP, +6 MP, +1 ATK`, "level_up"));
  }
}

// ─── Monster Death Handler ────────────────────────────────────────────────────

function handleMonsterDeath(state: GameState, target: Monster, log: CombatEntry[]): void {
  log.push(logEntry(`💀 ${target.name} foi derrotado!`, "system"));
  const alivePlayers = state.players.filter((p) => p.attributes.hp > 0);
  const xpGain = Math.floor(target.xpReward / Math.max(1, alivePlayers.length));
  const coinsGain = target.coinReward;

  alivePlayers.forEach((p) => {
    p.xp += xpGain;
    p.coins += coinsGain;
    checkLevelUp(p, log);
  });
  log.push(logEntry(`💰 +${coinsGain} moedas para cada herói!`, "system"));

  // Mark initiative entry as acted (dead)
  const initEntry = state.initiativeOrder.find(e => e.id === target.id);
  if (initEntry) initEntry.acted = true;

  if (state.currentBoss && target.id === state.currentBoss.id) {
    state.currentBoss = null;
    state.bossDefeated[state.currentMap!] = true;
  } else {
    state.monsters = state.monsters.filter((m) => m.id !== target.id);
  }
}

// ─── Apply Skill Effects ──────────────────────────────────────────────────────

function applySkillEffects(
  state: GameState, player: Player, target: Monster,
  effectKey: string | undefined, damage: number, log: CombatEntry[]
): void {
  const allMonsters = [...state.monsters, ...(state.currentBoss ? [state.currentBoss] : [])];

  if (["aoe", "aoe_fire", "aoe_cover", "aoe_arcane", "aoe_chaos", "aoe_holy_heal", "aoe_poison"].includes(effectKey ?? "")) {
    allMonsters.filter((m) => m.id !== target.id && m.hp > 0).forEach((m) => {
      const splashDmg = Math.floor(damage * 0.6);
      m.hp = Math.max(0, m.hp - splashDmg);
      log.push(logEntry(`  ↳ Dano em área: ${m.name} recebe ${splashDmg}! (${m.hp}/${m.maxHp} HP)`, "player_attack"));
      if (m.hp <= 0) handleMonsterDeath(state, m, log);
    });
  }

  if (effectKey === "aoe_poison") {
    allMonsters.filter((m) => m.hp > 0).forEach((m) => {
      log.push(logEntry(`  ↳ ${m.name} está envenenado!`, "special"));
    });
  }

  if (effectKey === "poison") {
    log.push(logEntry(`  ↳ ${target.name} foi envenenado! (3 turnos)`, "special"));
  }

  if (effectKey === "lifesteal" || effectKey === "group_lifesteal") {
    const healAmt = effectKey === "group_lifesteal" ? Math.floor(damage * 0.5) : Math.floor(damage * 0.35);
    if (effectKey === "group_lifesteal") {
      state.players.filter(p => p.attributes.hp > 0).forEach(p => {
        p.attributes.hp = clamp(p.attributes.hp + healAmt, 0, p.attributes.maxHp);
      });
      log.push(logEntry(`  ↳ O grupo absorveu ${healAmt} HP cada!`, "player_attack"));
    } else {
      player.attributes.hp = clamp(player.attributes.hp + healAmt, 0, player.attributes.maxHp);
      log.push(logEntry(`  ↳ ${player.name} absorveu ${healAmt} HP!`, "player_attack"));
    }
  }

  if (effectKey === "heal_ally") {
    const lowestHpAlly = state.players
      .filter(p => p.attributes.hp > 0)
      .sort((a, b) => (a.attributes.hp / a.attributes.maxHp) - (b.attributes.hp / b.attributes.maxHp))[0];
    if (lowestHpAlly) {
      lowestHpAlly.attributes.hp = clamp(lowestHpAlly.attributes.hp + 25, 0, lowestHpAlly.attributes.maxHp);
      log.push(logEntry(`✨ ${player.name} curou ${lowestHpAlly.name} em 25 HP!`, "player_attack"));
    }
  }

  if (effectKey === "heal_all") {
    const healAmt = 20;
    state.players.filter(p => p.attributes.hp > 0).forEach(p => {
      p.attributes.hp = clamp(p.attributes.hp + healAmt, 0, p.attributes.maxHp);
    });
    log.push(logEntry(`🌿 ${player.name} curou todo o grupo em ${healAmt} HP!`, "special"));
  }

  if (effectKey === "heal_on_hit") {
    const healAmt = Math.floor(damage * 0.3);
    state.players.filter(p => p.attributes.hp > 0).forEach(p => {
      p.attributes.hp = clamp(p.attributes.hp + healAmt, 0, p.attributes.maxHp);
    });
    log.push(logEntry(`  ↳ Cura do grupo: +${healAmt} HP!`, "special"));
  }

  if (effectKey === "aoe_holy_heal") {
    const healAmt = Math.floor(damage * 0.4);
    state.players.filter(p => p.attributes.hp > 0).forEach(p => {
      p.attributes.hp = clamp(p.attributes.hp + healAmt, 0, p.attributes.maxHp);
    });
    log.push(logEntry(`  ↳ Nova sagrada! Grupo recuperou ${healAmt} HP!`, "special"));
  }

  if (effectKey === "holy_shot_heal") {
    player.attributes.hp = clamp(player.attributes.hp + Math.floor(damage * 0.4), 0, player.attributes.maxHp);
    log.push(logEntry(`  ↳ ${player.name} se curou com o tiro abençoado!`, "special"));
  }

  if (effectKey === "group_shield") {
    state.players.forEach(p => {
      if (p.attributes.hp > 0) {
        p.statusEffects.push({ id: nanoid(), name: "Escudo Divino", turnsLeft: 1, defenseBonus: 999 });
        p.attributes.hp = clamp(p.attributes.hp + 15, 0, p.attributes.maxHp);
      }
    });
    log.push(logEntry(`🛡️ Escudo Divino protege o grupo por 1 turno! +15 HP!`, "special"));
  }

  if ((effectKey === "execute" || effectKey === "phase_strike") && target.hp < target.maxHp * 0.30) {
    target.hp = 0;
    log.push(logEntry(`☠️ Execução! ${target.name} foi eliminado instantaneamente!`, "special"));
  }

  if (effectKey === "execute_50" && target.hp < target.maxHp * 0.5) {
    target.hp = 0;
    log.push(logEntry(`⚖️ Julgamento Divino! ${target.name} foi executado!`, "special"));
  }

  if (effectKey === "berserker") {
    player.attributes.mp = 0;
    player.statusEffects.push({ id: nanoid(), name: "Fúria Berserker", turnsLeft: 3, attackBonus: 12 });
    log.push(logEntry(`😡 ${player.name} entra em FÚRIA! +12 ATK por 3 turnos!`, "special"));
  }

  if (effectKey === "summon" && player.classType === "necromancer") {
    player.summonActive = true;
    player.summonTurnsLeft = 3;
    log.push(logEntry(`💀 Exército de esqueletos invocado! +5 dano por 3 turnos!`, "special"));
  }

  if (effectKey === "evasion") {
    player.statusEffects.push({ id: nanoid(), name: "Evasão", turnsLeft: 2, defenseBonus: 10 });
    log.push(logEntry(`🌑 ${player.name} se funde às sombras! +10 DEF por 2 turnos.`, "special"));
  }

  if (effectKey === "multi_hit") {
    const extraHit = Math.floor(damage * 0.6);
    target.hp = Math.max(0, target.hp - extraHit);
    log.push(logEntry(`  ↳ Golpe extra! ${target.name} recebe mais ${extraHit}!`, "special"));
  }

  if (effectKey === "double_hit") {
    const secondHit = Math.floor(damage * 0.8);
    target.hp = Math.max(0, target.hp - secondHit);
    log.push(logEntry(`  ↳ Segundo golpe! +${secondHit} de dano!`, "special"));
  }

  if (effectKey === "group_attack_up") {
    state.players.filter(p => p.attributes.hp > 0).forEach(p => {
      p.statusEffects.push({ id: nanoid(), name: "Grito de Guerra", turnsLeft: 2, attackBonus: 5 });
    });
    log.push(logEntry(`🪓 Grito de Guerra! Todo o grupo +5 ATK por 2 turnos!`, "special"));
  }

  if (effectKey === "rampage") {
    const missingHp = player.attributes.maxHp - player.attributes.hp;
    const bonus = Math.floor(missingHp * 0.15);
    if (bonus > 0) {
      target.hp = Math.max(0, target.hp - bonus);
      log.push(logEntry(`  ↳ Carnificina! Bônus de ${bonus} dano pela fúria!`, "special"));
    }
    player.statusEffects.push({ id: nanoid(), name: "Atordoado", turnsLeft: 0, defenseBonus: 0 }); // stun target
  }

  if (effectKey === "guaranteed_crit") {
    log.push(logEntry(`  ↳ 💥 CRÍTICO GARANTIDO!`, "special"));
  }

  if (effectKey === "teleport_strike") {
    log.push(logEntry(`  ↳ 🌀 Teletransporte! Dano ignora toda defesa!`, "special"));
  }

  if (effectKey === "defense_down") {
    // Already handled via damage multiplier
    log.push(logEntry(`  ↳ Defesa de ${target.name} foi reduzida!`, "special"));
  }
}

// ─── Single Monster Attack ────────────────────────────────────────────────────

export function processSingleMonsterAttack(
  state: GameState,
  monster: Monster,
  log: CombatEntry[]
): void {
  const alivePlayers = state.players.filter(p => p.attributes.hp > 0);
  if (alivePlayers.length === 0) return;

  const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
  const mapDef = MAP_DEFINITIONS.find(m => m.id === state.currentMap)!;
  const defMult = mapDef?.defenseDebuff ?? 1;

  const shieldEffect = target.statusEffects.find(se => se.name === "Escudo Divino");
  if (shieldEffect) {
    log.push(logEntry(`🛡️ Escudo Divino absorveu o ataque de ${monster.name}!`, "system"));
    return;
  }

  const dice = rollDice();
  const effectiveDefense = Math.floor(
    (target.attributes.defense + target.statusEffects.reduce((sum, se) => sum + (se.defenseBonus ?? 0), 0)) * defMult
  );
  const damage = calculateDamage(monster.attack, dice, effectiveDefense);
  target.attributes.hp = Math.max(0, target.attributes.hp - damage);

  log.push(logEntry(
    `👹 ${monster.name} atacou ${target.name} → Dado: ${dice} → ${damage} dano! (${target.attributes.hp}/${target.attributes.maxHp} HP)`,
    "monster_attack"
  ));

  if (target.attributes.hp <= 0) {
    log.push(logEntry(`💔 ${target.name} foi derrotado!`, "monster_attack"));
  }

  // Berserker passive: gain ATK when hit
  if (target.classType === "berserker" && damage > 0 && target.attributes.hp > 0) {
    const currentBonus = target.statusEffects.filter(se => se.name === "Ira do Sangue").reduce((s, se) => s + (se.attackBonus ?? 0), 0);
    if (currentBonus < 20) {
      const gainAtk = Math.min(2, 20 - currentBonus);
      target.statusEffects.push({ id: nanoid(), name: "Ira do Sangue", turnsLeft: 999, attackBonus: gainAtk });
      log.push(logEntry(`🪓 ${target.name} fica mais forte! +${gainAtk} ATK (Ira do Sangue)`, "special"));
    }
  }
}

// ─── Player Action ────────────────────────────────────────────────────────────

export function processPlayerAction(
  state: GameState, playerId: string, actionType: ActionType,
  opts: { skillId?: string; targetId?: string; itemId?: string; comboActionId?: string; partnerId?: string } = {}
): { state: GameState; newEntries: CombatEntry[] } {
  const { skillId, targetId, itemId, comboActionId, partnerId } = opts;
  const log: CombatEntry[] = [];
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.hasActedThisTurn) return { state, newEntries: [] };

  const mapDef = MAP_DEFINITIONS.find(m => m.id === state.currentMap)!;
  const manaMult = mapDef?.manaCostMultiplier ?? 1;

  const allMonsters = [...state.monsters, ...(state.currentBoss ? [state.currentBoss] : [])];
  const target = targetId
    ? allMonsters.find(m => m.id === targetId && m.hp > 0)
    : allMonsters.find(m => m.hp > 0);

  // ── Combo Propose ──────────────────────────────────────────────────────────
  if (actionType === "combo_propose" && comboActionId && partnerId) {
    const partner = state.players.find(p => p.id === partnerId && p.attributes.hp > 0 && !p.hasActedThisTurn);
    if (!partner) { log.push(logEntry(`❌ Parceiro inválido!`, "system")); return { state, newEntries: log }; }
    const comboAction = COMBO_ACTIONS.find(c => c.id === comboActionId);
    if (!comboAction) return { state, newEntries: log };

    const classes = [player.classType, partner.classType];
    if (!(classes.includes(comboAction.requiredClasses[0]) && classes.includes(comboAction.requiredClasses[1]))) {
      log.push(logEntry(`❌ Classes incompatíveis!`, "system")); return { state, newEntries: log };
    }

    const mpCost = Math.floor(comboAction.mpCostPerPlayer * manaMult);
    if (player.attributes.mp < mpCost) {
      log.push(logEntry(`❌ Mana insuficiente!`, "system")); return { state, newEntries: log };
    }

    state.pendingCombos = state.pendingCombos.filter(c => c.proposerId !== playerId && c.partnerId !== playerId);
    const newCombo: PendingCombo = {
      id: nanoid(), proposerId: playerId, partnerId, comboActionId,
      targetId, proposerReady: true, partnerReady: false,
      expiresAt: Date.now() + 60000,
    };
    state.pendingCombos.push(newCombo);
    player.pendingComboId = newCombo.id;
    log.push(logEntry(`🤝 ${player.name} propõe "${comboAction.name}" com ${partner.name}!`, "combo"));
    return { state, newEntries: log };
  }

  // ── Combo Accept ───────────────────────────────────────────────────────────
  if (actionType === "combo_accept") {
    const pendingCombo = state.pendingCombos.find(c => c.partnerId === playerId && !c.partnerReady);
    if (!pendingCombo) { log.push(logEntry(`❌ Nenhum combo pendente!`, "system")); return { state, newEntries: log }; }

    const proposer = state.players.find(p => p.id === pendingCombo.proposerId);
    if (!proposer) return { state, newEntries: log };

    const comboAction = COMBO_ACTIONS.find(c => c.id === pendingCombo.comboActionId)!;
    const mpCost = Math.floor(comboAction.mpCostPerPlayer * manaMult);

    if (player.attributes.mp < mpCost) {
      log.push(logEntry(`❌ Mana insuficiente para o combo!`, "system"));
      state.pendingCombos = state.pendingCombos.filter(c => c.id !== pendingCombo.id);
      proposer.pendingComboId = undefined;
      return { state, newEntries: log };
    }

    // Both ready — execute combo NOW
    const comboTarget = pendingCombo.targetId
      ? allMonsters.find(m => m.id === pendingCombo.targetId && m.hp > 0)
      : allMonsters.find(m => m.hp > 0);

    if (!comboTarget) {
      log.push(logEntry(`❌ Alvo inválido para o combo!`, "system"));
      state.pendingCombos = state.pendingCombos.filter(c => c.id !== pendingCombo.id);
      proposer.pendingComboId = undefined;
      player.pendingComboId = undefined;
      return { state, newEntries: log };
    }

    proposer.attributes.mp -= mpCost;
    player.attributes.mp -= mpCost;

    const combinedAttack = proposer.attributes.attack + player.attributes.attack;
    const dice1 = rollDice();
    const dice2 = rollDice();
    const bestDice = Math.max(dice1, dice2);

    const damage = calculateDamage(combinedAttack, bestDice, comboTarget.defense, comboAction.damageMultiplier, false);
    comboTarget.hp = Math.max(0, comboTarget.hp - damage);

    log.push(logEntry(
      `✨ COMBO! ${proposer.name} + ${player.name} → "${comboAction.name}" ${comboAction.emoji} → ${damage} dano em ${comboTarget.name}! (${comboTarget.hp}/${comboTarget.maxHp} HP)`,
      "combo"
    ));

    applySkillEffects(state, proposer, comboTarget, comboAction.effectKey, damage, log);

    if (comboTarget.hp <= 0) handleMonsterDeath(state, comboTarget, log);

    // Mark initiative entries as acted
    const propInit = state.initiativeOrder.find(e => e.id === proposer.id);
    const partInit = state.initiativeOrder.find(e => e.id === player.id);
    if (propInit) propInit.acted = true;
    if (partInit) partInit.acted = true;

    proposer.hasActedThisTurn = true;
    player.hasActedThisTurn = true;
    proposer.pendingComboId = undefined;
    player.pendingComboId = undefined;
    state.pendingCombos = state.pendingCombos.filter(c => c.id !== pendingCombo.id);

    return { state, newEntries: log };
  }

  // ── Combo Cancel ───────────────────────────────────────────────────────────
  if (actionType === "combo_cancel") {
    state.pendingCombos = state.pendingCombos.filter(c => c.proposerId !== playerId && c.partnerId !== playerId);
    state.players.forEach(p => {
      if (p.pendingComboId) {
        const combo = state.pendingCombos.find(c => c.id === p.pendingComboId);
        if (!combo) p.pendingComboId = undefined;
      }
    });
    log.push(logEntry(`${player.name} cancelou o combo.`, "system"));
    return { state, newEntries: log };
  }

  // ── Normal Attack / Skip ───────────────────────────────────────────────────
  if (actionType === "attack" || actionType === "special") {
    const cls = CLASS_DEFINITIONS.find(c => c.id === player.classType)!;
    const skill = skillId ? cls.skills.find(s => s.id === skillId) : cls.skills[0];

    if (!skill || !target) {
      player.hasActedThisTurn = true;
      const initEntry = state.initiativeOrder.find(e => e.id === playerId);
      if (initEntry) initEntry.acted = true;
      return { state, newEntries: [] };
    }

    const actualMpCost = Math.floor(skill.mpCost * manaMult);
    if (player.attributes.mp < actualMpCost) {
      log.push(logEntry(`${player.name} não tem mana para ${skill.name}! Usando habilidade básica.`, "system"));
      // Fallback to basic attack (free)
      const basicSkill = cls.skills[0];
      const dice = rollDice();
      const damage = calculateDamage(player.attributes.attack, dice, target.defense, basicSkill.damageMultiplier);
      target.hp = Math.max(0, target.hp - damage);
      log.push(logEntry(`${player.name} usou ${basicSkill.name} em ${target.name} → ${damage} dano!`, "player_attack"));
      if (target.hp <= 0) handleMonsterDeath(state, target, log);
      player.hasActedThisTurn = true;
      const initEntry = state.initiativeOrder.find(e => e.id === playerId);
      if (initEntry) initEntry.acted = true;
      return { state, newEntries: log };
    }

    player.attributes.mp -= actualMpCost;

    const dice = rollDice();
    const isCrit = dice >= 9;
    let multiplier = skill.damageMultiplier;
    let piercing = false;

    // Class passives
    if (player.classType === "ranger" && dice >= 17) multiplier *= 3;
    if (player.classType === "mage" && Math.random() < 0.30) { multiplier *= 2; log.push(logEntry(`⚡ Amplificação Arcana! Dano dobrado!`, "special")); }
    if (player.classType === "warrior" && Math.random() < 0.25) { log.push(logEntry(`🛡️ ${player.name} bloqueou um ataque!`, "player_attack")); }
    if (skill.effectKey === "pierce" || skill.effectKey === "pierce_heavy" || skill.effectKey === "teleport_strike") piercing = true;

    // Necromancer passive summon
    if (player.classType === "necromancer" && Math.random() < 0.40 && !player.summonActive) {
      player.summonActive = true;
      player.summonTurnsLeft = 3;
      log.push(logEntry(`💀 ${player.name} invocou uma alma! (+5 dano por 3 turnos)`, "special"));
    }

    const summonBonus = player.summonActive ? 5 : 0;

    let bossBonus = 1;
    if (skill.effectKey === "boss_bonus" && target.isBoss) { bossBonus = 1.5; log.push(logEntry(`✨ Punição Divina! Dano bônus contra chefe!`, "special")); }

    // Status effect bonuses
    const atkBonus = player.statusEffects.reduce((sum, se) => sum + (se.attackBonus ?? 0), 0);

    const damage = Math.floor(calculateDamage(player.attributes.attack + summonBonus + atkBonus, dice, target.defense, multiplier * bossBonus, piercing));

    target.hp = Math.max(0, target.hp - damage);

    const critText = (isCrit && dice < 17) ? "💥 Crítico! " : (dice >= 17 ? "⚡⚡ CRÍTICO EXTREMO! " : "");
    log.push(logEntry(
      `${critText}${player.name} usou ${skill.name} em ${target.name} → Dado: ${dice} → ${damage} dano! (${target.hp}/${target.maxHp} HP)`,
      "player_attack"
    ));

    applySkillEffects(state, player, target, skill.effectKey, damage, log);

    if (target.hp <= 0) handleMonsterDeath(state, target, log);

    // Paladin aura on action
    if (player.classType === "paladin") {
      state.players.forEach(p => {
        if (p.attributes.hp > 0 && p.id !== player.id) {
          p.attributes.hp = clamp(p.attributes.hp + 6, 0, p.attributes.maxHp);
        }
      });
      log.push(logEntry(`✨ Aura Sagrada: aliados recuperam 6 HP!`, "special"));
    }
  } else {
    log.push(logEntry(`${player.name} passou o turno.`, "system"));
  }

  player.hasActedThisTurn = true;
  const initEntry = state.initiativeOrder.find(e => e.id === playerId);
  if (initEntry) initEntry.acted = true;

  return { state, newEntries: log };
}

// ─── Process Single Actor in Initiative Order ─────────────────────────────────

export function processInitiativeActorAction(
  state: GameState, actorId: string, log: CombatEntry[]
): GameState {
  const initEntry = state.initiativeOrder.find(e => e.id === actorId);
  if (!initEntry || initEntry.acted) return state;

  if (initEntry.isMonster) {
    const monster = [...state.monsters, ...(state.currentBoss ? [state.currentBoss] : [])].find(m => m.id === actorId);
    if (monster && monster.hp > 0) {
      processSingleMonsterAttack(state, monster, log);
    }
    initEntry.acted = true;
  }
  return state;
}

// ─── Full Monster Turn (legacy, used when all players acted) ─────────────────

export function processMonsterTurn(state: GameState): { state: GameState; newEntries: CombatEntry[] } {
  const log: CombatEntry[] = [];
  const alivePlayers = state.players.filter(p => p.attributes.hp > 0);
  if (alivePlayers.length === 0) return { state, newEntries: log };

  const allMonsters = [
    ...state.monsters.filter(m => m.hp > 0),
    ...(state.currentBoss && state.currentBoss.hp > 0 ? [state.currentBoss] : []),
  ];

  allMonsters.forEach(monster => processSingleMonsterAttack(state, monster, log));

  // Tick status effects for players
  state.players.forEach(p => tickStatusEffects(p, log, true));

  // Paladin passive heal all at end of round
  const paladin = state.players.find(p => p.classType === "paladin" && p.attributes.hp > 0);
  if (paladin) {
    state.players.forEach(p => {
      if (p.attributes.hp > 0) {
        p.attributes.hp = clamp(p.attributes.hp + 6, 0, p.attributes.maxHp);
      }
    });
    log.push(logEntry(`✨ ${paladin.name} — Aura Sagrada curou o grupo em 6 HP!`, "special"));
  }

  // Reset for next round
  state.players.forEach(p => { p.hasActedThisTurn = false; p.pendingComboId = undefined; });
  state.pendingCombos = [];
  state.currentPlayerTurnIndex = 0;
  state.turnNumber++;
  state.initiativeRolled = false;
  state.initiativeOrder = [];

  return { state, newEntries: log };
}

// ─── Check Win/Loss ───────────────────────────────────────────────────────────

export function checkGameEnd(state: GameState): "players" | "monsters" | null {
  const activePlayers = state.players.filter(p => p.isConnected);
  if (activePlayers.every(p => p.attributes.hp <= 0)) return "monsters";

  const noMonsters = state.monsters.filter(m => m.hp > 0).length === 0 && (!state.currentBoss || state.currentBoss.hp <= 0);
  if (noMonsters) return "players";

  return null;
}

// ─── Check All Players Acted ──────────────────────────────────────────────────

export function checkAllPlayersActed(state: GameState): boolean {
  const activePlayers = state.players.filter(p => p.attributes.hp > 0 && p.isConnected);
  if (activePlayers.length === 0) return true;
  return activePlayers.every(p => p.hasActedThisTurn);
}

// ─── Buy Item ─────────────────────────────────────────────────────────────────

export function buyItem(state: GameState, playerId: string, itemId: string): { state: GameState; newEntries: CombatEntry[] } {
  const log: CombatEntry[] = [];
  const player = state.players.find(p => p.id === playerId);
  const item = SHOP_ITEMS.find(i => i.id === itemId);

  if (!player || !item) return { state, newEntries: [] };
  if (player.coins < item.cost) { log.push(logEntry("❌ Moedas insuficientes!", "system")); return { state, newEntries: log }; }

  player.coins -= item.cost;
  player.inventory.push({ ...item, id: nanoid() });
  player.attributes.attack += item.attackBonus;
  player.attributes.defense += item.defenseBonus;
  player.attributes.maxHp += item.hpBonus;
  player.attributes.hp = clamp(player.attributes.hp + item.hpBonus, 0, player.attributes.maxHp);
  player.attributes.maxMp += item.mpBonus;
  player.attributes.mp = clamp(player.attributes.mp + item.mpBonus, 0, player.attributes.maxMp);

  log.push(logEntry(`🛒 ${player.name} comprou "${item.name}"! (${player.coins} moedas restantes)`, "item"));
  return { state, newEntries: log };
}

export { nanoid };

// ─── Reset for new map ────────────────────────────────────────────────────────

export function resetForNewMap(state: GameState): GameState {
  state.players.forEach(p => {
    p.attributes.hp = p.attributes.maxHp;
    p.attributes.mp = p.attributes.maxMp;
    p.hasActedThisTurn = false;
    p.statusEffects = [];
    p.summonActive = false;
    p.summonTurnsLeft = 0;
    p.pendingComboId = undefined;
    p.initiativeRoll = undefined;
  });
  state.monsters = [];
  state.currentBoss = null;
  state.turnNumber = 0;
  state.turnPhase = "initiative_roll";
  state.currentPlayerTurnIndex = 0;
  state.roundWinner = null;
  state.currentMap = null;
  state.phase = "lobby";
  state.pendingCombos = [];
  state.initiativeOrder = [];
  state.currentInitiativeIndex = 0;
  state.initiativeRolled = false;
  state.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: "✨ O grupo descansou. Escolha o próximo mapa!", type: "system" });
  return state;
}