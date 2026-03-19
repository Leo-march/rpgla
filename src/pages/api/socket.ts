import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  GameState,
  CombatEntry,
} from "@/types/game";
import {
  createInitialGameState,
  createPlayer,
  processPlayerAction,
  processMonsterTurn,
  checkGameEnd,
  checkAllPlayersActed,
  buyItem,
  spawnMonstersForMap,
  resetForNewMap,
  nanoid,
} from "@/lib/gameEngine";
import { MAP_DEFINITIONS, BOSSES } from "@/data/gameData";

type SocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
type ResWithSocket = NextApiResponse & { socket: { server: HttpServer & { io?: SocketServer } } };

const rooms: Record<string, GameState> = {};

let io: SocketServer | null = null;

function getOrCreateRoom(roomId: string): GameState {
  if (!rooms[roomId]) {
    rooms[roomId] = createInitialGameState(roomId);
  }
  return rooms[roomId];
}

function broadcast(roomId: string, state: GameState) {
  io?.to(roomId).emit("game_state", state);
}

function broadcastLog(roomId: string, entries: CombatEntry[]) {
  entries.forEach((entry) => io?.to(roomId).emit("combat_log_entry", entry));
}

// ─── Post-action resolution ───────────────────────────────────────────────────
// Called after every player action to check if we should advance to monster turn

