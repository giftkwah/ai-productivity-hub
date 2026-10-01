import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Archive,
  Bot,
  Check,
  Clipboard,
  ClipboardCheck,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  RotateCcw,
  Search,
  ShieldCheck,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import orbitMark from "@/assets/orbit-mark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbit — AI Workplace Productivity Assistant" },
      { name: "description", content: "Draft emails, summarize meetings, plan tasks, research topics, and solve workplace questions with AI." },
      { property: "og:title", content: "Orbit — AI Workplace Productivity Assistant" },
      { property: "og:description", content: "One focused workspace for professional writing, planning, research, and workplace support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type ToolId = "email" | "meeting" | "tasks" | "research" | "chat";

const tools = [
  { id: "email" as const, name: "Smart Email Generator", short: "Email Generator", hint: "Draft polished messages", icon: Mail, placeholder: "Describe who you're writing to, the purpose, tone, and any important details…", example: "Write a concise follow-up to the project team confirming Friday's launch and asking everyone to flag blockers by Wednesday." },
  { id: "meeting" as const, name: "Meeting Notes Summarizer", short: "Meeting Summarizer", hint: "Capture decisions and actions", icon: FileText, placeholder: "Paste your meeting notes or transcript…", example: "Project Atlas sync: Priya confirmed the design is approved. Daniel will finish QA by Thursday. Launch stays Friday. Open question: who owns customer communications?" },
  { id: "tasks" as const, name: "AI Task Planner", short: "Task Planner", hint: "Prioritize your next moves", icon: ClipboardCheck, placeholder: "Describe your goal, deadline, and any constraints…", example: "Plan the next two weeks for launching our employee engagement survey, including stakeholder review, communications, testing, and analysis setup." },
  { id: "research" as const, name: "AI Research Assistant", short: "Research Assistant", hint: "Structure complex topics", icon: FlaskConical, placeholder: "Ask a research question and add any context or constraints…", example: "What are the main benefits and risks of a four-day work week for a 100-person professional services firm? Give me a decision-ready brief." },
  { id: "chat" as const, name: "AI Workplace Chatbot", short: "Workplace Chat", hint: "Ask anything about work", icon: MessageSquareText, placeholder: "Ask Orbit a workplace question…", example: "Help me prepare talking points for a difficult but constructive performance conversation." },
];

const seedMessage: UIMessage = {
  id: "orbit-welcome",
  role: "assistant",
  parts: [{ type: "text", text: "Hello — I’m Orbit. I can help you write, plan, summarize, research, and think through workplace challenges. What are you working on?" }],
};

function getText(message: UIMessage) {
  return message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
}

function App() {
  const [active, setActive] = useState<ToolId>("email");
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = tools.find((tool) => tool.id === active) ?? tools[0];

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="ambient ambient-three" />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar active={active} onSelect={(id) => { setActive(id); setMobileOpen(false); }} open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          <header className="mb-6 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Button className="mt-0.5 md:hidden" size="icon" variant="outline" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></Button>
              <div><p className="eyebrow">Your AI workbench</p><h1 className="font-display text-2xl font-bold md:text-3xl">Work smarter, one prompt at a time.</h1><p className="mt-1 text-sm text-muted-foreground">Turn rough thoughts into useful workplace outputs.</p></div>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-glass-border bg-glass px-3 py-2 text-sm text-muted-foreground backdrop-blur-xl sm:flex"><Search className="size-4" /> Five focused tools</div>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {tools.map((tool) => <ToolCard key={tool.id} tool={tool} active={tool.id === active} onClick={() => setActive(tool.id)} />)}
          </div>

          {active === "chat" ? <ChatWorkspace /> : <ToolWorkspace key={active} tool={current} />}

          <div className="responsible mt-5 flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p><strong>Responsible AI:</strong> Orbit can make mistakes. Review, edit, and verify names, dates, facts, and recommendations before using any output.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ active, onSelect, open, onClose }: { active: ToolId; onSelect: (id: ToolId) => void; open: boolean; onClose: () => void }) {
  return <>
    {open && <button className="fixed inset-0 z-30 bg-overlay md:hidden" onClick={onClose} aria-label="Close navigation" />}
    <aside className={`sidebar ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
      <div className="flex items-center gap-3 px-2 py-3">
        <img src={orbitMark} alt="Orbit" className="size-10" width={816} height={816} />
        <div className="min-w-0"><p className="font-display text-base font-bold leading-none">Orbit</p><p className="mt-1 text-[11px] text-sidebar-muted">Workplace AI</p></div>
        <Button className="ml-auto md:hidden" size="icon" variant="ghost" onClick={onClose} aria-label="Close navigation"><X /></Button>
      </div>
      <p className="nav-label">Workspace</p>
      <button className="nav-item text-sidebar-foreground"><LayoutDashboard /> Dashboard</button>
      <p className="nav-label">AI tools</p>
      <nav className="flex flex-col gap-1">{tools.map((tool) => <button key={tool.id} className={`nav-item ${active === tool.id ? "nav-item-active" : ""}`} onClick={() => onSelect(tool.id)}><tool.icon />{tool.short}</button>)}</nav>
      <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent p-3"><div className="flex items-center gap-2 text-xs font-semibold"><Archive className="size-4" /> Browser-saved chat</div><p className="mt-1 text-[11px] leading-relaxed text-sidebar-muted">Your Workplace Chat stays on this device.</p></div>
    </aside>
  </>;
}

function ToolCard({ tool, active, onClick }: { tool: typeof tools[number]; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`tool-card ${active ? "tool-card-active" : ""}`}><span className="tool-icon"><tool.icon /></span><span className="mt-3 block text-left text-sm font-semibold">{tool.short}</span><span className="mt-1 block text-left text-[11px] text-muted-foreground">{tool.hint}</span></button>;
}

function ToolWorkspace({ tool }: { tool: typeof tools[number] }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, error } = useChat({ id: `tool-${tool.id}`, transport: new DefaultChatTransport({ api: "/api/chat", body: { mode: tool.id } }), onFinish: ({ message }) => setOutput(getText(message)) });
  const busy = status === "submitted" || status === "streaming";
  const live = [...messages].reverse().find((message) => message.role === "assistant");
  const result = live ? getText(live) : output;

  async function generate() { if (!input.trim() || busy) return; setOutput(""); await sendMessage({ text: input.trim() }); }
  async function copy() { if (!result) return; await navigator.clipboard.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }

  return <section className="grid gap-5 lg:grid-cols-2">
    <div className="glass-panel flex min-h-[420px] flex-col p-5">
      <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Prompt</p><h2 className="font-display text-lg font-semibold">{tool.name}</h2></div><span className="status-pill"><Wand2 /> AI powered</span></div>
      <label htmlFor="tool-prompt" className="text-xs font-semibold">What do you need?</label>
      <textarea ref={textareaRef} id="tool-prompt" value={input} onChange={(event) => setInput(event.target.value)} placeholder={tool.placeholder} className="prompt-area mt-2" />
      <button className="example-prompt" onClick={() => { setInput(tool.example); textareaRef.current?.focus(); }}><span>Try an example</span>{tool.example}</button>
      <div className="mt-auto flex items-center justify-end gap-2 pt-5"><Button variant="ghost" onClick={() => setInput("")} disabled={!input}>Clear</Button><Button className="rounded-xl px-5" onClick={generate} disabled={!input.trim() || busy}>{busy ? "Working…" : "Generate"}<Wand2 /></Button></div>
    </div>
    <div className="glass-panel flex min-h-[420px] flex-col p-5">
      <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Result</p><h2 className="font-display text-lg font-semibold">Your editable draft</h2></div>{result && <div className="flex gap-1"><Button size="icon" variant="ghost" onClick={copy} aria-label="Copy response">{copied ? <Check /> : <Clipboard />}</Button><Button size="icon" variant="ghost" onClick={generate} aria-label="Regenerate response"><RotateCcw /></Button></div>}</div>
      {busy && !result ? <div className="flex flex-1 items-center justify-center"><Shimmer>Orbit is preparing your response…</Shimmer></div> : result ? <textarea value={result} onChange={(event) => setOutput(event.target.value)} className="result-editor" aria-label="Editable AI response" /> : <div className="empty-result"><span className="empty-mark"><Bot /></span><p className="font-display font-semibold">Ready when you are</p><p className="max-w-xs text-sm text-muted-foreground">Add a clear prompt and Orbit will create a useful first draft here.</p></div>}
      {error && <p className="mt-3 text-sm text-destructive">{error.message || "The AI request could not be completed. Please try again."}</p>}
    </div>
  </section>;
}

function ChatWorkspace() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initial = useMemo(() => [seedMessage], []);
  const { messages, setMessages, sendMessage, status, stop, error } = useChat({ id: "orbit-workplace-chat", messages: initial, transport: new DefaultChatTransport({ api: "/api/chat", body: { mode: "chat" } }), onFinish: () => inputRef.current?.focus() });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { const saved = window.localStorage.getItem("orbit-chat-history"); if (saved) { try { setMessages(JSON.parse(saved) as UIMessage[]); } catch { setMessages([seedMessage]); } } inputRef.current?.focus(); }, [setMessages]);
  useEffect(() => { if (messages.length) window.localStorage.setItem("orbit-chat-history", JSON.stringify(messages)); }, [messages, status]);

  return <section className="glass-panel flex h-[650px] max-h-[calc(100vh-12rem)] min-h-[520px] flex-col overflow-hidden">
    <div className="flex items-center justify-between border-b border-glass-border px-5 py-4"><div className="flex items-center gap-3"><img src={orbitMark} alt="Orbit" className="size-9" width={816} height={816} /><div><h2 className="font-display font-semibold">Workplace Chat</h2><p className="text-xs text-muted-foreground">One conversation · saved in your browser</p></div></div><Button size="sm" variant="ghost" onClick={() => { setMessages([seedMessage]); window.localStorage.removeItem("orbit-chat-history"); inputRef.current?.focus(); }}><RotateCcw />Clear</Button></div>
    <Conversation><ConversationContent className="mx-auto w-full max-w-3xl gap-5 px-5 py-6">{messages.map((message) => <Message from={message.role} key={message.id}>{message.parts.map((part, index) => part.type === "text" ? <MessageContent key={`${message.id}-${index}`}><MessageResponse>{part.text}</MessageResponse></MessageContent> : null)}{message.role === "assistant" && getText(message) && <MessageActions><MessageAction tooltip="Copy response" onClick={() => navigator.clipboard.writeText(getText(message))}><Clipboard /></MessageAction></MessageActions>}</Message>)}{status === "submitted" && <Shimmer className="text-sm">Orbit is thinking…</Shimmer>}</ConversationContent><ConversationScrollButton /></Conversation>
    <div className="mx-auto w-full max-w-3xl px-4 pb-4"><PromptInput className="chat-composer" onSubmit={(message) => { if (!message.text.trim() || busy) return; void sendMessage({ text: message.text.trim() }); }}><PromptInputTextarea ref={inputRef} placeholder="Ask Orbit about your work…" /><PromptInputFooter className="justify-between"><span className="text-[11px] text-muted-foreground">Enter to send · Shift + Enter for a new line</span><PromptInputSubmit status={status} onStop={stop} disabled={status === "ready" && false} /></PromptInputFooter></PromptInput>{error && <p className="mt-2 text-xs text-destructive">{error.message || "Orbit couldn't respond. Please try again."}</p>}</div>
  </section>;
}