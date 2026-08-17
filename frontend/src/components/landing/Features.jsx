import {
  FaPills,
  FaCalendarCheck,
  FaTriangleExclamation,
  FaRobot,
  FaBell,
  FaUsers,
} from "react-icons/fa6";

const features = [

  {
    icon: <FaPills />,
    title: "Medicine Reminders",
    desc:
      "Elders receive timely reminders for their medicines and families can manage medicine schedules."
  },

  {
    icon: <FaCalendarCheck />,
    title: "Appointment Reminders",
    desc:
      "Families can maintain appointments and elderly users receive reminders at the right time."
  },

  {
    icon: <FaTriangleExclamation />,
    title: "Emergency SOS",
    desc:
      "An elderly user can trigger an emergency alert and notify trusted contacts according to priority."
  },

  {
    icon: <FaRobot />,
    title: "AI Companion",
    desc:
      "An AI companion allows elderly users to interact, talk and receive supportive assistance."
  },

  {
    icon: <FaBell />,
    title: "Family Notifications",
    desc:
      "Family members receive important notifications about emergencies, reminders and AI companion activity."
  },

  {
    icon: <FaUsers />,
    title: "Family Care Management",
    desc:
      "Family members can manage elders, medicines, appointments and emergency contacts from one place."
  },

];

function Features() {

  return (
    <section
      className="features"
      id="features"
    >

      <div className="container">

        <div
          className="section-title"
          data-aos="fade-up"
        >

          <span className="badge">
            Our Features
          </span>

          <h2>
            Everything You Need
            To Care For Your Loved Ones
          </h2>

          <p>
            CareConnect connects elderly
            people and their families through
            reminders, emergency support,
            AI companionship and care management.
          </p>

        </div>

        <div
          className="feature-grid"
          data-aos="zoom-in"
        >

          {features.map(
            (item, index) => (

              <div
                className="feature-card"
                key={index}
              >

                <div className="feature-icon">
                  {item.icon}
                </div>

                <h3>
                  {item.title}
                </h3>

                <p>
                  {item.desc}
                </p>

              </div>

            )
          )}

        </div>

      </div>

    </section>
  );
}

export default Features;