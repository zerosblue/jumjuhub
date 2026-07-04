import { Suspense } from "react";
import WritePostContent from "./WritePostContent";

export default function WritePostPage() {
  return (
    <Suspense>
      <WritePostContent />
    </Suspense>
  );
}
