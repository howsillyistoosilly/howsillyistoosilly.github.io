import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || 'rowr8pv5'
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || '2024-03-01'

export const isSanityConfigured = Boolean(projectId && projectId !== 'your_project_id_here')

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false to immediately see freshly published posts
})

const builder = client ? imageUrlBuilder(client) : null

export function urlFor(source) {
  if (!builder || !source) return null
  return builder.image(source)
}

const POSTS_QUERY = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  tags,
  "readTime": select(
    defined(readTime) => readTime,
    "5 min read"
  ),
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  body
}`

const SINGLE_POST_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  tags,
  "readTime": select(
    defined(readTime) => readTime,
    "5 min read"
  ),
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  body
}`

export async function fetchPosts() {
  if (!client) {
    return []
  }

  try {
    const posts = await client.fetch(POSTS_QUERY)
    if (!Array.isArray(posts)) return []
    return posts.map((post, idx) => ({
      ...post,
      num: String(idx + 1).padStart(2, '0'),
    }))
  } catch (error) {
    console.error('Failed to fetch posts from Sanity database:', error)
    return []
  }
}

export async function fetchPostBySlug(slug) {
  if (!client || !slug) return null

  try {
    const post = await client.fetch(SINGLE_POST_QUERY, { slug })
    return post || null
  } catch (error) {
    console.error(`Failed to fetch post '${slug}' from Sanity:`, error)
    return null
  }
}
