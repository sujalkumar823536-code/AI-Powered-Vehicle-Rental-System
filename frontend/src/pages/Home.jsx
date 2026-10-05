import CarBackground from "../components/CarBackground";
import SideTabs from "../components/SideTabs";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <CarBackground />
      <SideTabs showBookings={!!user} />
    </>
  );
}