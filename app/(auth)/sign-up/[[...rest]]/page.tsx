import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/login"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
