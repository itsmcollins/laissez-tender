"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeftIcon } from "lucide-react";

interface Tender {
  id: string;
  problem: string;
  desiredOutcome: string;
  constraints: string[];
  createdAt: string;
}

interface Proposal {
  id: string;
  reasoning: string;
  plan: {
    steps: Array<{
      stepNumber: number;
      action: string;
      apiCall: any;
      pricePerCall: number;
    }>;
    totalEstimatedCost: number;
    expectedOutcome: string;
  };
  createdAt: string;
}

export default function TenderDetailPage() {
  const params = useParams();
  const tenderId = params.tenderId as string;
  
  const [tender, setTender] = useState<Tender | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    selectedProposalId: string;
    reasoning: string;
    endpoint: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tender
        const tenderResponse = await fetch(`/api/tenders?id=${tenderId}`);
        const tenderData = await tenderResponse.json();
        
        // Fetch proposals for this tender
        const proposalsResponse = await fetch(`/api/proposals?tenderId=${tenderId}`);
        const proposalsData = await proposalsResponse.json();
        
        if (tenderData.tenders && tenderData.tenders.length > 0) {
          setTender(tenderData.tenders[0]);
        }
        
        if (proposalsData.proposals) {
          setProposals(proposalsData.proposals);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load tender details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tenderId]);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setShowDialog(true);
    
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate proposals');
      }

      setEvaluation(data);
      toast.success('Proposals evaluated successfully!');
    } catch (error) {
      console.error('Error evaluating proposals:', error);
      toast.error('Failed to evaluate proposals');
      setShowDialog(false);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handlePay = async () => {
    if (!evaluation) return;
    
    const selectedProposal = proposals.find(p => p.id === evaluation.selectedProposalId);
    if (!selectedProposal) return;

    const firstStep = selectedProposal.plan.steps[0];
    const apiCall = firstStep.apiCall;
    
    console.log('🔍 API Call structure:', apiCall);
    
    // Determine service and query
    const service = apiCall.endpoint.includes('firecrawl') ? 'firecrawl' : 'gloria';
    const query = service === 'firecrawl' 
      ? apiCall.query 
      : apiCall.parameter?.value;
    
    // For Gloria, also pass the endpoint and parameter name
    const endpoint = service === 'gloria' ? apiCall.endpoint : undefined;
    const parameterName = service === 'gloria' ? apiCall.parameter?.name : undefined;
    
    console.log('💳 Payment request:', { service, query, endpoint, parameterName });
    
    setIsPaying(true);
    try {
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, query, endpoint, parameterName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      toast.success('Payment completed successfully!');
      setShowDialog(false);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Tender not found</p>
            <Link href="/tenders" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon />
                Back to Tenders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid p-6">
      <div className="w-full max-w-4xl space-y-6">
        <Link 
          href="/tenders" 
          className="inline-flex items-center gap-2 font-secondary text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to tenders
        </Link>
        
        {/* Tender Details */}
        <Card>
          <CardHeader>
            <CardTitle>Tender Details</CardTitle>
            <CardDescription>
              Created {new Date(tender.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Problem</h4>
              <p className="text-sm text-muted-foreground">{tender.problem}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Desired Outcome</h4>
              <p className="text-sm text-muted-foreground">{tender.desiredOutcome}</p>
            </div>
            {tender.constraints.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-1">Constraints</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {tender.constraints.map((constraint, i) => (
                    <li key={i}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proposals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proposals ({proposals.length})</CardTitle>
                <CardDescription>
                  AI-generated proposals for this tender
                </CardDescription>
              </div>
              {proposals.length > 0 && (
                <Button onClick={handleEvaluate} disabled={isEvaluating}>
                  {isEvaluating ? 'Evaluating...' : 'Evaluate Proposals'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {proposals.length > 0 ? (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <Card key={proposal.id} className="border-muted">
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Reasoning</h4>
                        <p className="text-sm text-muted-foreground">{proposal.reasoning}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Plan</h4>
                        <div className="space-y-3">
                          {proposal.plan.steps.map((step) => (
                            <div key={step.stepNumber} className="text-sm border-l-2 border-muted pl-3">
                              <p className="font-medium">Step {step.stepNumber}: {step.action}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Price: ${step.pricePerCall.toFixed(2)} per call
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Expected Outcome</h4>
                        <p className="text-sm text-muted-foreground">{proposal.plan.expectedOutcome}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-muted">
                        <span className="text-sm font-semibold">
                          Total Cost: ${proposal.plan.totalEstimatedCost.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(proposal.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No proposals yet. Waiting for AI agents to respond...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Evaluation Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Evaluation Results</DialogTitle>
              <DialogDescription>
                {isEvaluating ? 'Analyzing proposals...' : 'Best proposal selected'}
              </DialogDescription>
            </DialogHeader>
            
            {isEvaluating ? (
              <div className="flex justify-center py-8">
                <Spinner className="size-8" />
              </div>
            ) : evaluation ? (
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Selected Proposal</h4>
                    <p className="text-sm text-muted-foreground">
                      {proposals.find(p => p.id === evaluation.selectedProposalId)?.reasoning || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Reasoning</h4>
                    <p className="text-sm text-muted-foreground">{evaluation.reasoning}</p>
                  </div>
                  
                  {evaluation.endpoint && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Next Step</h4>
                      <p className="text-sm text-muted-foreground">
                        Call endpoint: <code className="bg-muted px-1 py-0.5 rounded text-xs">{evaluation.endpoint}</code>
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : null}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Close
              </Button>
              {evaluation && !isEvaluating && (
                <Button onClick={handlePay} disabled={isPaying}>
                  {isPaying ? 'Processing...' : 'Pay'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

