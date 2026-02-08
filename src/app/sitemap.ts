import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tarnovsky.ru'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamic: categories
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
    url: `${baseUrl}/category/${cat.id}`,
    lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Dynamic: topics (last 500 for sitemap size limits)
  const { data: topics } = await supabaseAdmin
    .from('topics')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500)

  const topicPages: MetadataRoute.Sitemap = (topics || []).map((topic) => ({
    url: `${baseUrl}/topic/${topic.id}`,
    lastModified: topic.updated_at ? new Date(topic.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...topicPages]
}
