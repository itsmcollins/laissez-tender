import { prisma } from './prisma';

interface TenderData {
  id: string;
  problem: string;
  desiredOutcome: string;
  constraints: string[];
  evaluationCriteria: any;
  submissionFormat: any;
  createdAt: Date;
}

/**
 * Notify all subscribed webhooks about a new tender.
 * This function runs in the background and doesn't block the response.
 */
export async function notifyWebhooks(tender: TenderData) {
  try {
    // 1. Get all subscribed webhooks
    const webhooks = await prisma.webhook.findMany();
    
    console.log(`Found ${webhooks.length} webhooks to notify`);
    
    if (webhooks.length === 0) {
      return;
    }

    // 2. Send the tender to each webhook
    // We use Promise.allSettled so one failure doesn't stop others
    const notifications = webhooks.map(async (webhook) => {
      try {
        console.log(`Sending tender ${tender.id} to webhook ${webhook.url}`);
        
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'tender.created',
            tender: {
              id: tender.id,
              problem: tender.problem,
              desiredOutcome: tender.desiredOutcome,
              constraints: tender.constraints,
              evaluationCriteria: tender.evaluationCriteria,
              submissionFormat: tender.submissionFormat,
              createdAt: tender.createdAt,
            },
          }),
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          console.error(`Webhook ${webhook.url} returned status ${response.status}`);
        } else {
          console.log(`Successfully notified webhook ${webhook.url}`);
        }
      } catch (error) {
        console.error(`Failed to notify webhook ${webhook.url}:`, error);
      }
    });

    // Wait for all notifications to complete (or fail)
    await Promise.allSettled(notifications);
    
    console.log(`Finished notifying all webhooks for tender ${tender.id}`);
  } catch (error) {
    console.error('Error in notifyWebhooks:', error);
  }
}

