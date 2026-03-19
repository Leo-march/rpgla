import {
  GameState, Player, Monster, ClassType, MapId,
  CombatEntry, ActionType, Item, StatusEffect,
} from "@/types/game";
import {
  CLASS_DEFINITIONS, MAP_DEFINITIONS, SHOP_ITEMS,
  MONSTER_POOLS, BOSSES, XP_TO_NEXT_LEVEL,
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
    bossDefeated: { forest: false, dungeon: false, abyss: false },
    unlockedClasses: ["warrior", "mage", "ranger"],
    sharedCoins: 0,
    shopItems: SHOP_ITEMS,
    combatLog: [logEntry("⚔️ Aventureiros chegaram à taverna. Aguardando grupo completo...", "system")],
    turnNumber: 0,
    turnPhase: "player_actions",
    currentPlayerTurnIndex: 0,
    roundWinner: null,
  };
}

// ─── Map Spawn ────────────────────────────────────────────────────────────────

export function spawnMonstersForMap(mapId: MapId): Monster[] {
  const pool = MONSTER_POOLS[mapId];
  // pick 2-3 random monsters with unique ids
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

  // Tick necromancer summon
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
    // Increase stats
    player.attributes.maxHp += 10;
    player.attributes.hp = clamp(
      player.attributes.hp + 10,
      0,
      player.attributes.maxHp
    );
    player.attributes.maxMp += 5;
    player.attributes.attack += 1;
    log.push(
      logEntry(
        `🌟 ${player.name} subiu para o nível ${player.level}! +10 HP, +5 MP, +1 ATK`,
        "level_up"
      )
    );
  }
}

// ─── Player Action ────────────────────────────────────────────────────────────

