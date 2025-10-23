import Image from "next/image";

export default function ProcessOverview() {
  return (
    <div className="mt-4 mx-6 flex flex-col items-center">
      <ProcessItem icon="life" title="Mein Leben" desc="Bereich 1" />
      <Image
        src={`/arrow-down.svg`}
        alt="arrow down"
        width={15}
        height={26}
        style={{ width: "15px", height: "26px" }}
        className="m-3"
      />
      <ProcessItem icon="users" title="Selbstbild" desc="Bereich 2" />
      <Image
        src={`/arrow-down.svg`}
        alt="arrow down"
        width={15}
        height={26}
        style={{ width: "15px", height: "26px" }}
        className="m-3"
      />
      <ProcessItem icon="shooting-star" title="Tätigkeitsfelder" desc="Bereich 3" />
      <Image
        src={`/arrow-down.svg`}
        alt="arrow down"
        width={15}
        height={26}
        style={{ width: "15px", height: "26px" }}
        className="m-3"
      />
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
  return (
    <div className="flex items-center w-full">
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
