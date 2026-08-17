import { Link } from "react-router-dom";

import { FaArrowRight } from "react-icons/fa6";

function CTA() {

  return (
    <section
      className="cta"
      id="cta"
    >

      <div className="container">

        <div
          className="cta-box"
          data-aos="zoom-in"
        >

          <div className="cta-content">

            <h2>
              Ready to Care Smarter?
            </h2>

            <p>
              Start your CareConnect journey today.
            </p>

          </div>

          <Link
            to="/signup"
            className="cta-btn"
          >

            Get Started

            <FaArrowRight />

          </Link>

        </div>

      </div>

    </section>
  );
}

export default CTA;