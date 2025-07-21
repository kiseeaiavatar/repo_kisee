"use client";

import {
  ChartEvent,
  Chart as ChartJS,
  ChartOptions,
  LineElement,
  LinearScale,
  PointElement,
} from "chart.js";
import { getRelativePosition } from "chart.js/helpers";
import dragDataPlugin from "chartjs-plugin-dragdata";
import React, { useRef } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, LineElement, dragDataPlugin);

export const options: ChartOptions = {
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
        if (e.target) e.target.style.cursor = "default";
      },
    },
  },
};

export const data = {
  datasets: [
    {
      label: "Dataset 1",
      data: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ] as { x: number; y: number }[],
      borderColor: "#22F56E",
      tension: 0.3,
    },
  ],
};

export default function ChartPage() {
  const chartRef = useRef<ChartJS>();

  const onClick = (event: ChartEvent) => {
    const { current: chart } = chartRef;

    if (!chart) {
      return;
    }
    // Get elements under the click
    const mouseEvent = event.native as MouseEvent;
    const points = chart.getElementsAtEventForMode(
      mouseEvent,
      "nearest",
      { intersect: true },
      false
    );

    // Handle right-click (or Ctrl+Click fallback)
    if (mouseEvent.button === 2 || mouseEvent.ctrlKey) {
      if (points.length) {
        const point = points[0];
        const index = point.index;

        data.datasets[point.datasetIndex].data.splice(index, 1);
        chart.update();
      }
      return;
    }

    const pos = getRelativePosition(event, chart);
    const x = chart.scales.x.getValueForPixel(pos.x);
    const y = chart.scales.y.getValueForPixel(pos.y);

    if (!x || !y) return;

    data.datasets[0].data.push({ x, y });
    data.datasets[0].data.sort((a, b) => a.x - b.x);

    // FIXME delete
    chart.update();
  };

  options.onClick = onClick;

  return (
    <div style={{ width: "50%", margin: "auto" }}>
      <Line ref={chartRef} options={options} data={data} />
      <p>
        <ul>
          <li>Links-Klick fügt einen neuen Punkt hinzu</li>
          <li>Punkte können frei verschoben werden</li>
          <li>Rechts-Klick (Strg+Klick) auf Punkt löscht ihn</li>
        </ul>
      </p>
    </div>
  );
}
