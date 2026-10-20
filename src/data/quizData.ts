import quizQ1 from "@/assets/quiz-q1.jpg";
import quizQ2 from "@/assets/quiz-q2.jpg";
import quizQ3 from "@/assets/quiz-q3.jpg";
import quizQ4 from "@/assets/quiz-q4.jpg";
import quizQ5 from "@/assets/quiz-q5.jpg";
import quizQ6 from "@/assets/quiz-q6.jpg";

export interface QuizQuestion {
  id: number;
  question: string;
  image: string;
  options: string[];
}

export const quizQuestions: QuizQuestion[] = [
  { id: 1, question: "¿Cuánto tiempo llevas jugando Free Fire?", image: quizQ1, options: ["Menos de 1 mes", "1–6 meses", "6–12 meses", "Más de 1 año"] },
  { id: 2, question: "¿Con qué frecuencia juegas por semana?", image: quizQ2, options: ["1–2 días", "3–4 días", "5–7 días"] },
  { id: 3, question: "¿Qué modo juegas más?", image: quizQ3, options: ["Casual", "Clasificatoria / Ranked"] },
  { id: 4, question: "¿Has comprado diamantes antes?", image: quizQ4, options: ["Nunca", "1 vez", "Varias veces"] },
  { id: 5, question: "¿Cuál es tu rango actual?", image: quizQ5, options: ["Bronce / Plata", "Oro / Platino", "Diamante / Heroico", "Gran Maestro o superior"] },
  { id: 6, question: "¿Tienes personajes pagos desbloqueados?", image: quizQ6, options: ["Ninguno", "1 o 2", "3 o más"] },
];
