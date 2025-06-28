import React, { useState } from "react";
import Footer from "../Footer";
import { BookOpen } from "lucide-react";

const rules = [
  "Respect all members: avoid harassment, hate speech, and personal attacks.",
  "Do not share or post illegal, harmful, offensive, or discriminatory content.",
  "Protect your personal information and respect others' privacy at all times.",
  "Avoid spamming, self-promotion, or irrelevant advertising.",
  "Report any suspicious or inappropriate behavior promptly to moderators.",
  "Follow intellectual property rights and do not upload unauthorized content.",
  "Use appropriate language—no excessive profanity or vulgarity.",
  "Engage in discussions constructively and avoid inflammatory comments.",
  "Do not impersonate others or misrepresent your identity.",
  "Adhere to platform-specific terms of service alongside these guidelines.",
  "Repeated violations may result in content removal, account suspension, or bans.",
];

const guidelines = [
  {
    question: "What kind of content is allowed on the platform?",
    answer:
      "We allow content that is respectful, legal, and adheres to community standards. Content that promotes hate speech, violence, illegal activities, or explicit material is strictly prohibited.",
  },
  {
    question: "How should I interact with other users?",
    answer:
      "Please engage respectfully and thoughtfully. Harassment, bullying, and discriminatory remarks are not tolerated. Treat others as you would like to be treated.",
  },
  {
    question: "What happens if I violate the guidelines?",
    answer:
      "Violations may result in content removal, warnings, temporary suspensions, or permanent bans depending on severity and frequency.",
  },
  {
    question: "Can I report inappropriate content or behavior?",
    answer:
      "Yes! Use the report feature or contact support immediately to flag inappropriate content or behavior for review.",
  },
  {
    question: "Are there any rules about sharing personal information?",
    answer:
      "Protect your privacy and others'. Do not share sensitive personal information publicly or request it from others.",
  },
  {
    question: "How often are the guidelines updated?",
    answer:
      "Guidelines are reviewed regularly and updated as needed to maintain a safe and welcoming community. We encourage users to check back periodically.",
  },
];

export default function Guidelines() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggle = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter((i) => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-10 relative flex flex-col md:flex-row items-start gap-8">
        {/* Main Content: Rules */}
        <section className="flex-1 bg-slate-700 rounded-2xl shadow-xl p-8 md:p-12 text-white relative z-10 max-w-4xl mx-auto md:mx-0">
          <div className="text-center mb-6">
            <BookOpen className="mx-auto mb-4 text-sky-400 w-12 h-12 animate-bounce" />
            <h1 className="text-4xl font-bold mb-4">Community Guidelines</h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Our community guidelines help create a safe, respectful, and enjoyable space for everyone. Please read carefully.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl shadow-lg p-6 md:p-10 mt-6 text-white">
            <h2 className="text-2xl font-semibold mb-4">Rules</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-200">
              {rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Sidebar: FAQ Accordion */}
        <aside className="w-full md:w-96 bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 text-white relative z-0 hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-2xl font-bold mb-4 border-b border-slate-700 pb-2">FAQs</h2>
          <div className="space-y-4">
            {guidelines.map(({ question, answer }, idx) => {
              const isOpen = openIndexes.includes(idx);
              return (
                <div key={idx} className="border-b border-slate-700 last:border-b-0">
                  <button
                    onClick={() => toggle(idx)}
                    className="w-full flex justify-between items-center text-left py-3 font-semibold text-white text-lg focus:outline-none"
                    aria-expanded={isOpen}
                    aria-controls={`faq-content-${idx}`}
                  >
                    {question}
                    <svg
                      className={`w-5 h-5 ml-2 transform transition-transform duration-300 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  <div
                    id={`faq-content-${idx}`}
                    className={`mt-2 text-slate-300 text-base overflow-hidden transition-max-height duration-300 ease-in-out ${
                      isOpen ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <p>{answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
