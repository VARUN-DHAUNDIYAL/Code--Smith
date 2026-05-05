import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.AUTH_GITHUB_ID;
  if (!clientId) {
    return new Response("Missing AUTH_GITHUB_ID", { status: 500 });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo%20read:user`;
  return Response.redirect(githubAuthUrl);
} 
