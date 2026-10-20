import { Button } from "@/components/ui/button";
import { useState } from "react";
import { quizQuestions } from "@/data/br/quizData";

interface QuizQuestionsProps {
  onComplete: (answers: number[]) => void;
}

const QuizQuestions = ({ onComplete }: QuizQuestionsProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showMidReward, setShowMidReward] = useState(false);
  const [midShown, setMidShown] = useState(false);

  const question = quizQuestions[currentQuestion];
  const totalQuestions = quizQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const letters = ["A", "B", "C", "D"];
  const unlocked = progress >= 100 ? 65 : progress >= 50 ? 35 : 15;

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers, selectedOption];
    if (currentQuestion < totalQuestions - 1) {
      setAnswers(newAnswers);
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      setSelectedOption(null);
      if (!midShown && totalQuestions > 2 && next === Math.floor(totalQuestions / 2)) {
        setMidShown(true);
        setShowMidReward(true);
      }
    } else {
      onComplete(newAnswers);
    }
  };

  return (
    <div className="animate-fade-in">
      {showMidReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border-2 border-primary bg-card p-6 text-center shadow-2xl shadow-primary/40">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-4xl animate-bounce">🏆</div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Bônus desbloqueado!</p>
            <h3 className="mt-2 text-2xl font-extrabold text-foreground">Você já garantiu 35% OFF</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Responda às últimas perguntas para desbloquear sua chance de <span className="font-bold text-primary">65% OFF</span> em diamantes.
            </p>
            <Button
              onClick={() => setShowMidReward(false)}
              className="h-auto whitespace-normal mt-5 w-full rounded-xl bg-gradient-to-b from-primary to-primary/80 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110"
            >
              Continuar e desbloquear 65%
            </Button>
          </div>
        </div>
      )}
      <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            Etapa {currentQuestion + 1} de {totalQuestions}
          </span>
          <span className="text-sm font-bold text-primary">🎁 {unlocked}% OFF desbloqueado</span>
        </div>

        <div className="relative w-full bg-muted rounded-full h-3 mb-6">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-primary/70 to-primary shadow-[0_0_12px] shadow-primary/60 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
          <span className="absolute -right-1 -top-2 text-xl" aria-hidden>🏆</span>
        </div>


        <div className="flex justify-center mb-4">
          <img
            src={question.image}
            alt={question.question}
            className="w-28 h-28 object-cover rounded-xl border-2 border-primary/30"
            loading="lazy"
          />
        </div>

        <h2 className="text-lg md:text-xl font-bold text-foreground text-center mb-6">{question.question}</h2>

        <div className="space-y-3 mb-5">
          {question.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => setSelectedOption(index)}
              className={`h-auto whitespace-normal w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                selectedOption === index
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  selectedOption === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {letters[index]}
              </span>
              <span className="text-foreground">{option}</span>
            </Button>
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="h-auto whitespace-normal w-full text-lg font-semibold py-4 px-6 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {currentQuestion === totalQuestions - 1 ? "Ver resultado" : "Próxima"}
        </Button>
      </div>
    </div>
  );
};

export default QuizQuestions;
