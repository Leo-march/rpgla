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
  buyItem,
  spawnMonstersForMap,
  resetForNewMap,
  nanoid,
} from "@/lib/gameEngine";
import { MAP_DEFINITIONS, BOSSES } from "@/data/gameData";

// ─── Global in-memory state ───────────────────────────────────────────────────
// NOTE: This resets on server restart (by design for this architecture)

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

function startNextWave(roomId: string) {
  const state = rooms[roomId];
  if (!state) return;

  const mapDef = MAP_DEFINITIONS.find((m) => m.id === state.currentMap)!;
  const newMonsters = spawnMonstersForMap(state.currentMap!);
  state.monsters = newMonsters;

  const hasBoss =
    state.bossDefeated[state.currentMap!] === false &&
    newMonsters.length === 0;

  if (
    state.turnNumber > 0 &&
    state.turnNumber % 3 === 0 &&
    !state.bossDefeated[state.currentMap!] &&
    !state.currentBoss
  ) {
    state.currentBoss = { ...BOSSES[state.currentMap!], id: nanoid() };
    state.monsters = [];
    broadcastLog(roomId, [
      {
        id: nanoid(),
        timestamp: Date.now(),
        message: `⚠️ ATENÇÃO: ${state.currentBoss.name} apareceu! Boss Battle!`,
        type: "system",
      },
    ]);
  }
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
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      allowEIO3: true,
    }
  );
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ── Join Room ──────────────────────────────────────────────────────────
    socket.on("join_room", ({ roomId, playerName, classType }) => {
      const state = getOrCreateRoom(roomId);

      if (state.players.length >= 4) {
        socket.emit("error", "Sala cheia! Máximo de 4 jogadores.");
        return;
      }
      if (state.phase !== "lobby") {
        socket.emit("error", "Partida já em andamento.");
        return;
      }

      if (!state.unlockedClasses.includes(classType)) {
        socket.emit("error", "Classe não desbloqueada.");
        return;
      }

      const player = createPlayer(socket.id, playerName, classType);
      state.players.push(player);
      socket.join(roomId);

      state.combatLog.push({
        id: nanoid(),
        timestamp: Date.now(),
        message: `👤 ${playerName} (${classType}) entrou na sala. (${state.players.length}/4)`,
        type: "system",
      });

      broadcast(roomId, state);
    });

    // ── Select Map ─────────────────────────────────────────────────────────
    socket.on("select_map", (mapId) => {
      const room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === socket.id)
      );
      if (!room) return;
      if (room.players[0].id !== socket.id) {
        socket.emit("error", "Somente o líder pode escolher o mapa.");
        return;
      }

      room.currentMap = mapId;
      room.combatLog.push({
        id: nanoid(),
        timestamp: Date.now(),
        message: `🗺️ Mapa selecionado: ${MAP_DEFINITIONS.find((m) => m.id === mapId)?.name}`,
        type: "system",
      });
      broadcast(room.roomId, room);
    });

    // ── Start Game ─────────────────────────────────────────────────────────
    socket.on("start_game", () => {
      const room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === socket.id)
      );
      if (!room) return;
      if (room.players[0].id !== socket.id) return;
      if (!room.currentMap) {
        socket.emit("error", "Selecione um mapa primeiro.");
        return;
      }
      room.phase = "playing";
      room.monsters = spawnMonstersForMap(room.currentMap);
      room.players.forEach((p) => (p.hasActedThisTurn = false));

      room.combatLog.push({
        id: nanoid(),
        timestamp: Date.now(),
        message: `⚔️ A batalha começou! ${room.monsters.length} inimigo(s) aparecem!`,
        type: "system",
      });

      broadcast(room.roomId, room);
    });

    // ── Player Action ──────────────────────────────────────────────────────
    socket.on("player_action", ({ actionType, skillId, targetId, itemId }) => {
      const room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === socket.id)
      );
      if (!room || room.phase !== "playing") return;

      const player = room.players.find((p) => p.id === socket.id);
      if (!player || player.hasActedThisTurn || player.attributes.hp <= 0) return;

      const { state: newState, newEntries } = processPlayerAction(
        room,
        socket.id,
        actionType,
        skillId,
        targetId,
        itemId
      );
      rooms[room.roomId] = newState;
      broadcastLog(room.roomId, newEntries);

      // Check if all alive players have acted
      const alivePlayers = newState.players.filter((p) => p.attributes.hp > 0);
      const allActed = alivePlayers.every((p) => p.hasActedThisTurn);

      if (allActed) {
        // Check game end after player phase
        const afterPlayers = checkGameEnd(newState);
        if (afterPlayers === "players") {
          newState.phase = "shop";
          // CRITICAL: reset so players can click "ready" in the shop
          newState.players.forEach((p) => (p.hasActedThisTurn = false));
          newState.combatLog.push({
            id: nanoid(),
            timestamp: Date.now(),
            message: "🏆 Todos os inimigos derrotados! Visitem a loja antes da próxima onda!",
            type: "system",
          });
          broadcast(room.roomId, newState);
          return;
        }

        // Monster turn
        newState.turnPhase = "monster_turn";
        const { state: afterMonsters, newEntries: monsterEntries } =
          processMonsterTurn(newState);
        rooms[room.roomId] = afterMonsters;
        broadcastLog(room.roomId, monsterEntries);

        const finalResult = checkGameEnd(afterMonsters);
        if (finalResult === "monsters") {
          afterMonsters.phase = "game_over";
          afterMonsters.combatLog.push({
            id: nanoid(),
            timestamp: Date.now(),
            message: "💀 O grupo foi aniquilado! Game Over.",
            type: "system",
          });
        } else if (finalResult === "players") {
          afterMonsters.phase = "shop";
          // CRITICAL: reset so players can click "ready" in the shop
          afterMonsters.players.forEach((p) => (p.hasActedThisTurn = false));
          afterMonsters.combatLog.push({
            id: nanoid(),
            timestamp: Date.now(),
            message: "🏆 Onda vencida! Visite a loja!",
            type: "system",
          });

          // Check full map victory
          if (
            afterMonsters.bossDefeated[afterMonsters.currentMap!] &&
            afterMonsters.monsters.length === 0
          ) {
            afterMonsters.phase = "victory";
            afterMonsters.combatLog.push({
              id: nanoid(),
              timestamp: Date.now(),
              message: "🎉 VITÓRIA! O mapa foi conquistado!",
              type: "system",
            });
          }
        } else {
          afterMonsters.turnPhase = "player_actions";
          // Spawn boss after 3 rounds if not defeated
          if (
            afterMonsters.turnNumber % 3 === 0 &&
            !afterMonsters.bossDefeated[afterMonsters.currentMap!] &&
            !afterMonsters.currentBoss &&
            afterMonsters.monsters.length === 0
          ) {
            afterMonsters.currentBoss = {
              ...BOSSES[afterMonsters.currentMap!],
              id: nanoid(),
            };
            afterMonsters.combatLog.push({
              id: nanoid(),
              timestamp: Date.now(),
              message: `⚠️ ${afterMonsters.currentBoss.name} emergiu das sombras! BOSS BATTLE!`,
              type: "system",
            });
          } else if (afterMonsters.monsters.length === 0 && !afterMonsters.currentBoss) {
            afterMonsters.monsters = spawnMonstersForMap(afterMonsters.currentMap!);
            afterMonsters.combatLog.push({
              id: nanoid(),
              timestamp: Date.now(),
              message: `🔁 Nova onda de inimigos aparece! (${afterMonsters.monsters.length} inimigos)`,
              type: "system",
            });
          }
        }

        broadcast(room.roomId, rooms[room.roomId]);
      } else {
        broadcast(room.roomId, newState);
      }
    });

    // ── Buy Item ───────────────────────────────────────────────────────────
    socket.on("buy_item", (itemId) => {
      const room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === socket.id)
      );
      if (!room || room.phase !== "shop") return;

      const { state: newState, newEntries } = buyItem(room, socket.id, itemId);
      rooms[room.roomId] = newState;
      broadcastLog(room.roomId, newEntries);
      broadcast(room.roomId, newState);
    });

    // ── Ready (leave shop) ─────────────────────────────────────────────────
    socket.on("ready", () => {
      const room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === socket.id)
      );
      if (!room || room.phase !== "shop") return;

      const player = room.players.find((p) => p.id === socket.id)!;
      player.hasActedThisTurn = true; // reuse for "ready"

      // Only wait for alive + connected players
      const activePlayers = room.players.filter((p) => p.attributes.hp > 0 && p.isConnected);
      const allReady = activePlayers.every((p) => p.hasActedThisTurn);
      if (allReady) {
        room.phase = "playing";
        room.players.forEach((p) => (p.hasActedThisTurn = false));

        if (room.monsters.length === 0 && !room.currentBoss) {
          room.monsters = spawnMonstersForMap(room.currentMap!);
        }

        room.combatLog.push({
          id: nanoid(),
          timestamp: Date.now(),
          message: "⚔️ De volta à batalha!",
          type: "system",
        });
        broadcast(room.roomId, room);
      } else {
        broadcast(room.roomId, room);
      }
    });

    // ── Return to Map Select (after victory) ───────────────────────────────
    socket.on("return_to_map_select", () => {
      const room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === socket.id)
      );
      if (!room) return;
      if (room.players[0].id !== socket.id) {
        socket.emit("error", "Somente o líder pode escolher novo mapa.");
        return;
      }
      rooms[room.roomId] = resetForNewMap(room);
      broadcast(room.roomId, rooms[room.roomId]);
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      Object.values(rooms).forEach((room) => {
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.isConnected = false;
          room.combatLog.push({
            id: nanoid(),
            timestamp: Date.now(),
            message: `🔌 ${player.name} desconectou.`,
            type: "system",
          });
          broadcast(room.roomId, room);
        }
      });
    });
  });

  res.end();
}