import { ClassDefinition, MapDefinition, Item, Monster } from "@/types/game";

// ─── Classes ─────────────────────────────────────────────────────────────────

export const CLASS_DEFINITIONS: ClassDefinition[] = [
  {
    id: "warrior",
    name: "Guerreiro",
    emoji: "⚔️",
    description: "Tanque de linha de frente com alta defesa e golpes brutais.",
    passiveDescription: "Escudo de Aço: 20% de chance de bloquear todo o dano de um ataque.",
    baseAttributes: { hp: 120, maxHp: 120, mp: 30, maxMp: 30, attack: 8, defense: 6 },
    unlockedByDefault: true,
    skills: [
      { id: "slash", name: "Golpe Largo", description: "Ataque padrão com espada.", mpCost: 0, damageMultiplier: 1, isSpecial: false },
      { id: "shield_bash", name: "Choque de Escudo", description: "Atordoa o inimigo por 1 turno.", mpCost: 5, damageMultiplier: 0.8, isSpecial: false, effectKey: "stun" },
      { id: "heavy_strike", name: "Golpe Pesado", description: "Ataque poderoso com 1.5x de dano.", mpCost: 8, damageMultiplier: 1.5, isSpecial: false },
      { id: "berserker", name: "Fúria Berserker", description: "ESPECIAL: +10 ataque por 3 turnos. Consome toda a mana.", mpCost: 30, damageMultiplier: 2, isSpecial: true, effectKey: "berserker" },
    ],
  },
  {
    id: "mage",
    name: "Mago",
    emoji: "🔮",
    description: "Mestre dos elementos com dano altíssimo, mas frágil.",
    passiveDescription: "Amplificação Arcana: Magias têm 25% de chance de causar dano dobrado.",
    baseAttributes: { hp: 70, maxHp: 70, mp: 100, maxMp: 100, attack: 12, defense: 2 },
    unlockedByDefault: true,
    skills: [
      { id: "fireball", name: "Bola de Fogo", description: "Projétil de fogo básico.", mpCost: 8, damageMultiplier: 1.2, isSpecial: false },
      { id: "ice_shard", name: "Fragmento de Gelo", description: "Reduz defesa do alvo por 2 turnos.", mpCost: 10, damageMultiplier: 0.9, isSpecial: false, effectKey: "defense_down" },
      { id: "lightning", name: "Relâmpago", description: "Raio que acerta em área.", mpCost: 15, damageMultiplier: 1.4, isSpecial: false },
      { id: "meteor", name: "Meteoro", description: "ESPECIAL: Dano massivo em todos os inimigos.", mpCost: 50, damageMultiplier: 2.5, isSpecial: true, effectKey: "aoe" },
    ],
  },
  {
    id: "ranger",
    name: "Arqueiro",
    emoji: "🏹",
    description: "Especialista em ataques precisos e sangramento.",
    passiveDescription: "Olho de Falcão: Acertos críticos (dado 9-10) causam dano triplo.",
    baseAttributes: { hp: 85, maxHp: 85, mp: 50, maxMp: 50, attack: 10, defense: 3 },
    unlockedByDefault: true,
    skills: [
      { id: "arrow_shot", name: "Flecha Precisa", description: "Tiro básico de arco.", mpCost: 0, damageMultiplier: 1, isSpecial: false },
      { id: "poison_arrow", name: "Flecha Envenenada", description: "Causa dano por 3 turnos.", mpCost: 10, damageMultiplier: 0.7, isSpecial: false, effectKey: "poison" },
      { id: "piercing_shot", name: "Tiro Perfurante", description: "Ignora 50% da defesa.", mpCost: 12, damageMultiplier: 1.3, isSpecial: false, effectKey: "pierce" },
      { id: "rain_of_arrows", name: "Chuva de Flechas", description: "ESPECIAL: Acerta todos os inimigos.", mpCost: 30, damageMultiplier: 1.8, isSpecial: true, effectKey: "aoe" },
    ],
  },
  {
    id: "necromancer",
    name: "Necromante",
    emoji: "💀",
    description: "Manipula os mortos para destruir seus inimigos.",
    passiveDescription: "Invocação: Ao agir, 35% de chance de invocar uma alma que adiciona +4 de dano por 3 turnos.",
    baseAttributes: { hp: 75, maxHp: 75, mp: 90, maxMp: 90, attack: 9, defense: 2 },
    unlockedByDefault: false,
    unlockBossMap: "forest",
    skills: [
      { id: "soul_drain", name: "Dreno de Alma", description: "Rouba HP do inimigo.", mpCost: 10, damageMultiplier: 1, isSpecial: false, effectKey: "lifesteal" },
      { id: "bone_spear", name: "Lança de Osso", description: "Projétil de osso afiado.", mpCost: 8, damageMultiplier: 1.3, isSpecial: false },
      { id: "curse", name: "Maldição", description: "Reduz ataque do inimigo por 3 turnos.", mpCost: 12, damageMultiplier: 0.5, isSpecial: false, effectKey: "attack_down" },
      { id: "death_coil", name: "Espiral da Morte", description: "ESPECIAL: Invoca esqueletos que atacam por 3 turnos.", mpCost: 45, damageMultiplier: 1.5, isSpecial: true, effectKey: "summon" },
    ],
  },
  {
    id: "paladin",
    name: "Paladino",
    emoji: "🛡️",
    description: "Guerreiro sagrado que cura aliados e causa dano divino.",
    passiveDescription: "Aura Sagrada: Cura 5 HP de todos os aliados ao início de cada turno.",
    baseAttributes: { hp: 100, maxHp: 100, mp: 60, maxMp: 60, attack: 7, defense: 5 },
    unlockedByDefault: false,
    unlockBossMap: "dungeon",
    skills: [
      { id: "holy_strike", name: "Golpe Sagrado", description: "Dano sagrado básico.", mpCost: 5, damageMultiplier: 1.1, isSpecial: false },
      { id: "heal", name: "Cura Divina", description: "Restaura 20 HP de um aliado.", mpCost: 15, damageMultiplier: 0, isSpecial: false, effectKey: "heal_ally" },
      { id: "smite", name: "Punição Divina", description: "Dano extra contra chefes.", mpCost: 12, damageMultiplier: 1.4, isSpecial: false, effectKey: "boss_bonus" },
      { id: "divine_shield", name: "Escudo Divino", description: "ESPECIAL: Todo o grupo fica invulnerável por 1 turno.", mpCost: 50, damageMultiplier: 0, isSpecial: true, effectKey: "group_shield" },
    ],
  },
  {
    id: "assassin",
    name: "Assassino",
    emoji: "🗡️",
    description: "Veloz e letal, especialista em golpes críticos.",
    passiveDescription: "Sombra: Primeiros ataques em combate causam dano dobrado.",
    baseAttributes: { hp: 80, maxHp: 80, mp: 55, maxMp: 55, attack: 14, defense: 2 },
    unlockedByDefault: false,
    unlockBossMap: "abyss",
    skills: [
      { id: "backstab", name: "Facada pelas Costas", description: "Ataque rápido.", mpCost: 0, damageMultiplier: 1, isSpecial: false },
      { id: "shadow_strike", name: "Golpe das Sombras", description: "Ataque furtivo de alto dano.", mpCost: 10, damageMultiplier: 1.6, isSpecial: false },
      { id: "smoke_bomb", name: "Bomba de Fumaça", description: "Reduz chance de ser acertado.", mpCost: 8, damageMultiplier: 0, isSpecial: false, effectKey: "evasion" },
      { id: "death_mark", name: "Marca da Morte", description: "ESPECIAL: Mata instantaneamente inimigos abaixo de 25% HP.", mpCost: 40, damageMultiplier: 3, isSpecial: true, effectKey: "execute" },
    ],
  },
];

