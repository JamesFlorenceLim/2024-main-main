import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle GET request for fetching a user by ID
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop(); // Extract the ID from the URL

  if (!id) {
    return NextResponse.json({ message: 'ID is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (user) {
      return NextResponse.json(user);
    } else {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to retrieve user', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Handle PUT request for updating a user by ID
export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop(); // Extract the ID from the URL

  if (!id) {
    return NextResponse.json({ message: 'ID is required' }, { status: 400 });
  }

  const { username, password, role_id } = await req.json();

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { username, password, role_id: parseInt(role_id, 10) },
    });

    return NextResponse.json({ message: 'User updated successfully', user });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'User not found or no changes made' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update user', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Handle DELETE request for archiving a user by ID
export async function DELETE(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const id = requestBody?.id;

    if (!id) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { archived: true },
    });

    return NextResponse.json({ message: 'User archived successfully', user });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'User not found or already archived' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to archive user', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}