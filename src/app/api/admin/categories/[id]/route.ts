import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'

// Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { name, description, slug } = await request.json()
    const { id } = params

    // Validate required fields
    if (!name || !description || !slug) {
      return NextResponse.json(
        { error: 'Name, description, and slug are required' },
        { status: 400 }
      )
    }

    // Check if another category with same slug exists (excluding current one)
    const existingCategory = await Category.findOne({ 
      slug, 
      _id: { $ne: id } 
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Update category
    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description,
        slug
      },
      { new: true }
    )

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Category updated successfully',
      category: {
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        slug: category.slug
      }
    })

  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const { id } = params

    // Check if category exists
    const category = await Category.findById(id)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Soft delete - set isActive to false
    await Category.findByIdAndUpdate(id, { isActive: false })

    return NextResponse.json({
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

