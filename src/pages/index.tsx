import { useGameStore } from "@/store/gameStore";
import JoinScreen from "@/components/JoinScreen";
import LobbyScreen from "@/components/LobbyScreen";
import BattleScreen from "@/components/BattleScreen";
import ShopPanel from "@/components/ShopPanel";
import { VictoryScreen, GameOverScreen } from "@/components/EndScreens";
import Head from "next/head";

export default function Home() {
  const { gameState, myPlayerId } = useGameStore();

  const renderScreen = () => {
    // No game state = not joined yet
    if (!gameState || !myPlayerId) {
      return <JoinScreen />;
    }

    switch (gameState.phase) {
      case "lobby":
      case "map_select":
        return <LobbyScreen />;
      case "playing":
        return <BattleScreen />;
      case "shop":
        return <ShopPanel />;
      case "victory":
        return <VictoryScreen />;
      case "game_over":
        return <GameOverScreen />;
      default:
        return <JoinScreen />;
    }
  };

  return (
    <>
      <Head>
        <title>Dungeon Chronicles · RPG Multijogador</title>
        <meta name="description" content="RPG de turnos multijogador em tempo real com Socket.io e Next.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="dungeon-bg min-h-screen">
        {renderScreen()}
      </main>
    </>
  );
}