export function processPlayerAction(
  state: GameState,
  playerId: string,
  actionType: ActionType,
  skillId?: string,
  targetId?: string,
  itemId?: string
): { state: GameState; newEntries: CombatEntry[] } {
  const log: CombatEntry[] = [];
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.hasActedThisTurn) return { state, newEntries: [] };

  const mapDef = MAP_DEFINITIONS.find((m) => m.id === state.currentMap)!;
  const manaMult = mapDef?.manaCostMultiplier ?? 1;

  // Find target monster
  const allMonsters = [...state.monsters, ...(state.currentBoss ? [state.currentBoss] : [])];
  const target =
    targetId
      ? allMonsters.find((m) => m.id === targetId)
      : allMonsters.find((m) => m.hp > 0);

  if (actionType === "attack" || actionType === "special") {
    const cls = CLASS_DEFINITIONS.find((c) => c.id === player.classType)!;
    const skill = skillId
      ? cls.skills.find((s) => s.id === skillId)
      : cls.skills[0];

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
    if (skill.effectKey === "pierce") piercing = true;

    // Necromancer passive summon chance
    if (player.classType === "necromancer" && Math.random() < 0.35 && !player.summonActive) {
      player.summonActive = true;
      player.summonTurnsLeft = 3;
      log.push(logEntry(`💀 ${player.name} invocou uma alma do cemitério! (+4 dano por 3 turnos)`, "special"));
    }

    // Extra damage from necro summon
    const summonBonus = player.summonActive ? 4 : 0;

    // Paladin boss bonus
    let bossBonus = 1;
    if (skill.effectKey === "boss_bonus" && target.isBoss) bossBonus = 1.5;

    const damage = Math.floor(
      calculateDamage(
        player.attributes.attack + summonBonus,
        dice,
        target.defense,
        multiplier * bossBonus,
        piercing
      )
    );

    target.hp = Math.max(0, target.hp - damage);

    log.push(
      logEntry(
        `${isCrit ? "💥 CRÍTICO! " : ""}${player.name} usou ${skill.name} em ${target.name} → Dado: ${dice} → ${damage} dano! (${target.hp}/${target.maxHp} HP restante)`,
        "player_attack"
      )
    );

    // Handle special effects
    if (skill.effectKey === "aoe") {
      allMonsters.filter((m) => m.id !== target.id && m.hp > 0).forEach((m) => {
        const splashDmg = Math.floor(damage * 0.5);
        m.hp = Math.max(0, m.hp - splashDmg);
        log.push(logEntry(`  ↳ Dano em área: ${m.name} recebe ${splashDmg} de dano!`, "player_attack"));
      });
    }

    if (skill.effectKey === "lifesteal") {
      const heal = Math.floor(damage * 0.3);
      player.attributes.hp = clamp(player.attributes.hp + heal, 0, player.attributes.maxHp);
      log.push(logEntry(`  ↳ ${player.name} absorveu ${heal} HP!`, "player_attack"));
    }

    if (skill.effectKey === "heal_ally") {
      const ally = state.players.find((p) => p.id !== playerId && p.attributes.hp > 0);
      if (ally) {
        ally.attributes.hp = clamp(ally.attributes.hp + 20, 0, ally.attributes.maxHp);
        log.push(logEntry(`✨ ${player.name} curou ${ally.name} em 20 HP!`, "player_attack"));
      }
    }

    if (skill.effectKey === "group_shield") {
      state.players.forEach((p) => {
        if (p.attributes.hp > 0) {
          p.statusEffects.push({ id: nanoid(), name: "Escudo Divino", turnsLeft: 1, defenseBonus: 999 });
        }
      });
      log.push(logEntry(`🛡️ Escudo Divino protege o grupo por 1 turno!`, "special"));
    }

    if (skill.effectKey === "execute" && target.hp < target.maxHp * 0.25) {
      target.hp = 0;
      log.push(logEntry(`☠️ Marca da Morte! ${target.name} foi executado!`, "special"));
    }

    if (skill.effectKey === "berserker") {
      player.attributes.mp = 0;
      player.statusEffects.push({ id: nanoid(), name: "Fúria Berserker", turnsLeft: 3, attackBonus: 10 });
      log.push(logEntry(`😡 ${player.name} entra em fúria! +10 ATK por 3 turnos!`, "special"));
    }

    if (skill.effectKey === "summon" && player.classType === "necromancer") {
      player.summonActive = true;
      player.summonTurnsLeft = 3;
      log.push(logEntry(`💀 Esqueletos invocados! +4 dano por 3 turnos!`, "special"));
    }

    if (skill.effectKey === "evasion") {
      player.statusEffects.push({ id: nanoid(), name: "Evasão", turnsLeft: 2, defenseBonus: 8 });
      log.push(logEntry(`🌑 ${player.name} se funde às sombras! +8 DEF por 2 turnos.`, "special"));
    }

    // Check monster death
    if (target.hp <= 0) {
      log.push(logEntry(`💀 ${target.name} foi derrotado!`, "system"));
      const xpGain = Math.floor(target.xpReward / state.players.length);
      state.sharedCoins += target.coinReward;

      state.players.forEach((p) => {
        if (p.attributes.hp > 0) {
          p.xp += xpGain;
          checkLevelUp(p, log);
        }
      });
      log.push(logEntry(`💰 Grupo recebeu ${target.coinReward} moedas! (Total: ${state.sharedCoins})`, "system"));

      // Remove from state
      if (state.currentBoss && target.id === state.currentBoss.id) {
        state.currentBoss = null;
        state.bossDefeated[state.currentMap!] = true;
        // Unlock class
        const mapDef = MAP_DEFINITIONS.find((m) => m.id === state.currentMap);
        const toUnlock = CLASS_DEFINITIONS.find(
          (c) => !c.unlockedByDefault && c.unlockBossMap === mapDef?.id
        );
        if (toUnlock && !state.unlockedClasses.includes(toUnlock.id)) {
          state.unlockedClasses.push(toUnlock.id);
          log.push(logEntry(`🔓 Classe "${toUnlock.name}" desbloqueada!`, "system"));
        }
      } else {
        state.monsters = state.monsters.filter((m) => m.id !== target.id);
      }
    }
  } else if (actionType === "use_item") {
    const item = state.shopItems.find((i) => i.id === itemId);
    if (item && state.sharedCoins >= item.cost) {
      state.sharedCoins -= item.cost;
      player.inventory.push({ ...item });
      player.attributes.attack += item.attackBonus;
      player.attributes.defense += item.defenseBonus;
      player.attributes.maxHp += item.hpBonus;
      player.attributes.hp = clamp(player.attributes.hp + item.hpBonus, 0, player.attributes.maxHp);
      player.attributes.maxMp += item.mpBonus;
      player.attributes.mp = clamp(player.attributes.mp + item.mpBonus, 0, player.attributes.maxMp);
      log.push(logEntry(`🛒 ${player.name} equipou ${item.name}!`, "item"));
    }
  } else {
    log.push(logEntry(`${player.name} passou o turno.`, "system"));
  }

  player.hasActedThisTurn = true;

  // Paladin aura heal
  if (player.classType === "paladin") {
    state.players.forEach((p) => {
      if (p.attributes.hp > 0 && p.id !== player.id) {
        p.attributes.hp = clamp(p.attributes.hp + 5, 0, p.attributes.maxHp);
      }
    });
  }

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

    log.push(
      logEntry(
        `👹 ${monster.name} atacou ${target.name} → Dado: ${dice} → ${damage} dano! (${target.attributes.hp}/${target.attributes.maxHp} HP)`,
        "monster_attack"
      )
    );

    if (target.attributes.hp <= 0) {
      log.push(logEntry(`💔 ${target.name} foi derrotado!`, "monster_attack"));
    }
  });

  // Tick player status effects
  state.players.forEach((p) => tickStatusEffects(p, log, true));

  // Reset player actions for next round
  state.players.forEach((p) => (p.hasActedThisTurn = false));
  state.currentPlayerTurnIndex = 0;
  state.turnNumber++;

  return { state, newEntries: log };
}

