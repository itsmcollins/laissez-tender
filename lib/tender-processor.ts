import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Firecrawl API capabilities description
const FIRECRAWL_CAPABILITIES = `
Firecrawl is a web scraping and search API with the following capability:

On-Demand Search: Search the web using SERP (search engine results page) queries.

API Details:
- Endpoint: https://api.firecrawl.dev/v1/x402/search
- Method: POST
- Required Parameter: "query" (string) - the search query
- Returns: Array of search results with titles, descriptions, and URLs

Pricing: $0.01 per search request

Example Use Cases:
- Finding and extracting content from specific websites
- Researching information across multiple sources
- Gathering structured data from web pages
`;

interface Tender {
  id: string;
  problem: string;
  desiredOutcome: string;
  constraints: string[];
  evaluationCriteria: any;
  submissionFormat: any;
}

// Schema for relevance check
const relevanceSchema = z.object({
  isRelevant: z.boolean().describe('Whether Firecrawl API can help solve this tender'),
  reasoning: z.string().describe('Brief explanation of why it is or is not relevant'),
});

// Schema for the plan
const planSchema = z.object({
  steps: z.array(
    z.object({
      stepNumber: z.number(),
      action: z.string().describe('Description of what this step does'),
      apiCall: z.object({
        endpoint: z.string().describe('Firecrawl API endpoint to use (https://api.firecrawl.dev/v1/x402/search)'),
        method: z.string().describe('HTTP method (POST)'),
        query: z.string().describe('The search query string to send'),
      }),
      pricePerCall: z.number().describe('Cost in USD for this API call ($0.01)'),
    })
  ),
  totalEstimatedCost: z.number().describe('Total estimated cost in USD'),
  expectedOutcome: z.string().describe('What the final result will look like'),
});

export async function processTender(tender: Tender): Promise<void> {
  try {
    console.log(`Processing tender ${tender.id}...`);

    // Step 1: Check if tender is relevant for Firecrawl capabilities
    const relevanceResult = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: relevanceSchema,
      prompt: `You are evaluating whether a tender request can be solved using the Firecrawl API.

${FIRECRAWL_CAPABILITIES}

Tender Details:
- Problem: ${tender.problem}
- Desired Outcome: ${tender.desiredOutcome}
- Constraints: ${tender.constraints.join(', ')}

Determine if Firecrawl's web search and scraping capabilities can help solve this tender.
Only mark as relevant if Firecrawl can meaningfully contribute to the solution.`,
    });

    console.log('Relevance check:', relevanceResult.object);

    // If not relevant, post the negative result and return
    if (!relevanceResult.object.isRelevant) {
      console.log('Tender is not relevant for Firecrawl capabilities');
      console.log('Reasoning:', relevanceResult.object.reasoning);
      return;
    }

    // Step 2: Generate a detailed plan if relevant
    const planResult = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: planSchema,
      prompt: `You are creating a detailed plan to solve a tender using the Firecrawl API.

${FIRECRAWL_CAPABILITIES}

Tender Details:
- Problem: ${tender.problem}
- Desired Outcome: ${tender.desiredOutcome}
- Constraints: ${tender.constraints.join(', ')}

Create a step-by-step plan showing:
1. What Firecrawl API calls to make
2. The search query string to use (only include the "query" parameter)
3. The cost per call ($0.01 per search request)
4. The expected outcome

Be specific about the API endpoint (https://api.firecrawl.dev/v1/x402/search) 
and the search query strings needed. Only use the required "query" parameter.`,
    });

    console.log('Plan generated:', planResult.object);

    // Step 3: Post the proposal with the plan
    await postProposal(tender.id, {
      reasoning: relevanceResult.object.reasoning,
      plan: planResult.object,
    });

    console.log(`Successfully processed tender ${tender.id}`);
  } catch (error) {
    console.error(`Error processing tender ${tender.id}:`, error);
    // Don't throw - this is a background task
  }
}

async function postProposal(
  tenderId: string,
  data: {
    reasoning: string;
    plan: any;
  }
): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenderId,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to post proposal: ${response.statusText}`);
    }

    console.log(`Posted proposal for tender ${tenderId}`);
  } catch (error) {
    console.error(`Error posting proposal for tender ${tenderId}:`, error);
    throw error;
  }
}

