import { useState } from "react";

const faqList = [
  {
    question:
      "Lorem ipsum dolor sit amet consectetur. Elementum sed pretium quis sed risus?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam viverra.",
  },
  {
    question: "Lorem ipsum dolor sit amet consectetur?",
    answer:
      "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
  },
  {
    question: "Can I use my own OpenAI API key?",
    answer: "Yes, you can use your own OpenAI API key under account settings.",
  },
  {
    question: "Lorem ipsum dolor sit amet consectetur. Fermentum sed?",
    answer: "Fermentum sed facilisis orci, in ullamcorper urna.",
  },
];

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white dark:bg-[#15171C] space-y-6">
      <div className="text-lg font-semibold text-[#2E3A59] dark:text-white">
        FAQs
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Answers to the most frequently asked questions.
      </p>

      <div className="space-y-4">
        {faqList.map((faq, index) => (
          <div
            key={index}
            className="border-b border-gray-200 dark:border-[#1E2027] pb-3 cursor-pointer"
            onClick={() => toggleFAQ(index)}
          >
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{faq.question}</div>
              <span className="text-xl">{openIndex === index ? "−" : "+"}</span>
            </div>
            {openIndex === index && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQs;
