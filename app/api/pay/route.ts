import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { Experimental_Agent as Agent, tool, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Hardcoded endpoints
const FIRECRAWL_ENDPOINT = 'https://api.firecrawl.dev/v1/x402/search';
const GLORIA_NEWS_ENDPOINT = 'https://api.itsgloria.ai/news';

export async function POST(req: Request) {
  let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | undefined;
  
  try {
    const { service, query, endpoint, parameterName } = await req.json();
    console.log('🚀 Payment route called:', { service, query, endpoint, parameterName });

    if (!service || !query) {
      return NextResponse.json(
        { error: 'Service and query are required' },
        { status: 400 }
      );
    }

    if (service !== 'firecrawl' && service !== 'gloria') {
      return NextResponse.json(
        { error: 'Service must be either "firecrawl" or "gloria"' },
        { status: 400 }
      );
    }

    // Connect to Locus MCP server
    console.log('🔌 Connecting to Locus MCP server...');
    mcpClient = await createMCPClient({
      transport: {
        type: 'http' as const,
        url: 'https://mcp.paywithlocus.com/mcp',
        headers: {
          'Authorization': `Bearer ${process.env.LOCUS_API_KEY}`
        }
      }
    });

    const mcpTools = await mcpClient.tools();
    console.log('✅ MCP client connected, available tools:', Object.keys(mcpTools));
    
    // Define tools for calling Firecrawl and Gloria
    const firecrawlTool = tool({
      description: 'Search the web using Firecrawl. Returns search results with full page content. May require payment if 402 status is returned.',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
        paymentHeader: z.string().optional().describe('Optional payment header if retrying after payment'),
      }),
      execute: async ({ query: searchQuery, paymentHeader }) => {
        console.log('🔍 Firecrawl tool called:', { 
          query: searchQuery, 
          hasPaymentHeader: !!paymentHeader 
        });
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (paymentHeader) {
          console.log('💳 Using payment header:', paymentHeader);
          headers['X-Payment'] = paymentHeader;
        }
        
        const response = await fetch(FIRECRAWL_ENDPOINT, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: searchQuery,
            limit: 10,
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true,
            },
          }),
        });
        
        const data = await response.json();
        
        console.log('📥 Firecrawl response:', { 
          status: response.status,
          paymentRequired: response.status === 402,
          dataKeys: Object.keys(data)
        });
        
        if (response.status === 402) {
          console.log('💰 Payment required! Response data:', JSON.stringify(data, null, 2));
        }
        
        return {
          status: response.status,
          data,
        };
      },
    });
    
    const gloriaTool = tool({
      description: 'Get data from Gloria AI. Returns news/recaps/search results. May require payment if 402 status is returned.',
      inputSchema: z.object({
        queryValue: z.string().describe('The parameter value to send'),
        paymentHeader: z.string().optional().describe('Optional payment header if retrying after payment'),
      }),
      execute: async ({ queryValue, paymentHeader }) => {
        console.log('📰 Gloria tool called:', { 
          queryValue,
          endpoint: endpoint || GLORIA_NEWS_ENDPOINT,
          parameterName: parameterName || 'feed_categories',
          hasPaymentHeader: !!paymentHeader 
        });
        
        // Use the provided endpoint or fall back to news endpoint
        const gloriaEndpoint = endpoint || GLORIA_NEWS_ENDPOINT;
        const paramName = parameterName || 'feed_categories';
        
        const url = new URL(gloriaEndpoint);
        url.searchParams.append(paramName, queryValue);
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (paymentHeader) {
          console.log('💳 Using payment header:', paymentHeader);
          headers['X-Payment'] = paymentHeader;
        }
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
        });
        
        const data = await response.json();
        
        console.log('📥 Gloria response:', { 
          status: response.status,
          paymentRequired: response.status === 402,
          dataKeys: Object.keys(data)
        });
        
        if (response.status === 402) {
          console.log('💰 Payment required! Response data:', JSON.stringify(data, null, 2));
        }
        
        return {
          status: response.status,
          data,
        };
      },
    });
    
    // Combine MCP tools with custom tools
    const tools = {
      ...mcpTools,
      firecrawl: firecrawlTool,
      gloria: gloriaTool,
    };

    // Build prompt based on service
    let requestPrompt: string;
    if (service === 'firecrawl') {
      requestPrompt = `Use the firecrawl tool to search for: "${query}"

If the response has status 402, it means payment is required. The response will contain payment details. Use the available Locus payment tools to send the payment, then retry the firecrawl tool with the payment header from the payment response.`;
    } else {
      requestPrompt = `Use the gloria tool with queryValue="${query}" to get data from Gloria AI.

If the response has status 402, it means payment is required. The response will contain payment details. Use the available Locus payment tools to send the payment, then retry the gloria tool with the payment header from the payment response.`;
    }

    // Create an Agent to handle the request and payment loop
    console.log('🤖 Creating payment agent...');
    const paymentAgent = new Agent({
      model: anthropic('claude-haiku-4-5-20251001'),
      tools,
      stopWhen: stepCountIs(20), // Stop after 20 steps to prevent infinite loops
    });

    console.log('🏃 Starting agent with prompt:', requestPrompt);
    const result = await paymentAgent.generate({
      prompt: requestPrompt,
    });

    console.log('✅ Agent completed successfully');
    console.log('📊 Total steps taken:', result.steps.length);
    
    // Log each step the agent took
    result.steps.forEach((step, index) => {
      console.log(`\n🔄 Step ${index + 1}:`);
      console.log('  Text:', step.text || '(no text)');
      
      if (step.toolCalls && step.toolCalls.length > 0) {
        step.toolCalls.forEach((call, callIndex) => {
          console.log(`  🔧 Tool call ${callIndex + 1}:`, {
            toolName: call.toolName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            args: (call as any).args,
          });
        });
      }
      
      if (step.toolResults && step.toolResults.length > 0) {
        step.toolResults.forEach((toolResult, resultIndex) => {
          console.log(`  ✨ Tool result ${resultIndex + 1}:`, {
            toolName: toolResult.toolName,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result: typeof (toolResult as any).result === 'object' 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? JSON.stringify((toolResult as any).result, null, 2) 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              : (toolResult as any).result,
          });
        });
      }
    });
    
    console.log('\n📝 Final agent response:', result.text);
    console.log('💵 Total usage:', result.usage);

    return NextResponse.json({
      success: true,
      response: result.text,
      usage: result.usage,
      steps: result.steps.length,
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment failed' },
      { status: 500 }
    );
  } finally {
    await mcpClient?.close();
  }
}
