import { Button } from "@/components/Button";
import {
  Chart as ChartJS,
  ChartOptions,
  InteractionItem,
  LineElement,
  LinearScale,
  PointElement,
} from "chart.js";
import { getRelativePosition } from "chart.js/helpers";
import dragDataPlugin from "chartjs-plugin-dragdata";
import React, { MouseEventHandler, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { EventItemResult } from "./container";

ChartJS.register(LinearScale, PointElement, LineElement, dragDataPlugin);

type Point = { x: number; y: number };

const options: ChartOptions = {
  responsive: true,
  scales: {
    x: {
      type: "linear",
      position: "bottom",
      title: {
        display: true,
        text: "Jahre",
        color: "#3E0BB6",
      },
      beginAtZero: true,
      max: 100,
      grid: {
        display: false,
      },
      ticks: {
        stepSize: 5,
        color: "#3E0BB6",
      },
      border: {
        color: "#3E0BB6",
        width: 2,
      },
    },
    y: {
      title: {
        display: true,
      },
      beginAtZero: true,
      max: 100,
      grid: {
        display: false,
      },
      ticks: {
        stepSize: 5,
        callback: (_value, index, ticks) => {
          if (index == 0) return "☹";
          if (index == ticks.length - 1) return "☺";
          return "";
        },
        color: "#3E0BB6",
        font: {
          size: 20,
        },
      },
      border: {
        color: "#3E0BB6",
        width: 2,
      },
    },
  },
  onHover: (event, elements, _chart) => {
    const target = event.native?.target;
    if (target) target.style.cursor = "pointer";
    // return early
    if (elements.length == 0) return;
    if (target) target.style.cursor = "grab";
  },
  plugins: {
    tooltip: {
      enabled: false,
    },
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    dragData: {
      round: 0,
      dragX: true,
      showTooltip: false,
      /* onDragStart: function (e, datasetIndex, index, value) {}, */
      onDrag: function (e) {
        if (e.target) e.target.style.cursor = "grabbing";
      },
      onDragEnd: function (e) {
        if (e.target) e.target.style.cursor = "pointer";
      },
    },
  },
};

interface LifelineEventProps {
  onSubmit: (results: EventItemResult[]) => void;
}

const LifelineEvent: React.FC<LifelineEventProps> = ({ onSubmit }) => {
  const chartRef = useRef<ChartJS>();
  const [data, setData] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);

  const handleSubmit = () => {
    const finalResults = data.map((item) => {
      return {
        item: `${item.x}`, //age
        rating: item.y, //amplitude
      };
    });
    onSubmit(finalResults);
  };

  const addData = (point: Point) => {
    const newPoints = [...data, point];
    newPoints.sort((a, b) => a.x - b.x);
    setData(newPoints);
  };

  const removeData = (point: InteractionItem) => {
    const index = point.index;
    const newPoints = data.filter((_p, i) => i != index);
    setData(newPoints);
  };

  const onClick: MouseEventHandler = (event) => {
    const { current: chart } = chartRef;

    if (!chart) {
      return;
    }

    const mouseEvent = event.nativeEvent;
    const points = chart.getElementsAtEventForMode(
      mouseEvent,
      "nearest",
      { intersect: true },
      false
    );

    // Handle right-click (or Ctrl+Click fallback)
    if (mouseEvent.button === 2 || mouseEvent.ctrlKey) {
      if (points.length) removeData(points[0]);
      return;
    }

    const pos = getRelativePosition(mouseEvent, chart);
    const x = chart.scales.x.getValueForPixel(pos.x);
    const y = chart.scales.y.getValueForPixel(pos.y);

    if (!x || !y) return;

    addData({ x, y });
  };

  return (
    <div className="flex flex-col flex-1">
      <ul className="text-xs mx-auto mt-6 list-disc text-left">
        <li>Links-Klick fügt einen neuen Punkt hinzu</li>
        <li>Punkte können frei verschoben werden</li>
        <li>Rechts-Klick (Strg+Klick) auf Punkt löscht ihn</li>
      </ul>
      <Line
        ref={chartRef}
        options={options}
        onClick={onClick}
        data={{
          datasets: [
            {
              label: "Lifeline 1",
              data: data,
              borderColor: "#22F56E",
              tension: 0.3,
            },
          ],
        }}
      />
      <Button
        kind="primary"
        className="mt-auto mx-auto"
        onClick={() => {
          handleSubmit();
        }}
      >
        Abschließen
      </Button>
    </div>
  );
};

export default LifelineEvent;
