export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentId: user.studentId || null,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    creditScore: user.creditScore,
    rewardPoints: user.rewardPoints,
    activeBorrowingCount: user.activeBorrowingCount,
    createdAt: user.createdAt,
  }
}
