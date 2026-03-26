// ─── Enums ───────────────────────────────────────────────────────────────────

export type ClassType = "warrior" | "mage" | "ranger" | "necromancer" | "paladin" | "assassin" | "druida" | "berserker";
export type MapId = "forest" | "dungeon" | "abyss" | "volcano" | "cemetery" | "ice_castle" | "void";
export type GamePhase = "lobby" | "map_select" | "playing" | "shop" | "game_over" | "victory";
export type TurnPhase = "initiative_roll" | "player_actions" | "processing" | "monster_turn" | "broadcast";
export type ActionType = "attack" | "special" | "use_item" | "skip" | "combo_propose" | "combo_accept" | "combo_cancel" | "combo_execute";

// ─── Initiative ───────────────────────────────────────────────────────────────

export interface InitiativeEntry {
  id: string;         // player id or monster id
  name: string;
  roll: number;
  isPlayer: boolean;
  isMonster?: boolean;
  acted: boolean;
}

// ─── Attributes ──────────────────────────────────────────────────────────────

export interface Attributes {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  initiativeBonus: number; // flat bonus added to d20 initiative rolls
}

// ─── Items ───────────────────────────────────────────────────────────────────

export interface Item {
  id: string;
  name: string;
  description: string;
  cost: number;
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
  mpBonus: number;
  initiativeBonus?: number; // flat bonus to initiative rolls
  hpRestore?: number;
  mpRestore?: number;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  damageMultiplier: number;
  isSpecial: boolean;
  effectKey?: string;
}

// ─── Combo Action ─────────────────────────────────────────────────────────────

export interface ComboAction {
  id: string;
  name: string;
  description: string;
  requiredClasses: [ClassType, ClassType];
  mpCostPerPlayer: number;
  damageMultiplier: number;
  effectKey: string;
  emoji: string;
}

export interface PendingCombo {
  id: string;
  proposerId: string;
  partnerId: string;
  comboActionId: string;
  targetId?: string;
  proposerReady: boolean;
  partnerReady: boolean;
  expiresAt: number;
}

// ─── Class Definition ─────────────────────────────────────────────────────────

export interface ClassDefinition {
  id: ClassType;
  name: string;
  emoji: string;
  description: string;
  passiveDescription: string;
  baseAttributes: Omit<Attributes, "hp" | "mp"> & { hp: number; mp: number };
  skills: Skill[];
  unlockedByDefault: boolean;
  unlockBossMap?: MapId;
}

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  classType: ClassType;
  attributes: Attributes;
  level: number;
  xp: number;
  xpToNext: number;
  inventory: Item[];
  coins: number;
  purchasedItems: string[];
  statusEffects: StatusEffect[];
  hasActedThisTurn: boolean;
  isConnected: boolean;
  summonActive: boolean;
  summonTurnsLeft: number;
  pendingComboId?: string;
  initiativeRoll?: number;
}

// ─── Status Effects ───────────────────────────────────────────────────────────

export interface StatusEffect {
  id: string;
  name: string;
  turnsLeft: number;        // -1 = permanent for battle
  attackBonus?: number;     // adds to player.attributes.attack when calculating damage
  defenseBonus?: number;    // adds to effective defense; 999 = divine shield (blocks all)
  damagePerTurn?: number;   // DoT applied at end of round
  initiativeBonus?: number; // bonus to next initiative roll (consumed after use)
  stunned?: boolean;        // entity skips its next action
}

// ─── Monster ─────────────────────────────────────────────────────────────────

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
  coinReward: number;
  isBoss: boolean;
  initiativeBonus?: number; // flat bonus added to monster initiative rolls
  initiativeRoll?: number;
  stunned?: boolean;        // skips its next action when true
}

// ─── Map ─────────────────────────────────────────────────────────────────────

export interface MapDefinition {
  id: MapId;
  name: string;
  description: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado" | "Lendário";
  defenseDebuff: number;
  manaCostMultiplier: number;
  monsterLevel: number;
  monsters: Monster[];
  boss: Monster;
  requiredLevel: number;
}

// ─── Combat Log ──────────────────────────────────────────────────────────────

export interface CombatEntry {
  id: string;
  timestamp: number;
  message: string;
  type: "player_attack" | "monster_attack" | "level_up" | "item" | "system" | "special" | "combo" | "initiative";
}

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  roomId: string;
  phase: GamePhase;
  currentMap: MapId | null;
  players: Player[];
  monsters: Monster[];
  currentBoss: Monster | null;
  bossDefeated: Record<MapId, boolean>;
  unlockedMaps: MapId[];
  unlockedClasses: ClassType[];
  sharedCoins: number;
  shopItems: Item[];
  combatLog: CombatEntry[];
  turnNumber: number;
  turnPhase: TurnPhase;
  currentPlayerTurnIndex: number;
  roundWinner: null | "players" | "monsters";
  pendingCombos: PendingCombo[];
  initiativeOrder: InitiativeEntry[];
  currentInitiativeIndex: number;
  initiativeRolled: boolean;
}

// ─── Socket Events ────────────────────────────────────────────────────────────

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  combat_log_entry: (entry: CombatEntry) => void;
  damage_number: (data: { targetId: string; amount: number; isCrit: boolean }) => void;
  error: (msg: string) => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
}

export interface ClientToServerEvents {
  join_room: (data: { roomId: string; playerName: string; classType: ClassType }) => void;
  select_map: (mapId: MapId) => void;
  player_action: (data: { actionType: ActionType; skillId?: string; targetId?: string; itemId?: string; comboActionId?: string; partnerId?: string }) => void;
  buy_item: (itemId: string) => void;
  start_game: () => void;
  ready: () => void;
  return_to_map_select: () => void;
}
