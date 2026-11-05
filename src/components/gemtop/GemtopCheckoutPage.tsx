import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripeCardPaymentForm from "@/components/gemtop/StripeCardPaymentForm";
import diamondBonus from "@/assets/diamond-bonus.png";
import { track, trackFunnel } from "@/lib/gemtop-tracking";

const stripePromise = loadStripe(
  "pk_live_51USd0fEMALFSqtrSvveUnWRBhIPLfzAO0SkGsntOwIRZjBZO3xJ1EHfBrVf6oZeITfSybbS72YWqJBK5WuqFjRws00VafmEWmH"
);

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const texts = {
  es: {
    promo: "PROMOCIÓN SOLO HOY",
    productTitle: "Bono de Diamantes - Free Fire",
    bonusAlt: "Bono de Diamantes",
    emailLabel: "Tu correo electrónico",
    emailPlaceholder: "Ingresa tu correo para recibir la compra",
    emailRequired: "El correo electrónico es obligatorio",
    emailInvalid: "Ingresa un correo electrónico válido",
    nameLabel: "Nombre completo",
    namePlaceholder: "Ingresa tu nombre completo",
    productName: (diamonds: number) => `${diamonds.toLocaleString()} Diamantes Free Fire`,
  },
  en: {
    promo: "TODAY ONLY PROMOTION",
    productTitle: "Diamond Bonus - Free Fire",
    bonusAlt: "Diamond Bonus",
    emailLabel: "Your email address",
    emailPlaceholder: "Enter your email to receive the purchase",
    emailRequired: "Email is required",
    emailInvalid: "Enter a valid email address",
    nameLabel: "Full name",
    namePlaceholder: "Enter your full name",
    productName: (diamonds: number) => `${diamonds.toLocaleString()} Diamonds Free Fire`,
  },
} as const;

interface GemtopCheckoutPageProps {
  priceKey: string;
  priceUsd: number;
  diamonds: number;
  lang?: "es" | "en";
  banner: string;
  bannerAlt: string;
}

const GemtopCheckoutPage = ({ priceKey, priceUsd, diamonds, lang = "es", banner, bannerAlt }: GemtopCheckoutPageProps) => {
  const t = texts[lang];
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [dadosTracked, setDadosTracked] = useState(false);

  const getSource = () =>
    new URLSearchParams(window.location.search).get("utm_source") ||
    localStorage.getItem("utm_source") ||
    null;

  // Track funnel on checkout page load
  useEffect(() => {
    const source =
      new URLSearchParams(window.location.search).get("utm_source") ||
      localStorage.getItem("utm_source") ||
      null;
    track("checkout", `diamantes-${priceKey}`, source);
  }, [priceKey]);

  // Track 'dados' on first keystroke in email field
  const handleEmailChange = (value: string) => {
    setEmail(value);

    // Track 'dados' immediately on first input
    if (!dadosTracked && value.length > 0) {
      console.log("[FUNNEL] Disparando dados - primeiro keystroke");
      trackFunnel("dados", { productId: `diamantes-${priceKey}`, source: getSource() });
      setDadosTracked(true);
    }

    if (emailTouched) {
      if (!value.trim()) {
        setEmailError(t.emailRequired);
      } else if (!isValidEmail(value)) {
        setEmailError(t.emailInvalid);
      } else {
        setEmailError("");
      }
    }
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (!email.trim()) {
      setEmailError(t.emailRequired);
    } else if (!isValidEmail(email)) {
      setEmailError(t.emailInvalid);
    } else {
      setEmailError("");
    }
  };

  const handleNameBlur = () => {
    // No additional tracking needed - dados already tracked on first keystroke
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePaymentSuccess = () => {
    navigate({ to: "/obrigado" });
  };

  return (
    <div className="checkout-light min-h-screen bg-background text-foreground">
      {/* Urgency Header */}
      <div className="bg-destructive py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <span className="text-primary-foreground text-3xl md:text-4xl font-bold tabular-nums">
            {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-2 text-primary-foreground">
            <Clock className="w-5 h-5" />
            <span className="text-sm md:text-base font-medium">{t.promo}</span>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <img src={banner} alt={bannerAlt} className="w-full rounded-lg shadow-lg" />
        </div>
      </div>

      {/* Checkout Form */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-2xl shadow-xl p-6 md:p-8">
            {/* Product Info */}
            <div className="flex items-center gap-4 mb-6">
              <img src={diamondBonus} alt={t.bonusAlt} className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <h3 className="text-lg font-bold text-foreground">{t.productTitle}</h3>
                <p className="text-muted-foreground">{diamonds.toLocaleString()} + Bonus</p>
                <p className="text-green-500 font-bold text-lg">Total: $ {priceUsd.toFixed(2)} USD</p>
              </div>
            </div>

            {/* Customer Info Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-foreground font-medium mb-2">{t.emailLabel}</label>
                <Input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  className={`h-12 bg-muted border-border ${emailError ? "border-red-500 focus:border-red-500" : ""}`}
                  required
                />
                {emailError && (
                  <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                    <AlertCircle className="w-4 h-4" />
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">{t.nameLabel}</label>
                <Input
                  type="text"
                  placeholder={t.namePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={handleNameBlur}
                  className="h-12 bg-muted border-border"
                  required
                />
              </div>
            </div>

            {/* Payment Section with Stripe */}
            <Elements stripe={stripePromise}>
              <StripeCardPaymentForm
                priceKey={priceKey}
                amount={priceUsd}
                onSuccess={handlePaymentSuccess}
                productName={t.productName(diamonds)}
                customerEmail={email.trim()}
                customerName={fullName}
                lang={lang}
                onEmailInvalid={() => {
                  setEmailTouched(true);
                  if (!email.trim()) {
                    setEmailError(t.emailRequired);
                  } else {
                    setEmailError(t.emailInvalid);
                  }
                }}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GemtopCheckoutPage;
