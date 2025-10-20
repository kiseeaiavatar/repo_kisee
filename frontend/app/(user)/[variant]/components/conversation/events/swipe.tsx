import { Button } from "@/components/Button";
import { EventItemResult } from "@/lib/types";
import Image from "next/image";
import React, { useState } from "react";
import { parseEventItem } from "./utils";

interface SwipeEventProps {
  items: string[];
  onSubmit: (results: EventItemResult[]) => void;
}

const SwipeEvent: React.FC<SwipeEventProps> = ({ items, onSubmit }) => {
  const [results, setResults] = useState<number[]>(new Array(items.length).fill(0));
  const [page, setPage] = useState(0);

  const next = (v: number) => {
    const newResults = results.map((c, i) => {
      if (i === page) return v;
      return c;
    });
    setResults(newResults);

    if (page < items.length - 1) {
      setPage(page + 1);
    } else {
      const finalResults = items.map((item, idx) => {
        const parsedItem = parseEventItem(item);
        return {
          item: parsedItem.text,
          skill: parsedItem.skill,
          rating: newResults[idx],
        };
      });
      onSubmit(finalResults);
    }
  };

  const parseItem = () => {
    const str = items[page];
    return parseEventItem(str);
  };

  const itemImage = () => {
    const parsedItem = parseItem();
    if (!parsedItem.img) return;

    const props = {
      src: parsedItem.img,
      fill: true,
      className: "object-cover",
      unoptimized: false,
    };

    if (parsedItem.img.startsWith("http")) {
      props.unoptimized = true;
    }
    return <Image {...props} alt={parsedItem.img} />;
  };

  const itemText = () => {
    const parsedItem = parseItem();
    return parsedItem.text;
  };

  const handleLike = () => {
    next(4);
  };

  const handleDislike = () => {
    next(1);
  };

  return (
    <div className="container flex flex-col flex-1">
      <p>
        {page + 1} / {items.length}
      </p>
      <div className="item flex flex-col mt-4 flex-1 w-1/2 mx-auto">
        <div className="rounded-3xl flex-1 flex flex-col">
          <div className="rounded-t-3xl bg-center bg-cover flex-1 relative">{itemImage()}</div>
          <div
            className="px-4 pb-6 pt-10 rounded-b-3xl mt-[-50px] z-10"
            style={{
              backgroundImage: "linear-gradient(to bottom, transparent, white 30px)",
            }}
          >
            {itemText()}
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <Button
            kind="icon"
            onClick={() => {
              handleDislike();
            }}
          >
            <Image
              src="/icon-dislike.svg"
              alt="dislike"
              width={32}
              height={32}
              style={{ height: "32px", width: "32px" }}
            />
          </Button>
          <Button
            kind="icon"
            onClick={() => {
              handleLike();
            }}
          >
            <Image
              src="/icon-like.svg"
              alt="like"
              width={32}
              height={32}
              style={{ height: "32px", width: "32px" }}
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SwipeEvent;
