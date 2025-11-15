"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react";

interface MCPTool {
  name: string;
  description: string;
}

interface GeneratedTender {
  problem: string;
  desiredOutcome: string;
  constraints: string[];
  evaluationCriteria: Array<{ criterion: string; weight: string }>;
  submissionFormat: {
    endpoint: string;
    sampleOutput: string;
    pricePerCall: string;
  };
}

export default function BuyersPage() {
  const [tender, setTender] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTender, setGeneratedTender] = useState<GeneratedTender | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);

  useEffect(() => {
    const fetchMCPTools = async () => {
      try {
        const response = await fetch('/api/mcp/tools');
        const data = await response.json();
        
        if (data.tools) {
          setMcpTools(data.tools);
        } else if (data.error) {
          toast.error('Failed to load MCP tools');
        }
      } catch (error) {
        console.error('Error fetching MCP tools:', error);
        toast.error('Failed to connect to MCP server');
      } finally {
        setIsLoadingTools(false);
      }
    };

    fetchMCPTools();
  }, []);

  const handleGenerate = async () => {
    if (!tender.trim()) {
      toast.error("Please enter a tender request");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/tenders/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderRequest: tender }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tender');
      }

      const data = await response.json();
      setGeneratedTender(data.tender);
      toast.success("Tender generated successfully!");
    } catch (error) {
      console.error('Error generating tender:', error);
      toast.error("Failed to generate tender");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setTender("");
    setGeneratedTender(null);
    setIsSubmitted(false);
  };

  const handleConfirmSubmit = async () => {
    if (!generatedTender) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedTender),
      });

      if (!response.ok) {
        throw new Error('Failed to submit tender');
      }

      toast.success("Tender submitted successfully!");
      setTender("");
      setGeneratedTender(null);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting tender:', error);
      toast.error("Failed to submit tender");
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
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Available MCP Tools</CardTitle>
            <CardDescription>
              Tools available from the Locus MCP server
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTools ? (
              <div className="flex items-center justify-center py-4">
                <Spinner className="size-6" />
              </div>
            ) : mcpTools.length > 0 ? (
              <ul className="space-y-2">
                {mcpTools.map((tool) => (
                  <li key={tool.name} className="text-sm">
                    <span className="font-medium">{tool.name}</span>
                    {tool.description && (
                      <span className="text-muted-foreground"> — {tool.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No tools available</p>
            )}
          </CardContent>
        </Card>
        
        {!isSubmitted && (
          <Card>
            <CardHeader>
              <CardTitle>Submit a Tender</CardTitle>
              <CardDescription>
                Describe the task or research you need completed. Your tender will be distributed to available agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Tell me what happened in biotech this week"
                value={tender}
                onChange={(e) => setTender(e.target.value)}
                className="min-h-32"
                disabled={isGenerating || !!generatedTender}
              />
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !!generatedTender}
                className="w-full"
              >
                {isGenerating ? "Generating..." : "Generate Tender"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isGenerating && !isSubmitted && (
          <Card className="mt-6">
            <CardContent className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </CardContent>
          </Card>
        )}

        {generatedTender && !isGenerating && !isSubmitted && (
          <>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Generated Tender</CardTitle>
                <CardDescription>
                  Review your structured tender before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-2">1. Problem</h3>
                  <p className="text-sm text-muted-foreground">{generatedTender.problem}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">2. Desired Outcome</h3>
                  <p className="text-sm text-muted-foreground">{generatedTender.desiredOutcome}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">3. Constraints</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {generatedTender.constraints.map((constraint, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{constraint}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">4. Evaluation Criteria</h3>
                  <ul className="space-y-1">
                    {generatedTender.evaluationCriteria.map((ec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {ec.criterion} — {ec.weight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">5. Submission Format</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><span className="font-medium">Endpoint:</span> {generatedTender.submissionFormat.endpoint}</p>
                    <p><span className="font-medium">Sample Output:</span> {generatedTender.submissionFormat.sampleOutput}</p>
                    <p><span className="font-medium">Price:</span> {generatedTender.submissionFormat.pricePerCall}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex gap-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSubmitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
              >
                <XIcon className="size-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckIcon className="size-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </>
        )}

        {isSubmitted && (
          <Card className="mt-6 border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-500/10 p-3">
                    <CheckIcon className="size-6 text-green-500" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Tender Submitted Successfully!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your tender has been created and is now available for review.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    Submit Another
                  </Button>
                  <Link href="/tenders">
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                      View All Tenders
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

