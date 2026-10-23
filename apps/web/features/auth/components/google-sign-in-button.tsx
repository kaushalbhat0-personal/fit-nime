"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/features/auth/actions";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.3 7.5 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.6 0 10.2 0 12s.5 3.4 1.4 5.2l3.8-2.8Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.8l3.8 2.9c1-2.9 3.7-5.1 6.8-5.1Z"
      />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      className="min-h-11 w-full"
      disabled={pending}
      aria-label="Continue with Google"
      aria-busy={pending}
    >
      <GoogleIcon />
      {pending ? "Connecting…" : "Continue with Google"}
    </Button>
  );
}

/**
 * Single reusable Google entry point for login and signup. Server action +
 * form post: no client token handling, no Google SDK, no extra JS.
 */
export function GoogleSignInButton() {
  return (
    <form action={signInWithGoogle}>
      <SubmitButton />
    </form>
  );
}
