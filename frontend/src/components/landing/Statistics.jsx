import Counter from "./Counter";

const stats = [

  {
    end: 15000,
    suffix: "+",
    title: "Families",
  },

  {
    end: 30000,
    suffix: "+",
    title: "Elderly Users",
  },

  {
    end: 100000,
    suffix: "+",
    title: "Care Activities",
  },

  {
    end: 99.9,
    suffix: "%",
    decimals: 1,
    title: "Platform Reliability",
  },

];

function Statistics() {

  return (
    <section
      className="stats"
      id="statistics"
    >

      <div className="container">

        <div
          className="stats-grid"
          data-aos="zoom-in"
        >

          {stats.map(
            (item, index) => (

              <div
                className="stat-box"
                key={index}
              >

                <h2>

                  <Counter
                    end={item.end}
                    suffix={item.suffix}
                    decimals={
                      item.decimals || 0
                    }
                  />

                </h2>

                <p>
                  {item.title}
                </p>

              </div>

            )
          )}

        </div>

      </div>

    </section>
  );
}

export default Statistics;