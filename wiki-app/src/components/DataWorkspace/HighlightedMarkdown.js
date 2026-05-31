import React from 'react';

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

const HIGHLIGHT_CLASSES = {
  entity: 'rounded-sm bg-amber-100/80 px-0.5 underline decoration-amber-400 decoration-dashed underline-offset-2',
  concept: 'rounded-sm bg-sky-100/80 px-0.5 underline decoration-sky-400 decoration-dashed underline-offset-2',
  tag: 'rounded-sm bg-violet-100/80 px-0.5 underline decoration-violet-400 decoration-dashed underline-offset-2',
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlightTerms(entities, concepts, tags) {
  const terms = [
    ...(entities ?? []).map((entity) => ({
      label: entity.name,
      kind: 'entity',
    })),
    ...(concepts ?? []).map((concept) => ({
      label: concept.name,
      kind: 'concept',
    })),
    ...(tags ?? []).map((tag) => ({
      label: tag.replace(/-/g, ' '),
      kind: 'tag',
    })),
  ]
    .filter((term) => term.label && term.label.length >= 3)
    .sort((a, b) => b.label.length - a.label.length);

  const seen = new Set();
  return terms.filter((term) => {
    const key = `${term.kind}:${term.label.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function highlightPlainText(text, terms) {
  if (!text || terms.length === 0) {
    return [text];
  }

  let segments = [{ text, highlighted: false, kind: null }];

  for (const term of terms) {
    const pattern = new RegExp(`(${escapeRegex(term.label)})`, 'gi');
    const next = [];

    for (const segment of segments) {
      if (segment.highlighted) {
        next.push(segment);
        continue;
      }

      const parts = segment.text.split(pattern);
      for (let index = 0; index < parts.length; index += 1) {
        const part = parts[index];
        if (!part) {
          continue;
        }
        const isMatch = index % 2 === 1;
        next.push({
          text: part,
          highlighted: isMatch,
          kind: isMatch ? term.kind : null,
        });
      }
    }

    segments = next;
  }

  return segments.map((segment, index) =>
    segment.highlighted ? (
      <span key={`${segment.kind}-${index}`} className={HIGHLIGHT_CLASSES[segment.kind]}>
        {segment.text}
      </span>
    ) : (
      segment.text
    ),
  );
}

function renderInline(line, terms) {
  const parts = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of line.matchAll(LINK_RE)) {
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`text-${key}`}>
          {highlightPlainText(line.slice(lastIndex, match.index), terms)}
        </React.Fragment>,
      );
      key += 1;
    }

    parts.push(
      <span
        key={`link-${key}`}
        className="rounded bg-emerald-100/80 px-1 font-medium text-accent hover:underline">
        <a href={match[2]}>{match[1]}</a>
      </span>,
    );
    key += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(
      <React.Fragment key={`tail-${key}`}>
        {highlightPlainText(line.slice(lastIndex), terms)}
      </React.Fragment>,
    );
  }

  return parts.length > 0 ? parts : highlightPlainText(line, terms);
}

function renderLine(line, terms, index) {
  if (!line.trim()) {
    return <div key={index} className="h-2" />;
  }

  if (line.startsWith('### ')) {
    return (
      <h4 key={index} className="mb-2 mt-4 text-base font-semibold text-slate-800">
        {renderInline(line.slice(4), terms)}
      </h4>
    );
  }

  if (line.startsWith('## ')) {
    return (
      <h3 key={index} className="mb-2 mt-5 text-lg font-semibold text-slate-900">
        {renderInline(line.slice(3), terms)}
      </h3>
    );
  }

  if (line.startsWith('# ')) {
    return (
      <h2 key={index} className="mb-3 mt-6 text-xl font-semibold text-slate-900">
        {renderInline(line.slice(2), terms)}
      </h2>
    );
  }

  if (line.startsWith('- ') || line.startsWith('* ')) {
    return (
      <div key={index} className="relative my-1.5 pl-4 before:absolute before:left-0 before:text-slate-400 before:content-['•']">
        {renderInline(line.slice(2), terms)}
      </div>
    );
  }

  if (line.startsWith('> ')) {
    return (
      <blockquote
        key={index}
        className="my-2 border-l-2 border-slate-200 pl-3 text-slate-600">
        {renderInline(line.slice(2), terms)}
      </blockquote>
    );
  }

  return (
    <p key={index} className="my-1.5 text-[0.95rem] leading-relaxed text-slate-700">
      {renderInline(line, terms)}
    </p>
  );
}

export default function HighlightedMarkdown({ body, entities, concepts, tags }) {
  const terms = buildHighlightTerms(entities, concepts, tags);
  const lines = (body ?? '').split('\n');

  return (
    <div className="text-[0.95rem] leading-relaxed">
      {lines.map((line, index) => renderLine(line, terms, index))}
    </div>
  );
}
