import { NextRequest, NextResponse } from "next/server";
import { processTender } from "@/lib/tender-processor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Firecrawl webhook received:', body);
    
    // Validate that we have a tender in the webhook payload
    const { tender } = body;
    
    if (!tender || !tender.id) {
      return NextResponse.json(
        { error: "Invalid webhook payload: missing tender data" },
        { status: 400 }
      );
    }

    // Fire-and-forget: start background processing without waiting
    processTender(tender).catch(error => {
      console.error('Background tender processing failed:', error);
    });

    // Immediately return response indicating we're processing
    return NextResponse.json({ 
      message: "Tender received and processing started",
      tenderId: tender.id,
      status: "processing"
    });
  } catch (error) {
    console.error("Error in Firecrawl webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

