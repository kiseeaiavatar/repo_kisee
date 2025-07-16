import Image from "next/image";

export default function ProcessOverview() {
  return (
    <div className="mt-4 mr-6 grid grid-cols-1 gap-2">
      <ProcessItem icon="life" title="Mein Leben" desc="Bereich 1" done />
      <ProcessItem icon="users" title="Selbstbild" desc="Bereich 2" />
      <ProcessItem icon="shooting-star" title="Tätigkeitsfelder" desc="Bereich 3" />
      <ProcessItem icon="filter" title="Nachschärfen" desc="Bereich 4" />
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
  const bg = done ? "bg-green-500" : "bg-primary-300";
  const checkmark = done ? "check-circle-filled" : "check-circle";
  return (
    <div className="flex items-center">
      <Image
        src={`/icon-${checkmark}.svg`}
        alt="icon check circle"
        width={32}
        height={32}
        style={{ width: "32px", height: "32px" }}
      />
      <div className={`${bg} rounded-3xl items-center flex-1 ml-2 p-2 pr-4 flex align-center`}>
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
          <span className="text-sm">{title}</span>
        </div>
      </div>
    </div>
  );
}
