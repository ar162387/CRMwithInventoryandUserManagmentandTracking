import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const BarChart = ({ data = [], labelKey, valueKey }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d) => d[labelKey]),
        datasets: [
          {
            label: 'PKR',
            data: data.map((d) => d[valueKey]),
            backgroundColor: '#3B82F6',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            ticks: {
              callback: function (value) {
                return value.toLocaleString();
              },
            },
          },
        },
      },
    });
  }, [data, labelKey, valueKey]);

  return <canvas ref={canvasRef} />;
};

export default BarChart; 