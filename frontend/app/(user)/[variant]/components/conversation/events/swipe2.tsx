import { Button } from "@/components/Button";
import Image from "next/image";
import React, { useState } from "react";
import { SwipeEventProps } from "./swipe";
import { parseEventItem } from "./utils";

const Swipe2Event: React.FC<SwipeEventProps> = ({ items, onSubmit }) => {
  const [results, setResults] = useState<number[]>(new Array(items.length).fill(0));
  const [page, setPage] = useState(0);

  const handleRatingChange = (idx: number, value: number) => {
    const newResults = results.map((c, i) => {
      if (i === idx) return value;
      return c;
    });

    setResults(newResults);
  };

  const next = () => {
    if (page < items.length - 1) {
      setPage(page + 1);
    } else {
      const finalResults = items.map((item, idx) => {
        const parsedItem = parseEventItem(item);
        return {
          item: parsedItem.text,
          skill: parsedItem.skill,
          rating: results[idx],
        };
      });
      console.log("swipe2 finalResults", finalResults);
      onSubmit(finalResults);
    }
  };

  const itemId = () => {
    return `swipe2-radio-${page + 1}`;
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
      className: "object-cover rounded-t-3xl",
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

  return (
    <div className={`flex flex-col ${itemImage() ? "flex-1" : ""}`}>
      <p>
        {page + 1} / {items.length}
      </p>
      <div className="item flex flex-col mt-4 flex-1 w-1/2 mx-auto">
        <div className="rounded-3xl flex-1 flex flex-col">
          {itemImage() ? (
            <>
              <div className="rounded-t-3xl bg-center bg-cover flex-1 relative">{itemImage()}</div>
              <div
                className="px-4 pb-6 pt-10 rounded-b-3xl mt-[-50px] z-10"
                style={{
                  backgroundImage: "linear-gradient(to bottom, transparent, white 30px)",
                }}
              >
                {itemText()}
              </div>
            </>
          ) : (
            <div className="text-2xl">{itemText()}</div>
          )}
        </div>
        <div className="flex flex-col mt-6">
          <div className="flex flex-row justify-between items-end my-6">
            <div className="text-sm font-bold">
              Trifft nicht zu
              <br />
              <input
                className="cursor-pointer"
                type="radio"
                id={`${itemId()}-a`}
                name={itemId()}
                value="1"
                onChange={() => handleRatingChange(page, 1)}
                checked={results[page] == 1}
              />
            </div>
            <div className="text-sm font-bold">
              Trifft zu,
              <br /> mach ich nicht gern
              <br />
              <input
                className="cursor-pointer"
                type="radio"
                id={`${itemId()}-b`}
                name={itemId()}
                value="2"
                onChange={() => handleRatingChange(page, 2)}
                checked={results[page] == 2}
              />
            </div>
            <div className="text-sm font-bold">
              Trifft zu,
              <br /> mach ich gern
              <br />
              <input
                className="cursor-pointer"
                type="radio"
                id={`${itemId()}-c`}
                name={itemId()}
                value="3"
                onChange={() => handleRatingChange(page, 3)}
                checked={results[page] == 3}
              />
            </div>
          </div>

          <Button
            kind="primary"
            className="mt-auto mx-auto"
            onClick={() => {
              next();
            }}
            disabled={results[page] == 0}
          >
            {page == results.length - 1 ? "Abschließen" : "Weiter"}
          </Button>
          <span className={`${results[page] == 0 ? "" : "invisible"}`}>
            Bitte treffe eine Auswahl
          </span>
        </div>
      </div>
    </div>
  );
};

export default Swipe2Event;
