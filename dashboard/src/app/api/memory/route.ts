import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// GET /api/memory - Get memory entries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern')
    
    const memoryPath = path.join(process.cwd(), '..', '.swarm', 'memory.json')
    const memory = JSON.parse(await fs.readFile(memoryPath, 'utf-8').catch(() => '{}'))
    
    // Clean expired entries
    const now = Date.now()
    const cleaned = Object.entries(memory).reduce((acc, [key, entry]: [string, any]) => {
      if (!entry.expires || entry.expires > now) {
        acc[key] = entry
      }
      return acc
    }, {} as any)
    
    // Filter by pattern if provided
    let entries = Object.entries(cleaned)
    if (pattern) {
      const regex = new RegExp(pattern.replace('*', '.*'))
      entries = entries.filter(([key]) => regex.test(key))
    }
    
    return NextResponse.json({
      entries: entries.map(([key, value]: [string, any]) => ({ 
        key, 
        ...(typeof value === 'object' ? value : { value })
      })),
      count: entries.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch memory' },
      { status: 500 }
    )
  }
}

// DELETE /api/memory - Clear memory entries
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern')
    
    const memoryPath = path.join(process.cwd(), '..', '.swarm', 'memory.json')
    const memory = JSON.parse(await fs.readFile(memoryPath, 'utf-8').catch(() => '{}'))
    
    if (pattern) {
      const regex = new RegExp(pattern.replace('*', '.*'))
      Object.keys(memory).forEach(key => {
        if (regex.test(key)) {
          delete memory[key]
        }
      })
    } else {
      // Clear all
      Object.keys(memory).forEach(key => delete memory[key])
    }
    
    await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear memory' },
      { status: 500 }
    )
  }
}