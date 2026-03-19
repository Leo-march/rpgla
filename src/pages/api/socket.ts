import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";
import { ServerToClientEvents, ClientToServerEvents, GameState, CombatEntry } from "@/types/game";
import {
  createInitialGameState, createPlayer, processPlayerAction,
  processMonsterTurn, processSingleMonsterAttack, processInitiativeActorAction,
  checkGameEnd, checkAllPlayersActed, buyItem, spawnMonstersForMap,
  resetForNewMap, rollInitiative, getNextActorInInitiative, isRoundComplete, nanoid,
} from "@/lib/gameEngine";
import { MAP_DEFINITIONS, BOSSES } from "@/data/gameData";

type SocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
type ResWithSocket = NextApiResponse & { socket: { server: HttpServer & { io?: SocketServer } } };

const rooms: Record<string, GameState> = {};
let io: SocketServer | null = null;

function getOrCreateRoom(roomId: string): GameState {
  if (!rooms[roomId]) rooms[roomId] = createInitialGameState(roomId);
  return rooms[roomId];
}

function broadcast(roomId: string, state: GameState) {
  io?.to(roomId).emit("game_state", state);
}

function broadcastLog(roomId: string, entries: CombatEntry[]) {
  entries.forEach(entry => io?.to(roomId).emit("combat_log_entry", entry));
}

// ─── Spawn next wave or boss ──────────────────────────────────────────────────

function spawnNextWave(state: GameState): CombatEntry[] {
  const log: CombatEntry[] = [];

  // Check if it's time for a boss
  const wavesSinceLastBoss = state.turnNumber % 4;
  if (
    wavesSinceLastBoss === 0 &&
    !state.bossDefeated[state.currentMap!] &&
    !state.currentBoss &&
    state.turnNumber > 0
  ) {
    state.currentBoss = { ...BOSSES[state.currentMap!], id: nanoid() };
    log.push({ id: nanoid(), timestamp: Date.now(), message: `⚠️ ${state.currentBoss.name} emerge das sombras! BOSS BATTLE!`, type: "system" });
  } else if (state.monsters.length === 0 && !state.currentBoss) {
    state.monsters = spawnMonstersForMap(state.currentMap!);
    log.push({ id: nanoid(), timestamp: Date.now(), message: `🔁 Nova onda! (${state.monsters.length} inimigos)`, type: "system" });
  }

  return log;
}

// ─── Start a new round (roll initiative) ─────────────────────────────────────

function startNewRound(roomId: string) {
  const state = rooms[roomId];
  if (!state || state.phase !== "playing") return;

  // Check if we need to spawn before rolling
  const noEnemies = state.monsters.filter(m => m.hp > 0).length === 0 && (!state.currentBoss || state.currentBoss.hp <= 0);
  if (noEnemies) {
    const spawnLogs = spawnNextWave(state);
    broadcastLog(roomId, spawnLogs);
  }

  // Roll initiative for the new round
  const { state: stateAfterInit, newEntries: initEntries } = rollInitiative(state);
  rooms[roomId] = stateAfterInit;
  broadcastLog(roomId, initEntries);
  broadcast(roomId, stateAfterInit);

  // If the first actor is a monster, process it automatically after a short delay
  const firstActor = getNextActorInInitiative(stateAfterInit);
  if (firstActor && firstActor.isMonster) {
    setTimeout(() => resolveAfterAction(roomId), 800);
  }
}

// ─── Post-action resolution ───────────────────────────────────────────────────
// Called after every action to advance initiative or end round

