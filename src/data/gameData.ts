import { ClassDefinition, MapDefinition, Item, Monster, ComboAction } from "@/types/game";

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
    unlockedByDefault: true,
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
    unlockedByDefault: true,
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
    unlockedByDefault: true,
    skills: [
      { id: "backstab", name: "Facada pelas Costas", description: "Ataque rápido.", mpCost: 0, damageMultiplier: 1, isSpecial: false },
      { id: "shadow_strike", name: "Golpe das Sombras", description: "Ataque furtivo de alto dano.", mpCost: 10, damageMultiplier: 1.6, isSpecial: false },
      { id: "smoke_bomb", name: "Bomba de Fumaça", description: "Reduz chance de ser acertado.", mpCost: 8, damageMultiplier: 0, isSpecial: false, effectKey: "evasion" },
      { id: "death_mark", name: "Marca da Morte", description: "ESPECIAL: Mata instantaneamente inimigos abaixo de 25% HP.", mpCost: 40, damageMultiplier: 3, isSpecial: true, effectKey: "execute" },
    ],
  },
];

// ─── Combo Actions ────────────────────────────────────────────────────────────
// Each combo requires exactly 2 classes. All 15 class pairs are covered.

export const COMBO_ACTIONS: ComboAction[] = [
  // Warrior + Mage
  {
    id: "blazing_sword",
    name: "Espada em Chamas",
    description: "Guerreiro ataca enquanto Mago encanta a lâmina com fogo. Dano massivo em área.",
    requiredClasses: ["warrior", "mage"],
    mpCostPerPlayer: 20,
    damageMultiplier: 3.5,
    effectKey: "aoe_fire",
    emoji: "🔥⚔️",
  },
  // Warrior + Ranger
  {
    id: "volley_cover",
    name: "Cobertura de Flechas",
    description: "Arqueiro dispara rajada enquanto Guerreiro protege. +DEF grupo + dano em área.",
    requiredClasses: ["warrior", "ranger"],
    mpCostPerPlayer: 15,
    damageMultiplier: 2.8,
    effectKey: "aoe_cover",
    emoji: "🛡️🏹",
  },
  // Warrior + Necromancer
  {
    id: "bone_armor_crush",
    name: "Esmagamento Ósseo",
    description: "Necromante cobre o Guerreiro com ossos. Ataque brutal que ignora defesa.",
    requiredClasses: ["warrior", "necromancer"],
    mpCostPerPlayer: 18,
    damageMultiplier: 3.2,
    effectKey: "pierce_heavy",
    emoji: "💀⚔️",
  },
  // Warrior + Paladin
  {
    id: "sacred_charge",
    name: "Carga Sagrada",
    description: "Paladin abençoa o Guerreiro. Ataque poderoso que cura o grupo.",
    requiredClasses: ["warrior", "paladin"],
    mpCostPerPlayer: 20,
    damageMultiplier: 2.5,
    effectKey: "heal_on_hit",
    emoji: "✨⚔️",
  },
  // Warrior + Assassin
  {
    id: "death_dance",
    name: "Dança da Morte",
    description: "Guerreiro distrai enquanto Assassino desfere golpes letais por todos os lados.",
    requiredClasses: ["warrior", "assassin"],
    mpCostPerPlayer: 15,
    damageMultiplier: 3.8,
    effectKey: "multi_hit",
    emoji: "🗡️⚔️",
  },
  // Mage + Ranger
  {
    id: "arcane_arrows",
    name: "Flechas Arcanas",
    description: "Mago encanta as flechas do Arqueiro com energia arcana. Dano mágico em todos.",
    requiredClasses: ["mage", "ranger"],
    mpCostPerPlayer: 22,
    damageMultiplier: 3.0,
    effectKey: "aoe_arcane",
    emoji: "🔮🏹",
  },
  // Mage + Necromancer
  {
    id: "soul_storm",
    name: "Tempestade de Almas",
    description: "Necromante invoca almas que o Mago explode em energia caótica. Dano massivo AoE.",
    requiredClasses: ["mage", "necromancer"],
    mpCostPerPlayer: 30,
    damageMultiplier: 4.0,
    effectKey: "aoe_chaos",
    emoji: "💀🔮",
  },
  // Mage + Paladin
  {
    id: "holy_nova",
    name: "Nova Sagrada",
    description: "Paladino canaliza luz divina amplificada pelo Mago. Dano sagrado + cura grupo.",
    requiredClasses: ["mage", "paladin"],
    mpCostPerPlayer: 25,
    damageMultiplier: 2.8,
    effectKey: "aoe_holy_heal",
    emoji: "✨🔮",
  },
  // Mage + Assassin
  {
    id: "shadow_blink",
    name: "Teletransporte Sombrio",
    description: "Mago teletransporta o Assassino direto ao alvo para golpe mortal. Ignora defesa.",
    requiredClasses: ["mage", "assassin"],
    mpCostPerPlayer: 25,
    damageMultiplier: 4.2,
    effectKey: "teleport_strike",
    emoji: "🗡️🔮",
  },
  // Ranger + Necromancer
  {
    id: "plagued_volley",
    name: "Saraivada Pestilenta",
    description: "Arqueiro dispara flechas envenenadas pelo Necromante. Dano + veneno em todos.",
    requiredClasses: ["ranger", "necromancer"],
    mpCostPerPlayer: 20,
    damageMultiplier: 2.5,
    effectKey: "aoe_poison",
    emoji: "💀🏹",
  },
  // Ranger + Paladin
  {
    id: "blessed_shot",
    name: "Tiro Abençoado",
    description: "Paladino abençoa a flecha do Arqueiro. Dano sagrado + cura o Arqueiro.",
    requiredClasses: ["ranger", "paladin"],
    mpCostPerPlayer: 18,
    damageMultiplier: 3.0,
    effectKey: "holy_shot_heal",
    emoji: "✨🏹",
  },
  // Ranger + Assassin
  {
    id: "pincer_attack",
    name: "Ataque de Pinça",
    description: "Arqueiro distrai de longe enquanto Assassino ataca pelas costas. Dano crítico garantido.",
    requiredClasses: ["ranger", "assassin"],
    mpCostPerPlayer: 18,
    damageMultiplier: 3.6,
    effectKey: "guaranteed_crit",
    emoji: "🗡️🏹",
  },
  // Necromancer + Paladin
  {
    id: "life_drain_nova",
    name: "Nova de Dreno Vital",
    description: "Necromante drena vida enquanto Paladino distribui para o grupo. Cura massiva.",
    requiredClasses: ["necromancer", "paladin"],
    mpCostPerPlayer: 25,
    damageMultiplier: 2.2,
    effectKey: "group_lifesteal",
    emoji: "💀✨",
  },
  // Necromancer + Assassin
  {
    id: "spectral_blade",
    name: "Lâmina Espectral",
    description: "Necromante torna o Assassino intangível. Golpe que atravessa qualquer defesa.",
    requiredClasses: ["necromancer", "assassin"],
    mpCostPerPlayer: 28,
    damageMultiplier: 4.5,
    effectKey: "phase_strike",
    emoji: "💀🗡️",
  },
  // Paladin + Assassin
  {
    id: "divine_judgement",
    name: "Julgamento Divino",
    description: "Paladino julga enquanto Assassino executa. Mata inimigos com menos de 50% HP.",
    requiredClasses: ["paladin", "assassin"],
    mpCostPerPlayer: 30,
    damageMultiplier: 3.5,
    effectKey: "execute_50",
    emoji: "✨🗡️",
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
    makeMonster("goblin", "Goblin", "👺", 1, 30, 4, 1, 15, 20),
    makeMonster("wolf", "Lobo Sombrio", "🐺", 1, 25, 5, 0, 12, 16),
    makeMonster("slime", "Lodo Verde", "🟢", 1, 40, 3, 2, 10, 12),
    makeMonster("bandit", "Bandido", "🦹", 2, 35, 6, 1, 18, 24),
  ],
  dungeon: [
    makeMonster("skeleton", "Esqueleto", "💀", 5, 60, 8, 3, 30, 35),
    makeMonster("zombie", "Zumbi", "🧟", 5, 80, 6, 4, 28, 32),
    makeMonster("dark_knight", "Cavaleiro Negro", "🖤", 6, 70, 10, 5, 35, 40),
    makeMonster("wraith", "Espectro", "👻", 5, 50, 12, 2, 32, 38),
  ],
  abyss: [
    makeMonster("demon", "Demônio", "😈", 9, 120, 15, 8, 60, 70),
    makeMonster("lava_golem", "Golem de Lava", "🔥", 10, 150, 12, 10, 70, 80),
    makeMonster("void_spawn", "Filho do Vazio", "⚫", 9, 100, 18, 6, 65, 75),
  ],
  volcano: [
    makeMonster("fire_elemental", "Elemental de Fogo", "🌋", 12, 140, 18, 7, 80, 90),
    makeMonster("magma_crab", "Caranguejo de Magma", "🦀", 11, 160, 14, 12, 75, 85),
    makeMonster("ash_wraith", "Espectro de Cinzas", "🌑", 12, 110, 22, 5, 85, 95),
    makeMonster("inferno_hound", "Cão do Inferno", "🐕‍🦺", 13, 130, 20, 8, 90, 100),
  ],
  cemetery: [
    makeMonster("banshee", "Banshee", "👁️", 14, 150, 20, 6, 95, 105),
    makeMonster("grave_golem", "Golem Tumular", "🪨", 15, 200, 16, 14, 100, 110),
    makeMonster("lich_minion", "Servo do Lich", "🦴", 14, 130, 24, 4, 98, 108),
    makeMonster("death_knight", "Cavaleiro da Morte", "⚔️", 15, 180, 22, 10, 105, 115),
  ],
  ice_castle: [
    makeMonster("frost_golem", "Golem de Gelo", "🧊", 17, 220, 20, 16, 115, 125),
    makeMonster("ice_witch", "Bruxa do Gelo", "🧙‍♀️", 16, 160, 28, 8, 120, 130),
    makeMonster("frozen_knight", "Cavaleiro Congelado", "🛡️", 17, 240, 18, 18, 118, 128),
    makeMonster("blizzard_spirit", "Espírito da Nevasca", "❄️", 16, 140, 30, 6, 122, 132),
  ],
  void: [
    makeMonster("void_reaper", "Ceifador do Vazio", "🌀", 19, 250, 32, 12, 140, 160),
    makeMonster("shadow_titan", "Titã das Sombras", "👤", 20, 300, 28, 18, 150, 170),
    makeMonster("chaos_spawn", "Engendro do Caos", "💥", 19, 200, 36, 8, 145, 165),
  ],
};

