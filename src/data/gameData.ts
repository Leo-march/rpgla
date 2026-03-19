import { ClassDefinition, MapDefinition, Item, Monster, ComboAction } from "@/types/game";

// ─── Classes ─────────────────────────────────────────────────────────────────

export const CLASS_DEFINITIONS: ClassDefinition[] = [
  {
    id: "warrior",
    name: "Guerreiro",
    emoji: "⚔️",
    description: "Tanque de linha de frente com alta defesa e golpes brutais.",
    passiveDescription: "Escudo de Aço: 25% de chance de bloquear todo dano recebido.",
    baseAttributes: { hp: 130, maxHp: 130, mp: 40, maxMp: 40, attack: 9, defense: 7 },
    unlockedByDefault: true,
    skills: [
      { id: "slash", name: "Golpe Largo", description: "Ataque padrão com espada.", mpCost: 0, damageMultiplier: 1.1, isSpecial: false },
      { id: "shield_bash", name: "Choque de Escudo", description: "Atordoa inimigo por 1 turno.", mpCost: 5, damageMultiplier: 0.8, isSpecial: false, effectKey: "stun" },
      { id: "heavy_strike", name: "Golpe Pesado", description: "Ataque brutal com 1.6x dano.", mpCost: 8, damageMultiplier: 1.6, isSpecial: false },
      { id: "berserker_rage", name: "Fúria Berserker", description: "ESPECIAL: +12 ATK por 3 turnos + dano massivo.", mpCost: 35, damageMultiplier: 2.2, isSpecial: true, effectKey: "berserker" },
    ],
  },
  {
    id: "mage",
    name: "Mago",
    emoji: "🔮",
    description: "Mestre dos elementos com dano altíssimo, mas frágil.",
    passiveDescription: "Amplificação Arcana: 30% de chance de causar dano dobrado em magias.",
    baseAttributes: { hp: 75, maxHp: 75, mp: 120, maxMp: 120, attack: 13, defense: 2 },
    unlockedByDefault: true,
    skills: [
      { id: "fireball", name: "Bola de Fogo", description: "Projétil de fogo básico.", mpCost: 8, damageMultiplier: 1.3, isSpecial: false },
      { id: "ice_shard", name: "Fragmento de Gelo", description: "Reduz defesa do alvo por 2 turnos.", mpCost: 10, damageMultiplier: 1.0, isSpecial: false, effectKey: "defense_down" },
      { id: "lightning", name: "Relâmpago", description: "Raio que causa dano alto.", mpCost: 15, damageMultiplier: 1.6, isSpecial: false },
      { id: "meteor", name: "Meteoro", description: "ESPECIAL: Dano massivo em todos os inimigos.", mpCost: 55, damageMultiplier: 2.8, isSpecial: true, effectKey: "aoe" },
    ],
  },
  {
    id: "ranger",
    name: "Arqueiro",
    emoji: "🏹",
    description: "Especialista em ataques precisos e sangramento.",
    passiveDescription: "Olho de Falcão: Críticos (dado 17-20) causam dano triplo.",
    baseAttributes: { hp: 90, maxHp: 90, mp: 60, maxMp: 60, attack: 11, defense: 4 },
    unlockedByDefault: true,
    skills: [
      { id: "arrow_shot", name: "Flecha Precisa", description: "Tiro básico de arco.", mpCost: 0, damageMultiplier: 1.1, isSpecial: false },
      { id: "poison_arrow", name: "Flecha Envenenada", description: "Causa dano por 3 turnos.", mpCost: 10, damageMultiplier: 0.8, isSpecial: false, effectKey: "poison" },
      { id: "piercing_shot", name: "Tiro Perfurante", description: "Ignora 50% da defesa.", mpCost: 12, damageMultiplier: 1.4, isSpecial: false, effectKey: "pierce" },
      { id: "rain_of_arrows", name: "Chuva de Flechas", description: "ESPECIAL: Acerta todos os inimigos.", mpCost: 35, damageMultiplier: 2.0, isSpecial: true, effectKey: "aoe" },
    ],
  },
  {
    id: "necromancer",
    name: "Necromante",
    emoji: "💀",
    description: "Manipula os mortos para destruir seus inimigos.",
    passiveDescription: "Invocação: 40% de chance de invocar alma ao agir (+5 dano por 3 turnos).",
    baseAttributes: { hp: 80, maxHp: 80, mp: 100, maxMp: 100, attack: 10, defense: 3 },
    unlockedByDefault: true,
    skills: [
      { id: "soul_drain", name: "Dreno de Alma", description: "Rouba HP do inimigo.", mpCost: 10, damageMultiplier: 1.1, isSpecial: false, effectKey: "lifesteal" },
      { id: "bone_spear", name: "Lança de Osso", description: "Projétil de osso afiado.", mpCost: 8, damageMultiplier: 1.4, isSpecial: false },
      { id: "curse", name: "Maldição", description: "Reduz ataque do inimigo por 3 turnos.", mpCost: 12, damageMultiplier: 0.6, isSpecial: false, effectKey: "attack_down" },
      { id: "death_coil", name: "Espiral da Morte", description: "ESPECIAL: Invoca exército de esqueletos por 3 turnos.", mpCost: 50, damageMultiplier: 1.8, isSpecial: true, effectKey: "summon" },
    ],
  },
  {
    id: "paladin",
    name: "Paladino",
    emoji: "🛡️",
    description: "Guerreiro sagrado que cura aliados e causa dano divino.",
    passiveDescription: "Aura Sagrada: Cura 6 HP de todos os aliados no início de cada turno.",
    baseAttributes: { hp: 110, maxHp: 110, mp: 70, maxMp: 70, attack: 8, defense: 6 },
    unlockedByDefault: true,
    skills: [
      { id: "holy_strike", name: "Golpe Sagrado", description: "Dano sagrado básico.", mpCost: 5, damageMultiplier: 1.2, isSpecial: false },
      { id: "heal", name: "Cura Divina", description: "Restaura 25 HP de um aliado.", mpCost: 15, damageMultiplier: 0, isSpecial: false, effectKey: "heal_ally" },
      { id: "smite", name: "Punição Divina", description: "Dano extra contra chefes (×1.5).", mpCost: 12, damageMultiplier: 1.5, isSpecial: false, effectKey: "boss_bonus" },
      { id: "divine_shield", name: "Escudo Divino", description: "ESPECIAL: Grupo invulnerável por 1 turno + cura.", mpCost: 55, damageMultiplier: 0, isSpecial: true, effectKey: "group_shield" },
    ],
  },
  {
    id: "assassin",
    name: "Assassino",
    emoji: "🗡️",
    description: "Veloz e letal, especialista em golpes críticos e execuções.",
    passiveDescription: "Sombra: Primeiros ataques em cada alvo causam dano dobrado.",
    baseAttributes: { hp: 85, maxHp: 85, mp: 65, maxMp: 65, attack: 15, defense: 3 },
    unlockedByDefault: true,
    skills: [
      { id: "backstab", name: "Facada pelas Costas", description: "Ataque rápido e preciso.", mpCost: 0, damageMultiplier: 1.1, isSpecial: false },
      { id: "shadow_strike", name: "Golpe das Sombras", description: "Ataque furtivo de alto dano.", mpCost: 10, damageMultiplier: 1.7, isSpecial: false },
      { id: "smoke_bomb", name: "Bomba de Fumaça", description: "+10 DEF por 2 turnos.", mpCost: 8, damageMultiplier: 0, isSpecial: false, effectKey: "evasion" },
      { id: "death_mark", name: "Marca da Morte", description: "ESPECIAL: Executa inimigos abaixo de 30% HP.", mpCost: 45, damageMultiplier: 3.2, isSpecial: true, effectKey: "execute" },
    ],
  },
  // ─── NEW CLASS: Druid ──────────────────────────────────────────────────────
  {
    id: "druida",
    name: "Druida",
    emoji: "🌿",
    description: "Guardião da natureza. Cura, venenos e transformações.",
    passiveDescription: "Regeneração: Recupera 4 HP a cada turno automaticamente.",
    baseAttributes: { hp: 95, maxHp: 95, mp: 90, maxMp: 90, attack: 9, defense: 5 },
    unlockedByDefault: true,
    skills: [
      { id: "thorn_whip", name: "Chicote de Espinhos", description: "Causa dano e envenena o alvo.", mpCost: 0, damageMultiplier: 1.0, isSpecial: false, effectKey: "poison" },
      { id: "nature_heal", name: "Cura da Natureza", description: "Restaura 20 HP de todos os aliados.", mpCost: 20, damageMultiplier: 0, isSpecial: false, effectKey: "heal_all" },
      { id: "entangle", name: "Enredar", description: "Raízes imobilizam o inimigo (-4 DEF, 2 turnos).", mpCost: 12, damageMultiplier: 0.9, isSpecial: false, effectKey: "defense_down" },
      { id: "feral_form", name: "Forma Selvagem", description: "ESPECIAL: Transforma-se em fera — ×2.5 dano e AoE.", mpCost: 45, damageMultiplier: 2.5, isSpecial: true, effectKey: "aoe" },
    ],
  },
  // ─── NEW CLASS: Berserker ──────────────────────────────────────────────────
  {
    id: "berserker",
    name: "Berserker",
    emoji: "🪓",
    description: "Guerreiro selvagem que cresce mais forte com cada golpe recebido.",
    passiveDescription: "Ira do Sangue: Ao receber dano, +2 ATK permanente até o fim da batalha (máx +20).",
    baseAttributes: { hp: 115, maxHp: 115, mp: 35, maxMp: 35, attack: 12, defense: 3 },
    unlockedByDefault: true,
    skills: [
      { id: "axe_swing", name: "Machada em Arco", description: "Golpe selvagem com machado.", mpCost: 0, damageMultiplier: 1.2, isSpecial: false },
      { id: "blood_frenzy", name: "Frenesi Sangrento", description: "2 ataques rápidos em sequência.", mpCost: 8, damageMultiplier: 0.9, isSpecial: false, effectKey: "double_hit" },
      { id: "war_cry", name: "Grito de Guerra", description: "+5 ATK para todo o grupo por 2 turnos.", mpCost: 10, damageMultiplier: 0, isSpecial: false, effectKey: "group_attack_up" },
      { id: "rampage", name: "Carnificina", description: "ESPECIAL: Ataque devastador + stun. Quanto mais HP perdido, mais dano.", mpCost: 35, damageMultiplier: 2.8, isSpecial: true, effectKey: "rampage" },
    ],
  },
];

