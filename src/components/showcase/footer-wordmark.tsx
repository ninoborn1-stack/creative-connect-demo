import { APP_NAME } from "@/lib/brand";
import { MotionScope } from "@/components/showcase/motion-scope";

// Riesiger Schriftzug unten im Footer, kursives Serif, am unteren Rand angeschnitten. Schiebt sich beim
// Hineinscrollen leicht nach oben. Dekorativ, der Name steht als Text im Footer.
export function FooterWordmark() {
  return (
    <MotionScope mode="enter" className="sc-wordmark" aria-hidden data-testid="footer-wordmark">
      <p className="sc-wordmark-text">{APP_NAME}</p>
    </MotionScope>
  );
}
