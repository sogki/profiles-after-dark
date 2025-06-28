import React, { useState } from "react";
import Footer from "../Footer";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const reportItems = [
  {
    title: "What can I report?",
    description:
      "You can report any content or behavior that violates our community guidelines or terms of service, including harassment, hate speech, spam, illegal content, or inappropriate material.",
  },
  {
    title: "How to report content?",
    description:
      "Most content has a report button or link. Click it, select the reason for reporting, and submit. You can also contact support if the report button is not available.",
  },
  {
    title: "What happens after I report?",
    description:
      "Reports are reviewed by our moderation team promptly. Depending on severity, content may be removed and the user may face warnings or suspension.",
  },
  {
    title: "Can I report anonymously?",
    description:
      "Yes, reports are confidential. Your identity is not shared with the person or content you report.",
  },
  {
    title: "What types of evidence should I provide?",
    description:
      "Include screenshots, URLs, or detailed descriptions to help moderators understand and act on the report effectively.",
  },
  {
    title: "How long does it take to resolve a report?",
    description:
      "We strive to review reports as quickly as possible, usually within 24-72 hours, but complex cases may take longer.",
  },
  {
    title: "Can I appeal a decision?",
    description:
      "If you disagree with a moderation decision, you can contact support for a review or appeal.",
  },
  {
    title: "What happens if I misuse the report feature?",
    description:
      "Misuse, such as false reporting or harassment through reports, can lead to account penalties.",
  },
];

const faqs = [
  {
    question: "Who reviews the reports?",
    answer:
      "Our dedicated moderation team, trained to handle reports fairly and confidentially, reviews all submissions.",
  },
  {
    question: "Is reporting content the same as blocking a user?",
    answer:
      "No. Reporting alerts moderators about violations, while blocking prevents you from seeing or interacting with that user.",
  },
  {
    question: "Can I track the status of my report?",
    answer:
      "Currently, you cannot track reports individually, but we notify you if action is taken when appropriate.",
  },
  {
    question: "Are all reports investigated?",
    answer:
      "Yes, every report is reviewed, but not all result in action if the content complies with guidelines.",
  },
  {
    question: "Can I report content posted by minors?",
    answer:
      "Yes, protecting minors is a priority. Please report any concerning content involving minors immediately.",
  },
];

export default function ReportContent() {
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);

  const toggleFaq = (index: number) => {
    if (openFaqs.includes(index)) {
      setOpenFaqs(openFaqs.filter((i) => i !== index));
    } else {
      setOpenFaqs([...openFaqs, index]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-10 relative flex flex-col md:flex-row items-start gap-8">
        {/* Main Content: Report Items */}
        <section className="flex-1 bg-slate-700 rounded-2xl shadow-xl p-8 md:p-12 text-white relative z-10">
          <div className="text-center mb-6">
            <AlertCircle className="mx-auto mb-4 text-red-400 w-14 h-14 animate-pulse" />
            <h1 className="text-4xl font-bold mb-2">Report Content</h1>
            <p className="text-slate-300 max-w-xl mx-auto">
              Help us maintain a safe community by reporting content or behavior that violates our rules and guidelines. Here’s everything you need to know about reporting on our platform.
            </p>
          </div>

          <div className="space-y-6 mt-6">
            {reportItems.map(({ title, description }, idx) => (
              <div
                key={idx}
                className="bg-slate-800 rounded-xl p-5 shadow-md hover:shadow-2xl transition-shadow duration-300"
              >
                <h2 className="text-2xl font-semibold mb-2">{title}</h2>
                <p className="text-slate-300 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sidebar: FAQ Accordion */}
        <aside className="w-full md:w-96 bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 text-white relative z-0 hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-2xl font-bold mb-4 border-b border-slate-700 pb-2">
            Reporting FAQs
          </h2>
          <div className="space-y-4">
            {faqs.map(({ question, answer }, idx) => {
              const isOpen = openFaqs.includes(idx);
              return (
                <div key={idx} className="border-b border-slate-700 last:border-b-0">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex justify-between items-center text-left py-3 font-semibold text-white text-lg focus:outline-none"
                    aria-expanded={isOpen}
                    aria-controls={`faq-content-${idx}`}
                  >
                    {question}
                    <motion.svg
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </motion.svg>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-content-${idx}`}
                        key="content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mt-2 text-slate-300 text-base overflow-hidden"
                      >
                        <p>{answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
