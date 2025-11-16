"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react";

interface Tender {
  id: string;
  title: string;
  problem: string;
  desiredOutcome: string;
  constraints: string[];
  evaluationCriteria: Array<{ criterion: string; weight: string }>;
  submissionFormat: {
    endpoint: string;
    sampleOutput: string;
    pricePerCall: string;
  };
  createdAt: string;
  _count: {
    proposals: number;
  };
}

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTenders = async () => {
    try {
      const response = await fetch('/api/tenders');
      const data = await response.json();
      
      if (data.tenders) {
        setTenders(data.tenders);
      } else if (data.error) {
        toast.error('Failed to load tenders');
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
      toast.error('Failed to load tenders');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTenders();
    setIsRefreshing(false);
    toast.success('Tenders refreshed');
  };

  const handleEvaluateAndPay = () => {
    toast.info('Evaluate and pay functionality coming soon!');
  };

  useEffect(() => {
    fetchTenders().finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid p-6">
      <div className="w-full max-w-4xl">
        <Link 
          href="/" 
          className="mb-6 inline-flex items-center gap-2 font-secondary text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to home
        </Link>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Tenders</CardTitle>
                <CardDescription>
                  View all submitted tenders
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCwIcon className={isRefreshing ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="size-8" />
              </div>
            ) : tenders.length > 0 ? (
              <div className="space-y-4">
                {tenders.map((tender) => (
                  <Card key={tender.id} className="border-muted">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">{tender.title}</h3>
                            <h4 className="font-semibold text-sm mb-1">Problem</h4>
                            <p className="text-sm text-muted-foreground">{tender.problem}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Desired Outcome</h4>
                            <p className="text-sm text-muted-foreground">{tender.desiredOutcome}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-3xl font-bold">{tender._count.proposals}</div>
                          <div className="text-xs text-muted-foreground">
                            proposal{tender._count.proposals !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(tender.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/tenders/${tender.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Button size="sm" onClick={handleEvaluateAndPay}>
                            Evaluate Proposals & Pay
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tenders submitted yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