// ─── Combo Actions ────────────────────────────────────────────────────────────

export const COMBO_ACTIONS: ComboAction[] = [
  { id: "blazing_sword", name: "Espada em Chamas", description: "Guerreiro ataca com lâmina encantada de fogo. AoE massivo.", requiredClasses: ["warrior", "mage"], mpCostPerPlayer: 20, damageMultiplier: 3.5, effectKey: "aoe_fire", emoji: "🔥⚔️" },
  { id: "volley_cover", name: "Cobertura de Flechas", description: "Rajada enquanto Guerreiro protege. +DEF grupo + AoE.", requiredClasses: ["warrior", "ranger"], mpCostPerPlayer: 15, damageMultiplier: 2.8, effectKey: "aoe_cover", emoji: "🛡️🏹" },
  { id: "bone_armor_crush", name: "Esmagamento Ósseo", description: "Necromante cobre o Guerreiro com ossos. Ignora defesa.", requiredClasses: ["warrior", "necromancer"], mpCostPerPlayer: 18, damageMultiplier: 3.2, effectKey: "pierce_heavy", emoji: "💀⚔️" },
  { id: "sacred_charge", name: "Carga Sagrada", description: "Paladino abençoa o Guerreiro. Ataque + cura grupo.", requiredClasses: ["warrior", "paladin"], mpCostPerPlayer: 20, damageMultiplier: 2.5, effectKey: "heal_on_hit", emoji: "✨⚔️" },
  { id: "death_dance", name: "Dança da Morte", description: "Guerreiro distrai, Assassino desfere golpes letais.", requiredClasses: ["warrior", "assassin"], mpCostPerPlayer: 15, damageMultiplier: 3.8, effectKey: "multi_hit", emoji: "🗡️⚔️" },
  { id: "arcane_arrows", name: "Flechas Arcanas", description: "Mago encanta flechas do Arqueiro. AoE mágico.", requiredClasses: ["mage", "ranger"], mpCostPerPlayer: 22, damageMultiplier: 3.0, effectKey: "aoe_arcane", emoji: "🔮🏹" },
  { id: "soul_storm", name: "Tempestade de Almas", description: "Almas que o Mago explode em energia caótica. AoE massivo.", requiredClasses: ["mage", "necromancer"], mpCostPerPlayer: 30, damageMultiplier: 4.0, effectKey: "aoe_chaos", emoji: "💀🔮" },
  { id: "holy_nova", name: "Nova Sagrada", description: "Luz divina amplificada. AoE sagrado + cura grupo.", requiredClasses: ["mage", "paladin"], mpCostPerPlayer: 25, damageMultiplier: 2.8, effectKey: "aoe_holy_heal", emoji: "✨🔮" },
  { id: "shadow_blink", name: "Teletransporte Sombrio", description: "Mago teletransporta o Assassino. Ignora defesa.", requiredClasses: ["mage", "assassin"], mpCostPerPlayer: 25, damageMultiplier: 4.2, effectKey: "teleport_strike", emoji: "🗡️🔮" },
  { id: "plagued_volley", name: "Saraivada Pestilenta", description: "Flechas envenenadas. AoE + veneno em todos.", requiredClasses: ["ranger", "necromancer"], mpCostPerPlayer: 20, damageMultiplier: 2.5, effectKey: "aoe_poison", emoji: "💀🏹" },
  { id: "blessed_shot", name: "Tiro Abençoado", description: "Flecha sagrada. Dano + cura o Arqueiro.", requiredClasses: ["ranger", "paladin"], mpCostPerPlayer: 18, damageMultiplier: 3.0, effectKey: "holy_shot_heal", emoji: "✨🏹" },
  { id: "pincer_attack", name: "Ataque de Pinça", description: "Arqueiro distrai, Assassino ataca pelas costas. Crítico garantido.", requiredClasses: ["ranger", "assassin"], mpCostPerPlayer: 18, damageMultiplier: 3.6, effectKey: "guaranteed_crit", emoji: "🗡️🏹" },
  { id: "life_drain_nova", name: "Nova de Dreno Vital", description: "Drena vida e distribui para o grupo. Cura massiva.", requiredClasses: ["necromancer", "paladin"], mpCostPerPlayer: 25, damageMultiplier: 2.2, effectKey: "group_lifesteal", emoji: "💀✨" },
  { id: "spectral_blade", name: "Lâmina Espectral", description: "Assassino intangível. Atravessa qualquer defesa.", requiredClasses: ["necromancer", "assassin"], mpCostPerPlayer: 28, damageMultiplier: 4.5, effectKey: "phase_strike", emoji: "💀🗡️" },
  { id: "divine_judgement", name: "Julgamento Divino", description: "Paladino julga, Assassino executa. Mata abaixo de 50% HP.", requiredClasses: ["paladin", "assassin"], mpCostPerPlayer: 30, damageMultiplier: 3.5, effectKey: "execute_50", emoji: "✨🗡️" },
  // Druid combos
  { id: "nature_lightning", name: "Relâmpago da Natureza", description: "Druida canaliza trovão pelo Mago. Elétrico AoE.", requiredClasses: ["druida", "mage"], mpCostPerPlayer: 22, damageMultiplier: 3.2, effectKey: "aoe_arcane", emoji: "🌿🔮" },
  { id: "thorn_volley", name: "Saraivada de Espinhos", description: "Arqueiro dispara flechas encantadas com veneno da natureza.", requiredClasses: ["druida", "ranger"], mpCostPerPlayer: 18, damageMultiplier: 2.8, effectKey: "aoe_poison", emoji: "🌿🏹" },
  { id: "life_strike", name: "Golpe Vital", description: "Guerreiro ataca e Druida drena vida para curar o grupo.", requiredClasses: ["druida", "warrior"], mpCostPerPlayer: 18, damageMultiplier: 2.6, effectKey: "heal_on_hit", emoji: "🌿⚔️" },
  { id: "plague_nova", name: "Nova da Praga", description: "Necromante e Druida combinam poderes. Veneno em todos + AoE.", requiredClasses: ["druida", "necromancer"], mpCostPerPlayer: 24, damageMultiplier: 3.0, effectKey: "aoe_poison", emoji: "🌿💀" },
  { id: "divine_bloom", name: "Florescer Divino", description: "Cura massiva do grupo + dano sagrado em área.", requiredClasses: ["druida", "paladin"], mpCostPerPlayer: 25, damageMultiplier: 1.8, effectKey: "aoe_holy_heal", emoji: "🌿✨" },
  { id: "shadow_vines", name: "Trepadeiras Sombrias", description: "Druida imobiliza, Assassino executa. Crítico garantido.", requiredClasses: ["druida", "assassin"], mpCostPerPlayer: 20, damageMultiplier: 3.8, effectKey: "guaranteed_crit", emoji: "🌿🗡️" },
  { id: "feral_rage", name: "Fúria Selvagem", description: "Druida e Berserker em forma animal. Triplo AoE brutal.", requiredClasses: ["druida", "berserker"], mpCostPerPlayer: 25, damageMultiplier: 3.5, effectKey: "aoe_fire", emoji: "🌿🪓" },
  // Berserker combos
  { id: "thunder_axe", name: "Machada do Trovão", description: "Mago encanta a machada com raios. AoE elétrico devastador.", requiredClasses: ["berserker", "mage"], mpCostPerPlayer: 22, damageMultiplier: 3.6, effectKey: "aoe_arcane", emoji: "🪓🔮" },
  { id: "war_arrows", name: "Flechas de Guerra", description: "Arqueiro guia Berserker para alvos críticos. Duplo crítico.", requiredClasses: ["berserker", "ranger"], mpCostPerPlayer: 18, damageMultiplier: 3.2, effectKey: "guaranteed_crit", emoji: "🪓🏹" },
  { id: "blood_shield", name: "Escudo de Sangue", description: "Guerreiro e Berserker combinam força. Dano massivo + tankando.", requiredClasses: ["berserker", "warrior"], mpCostPerPlayer: 16, damageMultiplier: 3.4, effectKey: "multi_hit", emoji: "🪓⚔️" },
  { id: "cursed_rage", name: "Fúria Amaldiçoada", description: "Necromante amaldiçoa a fúria. Dano e drena HP de todos.", requiredClasses: ["berserker", "necromancer"], mpCostPerPlayer: 22, damageMultiplier: 3.8, effectKey: "group_lifesteal", emoji: "🪓💀" },
  { id: "holy_rampage", name: "Carnificina Sagrada", description: "Paladino abençoa o furor. AoE sagrado + cura absurda.", requiredClasses: ["berserker", "paladin"], mpCostPerPlayer: 25, damageMultiplier: 2.8, effectKey: "aoe_holy_heal", emoji: "🪓✨" },
  { id: "shadow_frenzy", name: "Frenesi das Sombras", description: "Berserker e Assassino — puro caos. Executa abaixo de 40% HP.", requiredClasses: ["berserker", "assassin"], mpCostPerPlayer: 22, damageMultiplier: 4.0, effectKey: "execute_50", emoji: "🪓🗡️" },
];

