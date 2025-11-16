import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyWebhooks } from '@/lib/webhook-notifier';

export async function POST(req: NextRequest) {
  try {
    const { title, problem, desiredOutcome, constraints, evaluationCriteria, submissionFormat } = await req.json();

    if (!problem || !desiredOutcome) {
      return NextResponse.json(
        { error: 'Problem and desired outcome are required' },
        { status: 400 }
      );
    }

    // 1. Persist the tender
    const tender = await prisma.tender.create({
      data: {
        title: title || 'Untitled Tender',
        problem,
        desiredOutcome,
        constraints: constraints || [],
        evaluationCriteria: evaluationCriteria || [],
        submissionFormat: submissionFormat || {},
      },
    });

    // 2. Trigger background webhook notifications (fire-and-forget)
    // We don't await this so the response returns immediately
    notifyWebhooks(tender).catch(error => {
      console.error('Background webhook notification failed:', error);
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // If ID is provided, fetch single tender
    if (id) {
      const tender = await prisma.tender.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              proposals: true,
            },
          },
        },
      });

      return NextResponse.json({ tenders: tender ? [tender] : [] });
    }

    // Otherwise fetch all tenders
    const tenders = await prisma.tender.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            proposals: true,
          },
        },
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