// ─── Check Win/Loss ───────────────────────────────────────────────────────────

export function checkGameEnd(state: GameState): "players" | "monsters" | null {
  const allDead = state.players.every((p) => p.attributes.hp <= 0);
  if (allDead) return "monsters";

  const noMonsters =
    state.monsters.filter((m) => m.hp > 0).length === 0 &&
    (!state.currentBoss || state.currentBoss.hp <= 0);
  if (noMonsters) return "players";

  return null;
}

// ─── Buy Item (from shop between waves) ──────────────────────────────────────

export function buyItem(
  state: GameState,
  playerId: string,
  itemId: string
): { state: GameState; newEntries: CombatEntry[] } {
  const log: CombatEntry[] = [];
  const player = state.players.find((p) => p.id === playerId);
  const item = SHOP_ITEMS.find((i) => i.id === itemId);

  if (!player || !item) return { state, newEntries: [] };
  if (state.sharedCoins < item.cost) {
    log.push(logEntry("❌ Moedas insuficientes!", "system"));
    return { state, newEntries: log };
  }

  state.sharedCoins -= item.cost;
  player.inventory.push({ ...item, id: nanoid() });
  player.attributes.attack += item.attackBonus;
  player.attributes.defense += item.defenseBonus;
  player.attributes.maxHp += item.hpBonus;
  player.attributes.hp = clamp(player.attributes.hp + item.hpBonus, 0, player.attributes.maxHp);
  player.attributes.maxMp += item.mpBonus;
  player.attributes.mp = clamp(player.attributes.mp + item.mpBonus, 0, player.attributes.maxMp);

  log.push(logEntry(`🛒 ${player.name} comprou "${item.name}"! (Moedas: ${state.sharedCoins})`, "item"));
  return { state, newEntries: log };
}

export { nanoid };