export const BOSSES: Record<string, Monster> = {
  forest: makeMonster("forest_boss", "Rei Goblin", "👑", 3, 200, 10, 4, 100, 150, true),
  dungeon: makeMonster("dungeon_boss", "Lich", "🧙", 7, 350, 18, 8, 200, 300, true),
  abyss: makeMonster("abyss_boss", "Senhor do Abismo", "🌑", 10, 600, 28, 15, 500, 800, true),
  volcano: makeMonster("volcano_boss", "Dragão de Lava", "🐉", 14, 900, 35, 18, 700, 1000, true),
  cemetery: makeMonster("cemetery_boss", "Senhor dos Mortos", "💀", 16, 1100, 40, 20, 850, 1200, true),
  ice_castle: makeMonster("ice_boss", "Rainha do Gelo Eterno", "👸", 18, 1400, 45, 25, 1000, 1500, true),
  void: makeMonster("void_boss", "Deus do Vazio", "🌌", 20, 2000, 55, 30, 1500, 2000, true),
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
  {
    id: "volcano",
    name: "Vulcão do Fim",
    description: "Calor extremo derrete a armadura. Defesa reduzida em 30%.",
    difficulty: "Avançado",
    defenseDebuff: 0.7,
    manaCostMultiplier: 1.0,
    monsterLevel: 12,
    monsters: MONSTER_POOLS.volcano,
    boss: BOSSES.volcano,
    requiredLevel: 8,
  },
  {
    id: "cemetery",
    name: "Cemitério Esquecido",
    description: "Os mortos nunca dormem aqui. Mana custa 1.5x mais.",
    difficulty: "Avançado",
    defenseDebuff: 1.0,
    manaCostMultiplier: 1.5,
    monsterLevel: 15,
    monsters: MONSTER_POOLS.cemetery,
    boss: BOSSES.cemetery,
    requiredLevel: 10,
  },
  {
    id: "ice_castle",
    name: "Castelo de Gelo Eterno",
    description: "O frio paralisa corpo e alma. Defesa -25% e Mana x1.5.",
    difficulty: "Lendário",
    defenseDebuff: 0.75,
    manaCostMultiplier: 1.5,
    monsterLevel: 17,
    monsters: MONSTER_POOLS.ice_castle,
    boss: BOSSES.ice_castle,
    requiredLevel: 13,
  },
  {
    id: "void",
    name: "O Vazio Absoluto",
    description: "Além da realidade. Defesa anulada e Mana custa o dobro.",
    difficulty: "Lendário",
    defenseDebuff: 0.5,
    manaCostMultiplier: 2.0,
    monsterLevel: 20,
    monsters: MONSTER_POOLS.void,
    boss: BOSSES.void,
    requiredLevel: 16,
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

// ─── Combo Lookup ─────────────────────────────────────────────────────────────

export function findComboForClasses(classA: string, classB: string): ComboAction | undefined {
  return COMBO_ACTIONS.find(
    (c) =>
      (c.requiredClasses[0] === classA && c.requiredClasses[1] === classB) ||
      (c.requiredClasses[0] === classB && c.requiredClasses[1] === classA)
  );
}