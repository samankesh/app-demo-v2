'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [time, setTime] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/time')
      .then((res) => res.json())
      .then((data) => setTime(data.time));

    setLoading(true);
    fetch('/api/data')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setData(data.data);
        }
      })
      .catch((err) => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Hello World</h1>
      {time ? (
        <p className="text-xl mb-8">Current server time: {time}</p>
      ) : (
        <p className="text-xl mb-8">Loading time...</p>
      )}

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">Databricks Data</h2>
        {loading && <p>Loading data from Databricks...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="px-6 py-3">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b dark:border-gray-700">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-6 py-4">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
