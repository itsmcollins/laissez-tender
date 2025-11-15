"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { ArrowLeftIcon } from "lucide-react";

interface Tender {
  id: string;
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
}

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenders();
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
            <CardTitle>All Tenders</CardTitle>
            <CardDescription>
              View all submitted tenders
            </CardDescription>
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
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Problem</h4>
                        <p className="text-sm text-muted-foreground">{tender.problem}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Desired Outcome</h4>
                        <p className="text-sm text-muted-foreground">{tender.desiredOutcome}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(tender.createdAt).toLocaleDateString()}
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

