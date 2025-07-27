"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  Code, 
  FileText, 
  Shield, 
  Wrench, 
  Bug,
  Palette,
  GitBranch,
  Server,
  Package,
  ShoppingBag,
  PenTool,
  Activity,
  PlayCircle,
  RefreshCw
} from "lucide-react"

// Agent icon mapping
const agentIcons: Record<string, any> = {
  "code-reviewer": Code,
  "test-runner": Activity,
  "debugger": Bug,
  "refactor": Wrench,
  "doc-writer": FileText,
  "security-scanner": Shield,
  "shadcn-ui-builder": Palette,
  "project-planner": GitBranch,
  "api-developer": Server,
  "frontend-developer": Code,
  "tdd-specialist": Activity,
  "api-documenter": FileText,
  "devops-engineer": Package,
  "product-manager": ShoppingBag,
  "marketing-writer": PenTool
}

interface Agent {
  name: string
  description: string
  installed: boolean
  enabled: boolean
  version: string
  lastUsed?: string
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // Fetch agents from API
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data.agents || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch agents:', err)
        setLoading(false)
      })
  }, [])

  const installedAgents = agents.filter(a => a.installed)
  const availableAgents = agents.filter(a => !a.installed)
  
  const getFilteredAgents = () => {
    switch (activeTab) {
      case "installed":
        return installedAgents
      case "available":
        return availableAgents
      default:
        return agents
    }
  }

  const runAgent = async (agentName: string) => {
    const task = prompt(`Enter task for ${agentName}:`)
    if (!task) return
    
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, task })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`Task queued: ${data.message}`)
        // Refresh page to show updated status
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to run agent:', error)
      alert('Failed to run agent')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Brain className="mr-2 h-6 w-6" />
          <h1 className="text-xl font-semibold">Claude Sub-Agents Dashboard</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
              <p className="text-xs text-muted-foreground">
                {installedAgents.length} installed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                2 running now
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground">
                +12% from yesterday
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Response</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2s</div>
              <p className="text-xs text-muted-foreground">
                -0.3s improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agents Grid */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="installed">Installed ({installedAgents.length})</TabsTrigger>
            <TabsTrigger value="available">Available ({availableAgents.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading agents...
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getFilteredAgents().map((agent) => {
                  const Icon = agentIcons[agent.name] || Brain
                  
                  return (
                    <Card key={agent.name} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">{agent.name}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            {agent.installed && (
                              <Badge variant={agent.enabled ? "default" : "secondary"}>
                                {agent.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            )}
                            <Badge variant="outline">{agent.version}</Badge>
                          </div>
                        </div>
                        <CardDescription className="mt-1.5">
                          {agent.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {agent.lastUsed ? `Used ${agent.lastUsed}` : "Not used yet"}
                          </div>
                          <div className="flex gap-2">
                            {agent.installed ? (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => runAgent(agent.name)}
                                >
                                  Run
                                </Button>
                                <Button size="sm" variant="outline">
                                  Configure
                                </Button>
                              </>
                            ) : (
                              <Button size="sm">
                                Install
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}