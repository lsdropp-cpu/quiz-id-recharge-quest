import quizQ1 from "@/assets/quiz-q1.jpg";
import quizQ2 from "@/assets/br-quiz-q2.jpg";
import quizQ3 from "@/assets/br-quiz-q3.jpg";
import quizQ4 from "@/assets/quiz-q4.jpg";
import quizQ5 from "@/assets/br-quiz-q5.jpg";
import quizQ6 from "@/assets/quiz-q6.jpg";

export interface QuizQuestion {
  id: number;
  question: string;
  image: string;
  options: string[];
}

export const quizQuestions: QuizQuestion[] = [
  { id: 1, question: "Há quanto tempo você joga Free Fire?", image: quizQ1, options: ["Menos de 1 mês", "1–6 meses", "6–12 meses", "Mais de 1 ano"] },
  { id: 2, question: "Com que frequência você joga por semana?", image: quizQ2, options: ["1–2 dias", "3–4 dias", "5–7 dias"] },
  { id: 3, question: "Qual modo você mais joga?", image: quizQ3, options: ["Casual", "Ranqueada / Ranked"] },
  { id: 4, question: "Você já comprou diamantes antes?", image: quizQ4, options: ["Nunca", "1 vez", "Várias vezes"] },
  { id: 5, question: "Qual é sua patente atual?", image: quizQ5, options: ["Bronze / Prata", "Ouro / Platina", "Diamante / Mestre", "Desafiante ou superior"] },
  { id: 6, question: "Você tem personagens pagos desbloqueados?", image: quizQ6, options: ["Nenhum", "1 ou 2", "3 ou mais"] },
];
