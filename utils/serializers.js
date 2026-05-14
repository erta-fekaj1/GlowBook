function serializeUser(user) {
    if (!user) return null;
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role === 'admin' ? 'Admin' : 'Customer',
        loyaltyPoints: Number(user.loyaltyPoints || 0),
        badges: Array.isArray(user.badges) ? user.badges : [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

function serializeService(service) {
    if (!service) return null;
    return {
        id: service.id,
        name: service.name,
        desc: service.desc || '',
        price: Number(service.price || 0),
        duration: Number(service.duration || 0),
        isActive: !!service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
    };
}

function serializeAppointment(appointment) {
    if (!appointment) return null;
    const iso = appointment.startAt ? new Date(appointment.startAt).toISOString() : `${appointment.date}T${appointment.time}:00`;
    return {
        id: appointment.id,
        userId: appointment.userId,
        userEmail: appointment.userEmail,
        userName: appointment.userName,
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName,
        date: iso,
        dateOnly: appointment.date,
        time: appointment.time,
        notes: appointment.notes || '',
        status: appointment.status,
        selectedDesignId: appointment.selectedDesignId ?? null,
        selectedDesignName: appointment.selectedDesignName ?? null,
        selectedDesignImage: appointment.selectedDesignImage ?? null,
        selectedDesignCategory: appointment.selectedDesignCategory ?? null,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
    };
}

function serializeReview(review) {
    if (!review) return null;
    return {
        id: review.id,
        userId: review.userId,
        userEmail: review.userEmail,
        userName: review.userName,
        appointmentId: review.appointmentId,
        rating: review.rating,
        comment: review.comment || '',
        image: review.image || '',
        serviceName: review.serviceName || '',
        dateOfAppointment: review.dateOfAppointment || '',
        designName: review.designName || '',
        isAnonymous: !!review.isAnonymous,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
    };
}

function serializePayment(payment) {
    if (!payment) return null;
    return {
        id: payment.id,
        txId: payment.txId,
        userId: payment.userId,
        userEmail: payment.userEmail,
        userName: payment.userName,
        appointmentId: payment.appointmentId,
        serviceId: payment.serviceId,
        serviceName: payment.serviceName,
        selectedDesignName: payment.selectedDesignName ?? null,
        amount: Number(payment.amount || 0),
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
    };
}

module.exports = {
    serializeUser,
    serializeService,
    serializeAppointment,
    serializeReview,
    serializePayment,
};
