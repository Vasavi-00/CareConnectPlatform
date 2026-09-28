import whyImage from "../../assets/images/why.png";

import {
  FaPills,
  FaCalendarCheck,
  FaBell,
  FaShieldAlt,
  FaRobot,
} from "react-icons/fa";

import { FaTriangleExclamation } from "react-icons/fa6";
const reasons = [

  {
    icon: <FaPills />,
    title: "Medicine Management",
    desc:
      "Families can manage medicine schedules and stock reminders."
  },

  {
    icon: <FaCalendarCheck />,
    title: "Appointment Management",
    desc:
      "Important appointments can be maintained and remembered."
  },

  {
    icon: <FaBell />,
    title: "Family Notifications",
    desc:
      "Families receive notifications about important events."
  },

  {
    icon: <FaShieldAlt />,
    title: "Secure Care",
    desc:
      "Authentication and controlled access protect user information."
  },

  {
    icon: <FaTriangleExclamation />,
    title: "Emergency Support",
    desc:
      "SOS alerts help connect elderly users with trusted contacts."
  },

  {
    icon: <FaRobot />,
    title: "AI Companion",
    desc:
      "An AI companion provides conversational support for elderly users."
  },

];

function WhyChoose() {

  return (
    <section
      className="why-us"
      id="about"
    >

      <div className="container">

        <div className="section-title">

          <span className="badge">
            Why Choose CareConnect
          </span>

          <h2>
            Smart Technology With Human Care
          </h2>

          <p>
            CareConnect combines family
            connectivity, reminders,
            emergency assistance and AI
            companionship to support elderly care.
          </p>

        </div>

        <div
          className="why-container"
          id="why"
        >

          <div
            className="why-image"
            data-aos="fade-right"
          >

            <img
              src={whyImage}
              alt="CareConnect"
            />

          </div>

          <div
            className="why-content"
            data-aos="fade-left"
          >

            <div className="why-grid">

              {reasons.map(
                (item, index) => (

                  <div
                    className="why-card"
                    key={index}
                  >

                    <div className="why-icon">
                      {item.icon}
                    </div>

                    <div>

                      <h4>
                        {item.title}
                      </h4>

                      <p>
                        {item.desc}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default WhyChoose;