// ─── Monsters (Balanceados por nível relativo) ────────────────────────────────
// Fórmula: HP = baseHP * (1 + 0.12 * level), ATK/DEF escalam suavemente

const makeMonster = (
  id: string, name: string, emoji: string, level: number,
  hp: number, attack: number, defense: number,
  xp: number, coins: number, isBoss = false
): Monster => ({ id, name, emoji, level, hp, maxHp: hp, attack, defense, xpReward: xp, coinReward: coins, isBoss });

export const MONSTER_POOLS: Record<string, Monster[]> = {
  forest: [
    makeMonster("goblin", "Goblin", "👺", 1, 38, 5, 1, 18, 22),
    makeMonster("wolf", "Lobo Sombrio", "🐺", 1, 32, 6, 1, 15, 18),
    makeMonster("slime", "Lodo Verde", "🟢", 1, 50, 4, 3, 12, 15),
    makeMonster("bandit", "Bandido", "🦹", 2, 45, 7, 2, 20, 28),
    makeMonster("forest_troll", "Troll da Floresta", "👹", 2, 60, 6, 3, 22, 30),
  ],
  dungeon: [
    makeMonster("skeleton", "Esqueleto", "💀", 4, 70, 9, 3, 32, 38),
    makeMonster("zombie", "Zumbi", "🧟", 4, 90, 7, 4, 30, 35),
    makeMonster("dark_knight", "Cavaleiro Negro", "🖤", 5, 80, 11, 5, 38, 44),
    makeMonster("wraith", "Espectro", "👻", 4, 60, 13, 2, 35, 42),
    makeMonster("trap_golem", "Golem de Pedra", "🗿", 5, 100, 8, 7, 40, 46),
  ],
  abyss: [
    makeMonster("demon", "Demônio", "😈", 7, 110, 14, 6, 55, 65),
    makeMonster("lava_golem", "Golem de Lava", "🔥", 8, 135, 11, 9, 65, 75),
    makeMonster("void_spawn", "Filho do Vazio", "⚫", 7, 95, 16, 5, 60, 70),
    makeMonster("infernal_hound", "Cão Infernal", "🐕", 7, 85, 17, 4, 58, 68),
  ],
  volcano: [
    makeMonster("fire_elemental", "Elemental de Fogo", "🌋", 9, 120, 15, 6, 72, 82),
    makeMonster("magma_crab", "Caranguejo de Magma", "🦀", 9, 145, 12, 10, 68, 78),
    makeMonster("ash_wraith", "Espectro de Cinzas", "🌑", 10, 100, 19, 4, 78, 88),
    makeMonster("inferno_hound2", "Hound do Inferno", "🐕‍🦺", 10, 115, 18, 7, 82, 92),
  ],
  cemetery: [
    makeMonster("banshee", "Banshee", "👁️", 12, 130, 18, 5, 88, 98),
    makeMonster("grave_golem", "Golem Tumular", "🪨", 12, 175, 14, 13, 92, 102),
    makeMonster("lich_minion", "Servo do Lich", "🦴", 12, 115, 21, 4, 90, 100),
    makeMonster("death_knight2", "Cavaleiro da Morte", "☠️", 13, 160, 20, 9, 96, 110),
  ],
  ice_castle: [
    makeMonster("frost_golem", "Golem de Gelo", "🧊", 14, 190, 18, 14, 108, 120),
    makeMonster("ice_witch", "Bruxa do Gelo", "🧙‍♀️", 14, 145, 25, 7, 115, 125),
    makeMonster("frozen_knight", "Cavaleiro Congelado", "🛡️", 15, 210, 16, 16, 112, 122),
    makeMonster("blizzard_spirit", "Espírito da Nevasca", "❄️", 14, 125, 28, 5, 118, 128),
  ],
  void: [
    makeMonster("void_reaper", "Ceifador do Vazio", "🌀", 16, 210, 28, 10, 130, 148),
    makeMonster("shadow_titan", "Titã das Sombras", "👤", 17, 260, 24, 15, 142, 160),
    makeMonster("chaos_spawn", "Engendro do Caos", "💥", 16, 175, 32, 7, 136, 155),
    makeMonster("void_knight", "Cavaleiro do Vazio", "🌌", 17, 240, 26, 13, 138, 158),
  ],
};

