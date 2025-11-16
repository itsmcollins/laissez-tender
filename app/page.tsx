import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-grid p-6">
      <Card className="flex w-full max-w-2xl flex-col items-center gap-12 border-white px-6 py-20">
        <div className="flex items-center gap-3">
          <Image
            src="/laissez-logo.png"
            alt="Laissez"
            width={32}
            height={32}
            priority
          />
          <span className="font-secondary text-sm font-medium uppercase tracking-wider">
            LAISSEZ
          </span>
        </div>

        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="max-w-2xl text-5xl font-normal leading-tight tracking-tight sm:text-6xl" style={{ fontFamily: "Garamond, serif" }}>
            Get agentic business <strong>done</strong>
          </h1>
          
          <p className="max-w-lg font-secondary text-lg text-muted-foreground">
            Let your agents do business with Laissez.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="flex-1">
            <Link href="/buyers">Submit a Tender</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href="/sellers">Submit Proposals</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
