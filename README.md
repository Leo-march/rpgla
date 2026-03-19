# Dungeon Chronicles — RPG Multijogador

RPG de turnos em tempo real para **4 jogadores** com Socket.io + Next.js + Tailwind CSS.

---

## 🚀 Como Rodar

### 1. Instalar dependências
```bash
npm install
```

### 2. Instalar o nanoid (necessário para IDs únicos)
```bash
npm install nanoid@3
```
> Use a versão 3 do nanoid pois é CommonJS-compatible com Next.js pages router.

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

### 4. Acessar no navegador
```
http://localhost:3000
```

---

## 🎮 Como Jogar

1. **Todos os 4 jogadores** abrem `http://localhost:3000` (ou o IP da máquina na rede local)
2. Todos digitam o **mesmo código de sala** (ex: `DUNGEON01`)
3. Cada um escolhe seu **nome** e **classe**
4. O **líder** (primeiro a entrar) escolhe o mapa e clica em **Iniciar Aventura**
5. Cada jogador age em seu turno clicando nas habilidades
6. Após todos agirem → monstros atacam → novo turno começa
7. Entre ondas → loja para gastar moedas coletivas

---

## 🏗️ Arquitetura

```
src/
├── pages/
│   ├── index.tsx          # Orquestrador de telas
│   ├── _app.tsx
│   ├── _document.tsx
│   └── api/
│       └── socket.ts      # Servidor Socket.io (estado em memória)
├── components/
│   ├── JoinScreen.tsx     # Tela de entrada
│   ├── LobbyScreen.tsx    # Sala de espera
│   ├── BattleScreen.tsx   # Tela de combate
│   ├── ActionPanel.tsx    # Painel de ações do jogador
│   ├── PlayerCard.tsx     # Card do personagem
│   ├── MonsterCard.tsx    # Card do monstro
│   ├── CombatLog.tsx      # Log de combate em tempo real
│   ├── ShopPanel.tsx      # Loja entre ondas
│   └── EndScreens.tsx     # Vitória / Game Over
├── store/
│   └── gameStore.ts       # Zustand store + Socket.io client
├── lib/
│   └── gameEngine.ts      # Toda a lógica de combate (servidor)
├── data/
│   └── gameData.ts        # Classes, monstros, mapas, itens
├── types/
│   └── game.ts            # Tipos TypeScript completos
└── styles/
    └── globals.css        # Tailwind + fontes + animações
```

---

## ⚔️ Classes Disponíveis

| Classe       | Desbloqueio       | Passiva                                     |
|-------------|-------------------|---------------------------------------------|
| Guerreiro   | Padrão            | 20% de chance de bloquear todo dano          |
| Mago        | Padrão            | 25% de chance de dano dobrado em magias      |
| Arqueiro    | Padrão            | Críticos (dado 9-10) causam dano triplo       |
| Necromante  | Boss Floresta     | 35% de chance de invocar alma (+4 dano/3t)   |
| Paladino    | Boss Masmorra     | Cura 5 HP de aliados a cada turno            |
| Assassino   | Boss Abismo       | Primeiros ataques causam dano dobrado         |

---

## 🗺️ Mapas

| Mapa              | Dificuldade   | Modificador                    |
|-------------------|---------------|--------------------------------|
| Floresta Amaldiçoada | Iniciante  | Normal                         |
| Masmorra Esquecida   | Intermediário | -20% Defesa de todos          |
| Abismo Eterno        | Avançado   | Custo de Mana dobrado          |

---

## ⚠️ Nota Técnica

O estado da partida fica em **memória RAM do servidor**. Se o servidor reiniciar, a partida é perdida. Isso é intencional para esta arquitetura sem banco de dados.

---

## 🔧 Troubleshooting

- **"Cannot find module 'nanoid'"** → `npm install nanoid@3`
- **Websocket não conecta** → Verifique se `reactStrictMode: false` no `next.config.js`
- **4 jogadores na mesma rede local** → Use o IP da máquina host (ex: `http://192.168.1.x:3000`)
