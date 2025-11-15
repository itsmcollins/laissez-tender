import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenderId, reasoning, plan } = body;

    // Validate required fields
    if (!tenderId || !reasoning || !plan) {
      return NextResponse.json(
        { error: "tenderId, reasoning, and plan are required" },
        { status: 400 }
      );
    }

    // Verify tender exists
    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
    });

    if (!tender) {
      return NextResponse.json(
        { error: "Tender not found" },
        { status: 404 }
      );
    }

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        tenderId,
        reasoning,
        plan,
      },
    });

    console.log(`Proposal created for tender ${tenderId}:`, {
      id: proposal.id,
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenderId = searchParams.get('tenderId');

    // If tenderId is provided, get proposals for that tender
    const where = tenderId ? { tenderId } : {};

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        tender: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