function resolveAfterAction(roomId: string) {
  const state = rooms[roomId];
  if (!state || state.phase !== "playing") return;

  const allActed = checkAllPlayersActed(state);
  if (!allActed) {
    broadcast(roomId, state);
    return;
  }

  // Check game end after player phase
  const afterPlayers = checkGameEnd(state);
  if (afterPlayers === "players") {
    // All enemies defeated
    if (state.bossDefeated[state.currentMap!] && state.monsters.length === 0 && !state.currentBoss) {
      state.phase = "victory";
      state.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: "🎉 VITÓRIA! O mapa foi conquistado!", type: "system" });
    } else {
      state.phase = "shop";
      // FIX: reset hasActedThisTurn so players can click "Pronto" in shop
      state.players.forEach((p) => (p.hasActedThisTurn = false));
      state.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: "🏆 Todos os inimigos derrotados! Visitem a loja!", type: "system" });
    }
    broadcast(roomId, state);
    return;
  }

  // Monster turn
  state.turnPhase = "monster_turn";
  broadcast(roomId, state);

  const { state: afterMonsters, newEntries: monsterEntries } = processMonsterTurn(state);
  rooms[roomId] = afterMonsters;
  broadcastLog(roomId, monsterEntries);

  const finalResult = checkGameEnd(afterMonsters);

  if (finalResult === "monsters") {
    afterMonsters.phase = "game_over";
    afterMonsters.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: "💀 O grupo foi aniquilado! Game Over.", type: "system" });
  } else if (finalResult === "players") {
    if (afterMonsters.bossDefeated[afterMonsters.currentMap!] && afterMonsters.monsters.length === 0 && !afterMonsters.currentBoss) {
      afterMonsters.phase = "victory";
      afterMonsters.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: "🎉 VITÓRIA! O mapa foi conquistado!", type: "system" });
    } else {
      afterMonsters.phase = "shop";
      // FIX: reset hasActedThisTurn so players can click "Pronto" in shop
      afterMonsters.players.forEach((p) => (p.hasActedThisTurn = false));
      afterMonsters.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: "🏆 Onda vencida! Visite a loja!", type: "system" });
    }
  } else {
    // Still fighting — spawn new monsters or boss if needed
    afterMonsters.turnPhase = "player_actions";

    if (
      afterMonsters.turnNumber % 3 === 0 &&
      !afterMonsters.bossDefeated[afterMonsters.currentMap!] &&
      !afterMonsters.currentBoss &&
      afterMonsters.monsters.length === 0
    ) {
      afterMonsters.currentBoss = { ...BOSSES[afterMonsters.currentMap!], id: nanoid() };
      afterMonsters.combatLog.push({
        id: nanoid(), timestamp: Date.now(),
        message: `⚠️ ${afterMonsters.currentBoss.name} emergiu das sombras! BOSS BATTLE!`,
        type: "system",
      });
    } else if (afterMonsters.monsters.length === 0 && !afterMonsters.currentBoss) {
      afterMonsters.monsters = spawnMonstersForMap(afterMonsters.currentMap!);
      afterMonsters.combatLog.push({
        id: nanoid(), timestamp: Date.now(),
        message: `🔁 Nova onda! (${afterMonsters.monsters.length} inimigos)`,
        type: "system",
      });
    }
  }

  broadcast(roomId, rooms[roomId]);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default function handler(req: NextApiRequest, res: ResWithSocket) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    res.socket.server,
    {
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ["polling", "websocket"],
      cors: { origin: "*", methods: ["GET", "POST"] },
      allowEIO3: true,
    }
  );
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_room", ({ roomId, playerName, classType }) => {
      const state = getOrCreateRoom(roomId);

      if (state.players.length >= 6) { socket.emit("error", "Sala cheia!"); return; }
      if (state.phase !== "lobby") { socket.emit("error", "Partida já em andamento."); return; }
      if (!state.unlockedClasses.includes(classType)) { socket.emit("error", "Classe não disponível."); return; }

      const player = createPlayer(socket.id, playerName, classType);
      state.players.push(player);
      socket.join(roomId);

      state.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `👤 ${playerName} (${classType}) entrou. (${state.players.length}/6)`, type: "system" });
      broadcast(roomId, state);
    });

    socket.on("select_map", (mapId) => {
      const room = Object.values(rooms).find((r) => r.players.some((p) => p.id === socket.id));
      if (!room) return;
      if (room.players[0].id !== socket.id) { socket.emit("error", "Somente o líder pode escolher o mapa."); return; }

      room.currentMap = mapId;
      room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `🗺️ Mapa: ${MAP_DEFINITIONS.find((m) => m.id === mapId)?.name}`, type: "system" });
      broadcast(room.roomId, room);
    });

    socket.on("start_game", () => {
      const room = Object.values(rooms).find((r) => r.players.some((p) => p.id === socket.id));
      if (!room || room.players[0].id !== socket.id || !room.currentMap) return;

      room.phase = "playing";
      room.monsters = spawnMonstersForMap(room.currentMap);
      room.players.forEach((p) => (p.hasActedThisTurn = false));
      room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `⚔️ A batalha começou! ${room.monsters.length} inimigo(s)!`, type: "system" });
      broadcast(room.roomId, room);
    });

    socket.on("player_action", ({ actionType, skillId, targetId, itemId, comboActionId, partnerId }) => {
      const room = Object.values(rooms).find((r) => r.players.some((p) => p.id === socket.id));
      if (!room || room.phase !== "playing") return;

      const player = room.players.find((p) => p.id === socket.id);

      // For combo_accept, the partner hasn't "acted" yet but we still allow it
      if (actionType !== "combo_accept" && actionType !== "combo_cancel" && actionType !== "combo_propose") {
        if (!player || player.hasActedThisTurn || player.attributes.hp <= 0) return;
      } else {
        if (!player || player.attributes.hp <= 0) return;
      }

      const { state: newState, newEntries } = processPlayerAction(
        room,
        socket.id,
        actionType,
        { skillId, targetId, itemId, comboActionId, partnerId }
      );
      rooms[room.roomId] = newState;
      broadcastLog(room.roomId, newEntries);

      // For combo_propose, don't advance turn — just broadcast state
      if (actionType === "combo_propose" || actionType === "combo_cancel") {
        broadcast(room.roomId, newState);
        return;
      }

      resolveAfterAction(room.roomId);
    });

    socket.on("buy_item", (itemId) => {
      const room = Object.values(rooms).find((r) => r.players.some((p) => p.id === socket.id));
      if (!room || room.phase !== "shop") return;

      const { state: newState, newEntries } = buyItem(room, socket.id, itemId);
      rooms[room.roomId] = newState;
      broadcastLog(room.roomId, newEntries);
      broadcast(room.roomId, newState);
    });

    // ── Ready (shop → battle) ──────────────────────────────────────────────
    socket.on("ready", () => {
      const room = Object.values(rooms).find((r) => r.players.some((p) => p.id === socket.id));
      if (!room || room.phase !== "shop") return;

      const player = room.players.find((p) => p.id === socket.id)!;
      player.hasActedThisTurn = true;

      // FIX: Only count alive + connected players for "ready" check
      const activePlayers = room.players.filter((p) => p.attributes.hp > 0 && p.isConnected);
      const allReady = activePlayers.every((p) => p.hasActedThisTurn);

      room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `${player.name} está pronto! (${activePlayers.filter((p) => p.hasActedThisTurn).length}/${activePlayers.length})`, type: "system" });

      if (allReady) {
        room.phase = "playing";
        room.players.forEach((p) => (p.hasActedThisTurn = false));
        room.pendingCombos = [];

        if (room.monsters.length === 0 && !room.currentBoss) {
          room.monsters = spawnMonstersForMap(room.currentMap!);
        }

        room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: "⚔️ De volta à batalha!", type: "system" });
      }

      broadcast(room.roomId, room);
    });

    socket.on("return_to_map_select", () => {
      const room = Object.values(rooms).find((r) => r.players.some((p) => p.id === socket.id));
      if (!room) return;
      if (room.players[0].id !== socket.id) { socket.emit("error", "Somente o líder pode escolher novo mapa."); return; }
      rooms[room.roomId] = resetForNewMap(room);
      broadcast(room.roomId, rooms[room.roomId]);
    });

    socket.on("disconnect", () => {
      Object.values(rooms).forEach((room) => {
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.isConnected = false;
          room.combatLog.push({ id: nanoid(), timestamp: Date.now(), message: `🔌 ${player.name} desconectou.`, type: "system" });

          // If disconnected player was holding up the turn, advance it
          if (room.phase === "playing") {
            resolveAfterAction(room.roomId);
          } else if (room.phase === "shop") {
            const activePlayers = room.players.filter((p) => p.attributes.hp > 0 && p.isConnected);
            if (activePlayers.length > 0 && activePlayers.every((p) => p.hasActedThisTurn)) {
              room.phase = "playing";
              room.players.forEach((p) => (p.hasActedThisTurn = false));
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