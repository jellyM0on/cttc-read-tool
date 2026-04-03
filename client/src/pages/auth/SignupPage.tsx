import { Link } from "react-router-dom";
import { Field } from "../../components/form/Field";
import { SoftDivider } from "../../components/form/SoftDivider";
import { Button } from "../../components/shared/Button";
import { Input } from "../../components/shared/Input";
import { AuthLayout } from "./AuthLayout";

export function SignupPage() {
  return (
    <AuthLayout
      mode="signup"
      title="Create your account"
      subtitle="Create your own reading space"
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

        <p className="px-2 text-center [font-family:var(--font-ui)]  text-xs leading-5 text-[rgba(68,70,85,0.72)]">
          By joining, you agree to our{" "}
          <Link to="#" className="text-(--primary) hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="#" className="text-(--primary) hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <Button type="submit" className="w-full">Create Account</Button>

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

