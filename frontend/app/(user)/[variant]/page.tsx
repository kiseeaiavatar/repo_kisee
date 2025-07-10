import { Variant } from "@/lib/variants";
import App from "./components/app";

export default async function Home({ params }: { params: Promise<{ variant: Variant }> }) {
  const { variant } = await params;
  return <App variant={variant} />;
}
