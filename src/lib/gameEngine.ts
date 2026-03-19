import {
  GameState, Player, Monster, ClassType, MapId,
  CombatEntry, ActionType, Item, StatusEffect, PendingCombo,
} from "@/types/game";
import {
  CLASS_DEFINITIONS, MAP_DEFINITIONS, SHOP_ITEMS,
  MONSTER_POOLS, BOSSES, XP_TO_NEXT_LEVEL, COMBO_ACTIONS, findComboForClasses,
} from "@/data/gameData";
import { nanoid } from "nanoid";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const rollDice = () => Math.floor(Math.random() * 10) + 1;

const logEntry = (
  message: string,
  type: CombatEntry["type"] = "system"
): CombatEntry => ({ id: nanoid(), timestamp: Date.now(), message, type });

const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

// ─── Player Factory ───────────────────────────────────────────────────────────

export function createPlayer(
  socketId: string,
  name: string,
  classType: ClassType
): Player {
  const cls = CLASS_DEFINITIONS.find((c) => c.id === classType)!;
  const base = cls.baseAttributes;
  return {
    id: socketId,
    name,
    classType,
    attributes: {
      hp: base.hp,
      maxHp: base.maxHp,
      mp: base.mp,
      maxMp: base.maxMp,
      attack: base.attack,
      defense: base.defense,
    },
    level: 1,
    xp: 0,
    xpToNext: XP_TO_NEXT_LEVEL(1),
    inventory: [],
    coins: 0,
    statusEffects: [],
    hasActedThisTurn: false,
    isConnected: true,
    summonActive: false,
    summonTurnsLeft: 0,
    pendingComboId: undefined,
  };
}

// ─── Initial Game State ───────────────────────────────────────────────────────

export function createInitialGameState(roomId: string): GameState {
  return {
    roomId,
    phase: "lobby",
    currentMap: null,
    players: [],
    monsters: [],
    currentBoss: null,
    bossDefeated: { forest: false, dungeon: false, abyss: false, volcano: false, cemetery: false, ice_castle: false, void: false },
    unlockedClasses: ["warrior", "mage", "ranger", "necromancer", "paladin", "assassin"],
    sharedCoins: 0,
    shopItems: SHOP_ITEMS,
    combatLog: [logEntry("⚔️ Aventureiros chegaram à taverna. Aguardando grupo completo...", "system")],
    turnNumber: 0,
    turnPhase: "player_actions",
    currentPlayerTurnIndex: 0,
    roundWinner: null,
    pendingCombos: [],
  };
}

// ─── Map Spawn ────────────────────────────────────────────────────────────────

export function spawnMonstersForMap(mapId: MapId): Monster[] {
  const pool = MONSTER_POOLS[mapId];
  const count = Math.floor(Math.random() * 2) + 2;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((m) => ({ ...m, id: nanoid(), hp: m.maxHp }));
}

// ─── Damage Calculation ───────────────────────────────────────────────────────

export function calculateDamage(
  attackerAttack: number,
  diceResult: number,
  targetDefense: number,
  multiplier = 1.0,
  piercing = false
): number {
  const effectiveDefense = piercing ? Math.floor(targetDefense / 2) : targetDefense;
  const raw = Math.floor((diceResult + attackerAttack) * multiplier) - effectiveDefense;
  return Math.max(1, raw);
}

// ─── Status Effect Tick ───────────────────────────────────────────────────────

export function tickStatusEffects(
  entity: Player | Monster,
  log: CombatEntry[],
  isPlayer: boolean
): void {
  if (!("statusEffects" in entity)) return;
  const p = entity as Player;
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
}

// ─── Level Up ────────────────────────────────────────────────────────────────

export function checkLevelUp(player: Player, log: CombatEntry[]): void {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = XP_TO_NEXT_LEVEL(player.level);
    player.attributes.maxHp += 10;
    player.attributes.hp = clamp(player.attributes.hp + 10, 0, player.attributes.maxHp);
    player.attributes.maxMp += 5;
    player.attributes.attack += 1;
    log.push(logEntry(`🌟 ${player.name} subiu para o nível ${player.level}! +10 HP, +5 MP, +1 ATK`, "level_up"));
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
  log.push(logEntry(`💰 Cada jogador recebeu ${coinsGain} moedas!`, "system"));

  if (state.currentBoss && target.id === state.currentBoss.id) {
    state.currentBoss = null;
    state.bossDefeated[state.currentMap!] = true;
  } else {
    state.monsters = state.monsters.filter((m) => m.id !== target.id);
  }
}

