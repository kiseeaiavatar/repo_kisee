import { App } from "@/components/Conversation";
import { Variant } from "@/lib/variants";

export default async function Conversation({ params }: { params: Promise<{ variant: Variant }> }) {
  const { variant } = await params;
  return <App variant={variant} />;
}
