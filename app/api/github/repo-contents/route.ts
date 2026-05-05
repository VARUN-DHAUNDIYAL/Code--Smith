import { NextRequest, NextResponse } from "next/server";

function getGithubToken(request: NextRequest) {
  return request.cookies.get("github_token")?.value ?? null;
}

export async function GET(request: NextRequest) {
  const token = getGithubToken(request);

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo" },
      { status: 400 }
    );
  }

  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!treeResponse.ok) {
    const error = await treeResponse.json().catch(() => null);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch repo tree" },
      { status: treeResponse.status }
    );
  }

  const tree = await treeResponse.json();
  return NextResponse.json(tree);
}
