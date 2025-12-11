"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [timeData, setTimeData] = useState<{ time: string; date: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const response = await fetch("/api/time");
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setTimeData(data);
      } catch (error) {
        console.error("Failed to fetch time:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTime();
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Hello World</h1>
        <div className="flex flex-col gap-4 items-center sm:items-start">
          <p className="text-lg">
            Current Server Time:
          </p>
          {loading ? (
            <p>Loading...</p>
          ) : timeData ? (
             <div className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800">
               <p className="text-2xl font-mono">{timeData.time}</p>
               <p className="text-sm text-gray-500">{timeData.date}</p>
             </div>
          ) : (
            <p className="text-red-500">Error loading time</p>
          )}
        </div>
      </main>
    </div>
  );
}
