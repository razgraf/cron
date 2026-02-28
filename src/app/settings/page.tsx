"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json() as Promise<{
        apiKeyConfigured: boolean;
        braveKeyConfigured: boolean;
        provider: string;
        model: string;
      }>;
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Provider</span>
            <span className="text-sm font-medium">Anthropic (Claude)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Model</span>
            <span className="text-sm font-mono">
              {data?.model ?? "claude-sonnet-4-20250514"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Anthropic API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {isLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            ) : data?.apiKeyConfigured ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="destructive">Not configured</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Set the <code className="rounded bg-muted px-1 py-0.5 font-mono">ANTHROPIC_API_KEY</code> environment
            variable in your <code className="rounded bg-muted px-1 py-0.5 font-mono">.env.local</code> file to
            connect to Claude.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Brave Search API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {isLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            ) : data?.braveKeyConfigured ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="destructive">Not configured</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Set the <code className="rounded bg-muted px-1 py-0.5 font-mono">BRAVE_SEARCH_API_KEY</code> environment
            variable in your <code className="rounded bg-muted px-1 py-0.5 font-mono">.env.local</code> file to
            enable web search context for AI tasks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
