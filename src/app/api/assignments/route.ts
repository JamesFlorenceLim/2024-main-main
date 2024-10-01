import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { driver_id, van_ids } = await req.json();

  try {
    const newAssignments = await Promise.all(
      van_ids.map(async (van_id: number) => {
        const existingAssignment = await prisma.assignment.findFirst({
          where: { van_id },
        });

        if (existingAssignment) {
          throw new Error(`Van with ID ${van_id} is already assigned`);
        }

        return prisma.assignment.create({
          data: {
            van_id,
            driver_id,
          },
        });
      })
    );

    return NextResponse.json(newAssignments, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to add assignment', error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { id, driver_id, van_ids } = await req.json();

  try {
    const updatedAssignments = await Promise.all(
      van_ids.map(async (van_id: number) => {
        const existingAssignment = await prisma.assignment.findFirst({
          where: {
            AND: [
              { van_id },
              { id: { not: id } },
            ],
          },
        });

        if (existingAssignment) {
          throw new Error(`Van with ID ${van_id} is already assigned`);
        }

        return prisma.assignment.update({
          where: { id },
          data: {
            van_id,
            driver_id,
          },
        });
      })
    );

    return NextResponse.json({ message: 'Assignment updated successfully', assignments: updatedAssignments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to update assignment', error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        Van: {
          include: {
            Operator: true, // Include operator details
          },
        },
        Driver: true, // Include driver details
      },
    });
    return NextResponse.json(assignments);
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to retrieve assignments', error: error.message }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  try {
    const deletedAssignment = await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Assignment deleted successfully', assignment: deletedAssignment }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Failed to delete assignment', error: error.message }, { status: 500 });
  }
}