// ─── Apply Skill Effects ──────────────────────────────────────────────────────

function applySkillEffects(
  state: GameState,
  player: Player,
  target: Monster,
  effectKey: string | undefined,
  damage: number,
  log: CombatEntry[]
): void {
  const allMonsters = [...state.monsters, ...(state.currentBoss ? [state.currentBoss] : [])];

  if (effectKey === "aoe" || effectKey === "aoe_fire" || effectKey === "aoe_cover" ||
      effectKey === "aoe_arcane" || effectKey === "aoe_chaos" || effectKey === "aoe_holy_heal" ||
      effectKey === "aoe_poison") {
    allMonsters.filter((m) => m.id !== target.id && m.hp > 0).forEach((m) => {
      const splashDmg = Math.floor(damage * 0.6);
      m.hp = Math.max(0, m.hp - splashDmg);
      log.push(logEntry(`  ↳ Dano em área: ${m.name} recebe ${splashDmg} de dano!`, "player_attack"));
      if (m.hp <= 0) handleMonsterDeath(state, m, log);
    });
  }

  if (effectKey === "aoe_poison") {
    allMonsters.filter((m) => m.hp > 0).forEach((m) => {
      log.push(logEntry(`  ↳ ${m.name} está envenenado!`, "special"));
    });
  }

  if (effectKey === "lifesteal" || effectKey === "group_lifesteal") {
    const healAmt = effectKey === "group_lifesteal" ? Math.floor(damage * 0.5) : Math.floor(damage * 0.3);
    if (effectKey === "group_lifesteal") {
      state.players.filter((p) => p.attributes.hp > 0).forEach((p) => {
        p.attributes.hp = clamp(p.attributes.hp + healAmt, 0, p.attributes.maxHp);
      });
      log.push(logEntry(`  ↳ O grupo absorveu ${healAmt} HP cada!`, "player_attack"));
    } else {
      player.attributes.hp = clamp(player.attributes.hp + healAmt, 0, player.attributes.maxHp);
      log.push(logEntry(`  ↳ ${player.name} absorveu ${healAmt} HP!`, "player_attack"));
    }
  }

  if (effectKey === "heal_ally") {
    const ally = state.players.find((p) => p.id !== player.id && p.attributes.hp > 0);
    if (ally) {
      ally.attributes.hp = clamp(ally.attributes.hp + 20, 0, ally.attributes.maxHp);
      log.push(logEntry(`✨ ${player.name} curou ${ally.name} em 20 HP!`, "player_attack"));
    }
  }

  if (effectKey === "heal_on_hit") {
    const healAmt = Math.floor(damage * 0.3);
    state.players.filter((p) => p.attributes.hp > 0).forEach((p) => {
      p.attributes.hp = clamp(p.attributes.hp + healAmt, 0, p.attributes.maxHp);
    });
    log.push(logEntry(`  ↳ O grupo recuperou ${healAmt} HP!`, "special"));
  }

  if (effectKey === "aoe_holy_heal") {
    const healAmt = Math.floor(damage * 0.4);
    state.players.filter((p) => p.attributes.hp > 0).forEach((p) => {
      p.attributes.hp = clamp(p.attributes.hp + healAmt, 0, p.attributes.maxHp);
    });
    log.push(logEntry(`  ↳ Nova sagrada! O grupo recuperou ${healAmt} HP!`, "special"));
  }

  if (effectKey === "holy_shot_heal") {
    player.attributes.hp = clamp(player.attributes.hp + Math.floor(damage * 0.4), 0, player.attributes.maxHp);
    log.push(logEntry(`  ↳ ${player.name} recuperou HP com o tiro abençoado!`, "special"));
  }

  if (effectKey === "group_shield") {
    state.players.forEach((p) => {
      if (p.attributes.hp > 0) {
        p.statusEffects.push({ id: nanoid(), name: "Escudo Divino", turnsLeft: 1, defenseBonus: 999 });
      }
    });
    log.push(logEntry(`🛡️ Escudo Divino protege o grupo por 1 turno!`, "special"));
  }

  if ((effectKey === "execute" || effectKey === "phase_strike") && target.hp < target.maxHp * 0.25) {
    target.hp = 0;
    log.push(logEntry(`☠️ Golpe letal! ${target.name} foi eliminado!`, "special"));
  }

  if (effectKey === "execute_50" && target.hp < target.maxHp * 0.5) {
    target.hp = 0;
    log.push(logEntry(`⚖️ Julgamento Divino! ${target.name} foi executado!`, "special"));
  }

  if (effectKey === "berserker") {
    player.attributes.mp = 0;
    player.statusEffects.push({ id: nanoid(), name: "Fúria Berserker", turnsLeft: 3, attackBonus: 10 });
    log.push(logEntry(`😡 ${player.name} entra em fúria! +10 ATK por 3 turnos!`, "special"));
  }

  if (effectKey === "summon" && player.classType === "necromancer") {
    player.summonActive = true;
    player.summonTurnsLeft = 3;
    log.push(logEntry(`💀 Esqueletos invocados! +4 dano por 3 turnos!`, "special"));
  }

  if (effectKey === "evasion") {
    player.statusEffects.push({ id: nanoid(), name: "Evasão", turnsLeft: 2, defenseBonus: 8 });
    log.push(logEntry(`🌑 ${player.name} se funde às sombras! +8 DEF por 2 turnos.`, "special"));
  }

  if (effectKey === "multi_hit") {
    const extraHit = Math.floor(damage * 0.5);
    target.hp = Math.max(0, target.hp - extraHit);
    log.push(logEntry(`  ↳ Golpe extra! ${target.name} recebe mais ${extraHit} de dano!`, "special"));
  }
}

