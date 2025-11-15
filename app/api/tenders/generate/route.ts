import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const tenderSchema = z.object({
  problem: z.string().describe('The pain point or issue that needs to be solved'),
  desiredOutcome: z.string().describe('What success looks like'),
  constraints: z.array(z.string()).describe('Limitations or requirements (budget, time, etc)'),
  evaluationCriteria: z.array(z.object({
    criterion: z.string(),
    weight: z.string()
  })).describe('How submissions will be evaluated'),
  submissionFormat: z.object({
    endpoint: z.string().describe('Required submission endpoint or agent handle'),
    sampleOutput: z.string().describe('Expected output format for test case'),
    pricePerCall: z.string().describe('Expected pricing structure')
  })
});

export async function POST(req: Request) {
  try {
    const { tenderRequest } = await req.json();

    if (!tenderRequest || !tenderRequest.trim()) {
      return NextResponse.json(
        { error: 'Tender request is required' },
        { status: 400 }
      );
    }

    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: tenderSchema,
      prompt: `Convert this tender request into a structured Request for Proposals (RFP). Keep it minimal and concise.
      
Tender request: "${tenderRequest}"

Generate a structured tender with:
- Problem: The pain point or issue to solve
- Desired Outcome: What success looks like
- Constraints: Key limitations (keep to 2-3 items max)
- Evaluation Criteria: How submissions will be judged (2-3 criteria with weights)
- Submission Format: Required delivery format (endpoint/handle, sample output description, pricing)

Keep everything concise and actionable.`,
    });

    return NextResponse.json({ tender: object });
  } catch (error) {
    console.error('Error generating tender:', error);
    return NextResponse.json(
      { error: 'Failed to generate tender' },
      { status: 500 }
    );
  }
}