export const BOSSES: Record<string, Monster> = {
  forest: makeMonster("forest_boss", "Rei Goblin", "👑", 3, 280, 12, 5, 120, 180, true),
  dungeon: makeMonster("dungeon_boss", "Lich Ancião", "🧙", 6, 480, 20, 9, 250, 350, true),
  abyss: makeMonster("abyss_boss", "Senhor do Abismo", "🌑", 9, 720, 28, 14, 520, 750, true),
  volcano: makeMonster("volcano_boss", "Dragão de Lava", "🐉", 11, 950, 33, 16, 720, 980, true),
  cemetery: makeMonster("cemetery_boss", "Rei dos Mortos", "💀", 13, 1150, 38, 18, 880, 1200, true),
  ice_castle: makeMonster("ice_boss", "Rainha Gélida", "👸", 15, 1350, 42, 22, 1050, 1450, true),
  void: makeMonster("void_boss", "Deus do Vazio", "🌌", 18, 1900, 52, 28, 1600, 2100, true),
};

// ─── Maps ────────────────────────────────────────────────────────────────────

export const MAP_DEFINITIONS: MapDefinition[] = [
  { id: "forest", name: "Floresta Amaldiçoada", description: "Árvores retorcidas escondem perigos nos cantos escuros.", difficulty: "Iniciante", defenseDebuff: 1.0, manaCostMultiplier: 1.0, monsterLevel: 1, monsters: MONSTER_POOLS.forest, boss: BOSSES.forest, requiredLevel: 1 },
  { id: "dungeon", name: "Masmorra Esquecida", description: "Corredores úmidos — defesa corrompida pela maldição.", difficulty: "Intermediário", defenseDebuff: 0.8, manaCostMultiplier: 1.0, monsterLevel: 4, monsters: MONSTER_POOLS.dungeon, boss: BOSSES.dungeon, requiredLevel: 2 },
  { id: "abyss", name: "Abismo Eterno", description: "O fundo do inferno. Mana escoa duas vezes mais rápido.", difficulty: "Avançado", defenseDebuff: 1.0, manaCostMultiplier: 2.0, monsterLevel: 7, monsters: MONSTER_POOLS.abyss, boss: BOSSES.abyss, requiredLevel: 4 },
  { id: "volcano", name: "Vulcão do Fim", description: "Calor extremo derrete armaduras. Defesa -30%.", difficulty: "Avançado", defenseDebuff: 0.7, manaCostMultiplier: 1.0, monsterLevel: 9, monsters: MONSTER_POOLS.volcano, boss: BOSSES.volcano, requiredLevel: 6 },
  { id: "cemetery", name: "Cemitério Esquecido", description: "Os mortos nunca dormem. Mana custa 1.5x mais.", difficulty: "Avançado", defenseDebuff: 1.0, manaCostMultiplier: 1.5, monsterLevel: 12, monsters: MONSTER_POOLS.cemetery, boss: BOSSES.cemetery, requiredLevel: 8 },
  { id: "ice_castle", name: "Castelo de Gelo Eterno", description: "O frio paralisa corpo e alma. Defesa -25% e Mana ×1.5.", difficulty: "Lendário", defenseDebuff: 0.75, manaCostMultiplier: 1.5, monsterLevel: 14, monsters: MONSTER_POOLS.ice_castle, boss: BOSSES.ice_castle, requiredLevel: 11 },
  { id: "void", name: "O Vazio Absoluto", description: "Além da realidade. Defesa anulada e Mana dobrada.", difficulty: "Lendário", defenseDebuff: 0.5, manaCostMultiplier: 2.0, monsterLevel: 16, monsters: MONSTER_POOLS.void, boss: BOSSES.void, requiredLevel: 14 },
];

