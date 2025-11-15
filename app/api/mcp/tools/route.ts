import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { NextResponse } from 'next/server';

export async function GET() {
  let mcpClient;
  
  try {
    mcpClient = await createMCPClient({
      transport: {
        type: 'http' as const,
        url: 'https://mcp.paywithlocus.com/mcp',
        headers: {
          'Authorization': `Bearer ${process.env.LOCUS_API_KEY}`
        }
      }
    });

    const tools = await mcpClient.tools();
    
    // Convert tools to a serializable format
    const toolsList = Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description || 'No description available'
    }));

    return NextResponse.json({ tools: toolsList });
  } catch (error) {
    console.error('MCP connection error:', error);
    return NextResponse.json({ error: 'Failed to connect to MCP server' }, { status: 500 });
  } finally {
    await mcpClient?.close();
  }
}

