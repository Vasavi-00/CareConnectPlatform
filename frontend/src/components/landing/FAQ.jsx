const faqs = [
  {
    question: "What is CareConnect?",
    answer:
      "CareConnect is a smart elder care platform that helps families monitor and care for senior citizens remotely.",
  },
  {
    question: "Is my family's data secure?",
    answer:
      "Yes. We use secure authentication and encrypted communication to protect health data.",
  },
  {
    question: "Can multiple family members connect?",
    answer:
      "Yes. Multiple family members can monitor and receive notifications.",
  },
  {
    question: "Does CareConnect support emergency alerts?",
    answer:
      "Yes. SOS alerts instantly notify connected family members.",
  },
];

function FAQ() {
  return (
    <section className="faq" id="faq">
      <div className="container">

        <div className="section-title">
          <span className="badge">FAQ</span>
          <h2>Frequently Asked Questions</h2>
        </div>

        <div className="faq-container" data-aos="fade-up">

          {faqs.map((faq, index) => (
            <details key={index}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}

        </div>

      </div>
    </section>
  );
}

export default FAQ;