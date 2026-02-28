interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveWebResults {
  web?: {
    results?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
}

export async function webSearch(
  query: string,
  count = 5,
): Promise<BraveSearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    count: String(count),
  });

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    },
  );

  if (!response.ok) {
    console.error("Brave Search error:", response.status, await response.text());
    return [];
  }

  const data: BraveWebResults = await response.json();
  return (
    data.web?.results?.map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    })) ?? []
  );
}

export function formatSearchContext(results: BraveSearchResult[]): string {
  if (results.length === 0) return "";

  const lines = results.map(
    (r, i) => `[${i + 1}] ${r.title}\n    ${r.url}\n    ${r.description}`,
  );

  return `Web search results:\n\n${lines.join("\n\n")}`;
}