// ─── Monsters ────────────────────────────────────────────────────────────────

const makeMonster = (
  id: string, name: string, emoji: string, level: number,
  hp: number, attack: number, defense: number,
  xp: number, coins: number, isBoss = false
): Monster => ({ id, name, emoji, level, hp, maxHp: hp, attack, defense, xpReward: xp, coinReward: coins, isBoss });

export const MONSTER_POOLS: Record<string, Monster[]> = {
  forest: [
    makeMonster("goblin", "Goblin", "👺", 1, 30, 4, 1, 15, 5),
    makeMonster("wolf", "Lobo Sombrio", "🐺", 1, 25, 5, 0, 12, 4),
    makeMonster("slime", "Lodo Verde", "🟢", 1, 40, 3, 2, 10, 3),
    makeMonster("bandit", "Bandido", "🦹", 2, 35, 6, 1, 18, 6),
  ],
  dungeon: [
    makeMonster("skeleton", "Esqueleto", "💀", 5, 60, 8, 3, 30, 10),
    makeMonster("zombie", "Zumbi", "🧟", 5, 80, 6, 4, 28, 9),
    makeMonster("dark_knight", "Cavaleiro Negro", "🖤", 6, 70, 10, 5, 35, 12),
    makeMonster("wraith", "Espectro", "👻", 5, 50, 12, 2, 32, 11),
  ],
  abyss: [
    makeMonster("demon", "Demônio", "😈", 9, 120, 15, 8, 60, 20),
    makeMonster("lava_golem", "Golem de Lava", "🔥", 10, 150, 12, 10, 70, 22),
    makeMonster("void_spawn", "Filho do Vazio", "⚫", 9, 100, 18, 6, 65, 21),
  ],
};

