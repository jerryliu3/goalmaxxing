"use client";

import { useState } from "react";
import { Action, AppNav, Heading, Search, StudyDialog } from "../primitives";
import { ArrowLeft, ArrowRight, BookOpen, Check } from "lucide-react";
import { HISTORY } from "../sample";

export function BooksConcept() {
  const [book, setBook] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("a");
  const books = [
    {
      id: "2026-September",
      title: "September",
      caption: "2026 · 2 goals",
      entries: HISTORY.filter(
        (item) => item.year === 2026 && item.month === "September",
      ),
    },
    {
      id: "2026-August",
      title: "August",
      caption: "2026 · 1 goal",
      entries: HISTORY.filter(
        (item) => item.year === 2026 && item.month === "August",
      ),
    },
    {
      id: "2025",
      title: "2025",
      caption: "Yearbook · 2 goals",
      entries: HISTORY.filter((item) => item.year === 2025),
    },
  ];
  const current = books.find((item) => item.id === book);
  const entries =
    current?.entries.filter((item) =>
      `${item.title} ${item.month} ${item.outcome}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ) ?? [];
  const entry = current?.entries.find((item) => item.id === selected);
  const position =
    current?.entries.findIndex((item) => item.id === selected) ?? -1;
  const open = (id: string) => {
    const item = books.find((value) => value.id === id)!;
    setBook(id);
    setSelected(item.entries[0].id);
    setQuery("");
  };
  return (
    <>
      <AppNav active="Goals" />
      <div className="rf-canvas">
        <Heading eyebrow="Your goal library" title="Time, bound into books." />
        <p className="rf-muted mb-6">2026 · Monthly volumes</p>
        <div className="rf-books">
          {books
            .filter((item) => item.id !== "2025")
            .map((item) => (
              <button
                type="button"
                className="rf-book"
                key={item.id}
                onClick={() => open(item.id)}
              >
                <BookOpen aria-hidden size={24} />
                <strong className="type-title">{item.title}</strong>
                <span className="rf-muted">{item.caption}</span>
                <span>Open contents →</span>
              </button>
            ))}
        </div>
        <p className="rf-muted mt-10 mb-6">Previous years</p>
        <div className="rf-books">
          {books
            .filter((item) => item.id === "2025")
            .map((item) => (
              <button
                type="button"
                className="rf-book"
                key={item.id}
                onClick={() => open(item.id)}
              >
                <BookOpen aria-hidden size={24} />
                <strong className="type-title">{item.title}</strong>
                <span className="rf-muted">{item.caption}</span>
                <span>Open chapters →</span>
              </button>
            ))}
        </div>
        <p className="rf-muted mt-8">
          Accomplished and unfinished ended goals share this chronological
          library, each with its actual outcome. Archived goals remain a
          separate collection.
        </p>
        <StudyDialog
          open={!!book}
          onOpenChange={(value) => {
            if (!value) setBook(null);
          }}
          title={
            current
              ? `${current.title} · ${current.id === "2025" ? "Yearbook" : "2026"}`
              : "Goal book"
          }
          description="Choose an entry directly or page through the book."
        >
          <div className="mt-6">
            <Search
              value={query}
              onChange={setQuery}
              label="Search book contents"
            />
            <div className="rf-stack mt-6">
              <nav aria-label="Book contents">
                {entries.map((item) => (
                  <button
                    type="button"
                    className="rf-setting-row"
                    key={item.id}
                    aria-current={selected === item.id ? "page" : undefined}
                    onClick={() => setSelected(item.id)}
                  >
                    <span>
                      <strong className="type-item">{item.title}</strong>
                      <small>
                        {item.month} {item.year} · {item.outcome}
                      </small>
                    </span>
                    {selected === item.id && <Check aria-hidden size={18} />}
                  </button>
                ))}
                {!entries.length && (
                  <p className="rf-muted">No matching entries in this book.</p>
                )}
              </nav>
              {entry && (
                <article className="rf-book-page">
                  <p className="type-eyebrow rf-muted">
                    {entry.month} {entry.year}
                  </p>
                  <h3 className="type-title text-3xl my-5">{entry.title}</h3>
                  <p className="type-item mb-3">{entry.outcome}</p>
                  <p className="rf-muted">{entry.detail}</p>
                </article>
              )}
            </div>
            <div className="rf-foot">
              <Action
                variant="outline"
                disabled={position <= 0}
                onClick={() => setSelected(current!.entries[position - 1].id)}
              >
                <ArrowLeft aria-hidden size={16} />
                Previous
              </Action>
              <span className="rf-muted">
                {position + 1} / {current?.entries.length}
              </span>
              <Action
                variant="outline"
                disabled={!current || position >= current.entries.length - 1}
                onClick={() => setSelected(current!.entries[position + 1].id)}
              >
                Next
                <ArrowRight aria-hidden size={16} />
              </Action>
            </div>
          </div>
        </StudyDialog>
      </div>
    </>
  );
}
