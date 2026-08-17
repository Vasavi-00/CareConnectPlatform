import {
  FaUserPlus,
  FaUsers,
  FaMobileScreenButton,
  FaHeartPulse,
} from "react-icons/fa6";

const steps = [

  {
    number: "01",
    icon: <FaUserPlus />,
    title: "Create Account",
    desc:
      "Create a CareConnect account as an elder or family member."
  },

  {
    number: "02",
    icon: <FaUsers />,
    title: "Connect Family",
    desc:
      "Family members and elders are securely connected through CareConnect."
  },

  {
    number: "03",
    icon: <FaMobileScreenButton />,
    title: "Manage Care",
    desc:
      "Families manage medicines, appointments and emergency contacts."
  },

  {
    number: "04",
    icon: <FaHeartPulse />,
    title: "Stay Connected",
    desc:
      "Elders receive reminders and support while families receive important notifications."
  },

];

function HowItWorks() {

  return (
    <section
      className="how-it-works"
      id="works"
    >

      <div className="container">

        <div className="section-title">

          <span className="badge">
            How It Works
          </span>

          <h2>
            Get Started In Four Simple Steps
          </h2>

          <p>
            CareConnect makes elderly care
            simple, connected and reliable.
          </p>

        </div>

        <div
          className="steps"
          data-aos="fade-up"
        >

          {steps.map(
            (step, index) => (

              <div
                className="step-card"
                key={index}
              >

                <div className="step-number">
                  {step.number}
                </div>

                <div className="step-icon">
                  {step.icon}
                </div>

                <h3>
                  {step.title}
                </h3>

                <p>
                  {step.desc}
                </p>

              </div>

            )
          )}

        </div>

      </div>

    </section>
  );
}

export default HowItWorks;