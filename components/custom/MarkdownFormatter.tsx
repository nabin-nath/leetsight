import React from "react";
import { createRoot } from "react-dom/client";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownFormatter = ({ markdown }: { markdown: string }) => {
  return <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>;
};

export default MarkdownFormatter;
