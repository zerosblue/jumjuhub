import { Suspense } from "react";
import SignInContent from "./SignInContent";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
