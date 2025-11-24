import { NextResponse } from 'next/server';
import { createPublicBooking } from '@/app/actions/landing-actions';

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      serviceTypeId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate,
      eventTime,
      message,
    } = body;

    // Validación básica
    if (!serviceTypeId || !clientName || !clientEmail || !clientPhone) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear reserva
    const result = await createPublicBooking({
      serviceTypeId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate: eventDate || null,
      eventTime: eventTime || null,
      message: message || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
    });
  } catch (error) {
    console.error('Error in public-booking API:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
