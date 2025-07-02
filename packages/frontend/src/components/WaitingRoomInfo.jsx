import React, { useState, useEffect } from 'react';

const STEAMFacts = [
  "STEAM stands for Science, Technology, Engineering, Arts, and Mathematics.",
  "The 'A' in STEAM emphasizes creativity and design thinking.",
  "Robotics competitions are a popular way to engage in STEAM learning.",
  "Coding is a fundamental skill in many STEAM fields.",
  "STEAM education aims to solve real-world problems through interdisciplinary approaches.",
  "3D printing is a technology often used in STEAM projects.",
  "The scientific method is a core part of the 'S' in STEAM.",
  "Graphic design and data visualization are part of the 'A' and 'T' in STEAM."
];

const WaitingRoomInfo = ({ roomStatus, isHost, onStartQuiz, timeUntilStart }) => {
  const [fact, setFact] = useState('');

  useEffect(() => {
    setFact(STEAMFacts[Math.floor(Math.random() * STEAMFacts.length)]);
    const interval = setInterval(() => {
      setFact(STEAMFacts[Math.floor(Math.random() * STEAMFacts.length)]);
    }, 15000); // Change fact every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 my-6 text-center">
      {roomStatus === 'waiting' && (
        <>
          <h3 className="text-2xl font-semibold text-creative-purple mb-4">
            Waiting Room
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isHost ? "Players are joining. Start the quiz when you're ready!" : "Waiting for the host to start the quiz. Get ready!"}
          </p>

          {timeUntilStart !== null && timeUntilStart > 0 && (
            <div className="my-4">
              <p className="text-lg text-tech-blue">Starting in:</p>
              <p className="text-4xl font-bold text-learning-yellow">{timeUntilStart}s</p>
            </div>
          )}

          {isHost && onStartQuiz && timeUntilStart === null && (
            <button
              onClick={onStartQuiz}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg"
            >
              Start Quiz Now!
            </button>
          )}

          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h4 className="text-md font-semibold text-tech-blue mb-2">STEAM Fact/Tip:</h4>
            <p className="text-gray-700 dark:text-gray-200 italic">
              {fact}
            </p>
          </div>
        </>
      )}
       {roomStatus === 'countdown' && (
         <>
          <h3 className="text-2xl font-semibold text-creative-purple mb-4">
            Get Ready!
          </h3>
           <p className="text-gray-600 dark:text-gray-300 mb-6">
            The quiz is about to begin!
          </p>
           {timeUntilStart !== null && timeUntilStart > 0 && (
            <div className="my-4">
              <p className="text-2xl text-tech-blue">Starting in:</p>
              <p className="text-6xl font-bold text-learning-yellow animate-pulse">{timeUntilStart}</p>
            </div>
          )}
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h4 className="text-md font-semibold text-tech-blue mb-2">Quick Tip:</h4>
            <p className="text-gray-700 dark:text-gray-200 italic">
              Focus and read each question carefully!
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default WaitingRoomInfo;
