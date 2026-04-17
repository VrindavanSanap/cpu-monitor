import { useEffect, useState } from "react";
import Chart from "./chart"; // no .tsx extension

const BASE_URL = "https://cpu.vrindavansanap.com";
const ENDPOINT = `${BASE_URL}/api/cpu`;

function App() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setChartData(data);
      } catch (err) {
        console.error("Failed to fetch CPU data:", err);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <div>CPU Utilisation (Last 1 min)</div>
      <Chart data={chartData} />
    </div>
  );
}

export default App;