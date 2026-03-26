import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import {
  GameState,
  ActionType,
  ClassType,
  MapId,
  CombatEntry,
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/game";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface GameStore {
  socket: GameSocket | null;
  isConnected: boolean;
  connectionError: string | null;
  gameState: GameState | null;
  myPlayerId: string | null;
  combatLog: CombatEntry[];

  // Actions
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string, playerName: string, classType: ClassType) => void;
  selectMap: (mapId: MapId) => void;
  startGame: () => void;
  playerAction: (
    actionType: ActionType,
    opts?: {
      skillId?: string;
      targetId?: string;
      itemId?: string;
      comboActionId?: string;
      partnerId?: string;
    }
  ) => void;
  performAction: (
    actionType: ActionType,
    opts?: {
      skillId?: string;
      targetId?: string;
      itemId?: string;
      comboActionId?: string;
      partnerId?: string;
    }
  ) => void;
  buyItem: (itemId: string) => void;
  ready: () => void;
  returnToMapSelect: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  isConnected: false,
  connectionError: null,
  gameState: null,
  myPlayerId: null,
  combatLog: [],

  connect: () => {
    const existing = get().socket;
    if (existing?.connected) return;

    // Initialise the Next.js socket API route first
    fetch("/api/socket").finally(() => {
      const socket: GameSocket = io({
        path: "/api/socket",
        addTrailingSlash: false,
        transports: ["polling", "websocket"],
      });

      socket.on("connect", () => {
        set({ isConnected: true, connectionError: null, myPlayerId: socket.id });
      });

      socket.on("disconnect", () => {
        set({ isConnected: false });
      });

      socket.on("connect_error", (err) => {
        set({ connectionError: err.message, isConnected: false });
      });

      socket.on("game_state", (state: GameState) => {
        set({ gameState: state });
      });

      socket.on("combat_log_entry", (entry: CombatEntry) => {
        set((s) => ({
          combatLog: [...s.combatLog.slice(-199), entry],
        }));
      });

      socket.on("error", (msg: string) => {
        set({ connectionError: msg });
        setTimeout(() => set({ connectionError: null }), 4000);
      });

      set({ socket });
    });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false, gameState: null, myPlayerId: null });
  },

  joinRoom: (roomId, playerName, classType) => {
    get().socket?.emit("join_room", { roomId, playerName, classType });
  },

  selectMap: (mapId) => {
    get().socket?.emit("select_map", mapId);
  },

  startGame: () => {
    get().socket?.emit("start_game");
  },

  playerAction: (actionType, opts = {}) => {
    get().socket?.emit("player_action", { actionType, ...opts });
  },

  performAction: (actionType, opts = {}) => {
    get().socket?.emit("player_action", { actionType, ...opts });
  },

  buyItem: (itemId) => {
    get().socket?.emit("buy_item", itemId);
  },

  ready: () => {
    get().socket?.emit("ready");
  },

  returnToMapSelect: () => {
    get().socket?.emit("return_to_map_select");
  },
}));