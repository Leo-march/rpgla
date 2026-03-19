import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { GameState, CombatEntry, ClientToServerEvents, ServerToClientEvents, ClassType, MapId, ActionType } from "@/types/game";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface GameStore {
  socket: AppSocket | null;
  gameState: GameState | null;
  myPlayerId: string | null;
  roomId: string | null;
  combatLog: CombatEntry[];
  connectionError: string | null;
  isConnected: boolean;

  // Actions
  connect: () => void;
  joinRoom: (roomId: string, name: string, classType: ClassType) => void;
  selectMap: (mapId: MapId) => void;
  startGame: () => void;
  performAction: (actionType: ActionType, skillId?: string, targetId?: string, itemId?: string) => void;
  buyItem: (itemId: string) => void;
  ready: () => void;
  disconnect: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  myPlayerId: null,
  roomId: null,
  combatLog: [],
  connectionError: null,
  isConnected: false,

  connect: () => {
    // Trigger socket API initialization
    fetch("/api/socket").finally(() => {
      const socket: AppSocket = io({ path: "/api/socket", addTrailingSlash: false, transports: ["websocket", "polling"] });

      socket.on("connect", () => {
        set({ isConnected: true, myPlayerId: socket.id, connectionError: null });
      });

      socket.on("disconnect", () => {
        set({ isConnected: false });
      });

      socket.on("game_state", (state) => {
        set({ gameState: state });
      });

      socket.on("combat_log_entry", (entry) => {
        set((s) => ({ combatLog: [...s.combatLog.slice(-99), entry] }));
      });

      socket.on("error", (msg) => {
        set({ connectionError: msg });
        setTimeout(() => set({ connectionError: null }), 3000);
      });

      set({ socket });
    });
  },

  joinRoom: (roomId, name, classType) => {
    const { socket } = get();
    if (!socket) return;
    set({ roomId });
    socket.emit("join_room", { roomId, playerName: name, classType });
  },

  selectMap: (mapId) => {
    get().socket?.emit("select_map", mapId);
  },

  startGame: () => {
    get().socket?.emit("start_game");
  },

  performAction: (actionType, skillId, targetId, itemId) => {
    get().socket?.emit("player_action", { actionType, skillId, targetId, itemId });
  },

  buyItem: (itemId) => {
    get().socket?.emit("buy_item", itemId);
  },

  ready: () => {
    get().socket?.emit("ready");
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, gameState: null, isConnected: false, roomId: null, myPlayerId: null });
  },
}));