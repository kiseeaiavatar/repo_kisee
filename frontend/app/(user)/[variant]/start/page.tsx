import { Variant } from "@/lib/variants";
import Start from "./components/start";

export default async function StartPage({ params }: { params: Promise<{ variant: Variant }> }) {
  const { variant } = await params;

  return (
    <div className="m-auto p-8 bg-secondary-500">
      <div className="p-8 text-center">
        <Start variant={variant} />
      </div>
    </div>
  );
}
