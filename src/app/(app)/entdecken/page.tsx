import { requireUser } from "@/lib/session";
import { getDiscoverItems } from "@/lib/discover";
import { PageHeader } from "@/components/page-header";
import { DiscoverDeck } from "@/components/discover/discover-deck";

export const metadata = { title: "Entdecken" };

// App-Ansicht „Entdecken“: Artists, Werke (Musik & Stock), Pakete und Studios gemischt –
// als Swipe-Stapel (rechts = merken, links = weiter) oder als Feed zum Scrollen.
export default async function DiscoverPage() {
  const user = await requireUser();
  const items = await getDiscoverItems(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title="Entdecken" description="Rechts wischen merkt, links geht’s weiter." />
      <DiscoverDeck items={items} />
    </div>
  );
}