function resolveAfterAction(roomId: string) {
  const state = rooms[roomId];
  if (!state || state.phase !== "playing") return;

  // Check game end first
  const result = checkGameEnd(state);
  if (result === "monsters") {
    state.phase = "game_over";
    const entry = { id: nanoid(), timestamp: Date.now(), message: "💀 O grupo foi aniquilado! Game Over.", type: "system" as const };
    state.combatLog.push(entry);
    broadcastLog(roomId, [entry]);
    broadcast(roomId, state);
    return;
  }

  if (result === "players") {
    // All enemies defeated — check if boss was defeated
    if (state.bossDefeated[state.currentMap!] && state.monsters.filter(m => m.hp > 0).length === 0) {
      state.phase = "victory";
      const entry = { id: nanoid(), timestamp: Date.now(), message: "🎉 VITÓRIA! O mapa foi conquistado!", type: "system" as const };
      state.combatLog.push(entry);
      broadcastLog(roomId, [entry]);
      broadcast(roomId, state);
      return;
    }

    // Wave cleared — go to shop
    state.phase = "shop";
    state.players.forEach(p => (p.hasActedThisTurn = false));
    const entry = { id: nanoid(), timestamp: Date.now(), message: "🏆 Onda vencida! Visitem a loja!", type: "system" as const };
    state.combatLog.push(entry);
    broadcastLog(roomId, [entry]);
    broadcast(roomId, state);
    return;
  }

  // Find next actor in initiative
  const nextActor = getNextActorInInitiative(state);

  if (!nextActor) {
    // All actors have gone — end of round, start a new one
    endOfRound(roomId);
    return;
  }

  if (nextActor.isMonster) {
    // Monster's turn — auto-process it
    const log: CombatEntry[] = [];
    const monster = [...state.monsters, ...(state.currentBoss ? [state.currentBoss] : [])].find(m => m.id === nextActor.id);
    if (monster && monster.hp > 0) {
      processSingleMonsterAttack(state, monster, log);
    }
    nextActor.acted = true;
    broadcastLog(roomId, log);
    broadcast(roomId, state);

    // After monster acts, check again
    setTimeout(() => resolveAfterAction(roomId), 600);
  } else {
    // Player's turn — just broadcast, wait for player input
    broadcast(roomId, state);
  }
}

// ─── End of round ─────────────────────────────────────────────────────────────

