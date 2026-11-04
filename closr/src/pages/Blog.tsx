import { useEffect, type ReactNode } from 'react'
import { Newspaper } from 'lucide-react'
import Markdown, { type Components } from 'react-markdown'
import { Link, useParams } from 'react-router-dom'
import PublicFooter from '../components/PublicFooter'
import PublicHeader from '../components/PublicHeader'
import { EmptyState } from '../components/ui'
import { getPost, listPosts, postDate } from '../lib/blog'

function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    window.scrollTo(0, 0)
    const tag = document.querySelector('meta[name="description"]')
    const before = { title: document.title, description: tag?.getAttribute('content') }
    document.title = title
    if (description) tag?.setAttribute('content', description)
    return () => {
      document.title = before.title
      if (before.description) tag?.setAttribute('content', before.description)
    }
  }, [title, description])
}

function BlogShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-50">
      <PublicHeader />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 pb-20 pt-8">{children}</main>
      <PublicFooter />
    </div>
  )
}

const Byline = ({ date, minutes, author }: { date: string; minutes: number; author?: string }) => (
  <p className="font-mono text-[13px] text-ink-500">
    {postDate(date)} · {minutes} min read{author ? ` · ${author}` : ''}
  </p>
)

export function BlogIndex() {
  usePageMeta('Blog · Closr', 'Practical advice on running a job search, from the team behind Closr.')
  const posts = listPosts()
  return (
    <BlogShell>
      <h1 className="text-4xl font-bold tracking-[-0.03em] text-ink">Blog</h1>
      <p className="mt-2 text-lg leading-normal text-ink-500">Practical advice on running a job search.</p>
      {posts.length ? (
        <div className="mt-10 flex flex-col gap-4">
          {posts.map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="flex flex-col gap-2 rounded-2xl border border-paper-200 bg-surface p-6 transition-colors hover:border-paper-300">
              <Byline date={p.date} minutes={p.minutes} />
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">{p.title}</h2>
              {p.description && <p className="text-[15px] leading-normal text-ink-500">{p.description}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-paper-200 bg-surface">
          <EmptyState icon={Newspaper} title="No posts yet" body="Our first articles are on the way." />
        </div>
      )}
    </BlogShell>
  )
}

// Post text styled to match the app. Raw HTML in a post is shown as text, never run.
const PROSE: Components = {
  h2: ({ children }) => <h2 className="mt-9 text-2xl font-semibold tracking-[-0.02em] text-ink">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-7 text-lg font-semibold tracking-[-0.01em] text-ink">{children}</h3>,
  p: ({ children }) => <p className="mt-4">{children}</p>,
  ul: ({ children }) => <ul className="mt-4 flex list-disc flex-col gap-2 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="mt-4 border-l-[3px] border-paper-200 pl-4 text-ink-500">{children}</blockquote>,
  a: ({ href, children }) =>
    href?.startsWith('/') ? (
      <Link to={href} className="font-semibold text-blue-600 hover:underline">
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
        {children}
      </a>
    ),
}

export function BlogPostPage() {
  const { slug } = useParams()
  const post = getPost(slug ?? '')
  usePageMeta(post ? `${post.title} · Closr` : 'Post not found · Closr', post?.description)
  if (!post)
    return (
      <BlogShell>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-ink">We couldn't find that post</h1>
        <Link to="/blog" className="mt-4 inline-block font-semibold text-blue-600 hover:underline">
          See all posts
        </Link>
      </BlogShell>
    )
  return (
    <BlogShell>
      <article>
        <Link to="/blog" className="text-sm font-semibold text-blue-600 hover:underline">
          ← All posts
        </Link>
        <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-ink">{post.title}</h1>
        <div className="mt-4">
          <Byline date={post.date} minutes={post.minutes} author={post.author} />
        </div>
        <div className="mt-6 text-base leading-[1.7] text-ink-700">
          <Markdown components={PROSE}>{post.body}</Markdown>
        </div>
      </article>
      <div className="mt-12 rounded-[20px] bg-oxford-900 px-6 py-8 text-center">
        <p className="text-xl font-bold tracking-[-0.02em] text-white">Keep your whole search in one place.</p>
        <Link to="/signup" className="mt-5 inline-block rounded-xl bg-spark px-5 py-2.5 font-semibold text-on-spark hover:brightness-95">
          Get started free
        </Link>
      </div>
    </BlogShell>
  )
}
