import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { CompanyForm } from "@/components/companies/company-form";

export const metadata: Metadata = { title: "Unternehmensseite bearbeiten" };

type Params = Promise<{ slug: string }>;

export default async function EditCompanyPage({ params }: { params: Params }) {
  const [{ slug }, user] = await Promise.all([params, requireUser()]);
  const company = await db.company.findUnique({ where: { slug } });
  if (!company) notFound();
  if (user.companyId !== company.id && !user.isAdmin) redirect(`/unternehmen/${company.slug}`);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/unternehmen/${company.slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Zur Unternehmensseite
      </Link>
      <PageHeader title={`${company.name} bearbeiten`} description="Diese Angaben sehen Kreative auf eurer Unternehmensseite und in jeder Ausschreibung." />
      <CompanyForm
        company={{ id: company.id, slug: company.slug, tagline: company.tagline, about: company.about, industry: company.industry, size: company.size, city: company.city, website: company.website, founded: company.founded }}
      />
    </div>
  );
}
