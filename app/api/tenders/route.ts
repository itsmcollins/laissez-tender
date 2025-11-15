import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { problem, desiredOutcome, constraints, evaluationCriteria, submissionFormat } = await req.json();

    if (!problem || !desiredOutcome) {
      return NextResponse.json(
        { error: 'Problem and desired outcome are required' },
        { status: 400 }
      );
    }

    const tender = await prisma.tender.create({
      data: {
        problem,
        desiredOutcome,
        constraints: constraints || [],
        evaluationCriteria: evaluationCriteria || [],
        submissionFormat: submissionFormat || {},
      },
    });

    return NextResponse.json({ tender });
  } catch (error) {
    console.error('Error creating tender:', error);
    return NextResponse.json(
      { error: 'Failed to create tender' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tenders = await prisma.tender.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ tenders });
  } catch (error) {
    console.error('Error fetching tenders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenders' },
      { status: 500 }
    );
  }
}

