import { useState, useEffect } from 'react';
import '../styles/Timer.css';

const Timer = ({ 
  isActive, // state: whether the timer is active
  onTimeUp, // prop: function to call when time is up
  totalTime = 30, // optional prop: total time in seconds for the timer
}) => {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [hasCalledTimeUp, setHasCalledTimeUp] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => { // interval is like a timer id
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // 1000 ms
    }
    return () => clearInterval(interval); // cancel the interval
  }, [isActive, timeLeft]);

  // Handle time up in a separate effect to avoid calling during render
  useEffect(() => {
    if (isActive && timeLeft === 0 && !hasCalledTimeUp) {
      setHasCalledTimeUp(true);
      onTimeUp();
    }
  }, [isActive, timeLeft, onTimeUp, hasCalledTimeUp]);

  // Reset timer when becoming active
  useEffect(() => {
    if (isActive) {
      setTimeLeft(totalTime);
      setHasCalledTimeUp(false); // Reset the flag for new timer session
    }
  }, [isActive, totalTime]);

  if (!isActive) return null;

  return (
    <div className={`fixed-timer ${timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warning' : 'success'}`}>
      <div className={`timer-circle ${timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warning' : 'success'}`}>
        <svg className="timer-progress" width="68" height="68">
          <circle
            cx="34"
            cy="34"
            r="30"
            fill="none"
            stroke={timeLeft <= 10 ? '#dc3545' : timeLeft <= 20 ? '#ffc107' : '#28a745'}
            strokeWidth="4"
            strokeDasharray={`${(timeLeft / totalTime) * 188.5} 188.5`} // 188.5 is the circumference of the circle: 2 * Math.PI * r
            strokeDashoffset="0"
            transform="rotate(-90 34 34)"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        </svg>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', zIndex: 10, position: 'relative' }}>
          {timeLeft}
        </span>
      </div>
      <div className="timer-text">
        ⏰ Time Left
      </div>
    </div>
  );
};

export default Timer;
