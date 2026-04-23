export const createSupabaseMock = () => {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  };

  const adminClient = {
    from: jest.fn().mockReturnValue(queryBuilder),
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
    },
  };

  const anonClient = {
    from: jest.fn().mockReturnValue(queryBuilder),
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
    },
  };

  const supabaseService = {
    getAdminClient: jest.fn().mockReturnValue(adminClient),
    getAnonClient: jest.fn().mockReturnValue(anonClient),
  };

  return { supabaseService, adminClient, anonClient, queryBuilder };
};
