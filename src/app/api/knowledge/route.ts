import { NextResponse } from 'next/server';
import { readKnowledge, deleteItem } from '@/lib/storage';

export async function GET() {
  try {
    const items = readKnowledge();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    deleteItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
