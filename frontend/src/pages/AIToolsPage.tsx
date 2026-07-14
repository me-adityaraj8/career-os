import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, FileText, Target, MessageSquareText, Save, Info, Zap } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApplications } from '@/hooks/useApplications';
import { useResumes } from '@/hooks/useResumes';
import {
  useAIStatus,
  useAnalyzeJob,
  useGenerateCoverLetter,
  useUpdateCoverLetter,
  useGenerateInterviewQuestions,
} from '@/hooks/useAI';
import { toast } from '@/stores/toastStore';
import { apiErrorMessage, isDemoReadonly } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CoverLetter, InterviewQuestionSet, JobAnalysis } from '@/types';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function MockBadge({ isMock }: { isMock: boolean }) {
  if (!isMock) return null;
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Info className="size-3" /> Mock
    </Badge>
  );
}

function AILoadingState({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
    >
      <div className="relative">
        <Sparkles className="size-5 text-primary" />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      <p className="text-sm font-medium">{label}</p>
    </motion.div>
  );
}

export default function AIToolsPage() {
  const { data: status } = useAIStatus();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="AI Tools"
        description="Analyze job descriptions, draft cover letters, and prep for interviews."
      />

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-2.5 rounded-xl border bg-secondary/40 px-4 py-2.5 text-[13px] text-muted-foreground"
        >
          <span className="relative flex size-2 shrink-0">
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                status.mode === 'live' ? 'bg-emerald-500' : 'bg-foreground/60',
              )}
            />
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full',
                status.mode === 'live' ? 'bg-emerald-500' : 'bg-foreground/80',
              )}
            />
          </span>
          {status.mode === 'live' ? (
            <span>
              <span className="font-medium text-foreground">{status.provider}</span> is powering
              your AI tools
              <span className="text-muted-foreground/70"> · {status.model}</span>
            </span>
          ) : (
            <span>
              <span className="font-medium text-foreground">Mock mode</span> — results are realistic
              placeholders. Set{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">GEMINI_API_KEY</code> to go live
              (with optional <code className="rounded bg-muted px-1 py-0.5 text-xs">GROQ_API_KEY</code>{' '}
              and <code className="rounded bg-muted px-1 py-0.5 text-xs">OPENROUTER_API_KEY</code>{' '}
              fallbacks).
            </span>
          )}
        </motion.div>
      )}

      <Tabs defaultValue="analyzer">
        <TabsList className="flex w-full justify-start overflow-x-auto sm:inline-flex sm:w-auto sm:justify-center">
          <TabsTrigger value="analyzer" className="shrink-0">
            <Target className="size-4" /> Job Analyzer
          </TabsTrigger>
          <TabsTrigger value="cover" className="shrink-0">
            <FileText className="size-4" /> Cover Letter
          </TabsTrigger>
          <TabsTrigger value="coach" className="shrink-0">
            <MessageSquareText className="size-4" /> Interview Coach
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer">
          <JobAnalyzer />
        </TabsContent>
        <TabsContent value="cover">
          <CoverLetterGenerator />
        </TabsContent>
        <TabsContent value="coach">
          <InterviewCoach />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContextPickers({
  applicationId,
  setApplicationId,
  resumeId,
  setResumeId,
}: {
  applicationId: string;
  setApplicationId: (v: string) => void;
  resumeId: string;
  setResumeId: (v: string) => void;
}) {
  const { data: applications } = useApplications();
  const { data: resumes } = useResumes();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Link to application (optional)</Label>
        <Select value={applicationId} onValueChange={setApplicationId}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {applications?.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.company} — {a.role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Compare against resume (optional)</Label>
        <Select value={resumeId} onValueChange={setResumeId}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {resumes?.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function JobAnalyzer() {
  const analyze = useAnalyzeJob();
  const [jd, setJd] = useState('');
  const [applicationId, setApplicationId] = useState('none');
  const [resumeId, setResumeId] = useState('none');
  const [result, setResult] = useState<JobAnalysis | null>(null);

  async function run() {
    try {
      const r = await analyze.mutateAsync({
        jobDescription: jd,
        applicationId: applicationId === 'none' ? null : applicationId,
        resumeId: resumeId === 'none' ? null : resumeId,
      });
      setResult(r);
    } catch (e) {
      if (!isDemoReadonly(e)) toast({ title: apiErrorMessage(e), variant: 'error' });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          <ContextPickers
            applicationId={applicationId}
            setApplicationId={setApplicationId}
            resumeId={resumeId}
            setResumeId={setResumeId}
          />
          <div className="space-y-2">
            <Label htmlFor="jd">Job description</Label>
            <Textarea id="jd" rows={8} placeholder="Paste the job description…" value={jd} onChange={(e) => setJd(e.target.value)} />
          </div>
          <Button onClick={run} disabled={analyze.isPending || jd.trim().length < 20} className="gap-2">
            {analyze.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            Analyze
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {analyze.isPending && (
          <AILoadingState label="Analyzing job description…" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div variants={fadeIn} initial="hidden" animate="show" exit="hidden">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="size-4 text-primary" /> Analysis
                  </CardTitle>
                  <MockBadge isMock={result.isMock} />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {result.matchScore !== null && (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">Resume match</span>
                      <span className={cn(
                        'text-lg font-bold',
                        result.matchScore >= 70 ? 'text-emerald-500' : result.matchScore >= 40 ? 'text-amber-500' : 'text-rose-500',
                      )}>
                        {result.matchScore}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className={cn(
                          'h-full rounded-full',
                          result.matchScore >= 70 ? 'bg-emerald-500' : result.matchScore >= 40 ? 'bg-amber-500' : 'bg-rose-500',
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${result.matchScore}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-sm font-medium">Summary</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Required skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.requiredSkills.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">ATS keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.atsKeywords.map((k) => (
                      <Badge key={k} variant="outline">{k}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CoverLetterGenerator() {
  const generate = useGenerateCoverLetter();
  const update = useUpdateCoverLetter();
  const [jd, setJd] = useState('');
  const [applicationId, setApplicationId] = useState('none');
  const [resumeId, setResumeId] = useState('none');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [result, setResult] = useState<CoverLetter | null>(null);
  const [draft, setDraft] = useState('');

  async function run() {
    try {
      const r = await generate.mutateAsync({
        jobDescription: jd,
        company: company || undefined,
        role: role || undefined,
        applicationId: applicationId === 'none' ? null : applicationId,
        resumeId: resumeId === 'none' ? null : resumeId,
      });
      setResult(r);
      setDraft(r.content);
    } catch (e) {
      if (!isDemoReadonly(e)) toast({ title: apiErrorMessage(e), variant: 'error' });
    }
  }

  async function save() {
    if (!result) return;
    await update.mutateAsync({ id: result.id, content: draft });
    toast({ title: 'Cover letter saved', variant: 'success' });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          <ContextPickers
            applicationId={applicationId}
            setApplicationId={setApplicationId}
            resumeId={resumeId}
            setResumeId={setResumeId}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clcompany">Company</Label>
              <Input id="clcompany" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clrole">Role</Label>
              <Input id="clrole" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cljd">Job description</Label>
            <Textarea id="cljd" rows={6} placeholder="Paste the job description…" value={jd} onChange={(e) => setJd(e.target.value)} />
          </div>
          <Button onClick={run} disabled={generate.isPending || jd.trim().length < 20} className="gap-2">
            {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            Generate cover letter
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {generate.isPending && (
          <AILoadingState label="Crafting your cover letter…" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div variants={fadeIn} initial="hidden" animate="show" exit="hidden">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="size-4 text-primary" /> Draft (editable)
                  </CardTitle>
                  <MockBadge isMock={result.isMock} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea rows={16} value={draft} onChange={(e) => setDraft(e.target.value)} className="font-mono text-sm leading-relaxed" />
                <Button onClick={save} disabled={update.isPending || draft === result.content} className="gap-2">
                  {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InterviewCoach() {
  const generate = useGenerateInterviewQuestions();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jd, setJd] = useState('');
  const [result, setResult] = useState<InterviewQuestionSet | null>(null);

  const categories: Array<{ key: 'technical' | 'behavioral' | 'company'; label: string; icon: React.ReactNode }> = [
    { key: 'technical', label: 'Technical', icon: <Target className="size-4" /> },
    { key: 'behavioral', label: 'Behavioral', icon: <MessageSquareText className="size-4" /> },
    { key: 'company', label: 'Company-specific', icon: <Sparkles className="size-4" /> },
  ];

  async function run() {
    try {
      const r = await generate.mutateAsync({ company, role, jobDescription: jd || null });
      setResult(r);
    } catch (e) {
      if (!isDemoReadonly(e)) toast({ title: apiErrorMessage(e), variant: 'error' });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iccompany">Company</Label>
              <Input id="iccompany" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icrole">Role</Label>
              <Input id="icrole" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="icjd">Job description (optional)</Label>
            <Textarea id="icjd" rows={4} value={jd} onChange={(e) => setJd(e.target.value)} />
          </div>
          <Button onClick={run} disabled={generate.isPending || !company || !role} className="gap-2">
            {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            Generate questions
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {generate.isPending && (
          <AILoadingState label="Preparing interview questions…" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <div className="flex items-center justify-end">
              <MockBadge isMock={result.isMock} />
            </div>
            {categories.map((cat) => {
              const items = result.questions.filter((q) => q.category === cat.key);
              if (items.length === 0) return null;
              return (
                <motion.div key={cat.key} variants={fadeIn}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {cat.icon} {cat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {items.map((q, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-medium text-muted-foreground">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{q.question}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
