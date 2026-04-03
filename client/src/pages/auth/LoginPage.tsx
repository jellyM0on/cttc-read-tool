import { Field } from "../../components/form/Field";
import { SoftDivider } from "../../components/form/SoftDivider";
import { Button } from "../../components/shared/Button";
import { Input } from "../../components/shared/Input";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  return (
    <AuthLayout
      mode="login"
      title="Welcome back"
      subtitle="Return to your reading space"
    >
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <Field label="Email address" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email..."
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password..."
          />
        </Field>

        {/* TODO */}
        {/* <div className="flex items-center justify-between gap-4 px-1">
          <label className="flex items-center gap-2 font-[var(--font-ui)] text-sm text-[var(--on-surface-muted)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[rgba(196,197,215,0.4)] text-[var(--primary)]"
            />
            Remember me
          </label>

          <Link
            to="#"
            className="font-[var(--font-ui)] text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Forgot password?
          </Link>
        </div> */}
     
        <Button type="submit" className="w-full">Log In</Button>
     
        <SoftDivider label="Or continue with" />

        <div className="w-full flex justify-center">
          <Button type="button" variant="secondary" className="flex items-center justify-center gap-3">
            <span className="text-base">G</span>
            Google Account
          </Button>
        </div>
       
      </form>
    </AuthLayout>
  );
}

