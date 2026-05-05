import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/features/auth/actions';
import { db } from '@/lib/db';
import { createClerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { playgroundId, email, role } = body;

    if (!playgroundId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: playgroundId, email, role' },
        { status: 400 }
      );
    }

    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "editor" or "viewer"' },
        { status: 400 }
      );
    }

    // Verify playground ownership
    const playground = await db.playground.findFirst({
      where: {
        id: playgroundId,
        userId: user.id
      }
    });

    if (!playground) {
      return NextResponse.json(
        { error: 'Playground not found or access denied' },
        { status: 404 }
      );
    }

    // Find the collaborator user using Clerk
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const userList = await clerk.users.getUserList({ emailAddress: [email] });
    const collaboratorUser = userList.data[0];

    if (!collaboratorUser) {
      return NextResponse.json(
        { error: 'User not found with that email address' },
        { status: 404 }
      );
    }

    // Check if collaboration already exists
    const existingCollaboration = await db.collaboration.findFirst({
      where: {
        playgroundId,
        collaboratorId: collaboratorUser.id
      }
    });

    if (existingCollaboration) {
      return NextResponse.json(
        { error: 'User is already a collaborator on this playground' },
        { status: 409 }
      );
    }

    // Create collaboration record
    const collaboration = await db.collaboration.create({
      data: {
        playgroundId,
        collaboratorId: collaboratorUser.id,
        role,
        invitedBy: user.id,
        status: 'pending',
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Playground shared successfully',
      data: {
        collaborationId: collaboration.id,
        collaboratorEmail: email,
        role,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error sharing playground:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playgroundId = searchParams.get('playgroundId');

    if (!playgroundId) {
      return NextResponse.json(
        { error: 'Missing playgroundId parameter' },
        { status: 400 }
      );
    }

    // Get collaborations for the playground
    const collaborations = await db.collaboration.findMany({
      where: { playgroundId },
      orderBy: { createdAt: 'desc' }
    });

    // To prevent build errors and slow N+1 queries, we return minimal user data.
    // If full names/emails are needed, the frontend can query Clerk or we can batch fetch.
    return NextResponse.json({
      success: true,
      data: collaborations.map(collab => ({
        id: collab.id,
        collaborator: {
          id: collab.collaboratorId,
          name: 'Collaborator', 
          email: ''
        },
        inviter: {
          id: collab.invitedBy,
          name: 'Inviter',
          email: ''
        },
        role: collab.role,
        status: collab.status,
        createdAt: collab.createdAt,
        updatedAt: collab.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error retrieving collaborations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collaborationId = searchParams.get('collaborationId');

    if (!collaborationId) {
      return NextResponse.json(
        { error: 'Missing collaborationId parameter' },
        { status: 400 }
      );
    }

    // Find the collaboration and verify ownership
    const collaboration = await db.collaboration.findFirst({
      where: {
        id: collaborationId,
        playground: {
          userId: user.id // Only playground owner can remove collaborators
        }
      }
    });

    if (!collaboration) {
      return NextResponse.json(
        { error: 'Collaboration not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the collaboration
    await db.collaboration.delete({
      where: { id: collaborationId }
    });

    return NextResponse.json({
      success: true,
      message: `Removed collaborator from playground`,
      data: {
        collaborationId,
      }
    });

  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 