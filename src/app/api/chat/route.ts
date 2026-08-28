import { NextResponse } from 'next/server';
import { GeminiConversationProvider } from '@/server/ai/provider';
import { getCurrentUserSession } from '@/server/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getCurrentUserSession();
    if (!session) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content, idempotencyKey } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const provider = new GeminiConversationProvider();
    const parseResult = await provider.generateResponse(
      {
        userId: session.userId,
        conversationId: conversationId || 'conv-001',
        recentMessages: [{ role: 'user', content }],
        confirmedInsights: ['Gia đình là ưu tiên cốt lõi'],
        userAnswersSummary: 'Muốn làm việc 4 ngày/tuần',
      },
      content,
      []
    );

    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json(
        {
          error_code: parseResult.errorCode || 'AI_SCHEMA_INVALID',
          message: parseResult.errorMessage || 'Invalid AI output schema',
        },
        { status: 502 }
      );
    }

    // Return Server-Sent Events (SSE) Stream
    const aiData = parseResult.data;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Event 1: message.started
        controller.enqueue(encoder.encode(`event: message.started\ndata: ${JSON.stringify({ conversationId, idempotencyKey })}\n\n`));

        // Event 2: message.delta (Simulate text streaming chunks)
        const textParts = aiData.responseText.match(/.{1,15}/g) || [aiData.responseText];
        for (const chunk of textParts) {
          controller.enqueue(encoder.encode(`event: message.delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Event 3: observation.created (if proposed)
        if (aiData.observationProposal) {
          controller.enqueue(
            encoder.encode(
              `event: observation.created\ndata: ${JSON.stringify({
                id: `obs-${Date.now()}`,
                dimension: aiData.observationProposal.dimension,
                dimensionLabel: aiData.observationProposal.dimension.toUpperCase(),
                contentOriginal: aiData.observationProposal.contentOriginal,
                status: 'pending',
              })}\n\n`
            )
          );
        }

        // Event 4: message.completed
        controller.enqueue(
          encoder.encode(
            `event: message.completed\ndata: ${JSON.stringify({
              nextStage: aiData.nextStage,
              requiresPermission: aiData.requiresPermission,
            })}\n\n`
          )
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
