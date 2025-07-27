import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// GET /api/agents - Get all agents
export async function GET() {
  try {
    const agentsDir = path.join(process.cwd(), '..', 'agents')
    const agentFolders = await fs.readdir(agentsDir)
    
    const agents = await Promise.all(
      agentFolders.map(async (folder) => {
        try {
          const metadataPath = path.join(agentsDir, folder, 'metadata.json')
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'))
          
          return {
            name: folder,
            ...metadata,
            installed: true,
            enabled: true
          }
        } catch (error) {
          return null
        }
      })
    )
    
    return NextResponse.json({
      agents: agents.filter(Boolean)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// POST /api/agents - Run an agent
export async function POST(request: Request) {
  try {
    const { agentName, task } = await request.json()
    
    // Store task in memory for the agent to pick up
    const memoryPath = path.join(process.cwd(), '..', '.swarm', 'memory.json')
    const memory = JSON.parse(await fs.readFile(memoryPath, 'utf-8').catch(() => '{}'))
    
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    memory[`agent:${agentName}:current_task`] = {
      value: {
        id: taskId,
        task,
        status: 'pending',
        created: Date.now()
      },
      created: Date.now(),
      expires: Date.now() + 3600000, // 1 hour
      accessed: Date.now(),
      accessCount: 1
    }
    
    await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2))
    
    return NextResponse.json({
      success: true,
      taskId,
      message: `Task queued for ${agentName}`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to run agent' },
      { status: 500 }
    )
  }
}