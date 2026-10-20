import quizQ1 from "@/assets/quiz-q1.jpg";
import quizQ2 from "@/assets/fr-quiz-q2.jpg";
import quizQ3 from "@/assets/fr-quiz-q3.jpg";
import quizQ4 from "@/assets/quiz-q4.jpg";
import quizQ5 from "@/assets/fr-quiz-q5.jpg";
import quizQ6 from "@/assets/fr-quiz-q6.jpg";

export interface QuizQuestion {
  id: number;
  question: string;
  image: string;
  options: string[];
}

export const quizQuestions: QuizQuestion[] = [
  { id: 1, question: "Depuis combien de temps jouez-vous à Free Fire ?", image: quizQ1, options: ["Moins d’un mois", "1–6 mois", "6–12 mois", "Plus d’un an"] },
  { id: 2, question: "Combien de jours par semaine jouez-vous ?", image: quizQ2, options: ["1–2 jours", "3–4 jours", "5–7 jours"] },
  { id: 3, question: "Quel mode jouez-vous le plus ?", image: quizQ3, options: ["Classique", "Classé"] },
  { id: 4, question: "Avez-vous déjà acheté des diamants ?", image: quizQ4, options: ["Jamais", "Une fois", "Plusieurs fois"] },
  { id: 5, question: "Quel est votre rang actuel ?", image: quizQ5, options: ["Bronze / Argent", "Or / Platine", "Diamant / Héroïque", "Grand Maître ou supérieur"] },
  { id: 6, question: "Avez-vous débloqué des personnages payants ?", image: quizQ6, options: ["Aucun", "1 ou 2", "3 ou plus"] },
];