// ─── Player Action ────────────────────────────────────────────────────────────

export function processPlayerAction(
  state: GameState,
  playerId: string,
  actionType: ActionType,
  opts: {
    skillId?: string;
    targetId?: string;
    itemId?: string;
    comboActionId?: string;
    partnerId?: string;
  } = {}
): { state: GameState; newEntries: CombatEntry[] } {
  const { skillId, targetId, itemId, comboActionId, partnerId } = opts;
  const log: CombatEntry[] = [];
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hasActedThisTurn) return { state, newEntries: [] };

  const mapDef = MAP_DEFINITIONS.find((m) => m.id === state.currentMap)!;
  const manaMult = mapDef?.manaCostMultiplier ?? 1;

  const allMonsters = [...state.monsters, ...(state.currentBoss ? [state.currentBoss] : [])];
  const target = targetId
    ? allMonsters.find((m) => m.id === targetId && m.hp > 0)
    : allMonsters.find((m) => m.hp > 0);

  // ── Combo Propose ──────────────────────────────────────────────────────────
  if (actionType === "combo_propose" && comboActionId && partnerId) {
    const partner = state.players.find((p) => p.id === partnerId && p.attributes.hp > 0 && !p.hasActedThisTurn);
    if (!partner) {
      log.push(logEntry(`❌ Parceiro inválido para combo!`, "system"));
      return { state, newEntries: log };
    }

    const comboAction = COMBO_ACTIONS.find((c) => c.id === comboActionId);
    if (!comboAction) return { state, newEntries: log };

    // Validate classes
    const classes = [player.classType, partner.classType];
    const valid = (classes.includes(comboAction.requiredClasses[0]) && classes.includes(comboAction.requiredClasses[1]));
    if (!valid) {
      log.push(logEntry(`❌ Classes incompatíveis para este combo!`, "system"));
      return { state, newEntries: log };
    }

    // Check MP
    const mpCost = Math.floor(comboAction.mpCostPerPlayer * manaMult);
    if (player.attributes.mp < mpCost) {
      log.push(logEntry(`❌ ${player.name} não tem mana suficiente para o combo!`, "system"));
      return { state, newEntries: log };
    }

    // Remove any existing combo for this player
    state.pendingCombos = state.pendingCombos.filter(
      (c) => c.proposerId !== playerId && c.partnerId !== playerId
    );

    const newCombo: PendingCombo = {
      id: nanoid(),
      proposerId: playerId,
      partnerId,
      comboActionId,
      targetId,
      proposerReady: true,
      partnerReady: false,
      expiresAt: Date.now() + 60000,
    };
    state.pendingCombos.push(newCombo);
    player.pendingComboId = newCombo.id;

    log.push(logEntry(`🤝 ${player.name} propõe combo "${comboAction.name}" com ${partner.name}!`, "combo"));
    return { state, newEntries: log };
  }

  // ── Combo Accept ───────────────────────────────────────────────────────────
  if (actionType === "combo_accept") {
    const pendingCombo = state.pendingCombos.find(
      (c) => c.partnerId === playerId && !c.partnerReady
    );
    if (!pendingCombo) {
      log.push(logEntry(`❌ Nenhum combo pendente para aceitar!`, "system"));
      return { state, newEntries: log };
    }

    const proposer = state.players.find((p) => p.id === pendingCombo.proposerId);
    if (!proposer) return { state, newEntries: log };

    const comboAction = COMBO_ACTIONS.find((c) => c.id === pendingCombo.comboActionId)!;
    const mpCost = Math.floor(comboAction.mpCostPerPlayer * manaMult);

    if (player.attributes.mp < mpCost) {
      log.push(logEntry(`❌ ${player.name} não tem mana suficiente para o combo!`, "system"));
      // Cancel combo
      state.pendingCombos = state.pendingCombos.filter((c) => c.id !== pendingCombo.id);
      proposer.pendingComboId = undefined;
      return { state, newEntries: log };
    }

    pendingCombo.partnerReady = true;
    player.pendingComboId = pendingCombo.id;

    // Execute combo immediately since both are ready
    const comboTarget = pendingCombo.targetId
      ? allMonsters.find((m) => m.id === pendingCombo.targetId && m.hp > 0)
      : allMonsters.find((m) => m.hp > 0);

    if (!comboTarget) {
      log.push(logEntry(`❌ Alvo inválido para o combo!`, "system"));
      state.pendingCombos = state.pendingCombos.filter((c) => c.id !== pendingCombo.id);
      proposer.pendingComboId = undefined;
      player.pendingComboId = undefined;
      return { state, newEntries: log };
    }

    // Deduct MP from both
    proposer.attributes.mp -= mpCost;
    player.attributes.mp -= mpCost;

    // Combined attack power
    const combinedAttack = proposer.attributes.attack + player.attributes.attack;
    const dice1 = rollDice();
    const dice2 = rollDice();
    const bestDice = Math.max(dice1, dice2);

    const damage = calculateDamage(combinedAttack, bestDice, comboTarget.defense, comboAction.damageMultiplier, false);
    comboTarget.hp = Math.max(0, comboTarget.hp - damage);

    log.push(logEntry(
      `✨ COMBO! ${proposer.name} + ${player.name} usaram "${comboAction.name}" ${comboAction.emoji} em ${comboTarget.name} → ${damage} dano! (${comboTarget.hp}/${comboTarget.maxHp} HP)`,
      "combo"
    ));

    // Apply combo effects
    applySkillEffects(state, proposer, comboTarget, comboAction.effectKey, damage, log);

    if (comboTarget.hp <= 0) {
      handleMonsterDeath(state, comboTarget, log);
    }

    // Mark both as acted
    proposer.hasActedThisTurn = true;
    player.hasActedThisTurn = true;
    proposer.pendingComboId = undefined;
    player.pendingComboId = undefined;

    // Remove pending combo
    state.pendingCombos = state.pendingCombos.filter((c) => c.id !== pendingCombo.id);

    return { state, newEntries: log };
  }

  // ── Combo Cancel ───────────────────────────────────────────────────────────
  if (actionType === "combo_cancel") {
    state.pendingCombos = state.pendingCombos.filter(
      (c) => c.proposerId !== playerId && c.partnerId !== playerId
    );
    state.players.forEach((p) => {
      if (p.pendingComboId) {
        const combo = state.pendingCombos.find((c) => c.id === p.pendingComboId);
        if (!combo) p.pendingComboId = undefined;
      }
    });
    log.push(logEntry(`${player.name} cancelou o combo.`, "system"));
    return { state, newEntries: log };
  }

  // ── Normal Attack / Skip ───────────────────────────────────────────────────
  if (actionType === "attack" || actionType === "special") {
    const cls = CLASS_DEFINITIONS.find((c) => c.id === player.classType)!;
    const skill = skillId ? cls.skills.find((s) => s.id === skillId) : cls.skills[0];

    if (!skill || !target) {
      player.hasActedThisTurn = true;
      return { state, newEntries: [] };
    }

    const actualMpCost = Math.floor(skill.mpCost * manaMult);

    if (player.attributes.mp < actualMpCost) {
      log.push(logEntry(`${player.name} não tem mana suficiente para ${skill.name}!`, "system"));
      player.hasActedThisTurn = true;
      return { state, newEntries: log };
    }

    player.attributes.mp -= actualMpCost;

    const dice = rollDice();
    const isCrit = dice >= 9;
    let multiplier = skill.damageMultiplier;
    let piercing = false;

    // Class passives
    if (player.classType === "ranger" && isCrit) multiplier *= 3;
    if (player.classType === "mage" && Math.random() < 0.25) multiplier *= 2;
    if (player.classType === "warrior" && Math.random() < 0.2) {
      log.push(logEntry(`🛡️ ${player.name} bloqueou o ataque!`, "player_attack"));
    }
    if (skill.effectKey === "pierce" || skill.effectKey === "pierce_heavy") piercing = true;

    // Necromancer passive summon chance
    if (player.classType === "necromancer" && Math.random() < 0.35 && !player.summonActive) {
      player.summonActive = true;
      player.summonTurnsLeft = 3;
      log.push(logEntry(`💀 ${player.name} invocou uma alma do cemitério! (+4 dano por 3 turnos)`, "special"));
    }

    const summonBonus = player.summonActive ? 4 : 0;

    let bossBonus = 1;
    if (skill.effectKey === "boss_bonus" && target.isBoss) bossBonus = 1.5;

    // Apply berserker bonus from status effects
    const berserkerBonus = player.statusEffects.find((se) => se.name === "Fúria Berserker")?.attackBonus ?? 0;

    const damage = Math.floor(
      calculateDamage(
        player.attributes.attack + summonBonus + berserkerBonus,
        dice,
        target.defense,
        multiplier * bossBonus,
        piercing
      )
    );

    target.hp = Math.max(0, target.hp - damage);

    log.push(logEntry(
      `${isCrit ? "💥 CRÍTICO! " : ""}${player.name} usou ${skill.name} em ${target.name} → Dado: ${dice} → ${damage} dano! (${target.hp}/${target.maxHp} HP restante)`,
      "player_attack"
    ));

    applySkillEffects(state, player, target, skill.effectKey, damage, log);

    if (target.hp <= 0) {
      handleMonsterDeath(state, target, log);
    }

    // Paladin aura heal
    if (player.classType === "paladin") {
      state.players.forEach((p) => {
        if (p.attributes.hp > 0 && p.id !== player.id) {
          p.attributes.hp = clamp(p.attributes.hp + 5, 0, p.attributes.maxHp);
        }
      });
    }
  } else {
    log.push(logEntry(`${player.name} passou o turno.`, "system"));
  }

  player.hasActedThisTurn = true;

  return { state, newEntries: log };
}

