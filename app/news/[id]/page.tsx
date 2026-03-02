import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await prisma.news.findUnique({ where: { id } });
  if (!article) return { title: "News" };
  return {
    title: `${article.title} | Sports News`,
    description: article.excerpt || article.title,
  };
}

async function getArticle(id: string) {
  return prisma.news.findUnique({ where: { id } });
}

function formatNewsDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function NewsArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>

          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.teams.map((team) => (
                <Link
                  key={team}
                  href={`/shop?team=${encodeURIComponent(team)}`}
                  className="hover:opacity-90"
                >
                  <Badge variant="default" className="text-xs">
                    {team}
                  </Badge>
                </Link>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <time dateTime={article.publishedAt.toISOString()}>
                {formatNewsDate(article.publishedAt)}
              </time>
            </div>
          </header>

          <div className="prose prose-lg prose-slate max-w-none">
            <div
              className="news-article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          <footer className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
            >
              <Newspaper className="h-4 w-4" />
              More Stories
            </Link>
          </footer>
        </article>
      </main>
      <Footer />
    </div>
  );
}
