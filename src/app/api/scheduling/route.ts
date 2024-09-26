import { PrismaClient, TerminalType, AssignmentStatus } from '@prisma/client'; 
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const url = new URL(request.url);
    const terminal = url.searchParams.get('terminal') as TerminalType | null; 
    const status = url.searchParams.get('status');

    if (!terminal || !(terminal === 'terminal1' || terminal === 'terminal2')) { 
        return NextResponse.json({ error: 'Valid terminal parameter is required' }, { status: 400 });
    }

    try {
        const whereClause: any = { terminal };
        if (status) whereClause.status = status;

        const assignments = await prisma.assignment.findMany({
            where: whereClause,
            orderBy: {
                order: 'asc', // Ensure the assignments are sorted by order
            },
            include: {
                Van: {
                    select: {
                        plate_number: true,
                    },
                },
                Driver: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
            },
        });

        return NextResponse.json(assignments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const body = await request.json();
    const { id, status, terminal, order } = body;

    if (typeof id !== 'number' || !status || !terminal) {
        return NextResponse.json({ error: 'ID, status, and terminal are required and must be valid' }, { status: 400 });
    }

    if (!['terminal1', 'terminal2'].includes(terminal)) {
        return NextResponse.json({ error: 'Invalid terminal type' }, { status: 400 });
    }

    try {
        let newTerminal: TerminalType | undefined;

        if (status === 'departed') {
            const firstInQueue = await prisma.assignment.findFirst({
                where: { terminal, status: 'queued' },
                orderBy: { order: 'asc' },
            });

            if (!firstInQueue || firstInQueue.id !== id) {
                return NextResponse.json({ error: 'Only the first van in the queue can be marked as departed.' }, { status: 400 });
            }

            newTerminal = terminal === 'terminal1' ? 'terminal2' : 'terminal1';
        } else if (status === 'arrived') {
            newTerminal = terminal;
        } else {
            newTerminal = terminal;
        }

        if (newTerminal !== 'terminal1' && newTerminal !== 'terminal2') {
            return NextResponse.json({ error: 'Invalid terminal type' }, { status: 400 });
        }

        // Update the assignment
        await prisma.assignment.update({
            where: { id },
            data: { status, terminal: newTerminal, order },
        });

        if (status === 'queued') {
            const lastAssignment = await prisma.assignment.findFirst({
                where: { terminal, status: 'queued' },
                orderBy: { order: 'desc' },
            });
            const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;

            await prisma.assignment.update({
                where: { id },
                data: { order: nextOrder },
            });
        }

        return NextResponse.json({ message: 'Updated successfully' });
    } catch (error) {
        console.error('Update failed:', error);
        return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }
}
