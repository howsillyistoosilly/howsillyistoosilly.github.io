import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Post & Devlog',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'readTime',
      title: 'Estimated Read Time',
      type: 'string',
      description: 'e.g. "4 min read" or "8 min read"',
      initialValue: '5 min read',
    }),
    defineField({
      name: 'tags',
      title: 'Tags & Topics',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'e.g. unity, shaders, physics, c#, game jam',
    }),
    defineField({
      name: 'excerpt',
      title: 'Short Excerpt / Summary',
      type: 'text',
      rows: 3,
      description: 'Brief summary displayed on the blog card and social previews.',
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'mainImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and screen readers.',
        },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Article Body',
      type: 'blockContent',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      publishedAt: 'publishedAt',
      media: 'mainImage',
    },
    prepare(selection) {
      const { title, publishedAt, media } = selection
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Draft'
      return {
        title: title || 'Untitled Post',
        subtitle: date,
        media,
      }
    },
  },
})
