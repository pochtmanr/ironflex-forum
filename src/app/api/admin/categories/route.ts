import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { name, description, slug } = await request.json()

    // Validate required fields
    if (!name || !description || !slug) {
      return NextResponse.json(
        { error: 'Name, description, and slug are required' },
        { status: 400 }
      )
    }

    // Check if category with same slug already exists
    const existingCategory = await Category.findOne({ slug })
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Create new category
    const category = new Category({
      name,
      description,
      slug,
      isActive: true,
      orderIndex: 0
    })

    await category.save()

    return NextResponse.json({
      message: 'Category created successfully',
      category: {
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        slug: category.slug
      }
    })

  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
