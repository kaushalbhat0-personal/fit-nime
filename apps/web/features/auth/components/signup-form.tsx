"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup, type ActionState } from "@/features/auth/actions";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

function FieldError({ messages }: { messages: string[] | undefined }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return <p className="mt-1 text-xs text-red-600">{messages[0]}</p>;
}

export function SignupForm() {
  const [state, formAction] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
        <FieldError messages={state.errors?.email} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state.errors?.password} />
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm font-medium"
        >
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state.errors?.confirmPassword} />
      </div>
      {state.message ? (
        <p role="alert" className="text-sm text-zinc-700">
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-zinc-950 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
