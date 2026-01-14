import { NextResponse } from 'next/server';
import { queryWithAppSP } from '@/app/lib/dbsql';

export async function GET() {
  const catalog = 'samples';
  const schema = 'nyctaxi';
  const table = 'trips';

  try {
    const result = await queryWithAppSP(
      `SELECT * FROM ${catalog}.${schema}.${table} LIMIT 10`
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
