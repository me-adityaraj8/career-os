import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  Users,
  Sparkles,
  Target,
  BarChart3,
  Settings,
  Search,
  ArrowRight,
  Command,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  label: string;
  section: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items: PaletteItem[] = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', section: 'Navigation', icon: <LayoutDashboard className="size-4" />, action: () => navigate('/'), keywords: 'home overview' },
      { id: 'applications', label: 'Applications', section: 'Navigation', icon: <Briefcase className="size-4" />, action: () => navigate('/applications'), keywords: 'jobs kanban board' },
      { id: 'resumes', label: 'Resumes', section: 'Navigation', icon: <FileText className="size-4" />, action: () => navigate('/resumes'), keywords: 'cv upload' },
      { id: 'interviews', label: 'Interviews', section: 'Navigation', icon: <MessageSquare className="size-4" />, action: () => navigate('/interviews'), keywords: 'rounds prep' },
      { id: 'network', label: 'Network', section: 'Navigation', icon: <Users className="size-4" />, action: () => navigate('/network'), keywords: 'contacts crm recruiters' },
      { id: 'ai', label: 'AI Tools', section: 'Navigation', icon: <Sparkles className="size-4" />, action: () => navigate('/ai'), keywords: 'analyzer cover letter coach' },
      { id: 'goals', label: 'Goals', section: 'Navigation', icon: <Target className="size-4" />, action: () => navigate('/goals'), keywords: 'targets progress' },
      { id: 'analytics', label: 'Analytics', section: 'Navigation', icon: <BarChart3 className="size-4" />, action: () => navigate('/analytics'), keywords: 'charts funnel stats' },
      { id: 'settings', label: 'Settings', section: 'Navigation', icon: <Settings className="size-4" />, action: () => navigate('/settings'), keywords: 'profile theme' },
      { id: 'job-analyzer', label: 'Analyze a Job Description', section: 'AI Tools', icon: <Sparkles className="size-4" />, action: () => navigate('/ai'), keywords: 'match score ats' },
      { id: 'cover-letter', label: 'Generate Cover Letter', section: 'AI Tools', icon: <FileText className="size-4" />, action: () => navigate('/ai'), keywords: 'draft write' },
      { id: 'interview-prep', label: 'Interview Prep Questions', section: 'AI Tools', icon: <MessageSquare className="size-4" />, action: () => navigate('/ai'), keywords: 'practice coach' },
    ],
    [navigate],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q),
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of filtered) {
      const arr = map.get(item.section) ?? [];
      arr.push(item);
      map.set(item.section, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('rys:command-palette', onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('rys:command-palette', onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  function runItem(item: PaletteItem) {
    item.action();
    close();
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      e.preventDefault();
      runItem(filtered[selected]);
    } else if (e.key === 'Escape') {
      close();
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selected}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={close} />

          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-popover shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
              />
              <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No results found.</p>
              )}
              {grouped.map(([section, sectionItems]) => (
                <div key={section}>
                  <p className="mb-1 mt-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section}
                  </p>
                  {sectionItems.map((item) => {
                    const globalIndex = filtered.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        data-index={globalIndex}
                        onClick={() => runItem(item)}
                        onMouseEnter={() => setSelected(globalIndex)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          globalIndex === selected
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="flex size-7 items-center justify-center rounded-md bg-secondary">
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {globalIndex === selected && (
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                <span>Navigate</span>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                <span>Open</span>
              </div>
              <div className="flex items-center gap-1">
                <Command className="size-3" />
                <span>K to toggle</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