// ─── Monster Turn ─────────────────────────────────────────────────────────────

export function processMonsterTurn(state: GameState): {
  state: GameState;
  newEntries: CombatEntry[];
} {
  const log: CombatEntry[] = [];
  const alivePlayers = state.players.filter((p) => p.attributes.hp > 0);
  if (alivePlayers.length === 0) return { state, newEntries: log };

  const allMonsters = [
    ...state.monsters.filter((m) => m.hp > 0),
    ...(state.currentBoss && state.currentBoss.hp > 0 ? [state.currentBoss] : []),
  ];

  allMonsters.forEach((monster) => {
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    const mapDef = MAP_DEFINITIONS.find((m) => m.id === state.currentMap)!;
    const defMult = mapDef?.defenseDebuff ?? 1;

    const shieldEffect = target.statusEffects.find((se) => se.name === "Escudo Divino");
    if (shieldEffect) {
      log.push(logEntry(`🛡️ Escudo Divino absorveu o ataque de ${monster.name}!`, "system"));
      return;
    }

    const dice = rollDice();
    const effectiveDefense = Math.floor(
      (target.attributes.defense +
        target.statusEffects.reduce((sum, se) => sum + (se.defenseBonus ?? 0), 0)) *
        defMult
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
  });

  // Tick player status effects
  state.players.forEach((p) => tickStatusEffects(p, log, true));

  // ── IMPORTANT FIX: Reset ALL players for next round ──────────────────────
  state.players.forEach((p) => {
    p.hasActedThisTurn = false;
    p.pendingComboId = undefined;
  });

  // Clear expired combos
  state.pendingCombos = [];

  state.currentPlayerTurnIndex = 0;
  state.turnNumber++;

  return { state, newEntries: log };
}

// ─── Check Win/Loss ───────────────────────────────────────────────────────────

export function checkGameEnd(state: GameState): "players" | "monsters" | null {
  // Only count connected players as "active" for win/loss checks
  const activePlayers = state.players.filter((p) => p.isConnected);
  const allDead = activePlayers.every((p) => p.attributes.hp <= 0);
  if (allDead) return "monsters";

  const noMonsters =
    state.monsters.filter((m) => m.hp > 0).length === 0 &&
    (!state.currentBoss || state.currentBoss.hp <= 0);
  if (noMonsters) return "players";

  return null;
}

// ─── Check All Players Acted ──────────────────────────────────────────────────

export function checkAllPlayersActed(state: GameState): boolean {
  // Only count alive + connected players
  const activePlayers = state.players.filter(
    (p) => p.attributes.hp > 0 && p.isConnected
  );
  if (activePlayers.length === 0) return true;
  return activePlayers.every((p) => p.hasActedThisTurn);
}

// ─── Buy Item ─────────────────────────────────────────────────────────────────

export function buyItem(
  state: GameState,
  playerId: string,
  itemId: string
): { state: GameState; newEntries: CombatEntry[] } {
  const log: CombatEntry[] = [];
  const player = state.players.find((p) => p.id === playerId);
  const item = SHOP_ITEMS.find((i) => i.id === itemId);

  if (!player || !item) return { state, newEntries: [] };
  if (player.coins < item.cost) {
    log.push(logEntry("❌ Moedas insuficientes!", "system"));
    return { state, newEntries: log };
  }

  player.coins -= item.cost;
  player.inventory.push({ ...item, id: nanoid() });
  player.attributes.attack += item.attackBonus;
  player.attributes.defense += item.defenseBonus;
  player.attributes.maxHp += item.hpBonus;
  player.attributes.hp = clamp(player.attributes.hp + item.hpBonus, 0, player.attributes.maxHp);
  player.attributes.maxMp += item.mpBonus;
  player.attributes.mp = clamp(player.attributes.mp + item.mpBonus, 0, player.attributes.maxMp);

  log.push(logEntry(`🛒 ${player.name} comprou "${item.name}"! (Moedas restantes: ${player.coins})`, "item"));
  return { state, newEntries: log };
}

export { nanoid };

// ─── Reset for new map ────────────────────────────────────────────────────────

export function resetForNewMap(state: GameState): GameState {
  state.players.forEach((p) => {
    p.attributes.hp = p.attributes.maxHp;
    p.attributes.mp = p.attributes.maxMp;
    p.hasActedThisTurn = false;
    p.statusEffects = [];
    p.summonActive = false;
    p.summonTurnsLeft = 0;
    p.pendingComboId = undefined;
  });
  state.monsters = [];
  state.currentBoss = null;
  state.turnNumber = 0;
  state.turnPhase = "player_actions";
  state.currentPlayerTurnIndex = 0;
  state.roundWinner = null;
  state.currentMap = null;
  state.phase = "lobby";
  state.pendingCombos = [];
  state.combatLog.push({
    id: nanoid(),
    timestamp: Date.now(),
    message: "✨ O grupo descansou e se recuperou. Escolha o próximo mapa!",
    type: "system",
  });
  return state;
}