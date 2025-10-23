import { Button } from "@/components/Button";
import { EventItemResult } from "@/lib/types";
import React, { useState } from "react";
import { parseEventItem } from "./utils";

interface RatingEventProps {
  items: string[];
  onSubmit: (results: EventItemResult[]) => void;
}

const ITEMS_PER_PAGE = 6;

const RatingEvent: React.FC<RatingEventProps> = ({ items, onSubmit }) => {
  const [results, setResults] = useState<number[]>(new Array(items.length).fill(0));
  const [page, setPage] = useState(0);
  const [allItemsRated, setAllItemsRated] = useState(false);

  const handleRatingChange = (idx: number, value: number) => {
    const newResults = results.map((c, i) => {
      if (i === idx) return value;
      return c;
    });

    setResults(newResults);

    const allItemsRated = newResults
      .slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE)
      .every((r) => r !== 0);
    setAllItemsRated(allItemsRated);
  };

  const isLastPage = () => {
    return page + 1 >= items.length / ITEMS_PER_PAGE;
  };

  const handleNext = () => {
    if (isLastPage()) {
      const finalResults = items.map((item, idx) => {
        const parsedItem = parseItem(item);
        return {
          item: parsedItem.text,
          skill: parsedItem.skill,
          rating: results[idx],
        };
      });
      onSubmit(finalResults);
    } else {
      setPage(page + 1);
      setAllItemsRated(false);
    }
  };

  const parseItem = (item: string) => {
    return parseEventItem(item);
  };

  const itemText = (item: string) => {
    const parsedItem = parseItem(item);
    return parsedItem.text;
  };

  return (
    <div className="flex flex-col">
      <p>
        {page + 1} / {Math.ceil(items.length / ITEMS_PER_PAGE)}
      </p>

      <div className="my-6 grid grid-cols-[40%_15%_15%_15%_15%] gap-y-4 items-center">
        <div></div>
        <div className="text-xs">
          Stimmt
          <br /> gar nicht
        </div>
        <div className="text-xs">
          Stimmt
          <br />
          nicht so
        </div>
        <div className="text-xs">
          Stimmt
          <br />
          etwas
        </div>
        <div className="text-xs">Stimmt</div>
        {items.map((item, i) => {
          if (i < page * ITEMS_PER_PAGE || i >= page * ITEMS_PER_PAGE + ITEMS_PER_PAGE) {
            return;
          }
          const id = `rating-radio-${i}`;
          return (
            <>
              <div className="text-right">{itemText(item)}</div>
              <div>
                <input
                  className="cursor-pointer"
                  type="radio"
                  id={`${id}-a`}
                  name={id}
                  value="1"
                  onChange={() => handleRatingChange(i, 1)}
                />
              </div>
              <div>
                <input
                  className="cursor-pointer"
                  type="radio"
                  id={`${id}-b`}
                  name={id}
                  value="2"
                  onChange={() => handleRatingChange(i, 2)}
                />
              </div>
              <div>
                <input
                  className="cursor-pointer"
                  type="radio"
                  id={`${id}-c`}
                  name={id}
                  value="3"
                  onChange={() => handleRatingChange(i, 3)}
                />
              </div>
              <div>
                <input
                  className="cursor-pointer"
                  type="radio"
                  id={`${id}-d`}
                  name={id}
                  value="4"
                  onChange={() => handleRatingChange(i, 4)}
                />
              </div>
            </>
          );
        })}
      </div>
      <Button
        kind="primary"
        className="mt-auto mx-auto"
        onClick={() => {
          handleNext();
        }}
        disabled={!allItemsRated}
      >
        {isLastPage() ? "Abschließen" : "Weiter"}
      </Button>
      <span className={`${!allItemsRated ? "" : "invisible"}`}>Bitte bewerte alle Aussagen</span>
    </div>
  );
};

export default RatingEvent;
