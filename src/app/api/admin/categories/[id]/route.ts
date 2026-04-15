import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

// Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(request)
    if (guard instanceof NextResponse) return guard

    const { name, description, slug, section } = await request.json()
    const { id } = await params

    // Validate required fields
    if (!name || !description || !slug) {
      return NextResponse.json(
        { error: 'Name, description, and slug are required' },
        { status: 400 }
      )
    }

    if (section !== 'medicine' && section !== 'sport') {
      return NextResponse.json(
        { error: 'Section must be either "medicine" or "sport"' },
        { status: 400 }
      )
    }

    // Check if another category with same slug exists (excluding current one)
    const { data: existingCategory } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single()

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Update category
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({
        name,
        description,
        slug,
        section
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Category updated successfully',
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        section: category.section
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(request)
    if (guard instanceof NextResponse) return guard

    const { id } = await params

    // Check if category exists
    const { data: category, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Soft delete - set is_active to false
    await supabaseAdmin
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)

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
