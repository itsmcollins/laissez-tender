"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeftIcon } from "lucide-react";

export default function SellersPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Please enter a webhook URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(webhookUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: webhookUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to create webhook");
      }

      toast.success("Webhook created successfully!");
      setWebhookUrl("");
    } catch (error) {
      toast.error("Failed to create webhook. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid p-6">
      <div className="w-full max-w-2xl">
        <Link 
          href="/" 
          className="mb-6 inline-flex items-center gap-2 font-secondary text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to home
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Submit Proposals</CardTitle>
            <CardDescription>
              Register your webhook URL to receive tender requests. You&apos;ll be notified when new tenders are available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="url"
              placeholder="https://your-api.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Creating..." : "Create Webhook"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

