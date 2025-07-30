import { Button } from "@/components/Button";
import Image from "next/image";
import React, { useState } from "react";
import { EventItemResult } from "./container";

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
        return {
          item,
          rating: results[idx],
        };
      });
      onSubmit(finalResults);
    }
  };

  const parseItem = () => {
    const str = items[page];

    // Match all [tag] and <tag>
    const tagRegex = /(\[([^\]]+)\])|(<([^>]+)>)/g;

    let match, img, skill;
    while ((match = tagRegex.exec(str)) !== null) {
      if (match[2]) img = match[2];
      if (match[4]) skill = match[4];
    }

    // Remove tags from the string to get remaining text
    const text = str.replace(tagRegex, "").trim();

    return {
      img,
      skill,
      text,
    };
  };

  const itemImage = () => {
    const parsedItem = parseItem();
    if (!parsedItem.img) return;

    let props = {
      src: parsedItem.img,
      alt: parsedItem.img,
      fill: true,
      className: "object-cover",
      unoptimized: false,
    };

    if (parsedItem.img.startsWith("http")) {
      props.unoptimized = true;
    }
    return <Image {...props} />;
  };

  const itemText = () => {
    const parsedItem = parseItem();
    return parsedItem.text;
  };

  const handleLike = () => {
    next(1);
  };

  const handleDislike = () => {
    next(0);
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
