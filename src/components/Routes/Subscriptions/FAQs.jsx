import { useState } from "react";

const faqList = [
  {
    question: "What is Algorooms' goal?",
    answer:
      "Algorooms aims to simplify the trading process, making it effortless for both new and experienced traders.",
  },
  {
    question: "How does Algorooms help me?",
    answer:
      "Algorooms offers various features such as trading engine, strategy building wizard, algo trading, and backtesting to help you trade smarter, not harder.",
  },
  {
    question: "What are the available subscription plans?",
    answer:
      "Algorooms offers three subscription plans: Free, Unlimited, and Limited.",
  },
  {
    question: "What features are included in the Free plan?",
    answer:
      "The Free plan includes basic features such as backtesting, strategy creation (up to 5), and limited backtest counts (50).",
  },
  {
    question: "What features are included in the Unlimited plan?",
    answer:
      "The Unlimited plan includes advanced features such as access to HNI and Retail strategy templates, higher limits for live and paper deployments, increased strategy creation (up to 50), and a higher backtest count (1500).",
  },
  {
    question: "What features are included in the Limited plan?",
    answer:
      "The Limited plan offers intermediate features including backtesting, strategy creation (up to 25), Limited live and paper deployments, and a moderate backtest count.",
  },
  {
    question: "Are there any restrictions on broker access?",
    answer:
      "Yes, the Unlimited plan allows access to a All brokers, while the Limited plan restricts access to some brokers.",
  },
  {
    question: "Is access to strategy templates included in all plans?",
    answer:
      "No, access to HNI and Retail strategy templates is available only with the Unlimited plan.",
  },
  {
    question: "How my query would be resolved?",
    answer:
      "You can contact our support details provided. Do not modify or delete the strategy or broker you are facing issue with, until you query is resolved.",
  },
];

const FAQs = () => {
  const [openIndexes, setOpenIndexes] = useState([]);

  const toggleFAQ = (index) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter((i) => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  return (
    <div className="bg-white dark:bg-[#131419] rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-[#2E3A59] dark:text-white mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Find answers to common questions about Algorooms
        </p>
      </div>

      <div className="space-y-3">
        {faqList.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-[#1E2027] rounded-lg overflow-hidden transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-900/50"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex justify-between items-center p-4 text-left bg-gray-50 dark:bg-[#1E2027] hover:bg-gray-100 dark:hover:bg-[#252830] transition-colors"
            >
              <span className="text-sm font-medium text-[#2E3A59] dark:text-white pr-4">
                {faq.question}
              </span>
              <span
                className="text-xl text-blue-600 dark:text-blue-400 flex-shrink-0 transition-transform duration-200"
                style={{
                  transform: openIndexes.includes(index)
                    ? "rotate(45deg)"
                    : "rotate(0deg)",
                }}
              >
                +
              </span>
            </button>
            {openIndexes.includes(index) && (
              <div className="p-4 bg-white dark:bg-[#131419] border-t border-gray-200 dark:border-[#1E2027]">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQs;
