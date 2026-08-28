import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, role = 'member' } = body;

    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('lifelab_session');
      response.cookies.delete('lifelab_user_role');
      response.cookies.delete('sb-access-token');
      return response;
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Set authenticated session cookie
    const response = NextResponse.json({
      data: {
        userId: email === 'admin@unionfam.com' ? 'admin-user-001' : 'member-user-001',
        email,
        role: email === 'admin@unionfam.com' ? 'admin' : role,
      },
    });

    const isDev = process.env.NODE_ENV !== 'production';

    response.cookies.set('lifelab_session', email, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set('lifelab_user_role', email === 'admin@unionfam.com' ? 'admin' : role, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Auth Error' }, { status: 500 });
  }
}
