import { NextRequest, NextResponse } from "next/server";

function getGithubToken(request: NextRequest) {
  return request.cookies.get("github_token")?.value ?? null;
}

export async function GET(request: NextRequest) {
  const token = getGithubToken(request);

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch("https://api.github.com/user/repos?per_page=100", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch repos" },
      { status: response.status }
    );
  }

  const repos = await response.json();
  return NextResponse.json(repos);
}
