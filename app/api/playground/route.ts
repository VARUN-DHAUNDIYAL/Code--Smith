import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/features/auth/actions";
import { loadStarterTemplate } from "@/features/playground/libs/load-starter-template";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playgrounds = await db.playground.findMany({
      where: {
        userId: user.id,
      },
      include: {
        templateFiles: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(playgrounds);
  } catch (error) {
    console.error('Error fetching playgrounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playgrounds' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, template } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const templateKey = (template || "REACT") as
      | "REACT"
      | "NEXTJS"
      | "EXPRESS"
      | "VUE"
      | "HONO"
      | "ANGULAR";
    const starterTemplate = await loadStarterTemplate(templateKey);

    const playground = await db.playground.create({
      data: {
        title,
        description,
        template: templateKey,
        userId: user.id,
        templateFiles: {
          create: {
            content: starterTemplate as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });

    return NextResponse.json(playground);
  } catch (error) {
    console.error('Error creating playground:', error);
    return NextResponse.json(
      { error: 'Failed to create playground' },
      { status: 500 }
    );
  }
}
