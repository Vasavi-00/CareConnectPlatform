import {
  useEffect,
  useState,
} from "react";

function Counter({
  end,
  duration = 2000,
  suffix = "",
  decimals = 0,
}) {

  const [count, setCount] =
    useState(0);

  useEffect(() => {

    let start = 0;

    const increment =
      end / (duration / 16);

    const timer =
      setInterval(() => {

        start += increment;

        if (start >= end) {

          setCount(end);

          clearInterval(timer);

        } else {

          setCount(start);

        }

      }, 16);

    return () =>
      clearInterval(timer);

  }, [end, duration]);

  return (
    <>
      {count.toLocaleString(
        undefined,
        {
          minimumFractionDigits:
            decimals,

          maximumFractionDigits:
            decimals,
        }
      )}

      {suffix}
    </>
  );
}

export default Counter;