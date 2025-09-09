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

  const handleRatingChange = (idx: number, value: number) => {
    const newResults = results.map((c, i) => {
      if (i === idx) return value;
      return c;
    });
    setResults(newResults);
  };

  const isLastPage = () => {
    return page + 1 > items.length / ITEMS_PER_PAGE;
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
    <div className="flex flex-col flex-1">
      <p>
        {page + 1} / {Math.floor(items.length / ITEMS_PER_PAGE) + 1}
      </p>
      {items.map((item, i) => {
        if (i < page * ITEMS_PER_PAGE || i >= page * ITEMS_PER_PAGE + ITEMS_PER_PAGE) {
          return;
        }
        const id = `rating-slider-${i}`;
        return (
          <div key={i} className="item flex mt-4 gap-4">
            <label className="w-[30%] pt-[10px] text-left" htmlFor={id}>
              {itemText(item)}
            </label>
            <div className="flex flex-col flex-1">
              <input
                type="range"
                value={results[i]}
                min="0"
                max="3"
                step="1"
                id={id}
                name={id}
                onChange={(e) => {
                  handleRatingChange(i, Number(e.target.value));
                }}
              />
              <ul className="flex flex-row">
                <li className="text-xs w-1/6 text-left opacity-60" value="0">
                  Stimmt
                  <br /> gar nicht
                </li>
                <li className="text-xs w-1/3 text-center opacity-60" value="1">
                  Stimmt
                  <br />
                  nicht so sehr
                </li>
                <li className="text-xs w-1/3 text-center opacity-60" value="2">
                  Stimmt
                  <br />
                  etwas
                </li>
                <li className="text-xs w-1/6 text-right opacity-60" value="3">
                  Stimmt
                </li>
              </ul>
            </div>
          </div>
        );
      })}
      <Button
        kind="primary"
        className="mt-auto mx-auto"
        onClick={() => {
          handleNext();
        }}
      >
        {isLastPage() ? "Abschließen" : "Weiter"}
      </Button>
    </div>
  );
};

export default RatingEvent;
