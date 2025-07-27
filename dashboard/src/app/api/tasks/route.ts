import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// GET /api/tasks - Get recent tasks
export async function GET() {
  try {
    const memoryPath = path.join(process.cwd(), '..', '.swarm', 'memory.json')
    const memory = JSON.parse(await fs.readFile(memoryPath, 'utf-8').catch(() => '{}'))
    
    // Find all task entries
    const tasks = Object.entries(memory)
      .filter(([key]) => key.includes(':current_task') || key.includes(':task:'))
      .map(([key, entry]: [string, any]) => ({
        key,
        ...entry.value,
        created: entry.created
      }))
      .sort((a, b) => b.created - a.created)
      .slice(0, 50) // Last 50 tasks
    
    return NextResponse.json({ tasks })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}