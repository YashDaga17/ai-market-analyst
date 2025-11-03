import { Button } from "@/components/ui/button";

interface ExampleQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const EXAMPLE_QUESTIONS = [
  "What are the main competitors?",
  "What is the market size and growth rate?",
  "What are the biggest opportunities?",
  "What are the key threats and risks?",
  "How can the company improve market share?",
  "What are the company's competitive advantages?",
  "What is the revenue breakdown?",
  "What strategic recommendations are provided?",
];

export function ExampleQuestions({ onQuestionClick }: ExampleQuestionsProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 font-medium">Try asking:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {EXAMPLE_QUESTIONS.map((question, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className="justify-start text-left h-auto py-2 px-3 text-xs"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
