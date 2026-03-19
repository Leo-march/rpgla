// ─── Enums ───────────────────────────────────────────────────────────────────

export type ClassType = "warrior" | "mage" | "ranger" | "necromancer" | "paladin" | "assassin";
export type MapId = "forest" | "dungeon" | "abyss";
export type GamePhase = "lobby" | "map_select" | "playing" | "shop" | "game_over" | "victory";
export type TurnPhase = "player_actions" | "processing" | "monster_turn" | "broadcast";
export type ActionType = "attack" | "special" | "use_item" | "skip";

// ─── Attributes ──────────────────────────────────────────────────────────────

export interface Attributes {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
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
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  damageMultiplier: number;
  isSpecial: boolean;
  // special effect key handled server-side
  effectKey?: string;
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
  id: string; // socket id
  name: string;
  classType: ClassType;
  attributes: Attributes;
  level: number;
  xp: number;
  xpToNext: number;
  inventory: Item[];
  coins: number; // shared pot reflected here
  statusEffects: StatusEffect[];
  hasActedThisTurn: boolean;
  isConnected: boolean;
  // Necromancer summon state
  summonActive: boolean;
  summonTurnsLeft: number;
}

// ─── Status Effects ───────────────────────────────────────────────────────────

export interface StatusEffect {
  id: string;
  name: string;
  turnsLeft: number;
  attackBonus?: number;
  defenseBonus?: number;
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
}

// ─── Map ─────────────────────────────────────────────────────────────────────

export interface MapDefinition {
  id: MapId;
  name: string;
  description: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  defenseDebuff: number;   // multiplier, e.g. 0.8 = -20%
  manaCostMultiplier: number; // e.g. 2 = double
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
  type: "player_attack" | "monster_attack" | "level_up" | "item" | "system" | "special";
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
  unlockedClasses: ClassType[];
  sharedCoins: number;
  shopItems: Item[];
  combatLog: CombatEntry[];
  turnNumber: number;
  turnPhase: TurnPhase;
  currentPlayerTurnIndex: number; // which player slot is acting
  roundWinner: null | "players" | "monsters";
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
  player_action: (data: { actionType: ActionType; skillId?: string; targetId?: string; itemId?: string }) => void;
  buy_item: (itemId: string) => void;
  start_game: () => void;
  ready: () => void;
}
