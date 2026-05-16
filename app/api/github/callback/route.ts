import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;
  if (!clientId || !clientSecret) {
    return new Response("Missing GitHub OAuth credentials", { status: 500 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return new Response("Failed to get access token", { status: 400 });
  }

  // Store the token in a cookie (frontend-accessible for demo/dev)
  const secureCookie = request.nextUrl.protocol === "https:" ? "; Secure" : "";
  const response = new Response(
    `<html><body><script>window.opener && window.opener.postMessage('github-auth-success', '*'); window.close();</script>Authenticated! You can close this window.</body></html>`,
    {
      headers: {
        // REMOVED HttpOnly for frontend access
        "Set-Cookie": `github_token=${tokenData.access_token}; Path=/; SameSite=Lax${secureCookie}`,
        "Content-Type": "text/html",
      },
    }
  );
  return response;
} 
