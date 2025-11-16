import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const evaluationSchema = z.object({
  selectedProposalId: z.string().describe('The ID of the best proposal'),
  reasoning: z.string().describe('Brief explanation of why this proposal was chosen'),
});

export async function POST(req: Request) {
  try {
    const { tenderId } = await req.json();

    if (!tenderId) {
      return NextResponse.json(
        { error: 'Tender ID is required' },
        { status: 400 }
      );
    }

    // Fetch tender and proposals
    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      include: { proposals: true },
    });

    if (!tender) {
      return NextResponse.json(
        { error: 'Tender not found' },
        { status: 404 }
      );
    }

    if (tender.proposals.length === 0) {
      return NextResponse.json(
        { error: 'No proposals to evaluate' },
        { status: 400 }
      );
    }

    // If only one proposal, return it directly
    if (tender.proposals.length === 1) {
      const proposal = tender.proposals[0];
      const submissionFormat = tender.submissionFormat as any;
      
      return NextResponse.json({
        selectedProposalId: proposal.id,
        reasoning: 'Only one proposal submitted',
        endpoint: submissionFormat?.endpoint || null,
      });
    }

    // Use AI to evaluate multiple proposals
    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: evaluationSchema,
      prompt: `For this tender, choose the best proposal.

Tender:
- Problem: ${tender.problem}
- Desired Outcome: ${tender.desiredOutcome}
- Constraints: ${tender.constraints.join(', ')}

Proposals:
${tender.proposals.map((p, i) => `
Proposal ${i + 1} (ID: ${p.id}):
- Reasoning: ${p.reasoning}
- Total Cost: $${(p.plan as any).totalEstimatedCost}
- Steps: ${(p.plan as any).steps.length}
- Expected Outcome: ${(p.plan as any).expectedOutcome}
`).join('\n')}

Select the proposal that best addresses the tender requirements. Consider cost, feasibility, and alignment with desired outcome.`,
    });

    const submissionFormat = tender.submissionFormat as any;

    return NextResponse.json({
      selectedProposalId: object.selectedProposalId,
      reasoning: object.reasoning,
      endpoint: submissionFormat?.endpoint || null,
    });
  } catch (error) {
    console.error('Error evaluating proposals:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate proposals' },
      { status: 500 }
    );
  }
}