export const BOSSES: Record<string, Monster> = {
  forest: makeMonster("forest_boss", "Rei Goblin", "👑", 3, 200, 10, 4, 100, 50, true),
  dungeon: makeMonster("dungeon_boss", "Lich", "🧙", 7, 350, 18, 8, 200, 100, true),
  abyss: makeMonster("abyss_boss", "Senhor do Abismo", "🌑", 10, 600, 28, 15, 500, 300, true),
};

// ─── Maps ────────────────────────────────────────────────────────────────────

export const MAP_DEFINITIONS: MapDefinition[] = [
  {
    id: "forest",
    name: "Floresta Amaldiçoada",
    description: "Árvores retorcidas escondem perigos nos cantos escuros.",
    difficulty: "Iniciante",
    defenseDebuff: 1.0,
    manaCostMultiplier: 1.0,
    monsterLevel: 1,
    monsters: MONSTER_POOLS.forest,
    boss: BOSSES.forest,
    requiredLevel: 1,
  },
  {
    id: "dungeon",
    name: "Masmorra Esquecida",
    description: "Corredores úmidos onde a defesa é corrompida pela maldição.",
    difficulty: "Intermediário",
    defenseDebuff: 0.8,
    manaCostMultiplier: 1.0,
    monsterLevel: 5,
    monsters: MONSTER_POOLS.dungeon,
    boss: BOSSES.dungeon,
    requiredLevel: 3,
  },
  {
    id: "abyss",
    name: "Abismo Eterno",
    description: "O fundo do inferno. Mana escoa duas vezes mais rápido aqui.",
    difficulty: "Avançado",
    defenseDebuff: 1.0,
    manaCostMultiplier: 2.0,
    monsterLevel: 10,
    monsters: MONSTER_POOLS.abyss,
    boss: BOSSES.abyss,
    requiredLevel: 6,
  },
];

// ─── Shop Items ───────────────────────────────────────────────────────────────

export const SHOP_ITEMS: Item[] = [
  { id: "iron_sword", name: "Espada de Ferro", description: "+3 Ataque", cost: 30, attackBonus: 3, defenseBonus: 0, hpBonus: 0, mpBonus: 0 },
  { id: "steel_shield", name: "Escudo de Aço", description: "+3 Defesa", cost: 30, attackBonus: 0, defenseBonus: 3, hpBonus: 0, mpBonus: 0 },
  { id: "health_potion", name: "Poção de Vida", description: "+25 HP Máximo", cost: 25, attackBonus: 0, defenseBonus: 0, hpBonus: 25, mpBonus: 0 },
  { id: "mana_crystal", name: "Cristal de Mana", description: "+20 Mana Máxima", cost: 25, attackBonus: 0, defenseBonus: 0, hpBonus: 0, mpBonus: 20 },
  { id: "enchanted_blade", name: "Lâmina Encantada", description: "+5 Ataque, +1 Defesa", cost: 60, attackBonus: 5, defenseBonus: 1, hpBonus: 0, mpBonus: 0 },
  { id: "dragon_scale", name: "Escama de Dragão", description: "+5 Defesa, +10 HP Máximo", cost: 60, attackBonus: 0, defenseBonus: 5, hpBonus: 10, mpBonus: 0 },
  { id: "arcane_tome", name: "Tomo Arcano", description: "+4 Ataque, +30 Mana Máxima", cost: 70, attackBonus: 4, defenseBonus: 0, hpBonus: 0, mpBonus: 30 },
  { id: "elixir", name: "Elixir da Força", description: "+6 Ataque, +4 Defesa", cost: 100, attackBonus: 6, defenseBonus: 4, hpBonus: 0, mpBonus: 0 },
];

// ─── XP Table ─────────────────────────────────────────────────────────────────

export const XP_TO_NEXT_LEVEL = (level: number): number => level * 50 + 50;