function endOfRound(roomId: string) {
  const state = rooms[roomId];
  if (!state) return;

  const log: CombatEntry[] = [];

  // Paladin aura
  const paladin = state.players.find(p => p.classType === "paladin" && p.attributes.hp > 0);
  if (paladin) {
    state.players.forEach(p => {
      if (p.attributes.hp > 0) {
        p.attributes.hp = Math.min(p.attributes.maxHp, p.attributes.hp + 6);
      }
    });
    log.push({ id: nanoid(), timestamp: Date.now(), message: `✨ Fim da rodada — ${paladin.name} cura o grupo em 6 HP!`, type: "special" });
  }

  // Tick status effects
  state.players.forEach(p => {
    p.statusEffects.forEach(se => {
      if (se.damagePerTurn && se.damagePerTurn > 0 && p.attributes.hp > 0) {
        p.attributes.hp = Math.max(0, p.attributes.hp - se.damagePerTurn);
        log.push({ id: nanoid(), timestamp: Date.now(), message: `☠️ ${p.name} sofre ${se.damagePerTurn} DoT`, type: "system" });
      }
    });
    p.statusEffects = p.statusEffects.map(se => ({ ...se, turnsLeft: se.turnsLeft - 1 })).filter(se => {
      if (se.turnsLeft <= 0) {
        log.push({ id: nanoid(), timestamp: Date.now(), message: `${p.name}: "${se.name}" expirou.`, type: "system" });
        return false;
      }
      return true;
    });
    if (p.summonActive) {
      p.summonTurnsLeft--;
      if (p.summonTurnsLeft <= 0) { p.summonActive = false; }
    }
    // Druid regen
    if (p.classType === "druida" && p.attributes.hp > 0) {
      p.attributes.hp = Math.min(p.attributes.maxHp, p.attributes.hp + 4);
      log.push({ id: nanoid(), timestamp: Date.now(), message: `🌿 ${p.name} regenerou 4 HP`, type: "special" });
    }
  });

  broadcastLog(roomId, log);

  // Reset for next round
  state.players.forEach(p => { p.hasActedThisTurn = false; p.pendingComboId = undefined; p.initiativeRoll = undefined; });
  state.pendingCombos = [];
  state.initiativeOrder = [];
  state.initiativeRolled = false;
  state.turnNumber++;

  // Check game end after status effects
  const result = checkGameEnd(state);
  if (result === "monsters") {
    state.phase = "game_over";
    const entry = { id: nanoid(), timestamp: Date.now(), message: "💀 O grupo foi aniquilado! Game Over.", type: "system" as const };
    state.combatLog.push(entry);
    broadcastLog(roomId, [entry]);
    broadcast(roomId, state);
    return;
  }

  if (result === "players") {
    if (state.bossDefeated[state.currentMap!] && state.monsters.filter(m => m.hp > 0).length === 0) {
      state.phase = "victory";
      const entry = { id: nanoid(), timestamp: Date.now(), message: "🎉 VITÓRIA! O mapa foi conquistado!", type: "system" as const };
      state.combatLog.push(entry);
      broadcastLog(roomId, [entry]);
      broadcast(roomId, state);
    } else {
      state.phase = "shop";
      state.players.forEach(p => (p.hasActedThisTurn = false));
      const entry = { id: nanoid(), timestamp: Date.now(), message: "🏆 Onda vencida! Visitem a loja!", type: "system" as const };
      state.combatLog.push(entry);
      broadcastLog(roomId, [entry]);
      broadcast(roomId, state);
    }
    return;
  }

  // Start new round — auto-roll initiative
  broadcast(roomId, state);
  setTimeout(() => startNewRound(roomId), 800);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: ResWithSocket) {
  if (res.socket.server.io) { res.end(); return; }

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    transports: ["polling", "websocket"],
    cors: { origin: "*", methods: ["GET", "POST"] },
    allowEIO3: true,
  });
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_room", ({ roomId, playerName, classType }) => {
      const state = getOrCreateRoom(roomId);
      if (state.players.length >= 6) { socket.emit("error", "Sala cheia!"); return; }
      if (state.phase !== "lobby") { socket.emit("error", "Partida em andamento."); return; }

      const player = createPlayer(socket.id, playerName, classType);
      state.players.push(player);
      socket.join(roomId);
      state.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `👤 ${playerName} (${classType}) entrou. (${state.players.length}/6)`, type: "system" });
      broadcast(roomId, state);
    });

    socket.on("select_map", (mapId) => {
      const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
      if (!room) return;
      if (room.players[0].id !== socket.id) { socket.emit("error", "Somente o líder pode escolher o mapa."); return; }
      room.currentMap = mapId;
      room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `🗺️ Mapa: ${MAP_DEFINITIONS.find(m => m.id === mapId)?.name}`, type: "system" });
      broadcast(room.roomId, room);
    });

    socket.on("start_game", () => {
      const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
      if (!room || room.players[0].id !== socket.id || !room.currentMap) return;
      room.phase = "playing";
      room.monsters = spawnMonstersForMap(room.currentMap);
      room.players.forEach(p => (p.hasActedThisTurn = false));
      room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `⚔️ A batalha começou! ${room.monsters.length} inimigo(s)!`, type: "system" });
      broadcast(room.roomId, room);
      // Auto-roll initiative
      setTimeout(() => startNewRound(room.roomId), 500);
    });

    socket.on("player_action", ({ actionType, skillId, targetId, itemId, comboActionId, partnerId }) => {
      const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
      if (!room || room.phase !== "playing") return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.attributes.hp <= 0) return;

      // combo_accept and combo_cancel: only valid on THIS player's turn (or cancel always allowed)
      if (actionType === "combo_accept") {
        if (player.hasActedThisTurn) return;
        const nextActor = getNextActorInInitiative(room);
        if (!nextActor || nextActor.id !== socket.id) {
          socket.emit("error", "Você só pode aceitar um combo no seu turno!");
          return;
        }
      }

      if (actionType !== "combo_accept" && actionType !== "combo_cancel" && actionType !== "combo_propose") {
        if (player.hasActedThisTurn) return;
        // Verify it's this player's turn in initiative order
        const nextActor = getNextActorInInitiative(room);
        if (!nextActor || nextActor.id !== socket.id) {
          socket.emit("error", "Não é seu turno!");
          return;
        }
      } else {
        if (player.attributes.hp <= 0) return;
      }

      const { state: newState, newEntries } = processPlayerAction(room, socket.id, actionType, { skillId, targetId, itemId, comboActionId, partnerId });
      rooms[room.roomId] = newState;
      broadcastLog(room.roomId, newEntries);

      if (actionType === "combo_propose" || actionType === "combo_cancel") {
        broadcast(room.roomId, newState);
        return;
      }

      resolveAfterAction(room.roomId);
    });

    socket.on("buy_item", (itemId) => {
      const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
      if (!room || room.phase !== "shop") return;
      const { state: newState, newEntries } = buyItem(room, socket.id, itemId);
      rooms[room.roomId] = newState;
      broadcastLog(room.roomId, newEntries);
      broadcast(room.roomId, newState);
    });

    socket.on("ready", () => {
      const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
      if (!room || room.phase !== "shop") return;
      const player = room.players.find(p => p.id === socket.id)!;
      player.hasActedThisTurn = true;

      const activePlayers = room.players.filter(p => p.attributes.hp > 0 && p.isConnected);
      const allReady = activePlayers.every(p => p.hasActedThisTurn);

      room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `${player.name} está pronto! (${activePlayers.filter(p => p.hasActedThisTurn).length}/${activePlayers.length})`, type: "system" });

      if (allReady) {
        room.phase = "playing";
        room.players.forEach(p => (p.hasActedThisTurn = false));
        room.pendingCombos = [];
        room.initiativeOrder = [];
        room.initiativeRolled = false;
        if (room.monsters.length === 0 && !room.currentBoss) {
          room.monsters = spawnMonstersForMap(room.currentMap!);
        }
        room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: "⚔️ De volta à batalha!", type: "system" });
        broadcast(room.roomId, room);
        setTimeout(() => startNewRound(room.roomId), 500);
      } else {
        broadcast(room.roomId, room);
      }
    });

    socket.on("return_to_map_select", () => {
      const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
      if (!room) return;
      if (room.players[0].id !== socket.id) { socket.emit("error", "Somente o líder pode escolher novo mapa."); return; }
      rooms[room.roomId] = resetForNewMap(room);
      broadcast(room.roomId, rooms[room.roomId]);
    });

    socket.on("disconnect", () => {
      Object.values(rooms).forEach(room => {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          player.isConnected = false;
          room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `🔌 ${player.name} desconectou.`, type: "system" });

          if (room.phase === "playing") {
            // Mark initiative entry as acted if disconnected
            const initEntry = room.initiativeOrder.find(e => e.id === socket.id);
            if (initEntry) initEntry.acted = true;
            resolveAfterAction(room.roomId);
          } else if (room.phase === "shop") {
            const activePlayers = room.players.filter(p => p.attributes.hp > 0 && p.isConnected);
            if (activePlayers.length > 0 && activePlayers.every(p => p.hasActedThisTurn)) {
              room.phase = "playing";
              room.players.forEach(p => (p.hasActedThisTurn = false));
              if (room.monsters.length === 0 && !room.currentBoss) {
                room.monsters = spawnMonstersForMap(room.currentMap!);
              }
            }
            broadcast(room.roomId, room);
          } else {
            broadcast(room.roomId, room);
          }
        }
      });
    });
  });

  res.end();
}