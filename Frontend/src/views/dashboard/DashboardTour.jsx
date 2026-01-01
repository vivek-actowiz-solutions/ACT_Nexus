import React, { useEffect, useState } from "react";
import Joyride from "react-joyride";

const DashboardTour = () => {
  const [run, setRun] = useState(false);

  const steps = [
    {
      target: ".pcoded-navbar",
      content: "This is your sidebar — use it to navigate between sections.",
    },
    {
      target: ".stats-card",
      content: "Here you can view all your task statistics at a glance.",
    },
    {
      target: ".add-task-btn",
      content: "Click here to add a new task to your project.",
    },
  ];
useEffect(() => {
  const hasSeenTour = localStorage.getItem("hasSeenTour");
  console.log("Value in localStorage:", hasSeenTour);

  if (hasSeenTour === null || hasSeenTour === "false") {
    setRun(true);
    console.log("Starting tour...");
  } else {
    setRun(false);
    console.log("Tour already completed.");
  }
}, []);

  const handleTourEnd = () => {
    localStorage.setItem("hasSeenTour", "true");
    setRun(false);
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
      callback={(data) => {
        if (["finished", "skipped"].includes(data.status)) {
          handleTourEnd();
        }
      }}
    />
  );
};

export default DashboardTour;
