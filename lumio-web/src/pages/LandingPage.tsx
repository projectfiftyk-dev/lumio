import { useNavigate } from 'react-router-dom';
import { Sparkles, Mic2, ImagePlay, MessageCircle, ChevronRight, BookOpen, Languages, GraduationCap } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-300 blur-3xl opacity-25" />
          <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full bg-sky-200 blur-3xl opacity-20" />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white border border-[#E2DFFF] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-600">
              An immersive learning experience
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-7xl sm:text-8xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-violet-600 via-violet-700 to-purple-900 leading-none">
            LUMIO
          </h1>

          <p className="text-2xl font-semibold text-[#1A1839] mb-3">
            Where stories teach and characters remember.
          </p>

          <p className="text-lg text-violet-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Learners progress through episodic narrative experiences — making choices,
            interacting with AI characters, and acquiring language through immersion,
            not repetition.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="lumio-btn-primary flex items-center gap-2 text-base px-8 py-3.5 shadow-lg shadow-violet-200"
            >
              Start learning
              <ChevronRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="lumio-btn-ghost text-base px-8 py-3.5"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <div className="w-px h-8 bg-violet-400" />
          <span className="text-xs text-violet-500 tracking-widest uppercase">scroll</span>
        </div>
      </section>

      {/* ── What is Lumio ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-violet-500 mb-3 block">
              The platform
            </span>
            <h2 className="text-4xl font-bold text-[#1A1839] mb-4">
              Every lesson is a world you step into
            </h2>
            <p className="text-lg text-violet-500 max-w-xl mx-auto">
              Lumio is an audiovisual experience platform where stories, lessons, and
              books come alive — through AI narration, generated scenes, and interactive
              characters. Content is experienced, not just read.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Mic2 className="w-5 h-5 text-violet-600" />,
                title: 'AI Voice Narration',
                desc: 'Every scene narrated in real time — character voices, pacing, emotion. No pre-recorded audio.',
              },
              {
                icon: <ImagePlay className="w-5 h-5 text-violet-600" />,
                title: 'Living Scenes',
                desc: 'Each story beat has a visual scene that evolves as the narrative unfolds around you.',
              },
              {
                icon: <MessageCircle className="w-5 h-5 text-violet-600" />,
                title: 'Interactive Characters',
                desc: 'Characters respond to you, remember context, and gently correct your mistakes.',
              },
            ].map((f) => (
              <div key={f.title} className="lumio-card p-7">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#1A1839] mb-2">{f.title}</h3>
                <p className="text-sm text-violet-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verticals ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-y border-[#E2DFFF]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-violet-500 mb-3 block">
              Experiences
            </span>
            <h2 className="text-4xl font-bold text-[#1A1839] mb-4">
              Built for two worlds right now
            </h2>
            <p className="text-lg text-violet-500 max-w-lg mx-auto">
              Lumio launches with Language and Kids — with Learners coming soon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Language */}
            <div className="lumio-card p-7 md:col-span-1 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                  <Languages className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-violet-500">Lumio for</p>
                  <h3 className="font-bold text-lg text-[#1A1839] leading-tight">Language</h3>
                </div>
              </div>
              <p className="text-sm italic text-violet-600 font-medium mb-4 leading-snug">
                "Step inside the language. Speak your way through."
              </p>
              <p className="text-sm text-violet-500 leading-relaxed mb-6">
                Immersive language acquisition through real-world scenarios. Grammar is
                introduced before each scene — then the conversation begins.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  'Grammar onboarding before every scene',
                  'Speak or tap to answer — voice recognition built in',
                  'Breakpoint quizzes woven naturally into the story',
                  'Talk to characters in the target language',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#1A1839]">
                    <span className="text-violet-500 mt-0.5 shrink-0">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/auth')}
                className="lumio-btn-primary mt-auto text-sm py-2.5 flex items-center justify-center gap-2"
              >
                Start a lesson
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Kids */}
            <div className="lumio-card p-7 md:col-span-1 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-sky-500">Lumio for</p>
                  <h3 className="font-bold text-lg text-[#1A1839] leading-tight">Kids</h3>
                </div>
              </div>
              <p className="text-sm italic text-sky-600 font-medium mb-4 leading-snug">
                "Stories that see you. Worlds that listen. Adventures you choose."
              </p>
              <p className="text-sm text-violet-500 leading-relaxed mb-6">
                Interactive audiovisual storybooks for ages 4–10. Kids don't just read
                stories — they step inside them, make choices, and talk to characters.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  'Expressive AI narration — every character sounds different',
                  'Beautiful illustrated scenes that evolve with the story',
                  'Choice moments that branch the adventure',
                  'Talk to story characters by voice',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#1A1839]">
                    <span className="text-sky-400 mt-0.5 shrink-0">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/auth')}
                className="bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl px-6 py-2.5 transition-all duration-200 cursor-pointer mt-auto text-sm flex items-center justify-center gap-2"
              >
                Explore stories
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Learners — coming soon */}
            <div className="lumio-card p-7 md:col-span-1 flex flex-col opacity-60 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-500 border border-violet-200">
                  Coming soon
                </span>
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-200 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-violet-400">Lumio for</p>
                  <h3 className="font-bold text-lg text-[#1A1839] leading-tight">Learners</h3>
                </div>
              </div>
              <p className="text-sm italic text-violet-500 font-medium mb-4 leading-snug">
                "Narrative-driven subject learning."
              </p>
              <p className="text-sm text-violet-400 leading-relaxed">
                Science, history, and more — delivered through story-driven episodic
                experiences. Learn by living through the subject matter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-violet-300 blur-3xl opacity-30" />
          </div>
          <div className="relative z-10 lumio-card px-10 py-14">
            <Sparkles className="w-8 h-8 text-violet-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-[#1A1839] mb-3">
              Ready to step inside?
            </h2>
            <p className="text-violet-500 mb-8 max-w-md mx-auto">
              The adventure begins the moment you press play.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="lumio-btn-primary text-base px-10 py-3.5 shadow-lg shadow-violet-200 flex items-center gap-2 mx-auto"
            >
              Create your account
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E2DFFF] bg-white py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-purple-900 tracking-tight">
              LUMIO
            </span>
          </div>
          <p className="text-xs text-violet-400">
            © {new Date().getFullYear()} Lumio. Early development — MVP in progress.
          </p>
        </div>
      </footer>
    </div>
  );
}
