import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Gloria API capabilities description
const GLORIA_CAPABILITIES = `
Gloria is a news and recap API with the following capabilities:

1. News API: Get news articles from specific feed categories
   - Endpoint: https://api.itsgloria.ai/news
   - Method: GET
   - Required Parameter: "feed_categories" (string) - comma separated list of feed categories
   - Pricing: $0.01 per request

2. Recaps API: Get AI-generated recaps for a specific feed category
   - Endpoint: https://api.itsgloria.ai/recaps
   - Method: GET
   - Required Parameter: "feed_category" (string) - the feed category to get recap for
   - Pricing: $0.10 per request

3. News By Keyword API: Search for news by keyword
   - Endpoint: https://api.itsgloria.ai/news-by-keyword
   - Method: GET
   - Required Parameter: "keyword" (string) - the keyword to search for
   - Pricing: $0.10 per request

Example Use Cases:
- Finding news articles from specific categories
- Getting AI-generated summaries of news topics
- Searching for news by specific keywords
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
  isRelevant: z.boolean().describe('Whether Gloria API can help solve this tender'),
  reasoning: z.string().describe('Brief explanation of why it is or is not relevant'),
});

// Schema for the plan
const planSchema = z.object({
  steps: z.array(
    z.object({
      stepNumber: z.number(),
      action: z.string().describe('Description of what this step does'),
      apiCall: z.object({
        endpoint: z.string().describe('Gloria API endpoint to use'),
        method: z.string().describe('HTTP method (GET)'),
        parameter: z.object({
          name: z.string().describe('Parameter name (feed_categories, feed_category, or keyword)'),
          value: z.string().describe('The value to send for this parameter'),
        }),
      }),
      pricePerCall: z.number().describe('Cost in USD for this API call'),
    })
  ),
  totalEstimatedCost: z.number().describe('Total estimated cost in USD'),
  expectedOutcome: z.string().describe('What the final result will look like'),
});

export async function processGloriaTender(tender: Tender): Promise<void> {
  try {
    console.log(`Processing Gloria tender ${tender.id}...`);

    // Step 1: Check if tender is relevant for Gloria capabilities
    const relevanceResult = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: relevanceSchema,
      prompt: `You are evaluating whether a tender request can be solved using the Gloria API.

${GLORIA_CAPABILITIES}

Tender Details:
- Problem: ${tender.problem}
- Desired Outcome: ${tender.desiredOutcome}
- Constraints: ${tender.constraints.join(', ')}

Determine if Gloria's news and recap capabilities can help solve this tender.
Only mark as relevant if Gloria can meaningfully contribute to the solution.`,
    });

    console.log('Gloria relevance check:', relevanceResult.object);

    // If not relevant, just log and return (don't create proposal)
    if (!relevanceResult.object.isRelevant) {
      console.log('Tender is not relevant for Gloria capabilities');
      console.log('Reasoning:', relevanceResult.object.reasoning);
      return;
    }

    // Step 2: Generate a detailed plan if relevant
    const planResult = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: planSchema,
      prompt: `You are creating a detailed plan to solve a tender using the Gloria API.

${GLORIA_CAPABILITIES}

Tender Details:
- Problem: ${tender.problem}
- Desired Outcome: ${tender.desiredOutcome}
- Constraints: ${tender.constraints.join(', ')}

Create a step-by-step plan showing:
1. What Gloria API calls to make
2. The required parameter name and value to use
3. The cost per call
4. The expected outcome

Be specific about which endpoint to use and only include the required parameter for each endpoint.`,
    });

    console.log('Gloria plan generated:', planResult.object);

    // Step 3: Post the proposal with the plan
    await postProposal(tender.id, {
      reasoning: relevanceResult.object.reasoning,
      plan: planResult.object,
    });

    console.log(`Successfully processed Gloria tender ${tender.id}`);
  } catch (error) {
    console.error(`Error processing Gloria tender ${tender.id}:`, error);
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
      throw new Error(`Failed to post Gloria proposal: ${response.statusText}`);
    }

    console.log(`Posted Gloria proposal for tender ${tenderId}`);
  } catch (error) {
    console.error(`Error posting Gloria proposal for tender ${tenderId}:`, error);
    throw error;
  }
}

