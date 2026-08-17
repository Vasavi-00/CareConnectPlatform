import userImage from "../../assets/images/user.png";

import { FaStar } from "react-icons/fa";

const testimonials = [

  {
    name: "Priya Sharma",
    role: "Daughter",
    message:
      "CareConnect helps our family stay connected with our parents and keep track of important care activities.",
  },

  {
    name: "Rahul Verma",
    role: "Son",
    message:
      "The medicine reminders and emergency support make elderly care much easier for our family.",
  },

  {
    name: "Anjali Rao",
    role: "Granddaughter",
    message:
      "The simple interface makes it easier for elderly family members to use the platform.",
  },

];

function Testimonials() {

  return (
    <section
      className="testimonials"
      id="testimonials"
    >

      <div className="container">

        <div className="section-title">

          <span className="badge">
            Testimonials
          </span>

          <h2>
            Designed For Families
          </h2>

          <p>
            CareConnect is designed to make
            elderly care more connected and manageable.
          </p>

        </div>

        <div
          className="testimonial-grid"
          data-aos="fade-up"
        >

          {testimonials.map(
            (item, index) => (

              <div
                className="testimonial-card"
                key={index}
              >

                <div className="stars">

                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />

                </div>

                <p>
                  {item.message}
                </p>

                <div className="user">

                  <img
                    src={userImage}
                    alt={item.name}
                  />

                  <div>

                    <h4>
                      {item.name}
                    </h4>

                    <span>
                      {item.role}
                    </span>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </section>
  );
}

export default Testimonials;