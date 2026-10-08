"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CONCEPT_COUNT, REFRESH_CONCEPTS } from "./catalog";
import { Search, Segments } from "./primitives";

export function RefreshIndex() {
  const [area, setArea] = useState("All");
  const [priority, setPriority] = useState("All priorities");
  const [query, setQuery] = useState("");
  const visible = REFRESH_CONCEPTS.filter(
    (item) =>
      (area === "All" || item.area === area) &&
      (priority === "All priorities" || item.priority === priority) &&
      `${item.title} ${item.problem} ${item.variants.map((variant) => variant.name).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <main className="rf-lab">
      <header className="rf-top">
        <Link href="/ux">← UX labs</Link>
        <span className="type-eyebrow text-xs">
          Everyday refresh / October 2026
        </span>
      </header>
      <div className="rf-main">
        <div className="rf-intro">
          <p className="type-eyebrow">
            24 audit findings · {CONCEPT_COUNT} interactive concepts
          </p>
          <h1 className="type-hero">
            Less searching.
            <br />
            More doing.
          </h1>
          <p>
            A refresh of the everyday interface around the cards, medals and
            books. Two alternatives for each high-priority finding; one focused
            direction for every medium-priority finding.
          </p>
          <p className="mt-3 text-sm">
            Exploratory study. Fictional sample data. Interactions stay in
            memory and reset when you leave. Production behavior and saved
            preferences are unchanged.
          </p>
        </div>
        <div className="rf-toolbar">
          <Segments
            label="Filter concepts by area"
            values={[
              "All",
              "Shared",
              "Agenda",
              "Growth",
              "Profile",
              "Goals",
              "Community",
            ]}
            value={area}
            onChange={setArea}
          />
          <label>
            <span className="sr-only">Priority</span>
            <select
              className="rf-select"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option>All priorities</option>
              <option>High</option>
              <option>Medium</option>
            </select>
          </label>
        </div>
        <div className="rf-toolbar">
          <Search
            value={query}
            onChange={setQuery}
            label="Search findings and concepts"
          />
          <p role="status" className="rf-muted">
            {visible.length} findings
          </p>
        </div>
        <div className="rf-grid">
          {visible.map((item) => (
            <Link
              key={item.slug}
              href={`/ux/refresh/${item.slug}`}
              className="rf-index-card"
            >
              <div className="rf-row">
                <span className="type-figure rf-muted">
                  {String(item.id).padStart(2, "0")} / {item.area}
                </span>
                <span className="rf-badge" data-priority={item.priority}>
                  {item.priority}
                </span>
              </div>
              <h2 className="type-heading">{item.title}</h2>
              <p>{item.problem}</p>
              <footer>
                <span>
                  {item.variants.map((variant) => variant.name).join(" / ")}
                </span>
                <ArrowUpRight aria-hidden size={18} />
              </footer>
            </Link>
          ))}
        </div>
        {visible.length === 0 && (
          <p className="rf-muted">
            No matches. Try another area or clear your search.
          </p>
        )}
      </div>
    </main>
  );
}
