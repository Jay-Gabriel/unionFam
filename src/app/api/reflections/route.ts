import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/current-user';

export const dynamic = 'force-dynamic';

function fail(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: fallback }, { status: 503 });
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reflections')
      .select('id, experiment_id, result, learning_candidate, feeling, next_action, rating, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const experimentIds = [...new Set((data || []).map((reflection: { experiment_id: string }) => reflection.experiment_id))];
    const { data: experiments } = experimentIds.length
      ? await supabase.from('experiments').select('id, title').in('id', experimentIds)
      : { data: [] as Array<{ id: string; title: string }> };
    const titles = new Map((experiments || []).map((experiment: { id: string; title: string }) => [experiment.id, experiment.title]));
    return NextResponse.json({
      data: (data || []).map((reflection: { experiment_id: string }) => ({
        ...reflection,
        experiment_title: titles.get(reflection.experiment_id) || 'Thử nghiệm không còn tồn tại',
      })),
    });
  } catch (error) {
    return fail(error, 'REFLECTIONS_UNAVAILABLE');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    let experimentId = typeof body.experimentId === 'string' ? body.experimentId.trim() : '';
    const result = typeof body.result === 'string' ? body.result.trim() : '';
    const learningCandidate = typeof body.learningCandidate === 'string' ? body.learningCandidate.trim() : '';
    const feeling = typeof body.feeling === 'string' ? body.feeling.trim() : '';
    const nextAction = typeof body.nextAction === 'string' ? body.nextAction.trim() : '';
    const rating = body.rating == null ? 5 : Number(body.rating);
    if (!result || !learningCandidate || !feeling || !nextAction || (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5))) {
      return NextResponse.json({ error: 'INVALID_REFLECTION' }, { status: 422 });
    }

    const supabase = createClient();
    if (experimentId) {
      const { data: experiment } = await supabase
        .from('experiments')
        .select('id, status')
        .eq('id', experimentId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (!experiment) return NextResponse.json({ error: 'EXPERIMENT_NOT_FOUND' }, { status: 404 });
      if (experiment.status !== 'completed') {
        await supabase
          .from('experiments')
          .update({ status: 'completed', progress_percent: 100, updated_at: new Date().toISOString() })
          .eq('id', experimentId)
          .eq('user_id', user.id);
      }
    } else {
      // Find latest active or completed experiment, or create one for this reflection
      const { data: latestExperiment } = await supabase
        .from('experiments')
        .select('id, status')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestExperiment) {
        experimentId = latestExperiment.id;
        if (latestExperiment.status !== 'completed') {
          await supabase
            .from('experiments')
            .update({ status: 'completed', progress_percent: 100, updated_at: new Date().toISOString() })
            .eq('id', experimentId)
            .eq('user_id', user.id);
        }
      } else {
        const today = new Date().toISOString().split('T')[0];
        const { data: newExperiment, error: createExpErr } = await supabase
          .from('experiments')
          .insert({
            user_id: user.id,
            title: typeof body.experimentTitle === 'string' && body.experimentTitle.trim() ? body.experimentTitle.trim() : 'Thử nghiệm thực tế từ trò chuyện',
            hypothesis: 'Thực hiện hành động nhỏ và quan sát phản hồi thực tế.',
            smallest_step: nextAction || 'Bắt đầu bước nhỏ đầu tiên.',
            success_signal: 'Thu nhận được bài học và cảm nhận rõ ràng hơn.',
            start_date: today,
            target_date: today,
            progress_percent: 100,
            status: 'completed',
          })
          .select('id')
          .single();
        if (createExpErr || !newExperiment) throw createExpErr || new Error('EXPERIMENT_AUTO_CREATE_FAILED');
        experimentId = newExperiment.id;
      }
    }

    const { data, error } = await supabase
      .from('reflections')
      .upsert({
        user_id: user.id,
        experiment_id: experimentId,
        result: result.slice(0, 4000),
        learning_candidate: learningCandidate.slice(0, 2000),
        feeling: feeling.slice(0, 2000),
        next_action: nextAction.slice(0, 2000),
        rating,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'experiment_id' })
      .select('id, experiment_id, result, learning_candidate, feeling, next_action, rating, created_at, updated_at')
      .single();
    if (error || !data) throw error || new Error('REFLECTION_SAVE_FAILED');

    const { data: existingLearning } = await supabase
      .from('learning_records')
      .select('id')
      .eq('source_reflection_id', data.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!existingLearning) {
      await supabase.from('learning_records').insert({
        user_id: user.id,
        source_reflection_id: data.id,
        content: learningCandidate.slice(0, 2000),
        status: 'pending',
      });
    } else {
      await supabase
        .from('learning_records')
        .update({ content: learningCandidate.slice(0, 2000), updated_at: new Date().toISOString() })
        .eq('id', existingLearning.id)
        .eq('user_id', user.id)
        .eq('status', 'pending');
    }
    await supabase.from('activity_events').insert({
      user_id: user.id,
      event_type: 'reflection_saved',
      metadata: { experiment_id: experimentId, reflection_id: data.id },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return fail(error, 'REFLECTION_SAVE_FAILED');
  }
}