// ─── Shop Items (Ampliado) ────────────────────────────────────────────────────

export const SHOP_ITEMS: Item[] = [
  // Armas
  { id: "iron_sword", name: "⚔️ Espada de Ferro", description: "+3 Ataque", cost: 28, attackBonus: 3, defenseBonus: 0, hpBonus: 0, mpBonus: 0 },
  { id: "steel_blade", name: "⚔️ Lâmina de Aço", description: "+5 Ataque", cost: 50, attackBonus: 5, defenseBonus: 0, hpBonus: 0, mpBonus: 0 },
  { id: "mithril_sword", name: "⚔️ Espada de Mithril", description: "+8 Ataque, +2 DEF", cost: 95, attackBonus: 8, defenseBonus: 2, hpBonus: 0, mpBonus: 0 },
  { id: "void_blade", name: "🌌 Lâmina do Vazio", description: "+12 Ataque", cost: 160, attackBonus: 12, defenseBonus: 0, hpBonus: 0, mpBonus: 0 },
  // Armaduras
  { id: "leather_armor", name: "🛡️ Couro Reforçado", description: "+3 Defesa", cost: 28, attackBonus: 0, defenseBonus: 3, hpBonus: 0, mpBonus: 0 },
  { id: "steel_shield", name: "🛡️ Escudo de Aço", description: "+5 Defesa", cost: 50, attackBonus: 0, defenseBonus: 5, hpBonus: 0, mpBonus: 0 },
  { id: "dragon_scale", name: "🐉 Escama de Dragão", description: "+7 Defesa, +15 HP", cost: 90, attackBonus: 0, defenseBonus: 7, hpBonus: 15, mpBonus: 0 },
  { id: "void_armor", name: "🌌 Armadura do Vazio", description: "+10 Defesa, +20 HP", cost: 155, attackBonus: 0, defenseBonus: 10, hpBonus: 20, mpBonus: 0 },
  // HP
  { id: "health_potion", name: "❤️ Poção de Vida", description: "+30 HP Máximo", cost: 30, attackBonus: 0, defenseBonus: 0, hpBonus: 30, mpBonus: 0 },
  { id: "elixir_hp", name: "❤️ Elixir Vital", description: "+55 HP Máximo", cost: 60, attackBonus: 0, defenseBonus: 0, hpBonus: 55, mpBonus: 0 },
  { id: "life_crystal", name: "💎 Cristal da Vida", description: "+90 HP Máximo, +3 DEF", cost: 120, attackBonus: 0, defenseBonus: 3, hpBonus: 90, mpBonus: 0 },
  // MP
  { id: "mana_crystal", name: "💧 Cristal de Mana", description: "+25 Mana Máxima", cost: 28, attackBonus: 0, defenseBonus: 0, hpBonus: 0, mpBonus: 25 },
  { id: "arcane_tome", name: "📖 Tomo Arcano", description: "+4 ATK, +40 Mana", cost: 75, attackBonus: 4, defenseBonus: 0, hpBonus: 0, mpBonus: 40 },
  { id: "mana_gem", name: "💎 Gema de Mana", description: "+70 Mana Máxima", cost: 95, attackBonus: 0, defenseBonus: 0, hpBonus: 0, mpBonus: 70 },
  // Híbridos
  { id: "enchanted_blade", name: "✨ Lâmina Encantada", description: "+5 ATK, +2 DEF", cost: 65, attackBonus: 5, defenseBonus: 2, hpBonus: 0, mpBonus: 0 },
  { id: "elixir_power", name: "⚗️ Elixir de Força", description: "+6 ATK, +4 DEF", cost: 100, attackBonus: 6, defenseBonus: 4, hpBonus: 0, mpBonus: 0 },
  { id: "war_band", name: "💢 Bracelete de Guerra", description: "+4 ATK, +20 HP", cost: 72, attackBonus: 4, defenseBonus: 0, hpBonus: 20, mpBonus: 0 },
  { id: "sage_ring", name: "💍 Anel do Sábio", description: "+3 ATK, +35 MP", cost: 72, attackBonus: 3, defenseBonus: 0, hpBonus: 0, mpBonus: 35 },
  { id: "hero_pendant", name: "🏅 Amuleto do Herói", description: "+5 ATK, +5 DEF, +20 HP", cost: 140, attackBonus: 5, defenseBonus: 5, hpBonus: 20, mpBonus: 0 },
  { id: "arcane_gauntlets", name: "🧤 Manoplas Arcanas", description: "+6 ATK, +30 MP, +10 HP", cost: 145, attackBonus: 6, defenseBonus: 0, hpBonus: 10, mpBonus: 30 },
  // Lendários
  { id: "chaos_shard", name: "💥 Fragmento do Caos", description: "+10 ATK, +10 DEF, +30 HP", cost: 220, attackBonus: 10, defenseBonus: 10, hpBonus: 30, mpBonus: 0 },
  { id: "void_essence", name: "🌌 Essência do Vazio", description: "+8 ATK, +8 DEF, +50 MP", cost: 220, attackBonus: 8, defenseBonus: 8, hpBonus: 0, mpBonus: 50 },
];

// ─── XP Table ─────────────────────────────────────────────────────────────────

export const XP_TO_NEXT_LEVEL = (level: number): number => level * 45 + 55;

// ─── Combo Lookup ─────────────────────────────────────────────────────────────

export function findComboForClasses(classA: string, classB: string): ComboAction | undefined {
  return COMBO_ACTIONS.find(
    (c) =>
      (c.requiredClasses[0] === classA && c.requiredClasses[1] === classB) ||
      (c.requiredClasses[0] === classB && c.requiredClasses[1] === classA)
  );
}