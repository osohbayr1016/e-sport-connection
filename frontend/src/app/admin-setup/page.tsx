import { notFound } from "next/navigation";

// Deliberately disable the legacy public self-service administrator grant page.
// Role changes are authorized server-side by the legacy backend, not by UI forms.
export default function AdminSetupPage() {
  notFound();
}
