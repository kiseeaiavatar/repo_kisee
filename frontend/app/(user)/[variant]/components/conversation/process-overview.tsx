import Image from "next/image";

export default function ProcessOverview() {
  return (
    <div className="mt-4 mx-6 grid grid-cols-1 gap-1">
      <ProcessItem icon="life" title="Mein Leben" desc="Bereich 1" />
      <span className="text-center text-3xl">🠓</span>
      <ProcessItem icon="users" title="Selbstbild" desc="Bereich 2" />
      <span className="text-center text-3xl">🠓</span>
      <ProcessItem icon="shooting-star" title="Tätigkeitsfelder" desc="Bereich 3" />
      <span className="text-center text-3xl">🠓</span>
      <ProcessItem icon="business" title="Berufliche Interessen" desc="Bereich 4" />
    </div>
  );
}

function ProcessItem({
  done = false,
  icon,
  title,
  desc,
}: {
  done?: boolean;
  icon: string;
  title: string;
  desc?: string;
}) {
  const bg = done ? "bg-green-500" : "bg-primary-200";
  const checkmark = done ? "check-circle-filled" : "check-circle";
  return (
    <div className="flex items-center">
      <div
        className={`${bg} text-primary-500 rounded-3xl items-center flex-1 p-3 flex align-center`}
      >
        <Image
          src={`/icon-${icon}.svg`}
          alt={`icon ${icon}`}
          width={32}
          height={32}
          style={{ width: "32px", height: "32px" }}
        />
        <div className="flex-1 ml-1">
          {desc && (
            <>
              <span className="text-xs">{desc}</span>
              <br />
            </>
          )}
          <span className="text-sm font-semibold">{title}</span>
        </div>
      </div>
    </div>
  );
}
